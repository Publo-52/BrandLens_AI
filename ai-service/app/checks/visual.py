import io
import math
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image


def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
    """Converts a hex string like #0c8ee9 or 0c8ee9 to (r, g, b) tuple."""
    hex_clean = hex_code.strip().lstrip('#')
    if len(hex_clean) == 3:
        hex_clean = ''.join(c * 2 for c in hex_clean)
    if len(hex_clean) != 6:
        return (0, 0, 0)
    return (
        int(hex_clean[0:2], 16),
        int(hex_clean[2:4], 16),
        int(hex_clean[4:6], 16)
    )


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Converts (r, g, b) to lowercase #rrggbb string."""
    return f"#{r:02x}{g:02x}{b:02x}"


def calculate_relative_luminance(rgb: Tuple[int, int, int]) -> float:
    """
    Computes WCAG 2.1 relative luminance for an sRGB tuple (0-255).
    L = 0.2126 * R + 0.7152 * G + 0.0722 * B
    """
    def channel_luminance(channel: int) -> float:
        c = channel / 255.0
        return c / 12.92 if c <= 0.04045 else math.pow((c + 0.055) / 1.055, 2.4)

    r_lin = channel_luminance(rgb[0])
    g_lin = channel_luminance(rgb[1])
    b_lin = channel_luminance(rgb[2])

    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin


def calculate_wcag_contrast(fg_rgb: Tuple[int, int, int], bg_rgb: Tuple[int, int, int]) -> float:
    """
    Calculates the WCAG contrast ratio between two colors:
    Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
    Returns float rounded to 2 decimal places (between 1.00 and 21.00).
    """
    l1 = calculate_relative_luminance(fg_rgb)
    l2 = calculate_relative_luminance(bg_rgb)

    lighter = max(l1, l2)
    darker = min(l1, l2)

    ratio = (lighter + 0.05) / (darker + 0.05)
    return round(ratio, 2)


def get_wcag_compliance(ratio: float) -> Dict[str, Any]:
    """
    Evaluates WCAG 2.1 Level AA and AAA thresholds.
    """
    return {
        "ratio": ratio,
        "ratioFormatted": f"{ratio}:1",
        "normalTextAA": ratio >= 4.5,
        "normalTextAAA": ratio >= 7.0,
        "largeTextAA": ratio >= 3.0,
        "largeTextAAA": ratio >= 4.5,
        "uiComponentsAA": ratio >= 3.0,
        "passedAA": ratio >= 4.5,
        "rating": "AAA" if ratio >= 7.0 else ("AA" if ratio >= 4.5 else ("AA Large Only" if ratio >= 3.0 else "FAIL"))
    }


def extract_dominant_colors(image_bytes: bytes, max_colors: int = 5) -> List[Dict[str, Any]]:
    """
    Deterministic extraction of dominant image colors using Pillow color quantization.
    Returns top colors with RGB, HEX, luminance, and frequency percentage.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # Resize to small thumbnail for fast, noise-filtered palette extraction
    img_thumb = img.resize((150, 150), Image.Resampling.LANCZOS)

    # Quantize using adaptive palette
    quantized = img_thumb.quantize(colors=max_colors, method=Image.Quantize.FASTOCTREE)
    palette = quantized.getpalette()[:max_colors * 3]
    color_counts = quantized.getcolors()

    if not color_counts:
        return []

    total_pixels = sum(count for count, _ in color_counts)
    # Sort colors by frequency descending
    sorted_colors = sorted(color_counts, key=lambda x: x[0], reverse=True)

    result = []
    for count, idx in sorted_colors:
        r = palette[idx * 3]
        g = palette[idx * 3 + 1]
        b = palette[idx * 3 + 2]
        hex_val = rgb_to_hex(r, g, b)
        luminance = calculate_relative_luminance((r, g, b))
        percentage = round((count / total_pixels) * 100, 1)

        result.append({
            "hex": hex_val,
            "rgb": [r, g, b],
            "luminance": round(luminance, 4),
            "percentage": percentage
        })

    return result


def compute_color_distance(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    """Computes Euclidean color distance in sRGB space (0 to ~441.67)."""
    return math.sqrt(
        (rgb1[0] - rgb2[0]) ** 2 +
        (rgb1[1] - rgb2[1]) ** 2 +
        (rgb1[2] - rgb2[2]) ** 2
    )


def match_brand_palette(
    dominant_colors: List[Dict[str, Any]],
    brand_palette: List[str]
) -> Dict[str, Any]:
    """
    Compares image colors against brand palette hex codes.
    Returns matching scores, nearest brand colors, and off-brand warnings.
    """
    if not brand_palette:
        return {
            "hasBrandPalette": False,
            "overallMatchScore": 100.0,
            "brandCompliant": True,
            "details": []
        }

    brand_rgbs = [hex_to_rgb(h) for h in brand_palette]
    max_distance = math.sqrt(255 ** 2 * 3)  # ~441.67

    color_evaluations = []
    total_weighted_match = 0.0
    total_weight = 0.0

    for color_info in dominant_colors:
        c_rgb = tuple(color_info["rgb"])
        # Find nearest brand color
        min_dist = float('inf')
        nearest_hex = brand_palette[0]

        for b_hex, b_rgb in zip(brand_palette, brand_rgbs):
            dist = compute_color_distance(c_rgb, b_rgb)
            if dist < min_dist:
                min_dist = dist
                nearest_hex = b_hex

        # Match percentage: 100% is exact match, 0% is opposite
        match_pct = max(0.0, round((1.0 - (min_dist / max_distance)) * 100, 1))
        # Within threshold (Euclidean <= 60 is close match)
        is_close = min_dist <= 65.0

        weight = color_info.get("percentage", 10.0)
        total_weighted_match += match_pct * weight
        total_weight += weight

        color_evaluations.append({
            "colorHex": color_info["hex"],
            "percentage": color_info["percentage"],
            "nearestBrandHex": nearest_hex,
            "distance": round(min_dist, 1),
            "matchPercentage": match_pct,
            "isBrandAligned": is_close
        })

    overall_score = round(total_weighted_match / max(total_weight, 1.0), 1)
    brand_compliant = overall_score >= 65.0

    return {
        "hasBrandPalette": True,
        "overallMatchScore": overall_score,
        "brandCompliant": brand_compliant,
        "brandPaletteChecked": brand_palette,
        "details": color_evaluations
    }


def evaluate_image_accessibility(
    image_bytes: bytes,
    alt_text: Optional[str] = None,
    brand_palette: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Executes full visual & accessibility check:
    1. WCAG Contrast analysis between background and foreground dominant colors.
    2. Dominant color extraction.
    3. Brand palette compliance.
    4. Alt-text validation against WCAG 2.1 Guideline 1.1.1.
    """
    dominant_colors = extract_dominant_colors(image_bytes, max_colors=5)
    findings = []

    # 1. Contrast Check between the 2 highest percentage colors (typical background & foreground/accent)
    contrast_evaluation = None
    if len(dominant_colors) >= 2:
        bg_color = tuple(dominant_colors[0]["rgb"])
        fg_color = tuple(dominant_colors[1]["rgb"])

        ratio = calculate_wcag_contrast(fg_color, bg_color)
        contrast_evaluation = get_wcag_compliance(ratio)
        contrast_evaluation["backgroundColor"] = dominant_colors[0]["hex"]
        contrast_evaluation["foregroundColor"] = dominant_colors[1]["hex"]

        if not contrast_evaluation["passedAA"]:
            findings.append({
                "type": "CONTRAST_FAIL",
                "severity": "HIGH" if ratio < 3.0 else "MEDIUM",
                "confidence": 1.0,
                "originalText": f"Dominant visual contrast: {ratio}:1 between {dominant_colors[0]['hex']} (bg) and {dominant_colors[1]['hex']} (fg)",
                "explanation": f"WCAG 2.1 Level AA requires at least 4.5:1 contrast for legible text/graphics. Detected ratio is {ratio}:1.",
                "suggestedCorrection": f"Adjust background ({dominant_colors[0]['hex']}) or foreground tones to reach at least 4.5:1 contrast ratio.",
                "checkMethod": "DETERMINISTIC",
                "sourceReferences": [
                    {
                        "sourceType": "WCAG_2_1_SPEC",
                        "sourceId": "Guideline_1.4.3",
                        "quote": "Contrast (Minimum): The visual presentation of text and images of text has a contrast ratio of at least 4.5:1."
                    }
                ]
            })

    # 2. Brand Palette Check
    palette_match = match_brand_palette(dominant_colors, brand_palette or [])
    if palette_match.get("hasBrandPalette") and not palette_match.get("brandCompliant"):
        findings.append({
            "type": "TONE_MISMATCH",
            "severity": "MEDIUM",
            "confidence": 0.88,
            "originalText": f"Image palette match score is {palette_match['overallMatchScore']}% with approved brand guidelines.",
            "explanation": f"The dominant image tones deviate from registered brand colors ({', '.join(brand_palette or [])}).",
            "suggestedCorrection": "Use brand-approved palette colors or primary corporate tones in marketing visuals.",
            "checkMethod": "DETERMINISTIC",
            "sourceReferences": [
                {
                    "sourceType": "BRAND_PALETTE",
                    "sourceId": "CORPORATE_PALETTE",
                    "quote": f"Approved Brand Hex Codes: {', '.join(brand_palette or [])}"
                }
            ]
        })

    # 3. Alt-Text Accessibility Verification (WCAG 2.1 - 1.1.1 Non-text Content)
    cleaned_alt = (alt_text or "").strip()
    alt_status = "COMPLIANT"

    if not cleaned_alt:
        alt_status = "MISSING"
        findings.append({
            "type": "ALT_TEXT_MISSING",
            "severity": "HIGH",
            "confidence": 1.0,
            "originalText": "[Missing Alt Text Description]",
            "explanation": "Image is missing an alt text description required by WCAG 2.1 Guideline 1.1.1 (Non-text Content). Screen readers cannot interpret this visual for visually impaired users.",
            "suggestedCorrection": "Provide a descriptive alt text summarizing the content and purpose of this image.",
            "checkMethod": "DETERMINISTIC",
            "sourceReferences": [
                {
                    "sourceType": "WCAG_2_1_SPEC",
                    "sourceId": "Guideline_1.1.1",
                    "quote": "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose."
                }
            ]
        })
    else:
        # Check for generic/trivial alt text like "image", "photo", "pic", "screenshot"
        generic_terms = ["image", "photo", "pic", "picture", "screenshot", "icon", "logo", "graphic"]
        if cleaned_alt.lower() in generic_terms or len(cleaned_alt) < 8:
            alt_status = "GENERIC_POOR_QUALITY"
            findings.append({
                "type": "ACCESSIBILITY",
                "severity": "MEDIUM",
                "confidence": 0.95,
                "originalText": f'Alt text: "{cleaned_alt}"',
                "explanation": f'Alt text "{cleaned_alt}" is too generic or brief. Good accessibility alt-text should clearly convey what is happening in the visual.',
                "suggestedCorrection": "Describe the specific scene, data, or action shown in the graphic (e.g. 'Infographic showing 99.9% uptime across cloud regions').",
                "checkMethod": "DETERMINISTIC",
                "sourceReferences": [
                    {
                        "sourceType": "WCAG_2_1_SPEC",
                        "sourceId": "Guideline_1.1.1",
                        "quote": "Short or vague alt text fails to give screen-reader users an equivalent understanding."
                    }
                ]
            })

    return {
        "dominantColors": dominant_colors,
        "contrast": contrast_evaluation,
        "paletteMatch": palette_match,
        "altTextStatus": alt_status,
        "altTextProvided": cleaned_alt,
        "findings": findings
    }
