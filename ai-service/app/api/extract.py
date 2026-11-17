import json
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.extraction.extractor import extract_content
from app.checks.visual import evaluate_image_accessibility, hex_to_rgb

router = APIRouter(prefix="/api", tags=["Document Extraction & Visual Checks"])


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    brand_palette: Optional[str] = Form(None)
):
    """
    Extracts text and runs visual/accessibility checks from uploaded files (.pdf, .docx, .jpg, .png, etc.).
    """
    try:
        content_bytes = await file.read()
        filename = file.filename or "uploaded_document"
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

        is_image = any(filename.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]) or "image" in mime_type
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document {file.filename}: {str(e)}")


@router.post("/visual-check")
async def visual_check(
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    brand_palette: Optional[str] = Form(None)
):
    """
    Runs deterministic WCAG contrast, brand palette matching, and alt-text verification on an image.
    """
    try:
        content_bytes = await file.read()
        filename = file.filename or "image"

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visual check failed: {str(e)}")
