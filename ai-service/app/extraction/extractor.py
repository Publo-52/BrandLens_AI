import io
import os
import re
from typing import Dict, Any, List, Optional
from PIL import Image

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None

try:
    import pytesseract
except ImportError:
    pytesseract = None


def extract_text_from_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts text from PDF bytes using pdfplumber with fallback to pypdf.
    """
    text_content = []
    page_count = 0
    extractor_used = "pdfplumber"

    if pdfplumber is not None:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                page_count = len(pdf.pages)
                for page_idx, page in enumerate(pdf.pages, start=1):
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        text_content.append(page_text.strip())
        except Exception as e:
            # Fallback to pypdf if pdfplumber fails on malformed streams
            extractor_used = f"pdfplumber_failed_fallback_pypdf ({e})"
            text_content = []

    if not text_content and pypdf is not None:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            for page in reader.pages:
                t = page.extract_text() or ""
                if t.strip():
                    text_content.append(t.strip())
            extractor_used = "pypdf"
        except Exception as e:
            extractor_used = f"pypdf_failed ({e})"

    full_text = "\n\n".join(text_content).strip()
    return {
        "format": "pdf",
        "extractor": extractor_used,
        "page_count": page_count,
        "character_count": len(full_text),
        "word_count": len(full_text.split()),
        "text": full_text
    }


def extract_text_from_docx(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts text and tables from DOCX bytes using python-docx.
    """
    if docx is None:
        raise RuntimeError("python-docx is not installed in the environment.")

    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = []

    # Extract regular paragraphs
    for p in doc.paragraphs:
        cleaned = p.text.strip()
        if cleaned:
            paragraphs.append(cleaned)

    # Extract table cell text
    table_texts = []
    for table in doc.tables:
        for row in table.rows:
            row_vals = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_vals:
                table_texts.append(" | ".join(row_vals))

    if table_texts:
        paragraphs.append("\n[Document Tables]:\n" + "\n".join(table_texts))

    full_text = "\n\n".join(paragraphs).strip()
    return {
        "format": "docx",
        "extractor": "python-docx",
        "paragraph_count": len(doc.paragraphs),
        "table_count": len(doc.tables),
        "character_count": len(full_text),
        "word_count": len(full_text.split()),
        "text": full_text
    }


def extract_text_from_image(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts OCR text and basic metadata from image bytes using Pillow and Tesseract.
    Handles environment without tesseract binary gracefully.
    """
    img = Image.open(io.BytesIO(file_bytes))
    width, height = img.size
    img_format = img.format or "UNKNOWN"
    img_mode = img.mode

    ocr_text = ""
    ocr_available = False
    ocr_status = "Tesseract binary not found on system PATH; image properties extracted."

    if pytesseract is not None:
        try:
            # Attempt OCR with English default
            ocr_text = pytesseract.image_to_string(img).strip()
            ocr_available = True
            ocr_status = "OCR extraction successful"
        except (pytesseract.TesseractNotFoundError, FileNotFoundError):
            ocr_available = False
            ocr_status = "Tesseract CLI not installed on host; visual analysis active."
        except Exception as e:
            ocr_available = False
            ocr_status = f"OCR engine warning: {str(e)}"

    return {
        "format": img_format.lower(),
        "dimensions": {"width": width, "height": height},
        "mode": img_mode,
        "ocr_available": ocr_available,
        "ocr_status": ocr_status,
        "character_count": len(ocr_text),
        "word_count": len(ocr_text.split()),
        "text": ocr_text
    }


def extract_content(file_bytes: bytes, filename: str, mime_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point: detects format and extracts content.
    Supports .pdf, .docx, .jpg, .jpeg, .png, and .txt.
    """
    fn_lower = filename.lower()
    mime = (mime_type or "").lower()

    if fn_lower.endswith(".pdf") or "pdf" in mime:
        return extract_text_from_pdf(file_bytes)
    elif fn_lower.endswith(".docx") or "wordprocessingml" in mime or fn_lower.endswith(".doc"):
        return extract_text_from_docx(file_bytes)
    elif any(fn_lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]) or "image" in mime:
        return extract_text_from_image(file_bytes)
    elif fn_lower.endswith(".txt") or "text/plain" in mime:
        text = file_bytes.decode("utf-8", errors="replace").strip()
        return {
            "format": "txt",
            "extractor": "plain_text",
            "character_count": len(text),
            "word_count": len(text.split()),
            "text": text
        }
    else:
        # Fallback for unrecognized text-like files
        text = file_bytes.decode("utf-8", errors="replace").strip()
        return {
            "format": "unrecognized",
            "extractor": "utf8_fallback",
            "character_count": len(text),
            "word_count": len(text.split()),
            "text": text
        }
