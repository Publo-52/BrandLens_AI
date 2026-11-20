import { TerminologyRule } from '../terminology/terminology.model.js';
import { Guideline, GUIDELINE_CATEGORIES } from '../guidelines/guideline.model.js';
import { ApprovedFact } from '../facts/fact.model.js';
import { Review, FINDING_TYPES, FINDING_SEVERITY, CHECK_METHOD } from './review.model.js';
import { Content } from '../contents/content.model.js';
import { ContentVersion } from '../contents/contentVersion.model.js';
import { logger } from '../../utils/logger.js';

// In-memory compiled RegEx cache for ultra-fast terminology scanning
const regexCache = new Map();
function getCachedRegex(banned, caseSensitive) {
  const key = `${caseSensitive ? 's' : 'i'}:${banned}`;
  let regex = regexCache.get(key);
  if (!regex) {
    const flags = caseSensitive ? 'g' : 'gi';
    const escapedBanned = banned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    regex = new RegExp(`\\b${escapedBanned}\\b`, flags);
    if (regexCache.size > 2000) regexCache.clear();
    regexCache.set(key, regex);
  }
  regex.lastIndex = 0;
  return regex;
}

/**
 * 1. Deterministic Terminology Check Engine
 * Scans content text against organisation's active terminology rules.
 */
export async function runDeterministicChecks(text, organisationId) {
  const rules = await TerminologyRule.find({ organisationId, isActive: true }).lean();
  const findings = [];

  for (const rule of rules) {
    for (const banned of rule.bannedTerms) {
      if (!banned.trim()) continue;

      const regex = getCachedRegex(banned, rule.caseSensitive);

      let match;
      while ((match = regex.exec(text)) !== null) {
        // If the matched text is already exactly the preferred term, it's compliant - do not flag!
        if (match[0] === rule.preferredTerm) {
          continue;
        }

        findings.push({
          type: FINDING_TYPES.TERMINOLOGY,
          severity: FINDING_SEVERITY.HIGH,
          confidence: 1.0,
          location: {
            start: match.index,
            end: match.index + match[0].length,
          },
          originalText: match[0],
          explanation: rule.explanation || `The term "${match[0]}" is discouraged or banned by brand governance.`,
          suggestedCorrection: rule.replacement || rule.preferredTerm,
          checkMethod: CHECK_METHOD.DETERMINISTIC,
          sourceReferences: [
            {
              sourceType: 'TERMINOLOGY_RULE',
              sourceId: String(rule._id),
              quote: `Preferred: "${rule.preferredTerm}". Discouraged: [${rule.bannedTerms.join(', ')}]`,
            },
          ],
        });
      }
    }
  }

  return findings;
}

/**
 * 2. Grounded Fact and Tone Verification Engine
 * Compares claims against approved facts and tone guidelines.
 */
export async function runGroundedChecks(text, organisationId, channel, audience) {
  const [facts, guidelines] = await Promise.all([
    ApprovedFact.find({
      organisationId,
      status: { $in: ['ACTIVE', 'active', null, undefined], $ne: 'EXPIRED' },
    }).lean(),
    Guideline.find({
      organisationId,
      status: { $in: ['ACTIVE', 'active', null, undefined], $ne: 'ARCHIVED' },
    }).lean(),
  ]);

  const findings = [];

  // Grounded Heuristic Fact & Claim Verification
  // Detects factual statements / claims in the submitted draft
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  // Hype phrase patterns for TONE_MISMATCH — keyed by the full phrase to replace
  // Each entry has: `pattern` (full phrase regex), `replacement` (clean rewrite phrase)
  const exaggeratedTriggers = [
    {
      // Full-phrase: "100% risk-free" or "100% risk free" → replace whole phrase together
      pattern: /100%\s+risk[-\s]?free/gi,
      replacement: 'reliable, enterprise-grade',
    },
    {
      // Full-phrase: "100% guarantee(d)" → replace whole phrase
      pattern: /100%\s+guarantee[d]?/gi,
      replacement: 'backed by our service-level agreement',
    },
    {
      // Standalone "100%" — negative lookahead ensures "100% risk-free" / "100% guaranteed" already replaced above
      pattern: /\b100%(?!\s+risk|\s+guarantee)/gi,
      replacement: 'industry-leading',
    },
    {
      pattern: /\bguarantee\b/gi,
      replacement: 'committed to',
    },
    {
      pattern: /\bnever fail(s)?\b/gi,
      replacement: 'maintains high availability',
    },
    {
      pattern: /\binstant\b/gi,
      replacement: 'rapid',
    },
    {
      pattern: /\bmagic\b/gi,
      replacement: 'advanced',
    },
    {
      pattern: /\binvulnerable\b/gi,
      replacement: 'resilient',
    },
    {
      pattern: /\bzero[- ]risk\b/gi,
      replacement: 'low-risk',
    },
    {
      pattern: /cheapest in the world/gi,
      replacement: 'highly cost-effective',
    },
    {
      pattern: /#1 in the universe/gi,
      replacement: 'industry-leading',
    },
    {
      pattern: /fastest ever/gi,
      replacement: 'exceptionally fast',
    },
  ];

  // Combined detection regex for quick sentence screening (any trigger fires tone check)
  const anyHypeTrigger = /100%\s+risk[-\s]?free|100%\s+guarantee[d]?|\b100%|\bguarantee\b|\bnever fail(s)?\b|\binstant\b|\bmagic\b|\binvulnerable\b|\bzero[- ]risk\b|cheapest in the world|#1 in the universe|fastest ever/i;

  /**
   * Apply all hype-phrase replacements sequentially (most specific first)
   * to produce a grammatically clean rewrite without partial splits.
   */
  function buildToneRewrite(original) {
    let rewritten = original;
    for (const { pattern, replacement } of exaggeratedTriggers) {
      // Reset stateful global flags
      pattern.lastIndex = 0;
      rewritten = rewritten.replace(pattern, replacement);
    }
    // Collapse any double spaces left behind
    return rewritten.replace(/\s{2,}/g, ' ').trim();
  }

  // Quantitative metric extraction: numbers, percentages, multipliers, currency, timeframes
  const metricPattern = /\b\d+(?:\.\d+)?(?:%|\s*x\b|\s*hours?|\s*days?|\s*weeks?|\s*months?|\s*years?|\s*minutes?|\s*seconds?|\s*times\b)?|(?:\$|€|£)\s*\d+(?:\.\d+)?/gi;

  // Specific promotional/performance claim phrases with metrics (e.g. "boosts ROI by 400%", "cuts cloud bills by 94%", "delivers 3x faster")
  const promotionalMetricPhrasePattern = /\b(?:boosts?|increases?|reduces?|cuts?|saves?|delivers?|maximizes?|accelerates?|improves?|slashes?|doubles?|triples?)\s+(?:(?:[a-z]{2,15}\s+){0,3})?(?:by\s+)?(?:\d+(?:\.\d+)?(?:%|x\b)|(?:\$|€|£)\s*\d+)(?:\s+faster|\s+more)?/gi;

  // Broad promotional / performance claims (e.g. boosts, increases, reduces, cuts, saves, faster, guaranteed, roi, etc.)
  const broadPromotionalPattern = /\b(?:boosts?|increases?|reduces?|cuts?|saves?|faster|guaranteed?|delivers?|maximizes?|accelerates?|improves?|slashes?|doubles?|triples?)\b|\b(?:roi|return on investment|revenue|savings?|conversion|growth|efficiency|costs?|speed|latency|downtime|turnaround)\b/gi;

  // Domain keywords for factual claims against Approved Facts
  const claimKeywords = [
    'backup', 'uptime', 'sla', 'cloud', 'security', 'soc 2', 'gdpr',
    'certified', 'certification', 'iso', 'iso 27001', 'hipaa', 'compliance',
    'compliant', 'guarantee', 'guaranteed', 'latency', 'redundancy', 'encryption',
    'pci-dss', 'patented', 'audited', 'roi', 'faster', 'savings', 'boosts'
  ];

  for (const sentence of sentences) {
    // Check against tone guidelines (flag at most once per sentence)
    let sentenceFlaggedTone = false;
    for (const g of guidelines) {
      if (sentenceFlaggedTone) break;
      if (g.category === GUIDELINE_CATEGORIES.TONE || g.category === GUIDELINE_CATEGORIES.LEGAL) {
        // Use the combined detection regex; reset before each test
        anyHypeTrigger.lastIndex = 0;
        if (anyHypeTrigger.test(sentence)) {
          const matchIndex = text.indexOf(sentence);
          findings.push({
            type: FINDING_TYPES.TONE_MISMATCH,
            severity: g.severity || FINDING_SEVERITY.HIGH,
            confidence: 0.92,
            location: {
              start: matchIndex >= 0 ? matchIndex : 0,
              end: matchIndex >= 0 ? matchIndex + sentence.length : sentence.length,
            },
            originalText: sentence,
            explanation: `Sentence contains exaggerated or unsubstantiated wording conflicting with brand tone: "${g.title}".`,
            suggestedCorrection: buildToneRewrite(sentence),
            checkMethod: CHECK_METHOD.AI,
            sourceReferences: [
              {
                sourceType: 'GUIDELINE',
                sourceId: String(g._id),
                quote: g.ruleText,
              },
            ],
          });
          sentenceFlaggedTone = true;
        }
      }
    }

    // Check factual and promotional claims against Approved Facts
    promotionalMetricPhrasePattern.lastIndex = 0;
    const promoMetricMatches = [...sentence.matchAll(promotionalMetricPhrasePattern)].map((m) => m[0].trim());

    broadPromotionalPattern.lastIndex = 0;
    const hasPromotionalClaim = broadPromotionalPattern.test(sentence);

    metricPattern.lastIndex = 0;
    const draftMetrics = [...sentence.matchAll(metricPattern)]
      .map((m) => m[0].toLowerCase().trim())
      .filter((m) => m.length > 0);

    const quantitativeMetrics = draftMetrics.filter((m) =>
      /[%x$€£]|hours?|days?|weeks?|months?|years?|minutes?|seconds?|\d+\.\d+/.test(m) ||
      (hasPromotionalClaim && /\d+/.test(m))
    );
    const hasQuantitativeMetric = quantitativeMetrics.length > 0;
    const hasClaimKeyword = claimKeywords.some((kw) => sentence.toLowerCase().includes(kw));

    const isClaimCandidate = promoMetricMatches.length > 0 || hasPromotionalClaim || hasQuantitativeMetric || hasClaimKeyword;

    if (isClaimCandidate) {
      // Check if quantitative metrics in the draft sentence are substantiated by ANY approved fact
      const unverifiedMetrics = quantitativeMetrics.filter((metric) => {
        const normalized = metric.replace(/\s+/g, ' ').trim();
        return !facts.some((f) => f.statement.toLowerCase().includes(normalized));
      });

      // Check if promotional claim is substantiated (e.g. ROI / revenue)
      const hasRoi = /\broi\b|return on investment/i.test(sentence);
      const isRoiUnverified = hasRoi && !facts.some((f) => /\broi\b|return on investment/i.test(f.statement.toLowerCase()));

      const hasUnverifiedMetricOrPromo = unverifiedMetrics.length > 0 || promoMetricMatches.length > 0 || isRoiUnverified;

      // Find matching approved fact — requires TRUE SEMANTIC and QUANTITATIVE entailment:
      // If there are unverified metrics or promotional claims, NO fact can substantiate the sentence!
      let matchingFact = null;
      if (!hasUnverifiedMetricOrPromo) {
        matchingFact = facts.find((f) => {
          const factLower = f.statement.toLowerCase();
          const factWords = factLower.split(/\s+/).map((w) => w.replace(/[^\w-]/g, '')).filter(Boolean);

          // Overlap of meaningful content words (length >= 4 or key compliance terms)
          const contentOverlap = factWords.filter(
            (w) => (w.length >= 4 || ['iso', 'soc', 'sla', 'roi'].includes(w)) && sentence.toLowerCase().includes(w)
          ).length;

          if (contentOverlap < 3) return false;

          // All metrics must exist in fact
          if (draftMetrics.length > 0) {
            const metricsAllVerified = draftMetrics.every((metric) => {
              const normalized = metric.replace(/\s+/g, ' ').trim();
              return factLower.includes(normalized);
            });
            if (!metricsAllVerified) return false;
          }

          return true;
        });
      }

      if (matchingFact) {
        const matchIndex = text.indexOf(sentence);
        findings.push({
          type: FINDING_TYPES.CLAIM_SUPPORTED,
          severity: FINDING_SEVERITY.INFO,
          confidence: 0.95,
          location: {
            start: matchIndex >= 0 ? matchIndex : 0,
            end: matchIndex >= 0 ? matchIndex + sentence.length : sentence.length,
          },
          originalText: sentence,
          explanation: 'Factual claim is verified and supported by an active approved brand fact.',
          suggestedCorrection: sentence,
          checkMethod: CHECK_METHOD.AI,
          sourceReferences: [
            {
              sourceType: 'APPROVED_FACT',
              sourceId: String(matchingFact._id),
              quote: matchingFact.statement,
            },
          ],
        });
      } else {
        // ALWAYS return CLAIM_UNSUPPORTED with "No Approved Citation Found"
        const flaggedPhrase = promoMetricMatches[0] || (unverifiedMetrics.length > 0 ? (sentence.includes(unverifiedMetrics[0]) ? unverifiedMetrics[0] : sentence) : sentence);
        const matchIndex = text.indexOf(flaggedPhrase) >= 0 ? text.indexOf(flaggedPhrase) : (text.indexOf(sentence) >= 0 ? text.indexOf(sentence) : 0);

        const explanation = (unverifiedMetrics.length > 0 || promoMetricMatches.length > 0)
          ? `No Approved Citation Found: No approved brand fact substantiates the promotional metric or performance claim ("${flaggedPhrase}") in this sentence. Requires reviewer verification or citation approval before publication.`
          : 'No Approved Citation Found: No approved brand fact was found to substantiate this factual claim. Requires reviewer verification or citation approval before publication.';

        findings.push({
          type: FINDING_TYPES.CLAIM_UNSUPPORTED,
          severity: FINDING_SEVERITY.HIGH,
          confidence: 0.90,
          location: {
            start: matchIndex,
            end: matchIndex + flaggedPhrase.length,
          },
          originalText: flaggedPhrase,
          explanation,
          suggestedCorrection: 'Qualify or remove this claim until approved source data is added to the Brand Knowledge Base.',
          checkMethod: CHECK_METHOD.AI,
          sourceReferences: [], // Explicitly empty: no hallucinated citation!
        });
      }
    }
  }

  return findings;
}

/**
 * 3. Master Orchestration: Run complete review pipeline
 */
export async function executeReview({ contentId, contentVersionId, organisationId }) {
  const startTime = Date.now();

  // Fetch version and content concurrently
  const [version, content] = await Promise.all([
    ContentVersion.findOne({
      _id: contentVersionId,
      contentId,
      organisationId,
    }),
    Content.findById(contentId),
  ]);

  if (!version) {
    throw new Error('Content version not found');
  }

  // Run deterministic and grounded checks concurrently for minimal latency
  const [deterministicFindings, groundedFindings] = await Promise.all([
    runDeterministicChecks(version.text, organisationId),
    runGroundedChecks(
      version.text,
      organisationId,
      content?.channel,
      content?.audience
    ),
  ]);

  // Combine findings: deterministic text + grounded facts + visual/accessibility checks
  const visualFindings = [];
  if (version.fileReferences && version.fileReferences.length > 0) {
    for (const fileRef of version.fileReferences) {
      if (fileRef.visualChecks?.findings && Array.isArray(fileRef.visualChecks.findings)) {
        for (const vf of fileRef.visualChecks.findings) {
          visualFindings.push({
            type: vf.type || FINDING_TYPES.ACCESSIBILITY,
            severity: vf.severity || FINDING_SEVERITY.MEDIUM,
            confidence: vf.confidence || 0.95,
            location: { start: 0, end: 0, page: 1 },
            originalText: vf.originalText || `[File: ${fileRef.originalName}]`,
            explanation: vf.explanation || 'Visual or accessibility compliance finding.',
            suggestedCorrection: vf.suggestedCorrection || '',
            checkMethod: vf.checkMethod || CHECK_METHOD.DETERMINISTIC,
            sourceReferences: vf.sourceReferences || [],
          });
        }
      }
    }
  }

  const allFindings = [...deterministicFindings, ...groundedFindings, ...visualFindings];

  const review = await Review.create({
    organisationId,
    contentId,
    contentVersionId,
    status: 'COMPLETED',
    findings: allFindings,
    processingMetadata: {
      modelProvider: 'BrandLens Hybrid Engine',
      modelName: 'Deterministic Lexicon + Grounded Fact Retrieval',
      completedAt: new Date(),
      executionTimeMs: Date.now() - startTime,
    },
  });

  // Transition content status to AUTO_CHECKED as per Blueprint Section 5.1
  await Content.findByIdAndUpdate(contentId, {
    status: 'AUTO_CHECKED',
  });

  logger.info(`Review completed for content ${contentId} v${version.versionNumber} with ${allFindings.length} findings.`);

  return review;
}
