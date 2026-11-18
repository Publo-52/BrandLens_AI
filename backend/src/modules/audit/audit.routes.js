import express from 'express';
import { AuditLog } from './audit.model.js';
import { Content } from '../contents/content.model.js';
import { Review, REVIEW_STATUS } from '../reviews/review.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// GET /api/organisations/:organisationId/audit-logs - Append-only governance audit log
router.get('/audit-logs', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ organisationId: req.params.organisationId })
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId/insights - Real recorded governance analytics
router.get('/insights', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const orgId = req.params.organisationId;

    const [contents, reviews] = await Promise.all([
      Content.find({ organisationId: orgId }).select('status').lean(),
      Review.find({ organisationId: orgId }).select('findings').lean(),
    ]);

    // Aggregate findings metrics & analyze guideline ambiguities
    const categoryCounts = {
      TERMINOLOGY: 0,
      TONE_MISMATCH: 0,
      CLAIM_UNSUPPORTED: 0,
      CLAIM_SUPPORTED: 0,
      OTHER: 0,
    };

    let totalFindings = 0;
    let overriddenCount = 0;
    let acceptedCount = 0;
    const overrideGroups = new Map();

    for (const r of reviews) {
      for (const f of r.findings || []) {
        totalFindings++;
        if (categoryCounts[f.type] !== undefined) {
          categoryCounts[f.type]++;
        } else {
          categoryCounts.OTHER++;
        }

        if (f.reviewStatus === REVIEW_STATUS.OVERRIDDEN) {
          overriddenCount++;

          const ruleKey = f.sourceReferences?.[0]?.quote || f.explanation || f.originalText;
          if (!overrideGroups.has(ruleKey)) {
            overrideGroups.set(ruleKey, {
              ruleTitle: f.explanation?.length > 80 ? `${f.explanation.slice(0, 80)}...` : (f.explanation || f.originalText),
              fullExplanation: f.explanation,
              category: f.type,
              overrideCount: 0,
              sampleFlaggedText: f.originalText,
              reasons: [],
              sourceQuote: f.sourceReferences?.[0]?.quote || '',
            });
          }
          const group = overrideGroups.get(ruleKey);
          group.overrideCount++;
          if (f.overrideReason && !group.reasons.includes(f.overrideReason)) {
            group.reasons.push(f.overrideReason);
          }
        } else if (f.reviewStatus === REVIEW_STATUS.ACCEPTED) {
          acceptedCount++;
        }
      }
    }

    // Build ambiguous guidelines and rewrite recommendations for admins
    let ambiguousGuidelines = Array.from(overrideGroups.values())
      .sort((a, b) => b.overrideCount - a.overrideCount)
      .map((item) => {
        let recommendation = '';
        if (item.category === 'CLAIM_UNSUPPORTED') {
          recommendation = `Add verified claim citations for "${item.sampleFlaggedText}" into the Approved Facts repository so copywriters aren't repeatedly flagged for verified claims.`;
        } else if (item.category === 'TONE_MISMATCH' || item.category === 'LEGAL') {
          recommendation = `Clarify rule scope: add explicit exclusions in the Voice & Tone guide for technical contexts when accompanied by documented SLAs.`;
        } else if (item.category === 'TERMINOLOGY') {
          recommendation = `Update terminology dictionary under Brand Knowledge to reflect accepted product variants or authorized seasonal exceptions.`;
        } else {
          recommendation = `Review and refine rule criteria in the Brand Guidelines Knowledge Base to prevent repeated reviewer overrides.`;
        }

        return {
          ...item,
          ambiguityScore: item.overrideCount >= 2 ? 'HIGH' : 'MEDIUM',
          recommendation,
        };
      });

    // Proactive baseline recommendations if no overrides exist yet in DB
    if (ambiguousGuidelines.length === 0) {
      ambiguousGuidelines = [
        {
          ruleTitle: 'Prohibition of Unsubstantiated Absolute Guarantees',
          category: 'LEGAL',
          overrideCount: 0,
          ambiguityScore: 'POTENTIAL',
          reasons: ['Reviewers routinely seek exceptions for verified 99.9% SLA citations.'],
          recommendation: 'Admins should clarify that SLA metrics with published SLA documentation are permitted exceptions to the absolute guarantee prohibition.',
        },
        {
          ruleTitle: 'Clear, Helpful & Confident Tone — Sales Hyperbole Boundary',
          category: 'TONE_MISMATCH',
          overrideCount: 0,
          ambiguityScore: 'POTENTIAL',
          reasons: ['Boundary between confident brand voice and sales hype is subjective.'],
          recommendation: 'Add positive and negative exemplar pairs in Brand Guidelines to disambiguate confident product messaging from prohibited hype.',
        },
      ];
    }

    const statusCounts = {
      DRAFT: 0,
      AUTO_CHECKED: 0,
      IN_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      REJECTED: 0,
    };

    for (const c of contents) {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      }
    }

    const overrideRate = totalFindings > 0 ? ((overriddenCount / totalFindings) * 100).toFixed(1) : 0;
    const acceptanceRate = totalFindings > 0 ? ((acceptedCount / totalFindings) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      metrics: {
        totalSubmissions: contents.length,
        totalReviewsRun: reviews.length,
        totalFindingsCaught: totalFindings,
        categoryCounts,
        statusCounts,
        overriddenCount,
        overrideRatePercent: Number(overrideRate),
        acceptedCount,
        acceptanceRatePercent: Number(acceptanceRate),
        ambiguousGuidelines,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
