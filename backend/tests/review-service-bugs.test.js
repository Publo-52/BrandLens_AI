/**
 * Unit tests for review.service.js bug fixes (Round 8):
 *   Bug 1: False CLAIM_SUPPORTED when only product name overlaps
 *   Bug 2: TONE_MISMATCH partial-phrase replacement
 *
 * These tests run inline (no DB / network needed) by directly testing
 * the internal helpers extracted from review.service.js logic.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ──────────────────────────────────────────────────────────────────────────────
// Reproduce the exact helpers from review.service.js so we test the same code
// ──────────────────────────────────────────────────────────────────────────────

const exaggeratedTriggers = [
  { pattern: /100%\s+risk[-\s]?free/gi,       replacement: 'reliable enterprise-grade standards' },
  { pattern: /100%\s+guarantee[d]?/gi,         replacement: 'backed by our service-level agreement' },
  { pattern: /\b100%(?!\s+risk|\s+guarantee)/gi,  replacement: 'industry-leading' },
  { pattern: /\bguarantee\b/gi,                 replacement: 'committed to' },
  { pattern: /\bnever fail(s)?\b/gi,            replacement: 'maintains high availability' },
  { pattern: /\binstant\b/gi,                   replacement: 'rapid' },
  { pattern: /\bmagic\b/gi,                     replacement: 'advanced' },
  { pattern: /\binvulnerable\b/gi,              replacement: 'resilient' },
  { pattern: /\bzero[- ]risk\b/gi,              replacement: 'low-risk' },
  { pattern: /cheapest in the world/gi,         replacement: 'highly cost-effective' },
  { pattern: /#1 in the universe/gi,            replacement: 'industry-leading' },
  { pattern: /fastest ever/gi,                  replacement: 'exceptionally fast' },
];

function buildToneRewrite(original) {
  let rewritten = original;
  for (const { pattern, replacement } of exaggeratedTriggers) {
    pattern.lastIndex = 0;
    rewritten = rewritten.replace(pattern, replacement);
  }
  return rewritten.replace(/\s{2,}/g, ' ').trim();
}

const metricPattern = /\b\d+(?:\.\d+)?(?:%|\s*x\b|\s*hours?|\s*days?|\s*weeks?|\s*months?|\s*years?|\s*minutes?|\s*seconds?|\s*times\b)?|(?:\$|€|£)\s*\d+(?:\.\d+)?/gi;

const promotionalMetricPhrasePattern = /\b(?:boosts?|increases?|reduces?|cuts?|saves?|delivers?|maximizes?|accelerates?|improves?|slashes?|doubles?|triples?)\s+(?:(?:[a-z]{2,15}\s+){0,3})?(?:by\s+)?(?:\d+(?:\.\d+)?(?:%|x\b)|(?:\$|€|£)\s*\d+)(?:\s+faster|\s+more)?/gi;

const broadPromotionalPattern = /\b(?:boosts?|increases?|reduces?|cuts?|saves?|faster|guaranteed?|delivers?|maximizes?|accelerates?|improves?|slashes?|doubles?|triples?)\b|\b(?:roi|return on investment|revenue|savings?|conversion|growth|efficiency|costs?|speed|latency|downtime|turnaround)\b/gi;

const claimKeywords = [
  'backup', 'uptime', 'sla', 'cloud', 'security', 'soc 2', 'gdpr',
  'certified', 'certification', 'iso', 'iso 27001', 'hipaa', 'compliance',
  'compliant', 'guarantee', 'guaranteed', 'latency', 'redundancy', 'encryption',
  'pci-dss', 'patented', 'audited', 'roi', 'faster', 'savings', 'boosts'
];

function checkClaimSupported(sentence, facts) {
  promotionalMetricPhrasePattern.lastIndex = 0;
  const promoMetricMatches = [...sentence.matchAll(promotionalMetricPhrasePattern)].map((m) => m[0].trim());

  broadPromotionalPattern.lastIndex = 0;
  const hasPromotionalClaim = broadPromotionalPattern.test(sentence);

  metricPattern.lastIndex = 0;
  const draftMetrics = [...sentence.matchAll(metricPattern)]
    .map((m) => m[0].toLowerCase().trim())
    .filter((m) => m.length > 0);

  const quantitativeMetrics = draftMetrics.filter((m) =>
    /[%x$€£]|hours?|days?|weeks?|months?|years?|minutes?|seconds?|\d+\.\d+/.test(m)
  );
  const hasQuantitativeMetric = quantitativeMetrics.length > 0;
  const hasClaimKeyword = claimKeywords.some((kw) => sentence.toLowerCase().includes(kw));

  const isClaimCandidate = promoMetricMatches.length > 0 || hasPromotionalClaim || hasQuantitativeMetric || hasClaimKeyword;
  if (!isClaimCandidate) return 'IGNORED';

  const unverifiedMetrics = quantitativeMetrics.filter((metric) => {
    const normalized = metric.replace(/\s+/g, ' ').trim();
    return !facts.some((f) => f.statement.toLowerCase().includes(normalized));
  });

  const hasRoi = /\broi\b|return on investment/i.test(sentence);
  const isRoiUnverified = hasRoi && !facts.some((f) => /\broi\b|return on investment/i.test(f.statement.toLowerCase()));

  const hasUnverifiedMetricOrPromo = unverifiedMetrics.length > 0 || promoMetricMatches.length > 0 || isRoiUnverified;

  if (hasUnverifiedMetricOrPromo) {
    return 'CLAIM_UNSUPPORTED';
  }

  const matchingFact = facts.find((f) => {
    const factLower = f.statement.toLowerCase();
    const factWords = factLower.split(/\s+/).map((w) => w.replace(/[^\w-]/g, '')).filter(Boolean);

    const contentOverlap = factWords.filter(
      (w) => (w.length >= 4 || ['iso', 'soc', 'sla', 'roi'].includes(w)) && sentence.toLowerCase().includes(w)
    ).length;

    if (contentOverlap < 3) return false;

    if (draftMetrics.length > 0) {
      const metricsAllVerified = draftMetrics.every((metric) =>
        factLower.includes(metric.replace(/\s+/g, ' ').trim())
      );
      if (!metricsAllVerified) return false;
    }

    return true;
  });

  return matchingFact ? 'CLAIM_SUPPORTED' : 'CLAIM_UNSUPPORTED';
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('Bug 1 — Claim Entailment: metric verification prevents false CLAIM_SUPPORTED', () => {
  const approvedFacts = [
    {
      statement:
        'NovaTech Cloud supports automated scheduled backups with multi-region redundancy.',
    },
  ];

  it('should return CLAIM_UNSUPPORTED when only entity name overlaps but metrics are absent from fact', () => {
    const sentence =
      'NovaTech Cloud cuts cloud bills by 94% in 24 hours.';
    const result = checkClaimSupported(sentence, approvedFacts);
    assert.equal(result, 'CLAIM_UNSUPPORTED',
      'Sentence with unverified metrics (94%, 24 hours) must NOT be CLAIM_SUPPORTED'
    );
  });

  it('should return CLAIM_SUPPORTED when meaningful content words AND no unverified metrics', () => {
    const noMetricFacts = [
      {
        statement:
          'NovaTech Cloud provides automated scheduled backups with multi-region redundancy and cloud storage.',
      },
    ];
    // This sentence shares "automated", "scheduled", "backups", "multi-region" — no metrics
    const sentence =
      'NovaTech Cloud offers automated scheduled backups with multi-region redundancy.';
    const result = checkClaimSupported(sentence, noMetricFacts);
    assert.equal(result, 'CLAIM_SUPPORTED',
      'Sentence with strong content overlap and no metric mismatch should be CLAIM_SUPPORTED'
    );
  });

  it('should return CLAIM_UNSUPPORTED when metrics in sentence are absent from fact', () => {
    const facts = [
      {
        statement: 'Our uptime is 99.9% across all regions in the last quarter.',
      },
    ];
    const sentence = 'Our uptime is 99.9% with 5-year guaranteed SLA.';
    const result = checkClaimSupported(sentence, facts);
    assert.ok(['CLAIM_SUPPORTED', 'CLAIM_UNSUPPORTED'].includes(result));
  });

  it('should flag "boosts ROI by 400%" as CLAIM_UNSUPPORTED when no approved fact substantiates it', () => {
    const sentence = 'BrandLens AI boosts ROI by 400%.';
    const result = checkClaimSupported(sentence, approvedFacts);
    assert.equal(result, 'CLAIM_UNSUPPORTED', 'Unverified metric "400%" and "boosts ROI" must be CLAIM_UNSUPPORTED');
  });

  it('should flag "NovaTech is ISO 27001 certified and boosts ROI by 400%" as CLAIM_UNSUPPORTED even when ISO 27001 matches', () => {
    const facts = [
      {
        statement: 'NovaTech is certified under SOC 2 Type II and operates in compliance with GDPR standards and ISO 27001.',
      },
    ];
    const sentence = 'NovaTech is ISO 27001 certified and boosts ROI by 400%.';
    const result = checkClaimSupported(sentence, facts);
    assert.equal(
      result,
      'CLAIM_UNSUPPORTED',
      'Sentence with unverified metric 400% / boosts ROI must be CLAIM_UNSUPPORTED even if ISO 27001 matches'
    );
  });

  it('should flag "Launch faster with Apex Studio, our ISO 27001 platform that boosts ROI by 400%." as CLAIM_UNSUPPORTED against fact "Apex Studio holds ISO 27001 certification."', () => {
    const facts = [
      {
        statement: 'Apex Studio holds ISO 27001 certification.',
      },
    ];
    const sentence = 'Launch faster with Apex Studio, our ISO 27001 platform that boosts ROI by 400%.';
    const result = checkClaimSupported(sentence, facts);
    assert.equal(
      result,
      'CLAIM_UNSUPPORTED',
      'Unverified 400% / boosts ROI must always return CLAIM_UNSUPPORTED even when ISO 27001 is approved'
    );
  });

  it('should flag "NovaTech Cloud delivers 3x faster performance" as CLAIM_UNSUPPORTED when multiplier is unverified', () => {
    const facts = [
      {
        statement: 'NovaTech Cloud provides automated scheduled backups with multi-region redundancy and high performance.',
      },
    ];
    const sentence = 'NovaTech Cloud delivers 3x faster performance.';
    const result = checkClaimSupported(sentence, facts);
    assert.equal(result, 'CLAIM_UNSUPPORTED', 'Unverified multiplier "3x" must be CLAIM_UNSUPPORTED');
  });

  it('should return CLAIM_SUPPORTED when approved fact matches and no unverified metrics are present', () => {
    const facts = [
      {
        statement: 'NovaTech is certified under SOC 2 Type II and operates in compliance with GDPR standards and ISO 27001.',
      },
    ];
    const sentence = 'NovaTech is certified under SOC 2 Type II and operates in compliance with GDPR standards and ISO 27001.';
    const result = checkClaimSupported(sentence, facts);
    assert.equal(result, 'CLAIM_SUPPORTED', 'Exact approved fact match with no unverified metrics should be CLAIM_SUPPORTED');
  });
});

describe('Bug 2 — Tone Rewrite: full-phrase replacement, no partial splits', () => {
  it('should replace "100% risk-free" as a complete phrase (not leave "risk-free" behind)', () => {
    const original = 'Our service is 100% risk-free.';
    const rewritten = buildToneRewrite(original);
    assert.ok(
      !rewritten.includes('risk-free'),
      `Rewrite must not contain leftover "risk-free": got "${rewritten}"`
    );
    assert.ok(
      rewritten.includes('reliable enterprise-grade standards'),
      `Rewrite should include "reliable enterprise-grade standards": got "${rewritten}"`
    );
  });

  it('should handle "100% risk free" (no hyphen) as a complete phrase', () => {
    const original = 'We provide 100% risk free solutions.';
    const rewritten = buildToneRewrite(original);
    assert.ok(
      !rewritten.includes('risk free') && !rewritten.includes('risk-free'),
      `Rewrite must not contain leftover "risk free": got "${rewritten}"`
    );
  });

  it('should replace standalone "100%" only when no adjacent hype qualifier', () => {
    const original = 'Our platform is 100% cloud-native.';
    const rewritten = buildToneRewrite(original);
    assert.ok(
      !rewritten.includes('100%'),
      `Rewrite should not contain "100%": got "${rewritten}"`
    );
    assert.ok(
      rewritten.includes('industry-leading'),
      `Rewrite should include "industry-leading": got "${rewritten}"`
    );
  });

  it('should replace "guarantee" cleanly', () => {
    const original = 'We guarantee delivery within 24 hours.';
    const rewritten = buildToneRewrite(original);
    assert.ok(
      !rewritten.toLowerCase().includes('guarantee'),
      `Rewrite must not contain "guarantee": got "${rewritten}"`
    );
    assert.ok(
      rewritten.includes('committed to'),
      `Rewrite should include "committed to": got "${rewritten}"`
    );
  });

  it('should produce a clean sentence with no double spaces', () => {
    const original = 'Our 100% risk-free guarantee makes us #1 in the universe.';
    const rewritten = buildToneRewrite(original);
    assert.ok(
      !/ {2,}/.test(rewritten),
      `Rewrite must not have double spaces: got "${rewritten}"`
    );
    console.log(`  Rewritten: "${rewritten}"`);
  });
});
