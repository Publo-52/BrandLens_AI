import express from 'express';
import { Content, CONTENT_STATUS } from '../contents/content.model.js';
import { Comment } from '../comments/comment.model.js';
import { AuditLog } from '../audit/audit.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';
import { validateObjectIdParam } from '../../middleware/security.js';

const router = express.Router({ mergeParams: true });
router.use(validateObjectIdParam('contentId'));

// POST /api/organisations/:organisationId/contents/:contentId/approval-request - Request formal review
router.post('/approval-request', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { contentId, organisationId } = req.params;
    const content = await Content.findOne({ _id: contentId, organisationId });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content not found.', statusCode: 404 },
      });
    }

    content.status = CONTENT_STATUS.IN_REVIEW;
    await content.save();

    await AuditLog.create({
      organisationId,
      actorId: req.user._id,
      action: 'APPROVAL_REQUESTED',
      entityType: 'CONTENT',
      entityId: String(contentId),
      details: { versionNumber: content.currentVersionNumber },
    });

    res.json({
      success: true,
      content,
      message: 'Submission routed to review queue for formal human sign-off.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/contents/:contentId/decision - Approve or Request Changes (MANAGER / ADMIN)
router.post('/decision', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { decision, reason } = req.body; // 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'
    const { contentId, organisationId } = req.params;

    if (!['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Decision must be APPROVED, CHANGES_REQUESTED, or REJECTED.', statusCode: 400 },
      });
    }

    const content = await Content.findOne({ _id: contentId, organisationId });
    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content not found.', statusCode: 404 },
      });
    }

    // Enterprise RBAC: Separation of duties prevents authors/creators from approving their own submissions
    if (decision === 'APPROVED' && content.createdBy && String(content.createdBy) === String(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Separation of duties violation: Creators are strictly prohibited from approving their own submissions. Approval requires an independent manager sign-off.',
          statusCode: 403,
        },
      });
    }

    content.status = decision;
    if (decision === 'APPROVED') {
      content.approvedBy = req.user._id;
      content.approvedAt = new Date();
      content.approvalNotes = reason?.trim() || '';
    }
    await content.save();

    // Immutable audit record
    await AuditLog.create({
      organisationId,
      actorId: req.user._id,
      action: `DECISION_${decision}`,
      entityType: 'CONTENT',
      entityId: String(contentId),
      reason: reason?.trim() || '',
      details: {
        versionNumber: content.currentVersionNumber,
        approverName: req.user.name,
        approverRole: req.membership.role,
      },
    });

    res.json({
      success: true,
      content,
      message: `Content officially marked as ${decision}.`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId/contents/:contentId/comments
router.get('/comments', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { contentId, organisationId } = req.params;
    const comments = await Comment.find({ contentId, organisationId })
      .populate('authorId', 'name email')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/contents/:contentId/comments
router.post('/comments', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { body, findingId } = req.body;
    const { contentId, organisationId } = req.params;

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment text is required.', statusCode: 400 },
      });
    }

    const content = await Content.findOne({ _id: contentId, organisationId });
    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content not found.', statusCode: 404 },
      });
    }

    const comment = await Comment.create({
      organisationId,
      contentId,
      contentVersionId: content.currentVersionId,
      findingId: findingId || null,
      authorId: req.user._id,
      body: body.trim(),
    });

    const populated = await Comment.findById(comment._id).populate('authorId', 'name email');

    res.status(201).json({
      success: true,
      comment: populated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/contents/:contentId/publish - Safe publishing (Requires APPROVED status)
router.post('/publish', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { destination, liveUrl } = req.body;
    const { contentId, organisationId } = req.params;

    const content = await Content.findOne({ _id: contentId, organisationId });
    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content not found.', statusCode: 404 },
      });
    }

    if (content.status !== CONTENT_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Safe Publishing Blocked: Content must have APPROVED status before publishing. Current status: ${content.status}`,
          statusCode: 400,
        },
      });
    }

    content.status = CONTENT_STATUS.PUBLISHED;
    await content.save();

    const certId = `BL-CERT-${contentId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    await AuditLog.create({
      organisationId,
      actorId: req.user._id,
      action: 'CONTENT_PUBLISHED',
      entityType: 'CONTENT',
      entityId: String(contentId),
      details: {
        destination: destination || 'Live Production Hub',
        liveUrl: liveUrl || `https://publish.brandlens.ai/p/${contentId}`,
        certificateId: certId,
        versionNumber: content.currentVersionNumber,
        publishedBy: req.user.name,
      },
    });

    res.json({
      success: true,
      content,
      certificateId: certId,
      message: `Content successfully published to ${destination || 'live channel'}!`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
