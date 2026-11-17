import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateLuminance,
  calculateContrastRatio,
  hexToRgb,
  extractAndAnalyzeFile,
} from '../src/services/extractionService.js';

describe('BrandLens AI - Document & Visual Extraction Service Tests', () => {
  test('calculateContrastRatio computes deterministic WCAG contrast', () => {
    const black = [0, 0, 0];
    const white = [255, 255, 255];
    const ratioBW = calculateContrastRatio(black, white);
    assert.strictEqual(ratioBW, 21);

    const ratioWW = calculateContrastRatio(white, white);
    assert.strictEqual(ratioWW, 1);

    // Corporate blue #0c8ee9 on white #ffffff
    const blue = hexToRgb('#0c8ee9');
    const ratioBlueWhite = calculateContrastRatio(blue, white);
    assert.ok(ratioBlueWhite >= 3.0 && ratioBlueWhite <= 3.8);
  });

  test('hexToRgb correctly parses 3 and 6 digit hex codes', () => {
    assert.deepStrictEqual(hexToRgb('#fff'), [255, 255, 255]);
    assert.deepStrictEqual(hexToRgb('#000000'), [0, 0, 0]);
    assert.deepStrictEqual(hexToRgb('#0c8ee9'), [12, 142, 233]);
  });

  test('extractAndAnalyzeFile handles plain text buffers resiliently', async () => {
    const file = {
      originalname: 'marketing_copy.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('Experience NovaTech cloud infrastructure with 99.9% uptime.'),
      size: 58,
    };

    const res = await extractAndAnalyzeFile(file, { altText: '' });
    assert.ok(res.extractedText.includes('NovaTech'));
    assert.strictEqual(res.metadata.format, 'text/plain');
  });

  test('extractAndAnalyzeFile evaluates image alt-text compliance', async () => {
    const file = {
      originalname: 'banner.png',
      mimetype: 'image/png',
      buffer: Buffer.from('fake_image_bytes'),
      size: 100,
    };

    // Case 1: Missing alt text
    const missingAlt = await extractAndAnalyzeFile(file, { altText: '' });
    assert.ok(missingAlt.visualChecks);
    assert.strictEqual(missingAlt.visualChecks.altTextStatus, 'MISSING');
    assert.ok(missingAlt.visualChecks.findings.some((f) => f.type === 'ALT_TEXT_MISSING'));

    // Case 2: Good descriptive alt text
    const goodAlt = await extractAndAnalyzeFile(file, {
      altText: 'NovaTech infrastructure architecture diagram showing multi-region automated replication',
    });
    assert.ok(goodAlt.visualChecks);
    assert.strictEqual(goodAlt.visualChecks.altTextStatus, 'COMPLIANT');
    assert.ok(!goodAlt.visualChecks.findings.some((f) => f.type === 'ALT_TEXT_MISSING'));
  });
});
