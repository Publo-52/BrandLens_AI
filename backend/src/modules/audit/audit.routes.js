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
      .limit(100);

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
      Content.find({ organisationId: orgId }),
      Review.find({ organisationId: orgId }),
    ]);

    // Aggregate findings metrics
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

    for (const r of reviews) {
      for (const f of r.findings) {
        totalFindings++;
        if (categoryCounts[f.type] !== undefined) {
          categoryCounts[f.type]++;
        } else {
          categoryCounts.OTHER++;
        }

        if (f.reviewStatus === REVIEW_STATUS.OVERRIDDEN) {
          overriddenCount++;
        } else if (f.reviewStatus === REVIEW_STATUS.ACCEPTED) {
          acceptedCount++;
        }
      }
    }

    const statusCounts = {
      DRAFT: 0,
      AUTO_CHECKED: 0,
      IN_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      APPROVED: 0,
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
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
