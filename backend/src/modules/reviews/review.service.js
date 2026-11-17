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
    ApprovedFact.find({ organisationId, status: 'ACTIVE' }).lean(),
    Guideline.find({ organisationId, status: 'ACTIVE' }).lean(),
  ]);

  const findings = [];

  // Grounded Heuristic Fact & Claim Verification
  // Detects factual statements / claims in the submitted draft
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Check for unsupported / exaggerated claims
  const exaggeratedTriggers = [
    { trigger: /100%|guarantee|never fail|instant|magic|invulnerable|zero risk/i, desc: 'Unsubstantiated absolute guarantee' },
    { trigger: /cheapest in the world|#1 in the universe|fastest ever/i, desc: 'Unverified superlative marketing claim' },
  ];

  for (const sentence of sentences) {
    // Check against tone guidelines
    for (const g of guidelines) {
      if (g.category === GUIDELINE_CATEGORIES.TONE || g.category === GUIDELINE_CATEGORIES.LEGAL) {
        for (const exp of exaggeratedTriggers) {
          if (exp.trigger.test(sentence)) {
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
              suggestedCorrection: sentence.replace(exp.trigger, 'reliable enterprise-grade standards'),
              checkMethod: CHECK_METHOD.AI,
              sourceReferences: [
                {
                  sourceType: 'GUIDELINE',
                  sourceId: String(g._id),
                  quote: g.ruleText,
                },
              ],
            });
            break;
          }
        }
      }
    }

    // Check factual claims against Approved Facts
    const claimKeywords = ['backup', 'uptime', 'sla', 'cloud', 'security', 'soc 2', 'gdpr', 'certified'];
    const hasClaimKeyword = claimKeywords.some((kw) => sentence.toLowerCase().includes(kw));

    if (hasClaimKeyword) {
      // Find matching approved fact
      const matchingFact = facts.find((f) => {
        const factWords = f.statement.toLowerCase().split(/\s+/);
        const matchCount = factWords.filter((w) => w.length > 3 && sentence.toLowerCase().includes(w)).length;
        return matchCount >= 2;
      });

      const matchIndex = text.indexOf(sentence);

      if (matchingFact) {
        // Supported claim with verified source reference
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
        // Blueprint Section 2.1 & 11.2: If no approved source exists, show a distinct
        // unsupported-claim result. Do not manufacture a citation!
        findings.push({
          type: FINDING_TYPES.CLAIM_UNSUPPORTED,
          severity: FINDING_SEVERITY.HIGH,
          confidence: 0.88,
          location: {
            start: matchIndex >= 0 ? matchIndex : 0,
            end: matchIndex >= 0 ? matchIndex + sentence.length : sentence.length,
          },
          originalText: sentence,
          explanation: 'No approved brand fact was found to substantiate this factual claim. Requires reviewer verification or citation approval before publication.',
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
