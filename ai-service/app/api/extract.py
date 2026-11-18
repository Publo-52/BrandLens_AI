import hmac
import json
import logging
import os
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header, Depends
from app.extraction.extractor import extract_content
from app.checks.visual import evaluate_image_accessibility, hex_to_rgb

logger = logging.getLogger("brandlens.ai.extract")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".webp", ".txt"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def verify_internal_api_key(x_api_key: Optional[str] = Header(default=None)):
    """
    Validates X-API-Key when AI_SERVICE_API_KEY is configured in production.
    Uses constant-time comparison to prevent timing side-channels.
    """
    configured_key = (os.getenv("AI_SERVICE_API_KEY") or "").strip()
    is_prod = (os.getenv("ENVIRONMENT", "development").strip().lower() == "production")
    if is_prod and configured_key:
        if not x_api_key or not hmac.compare_digest(x_api_key.strip(), configured_key):
            raise HTTPException(status_code=401, detail="Unauthorized service request.")


def _validate_file_and_read(content_bytes: bytes, filename: str, allowed_exts: set):
    if not content_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds the 10MB maximum size limit.")
    safe_name = os.path.basename(filename or "uploaded_document")
    _, ext = os.path.splitext(safe_name.lower())
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext or 'unknown'}'.")
    return safe_name


router = APIRouter(prefix="/api", tags=["Document Extraction & Visual Checks"])


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    brand_palette: Optional[str] = Form(None),
    _: None = Depends(verify_internal_api_key),
):
    """
    Extracts text and runs visual/accessibility checks from uploaded files (.pdf, .docx, .jpg, .png, etc.).
    """
    try:
        content_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
        filename = _validate_file_and_read(content_bytes, file.filename or "uploaded_document", ALLOWED_EXTENSIONS)
        mime_type = file.content_type or ""

        # 1. Text Extraction (PDF / DOCX / Image OCR)
        extraction_result = extract_content(content_bytes, filename, mime_type)

        # 2. Visual & Accessibility Checks if file is an image
        visual_analysis = None
        palette_list = []
        if brand_palette:
            try:
                if brand_palette.startswith("["):
                    palette_list = json.loads(brand_palette)
                else:
                    palette_list = [p.strip() for p in brand_palette.split(",") if p.strip()]
            except Exception:
                palette_list = []

        is_image = any(filename.lower().endswith(ext) for ext in IMAGE_EXTENSIONS) or "image" in mime_type
        if is_image:
            visual_analysis = evaluate_image_accessibility(
                content_bytes,
                alt_text=alt_text,
                brand_palette=palette_list
            )

        return {
            "success": True,
            "filename": filename,
            "mimeType": mime_type,
            "sizeBytes": len(content_bytes),
            "extraction": extraction_result,
            "visualAnalysis": visual_analysis,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Document extraction failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process uploaded document.")


@router.post("/visual-check")
async def visual_check(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    brand_palette: Optional[str] = Form(None),
    _: None = Depends(verify_internal_api_key),
):
    """
    Runs deterministic WCAG contrast, brand palette matching, and alt-text verification on an image.
    """
    try:
        content_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
        filename = _validate_file_and_read(content_bytes, file.filename or "image.png", IMAGE_EXTENSIONS)

        palette_list = []
        if brand_palette:
            try:
                if brand_palette.startswith("["):
                    palette_list = json.loads(brand_palette)
                else:
                    palette_list = [p.strip() for p in brand_palette.split(",") if p.strip()]
            except Exception:
                palette_list = []

        analysis = evaluate_image_accessibility(
            content_bytes,
            alt_text=alt_text,
            brand_palette=palette_list
        )

        return {
            "success": True,
            "filename": filename,
            "visualAnalysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Visual accessibility check failed: %s", e)
        raise HTTPException(status_code=500, detail="Visual check failed.")
