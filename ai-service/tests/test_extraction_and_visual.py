import io
import unittest
from PIL import Image, ImageDraw
import docx

from app.extraction.extractor import extract_text_from_docx, extract_content
from app.checks.visual import (
    calculate_wcag_contrast,
    calculate_relative_luminance,
    get_wcag_compliance,
    extract_dominant_colors,
    match_brand_palette,
    evaluate_image_accessibility,
    hex_to_rgb
)


class TestVisualAndAccessibilityChecks(unittest.TestCase):

    def test_wcag_contrast_black_and_white(self):
        black = (0, 0, 0)
        white = (255, 255, 255)
        contrast = calculate_wcag_contrast(black, white)
        self.assertEqual(contrast, 21.0)
        compliance = get_wcag_compliance(contrast)
        self.assertTrue(compliance["passedAA"])
        self.assertEqual(compliance["rating"], "AAA")

    def test_wcag_contrast_same_color(self):
        white = (255, 255, 255)
        contrast = calculate_wcag_contrast(white, white)
        self.assertEqual(contrast, 1.0)
        compliance = get_wcag_compliance(contrast)
        self.assertFalse(compliance["passedAA"])
        self.assertEqual(compliance["rating"], "FAIL")

    def test_wcag_contrast_low_contrast(self):
        # Light gray text on white background
        light_gray = (200, 200, 200)
        white = (255, 255, 255)
        contrast = calculate_wcag_contrast(light_gray, white)
        self.assertLess(contrast, 3.0)
        compliance = get_wcag_compliance(contrast)
        self.assertFalse(compliance["passedAA"])

    def test_docx_extraction(self):
        # Create an in-memory docx
        doc = docx.Document()
        doc.add_heading("NovaTech Product Launch", level=1)
        doc.add_paragraph("This is the official enterprise cloud launch copy.")
        
        table = doc.add_table(rows=2, cols=2)
        table.rows[0].cells[0].text = "Feature"
        table.rows[0].cells[1].text = "SLA"
        table.rows[1].cells[0].text = "Uptime"
        table.rows[1].cells[1].text = "99.9%"

        docx_stream = io.BytesIO()
        doc.save(docx_stream)
        docx_bytes = docx_stream.getvalue()

        result = extract_text_from_docx(docx_bytes)
        self.assertEqual(result["format"], "docx")
        self.assertIn("NovaTech Product Launch", result["text"])
        self.assertIn("99.9%", result["text"])
        self.assertGreater(result["word_count"], 5)

    def test_image_visual_and_accessibility(self):
        # Create a sample image (e.g. blue header with white text)
        img = Image.new("RGB", (200, 100), color=(12, 142, 233)) # #0c8ee9
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 50, 200, 100], fill=(255, 255, 255)) # half white
        
        img_stream = io.BytesIO()
        img.save(img_stream, format="PNG")
        img_bytes = img_stream.getvalue()

        # Case 1: Missing alt text
        analysis_missing_alt = evaluate_image_accessibility(
            img_bytes,
            alt_text="",
            brand_palette=["#0c8ee9", "#0259a1", "#072849"]
        )
        self.assertEqual(analysis_missing_alt["altTextStatus"], "MISSING")
        findings = analysis_missing_alt["findings"]
        alt_finding = next((f for f in findings if f["type"] == "ALT_TEXT_MISSING"), None)
        self.assertIsNotNone(alt_finding)
        self.assertEqual(alt_finding["severity"], "HIGH")

        # Case 2: Generic alt text ("image")
        analysis_generic_alt = evaluate_image_accessibility(
            img_bytes,
            alt_text="image",
            brand_palette=["#0c8ee9", "#0259a1", "#072849"]
        )
        self.assertEqual(analysis_generic_alt["altTextStatus"], "GENERIC_POOR_QUALITY")
        generic_finding = next((f for f in findings if f["type"] == "ACCESSIBILITY"), None)

        # Case 3: Proper descriptive alt text
        analysis_good_alt = evaluate_image_accessibility(
            img_bytes,
            alt_text="NovaTech enterprise cloud architecture overview diagram",
            brand_palette=["#0c8ee9", "#0259a1", "#072849"]
        )
        self.assertEqual(analysis_good_alt["altTextStatus"], "COMPLIANT")
        self.assertFalse(any(f["type"] == "ALT_TEXT_MISSING" for f in analysis_good_alt["findings"]))

    def test_brand_palette_matching(self):
        dominant = [
            {"hex": "#0c8ee9", "rgb": [12, 142, 233], "percentage": 80.0},
            {"hex": "#ffffff", "rgb": [255, 255, 255], "percentage": 20.0}
        ]
        brand_palette = ["#0c8ee9", "#0259a1", "#ffffff"]
        res = match_brand_palette(dominant, brand_palette)
        self.assertTrue(res["brandCompliant"])
        self.assertGreaterEqual(res["overallMatchScore"], 85.0)


if __name__ == "__main__":
    unittest.main()
