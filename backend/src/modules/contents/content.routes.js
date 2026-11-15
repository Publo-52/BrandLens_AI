import express from 'express';
import multer from 'multer';
import { Content, CONTENT_STATUS, CHANNELS } from './content.model.js';
import { ContentVersion } from './contentVersion.model.js';
import { Review, REVIEW_STATUS } from '../reviews/review.model.js';
import { executeReview } from '../reviews/review.service.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router({ mergeParams: true });

// POST /api/organisations/:organisationId/contents - Create draft and run automated review
router.post('/', authenticate, requireOrgAccess(), upload.array('files', 5), async (req, res, next) => {
  try {
    const { title, channel, audience, text } = req.body;
    const orgId = req.params.organisationId;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Content title is required.', statusCode: 400 },
      });
    }

    let submittedText = text ? text.trim() : '';
    const fileReferences = [];

    // Extract text from uploaded files (Milestone 4 multi-format intake)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let extracted = '';
        if (file.mimetype === 'text/plain') {
          extracted = file.buffer.toString('utf-8');
        } else {
          // For binary formats like PDF/DOCX/Images, simulate/extract textual content
          extracted = `[Document: ${file.originalname}] ${file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 500)).replace(/[^\x20-\x7E\t\r\n]/g, ' ')}`;
        }

        fileReferences.push({
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey: `local_uploads/${Date.now()}_${file.originalname}`,
          extractedText: extracted,
        });

        if (!submittedText && extracted) {
          submittedText = extracted;
        }
      }
    }

    if (!submittedText) {
      return res.status(400).json({
        success: false,
        error: { message: 'Content body text or a supported readable document is required.', statusCode: 400 },
      });
    }

    // 1. Create Content entity
    const content = await Content.create({
      organisationId: orgId,
      title: title.trim(),
      channel: channel || CHANNELS.SOCIAL,
      audience: audience?.trim() || 'General Public',
      createdBy: req.user._id,
      status: CONTENT_STATUS.DRAFT,
      currentVersionNumber: 1,
    });

    // 2. Create ContentVersion #1
    const version = await ContentVersion.create({
      organisationId: orgId,
      contentId: content._id,
      versionNumber: 1,
      text: submittedText,
      fileReferences,
      changeSummary: 'Initial draft submission',
      createdBy: req.user._id,
    });

    content.currentVersionId = version._id;
    await content.save();

    // 3. Execute Automated Review Engine (Milestone 5)
    const review = await executeReview({
      contentId: content._id,
      contentVersionId: version._id,
      organisationId: orgId,
    });

    const populatedContent = await Content.findById(content._id)
      .populate('createdBy', 'name email')
      .populate('currentVersionId');

    res.status(201).json({
      success: true,
      content: populatedContent,
      version,
      review,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId/contents - List all submissions in workspace
router.get('/', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { status, channel } = req.query;
    const filter = { organisationId: req.params.organisationId };

    if (status) filter.status = status;
    if (channel) filter.channel = channel;

    const contents = await Content.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      contents,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId/contents/:contentId - Get submission with versions and review findings
router.get('/:contentId', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const content = await Content.findOne({
      _id: req.params.contentId,
      organisationId: req.params.organisationId,
    })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('currentVersionId');

    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content submission not found.', statusCode: 404 },
      });
    }

    const versions = await ContentVersion.find({
      contentId: content._id,
      organisationId: req.params.organisationId,
    }).sort({ versionNumber: 1 });

    const latestReview = await Review.findOne({
      contentId: content._id,
      contentVersionId: content.currentVersionId?._id || versions[versions.length - 1]?._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      content,
      versions,
      latestReview,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/contents/:contentId/versions - Submit a revised version
router.post('/:contentId/versions', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { text, changeSummary } = req.body;
    const { contentId, organisationId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Revised text is required.', statusCode: 400 },
      });
    }

    const content = await Content.findOne({ _id: contentId, organisationId });
    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content not found.', statusCode: 404 },
      });
    }

    // Blueprint Section 6.9: Approved version is locked!
    if (content.status === CONTENT_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        error: { message: 'This content version is officially approved and locked. Cannot edit approved content.', statusCode: 403 },
      });
    }

    const nextVersionNumber = content.currentVersionNumber + 1;

    // Create new immutable version record
    const newVersion = await ContentVersion.create({
      organisationId,
      contentId,
      versionNumber: nextVersionNumber,
      text: text.trim(),
      changeSummary: changeSummary?.trim() || `Revised to version ${nextVersionNumber}`,
      createdBy: req.user._id,
    });

    content.currentVersionId = newVersion._id;
    content.currentVersionNumber = nextVersionNumber;
    content.status = CONTENT_STATUS.DRAFT;
    await content.save();

    // Re-run review engine on revised version
    const review = await executeReview({
      contentId,
      contentVersionId: newVersion._id,
      organisationId,
    });

    res.status(201).json({
      success: true,
      version: newVersion,
      review,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId/contents/:contentId/findings/:findingId - Decision on finding
router.patch('/:contentId/findings/:findingId', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { reviewStatus, rejectionReason, overrideReason, editedText } = req.body;
    const { contentId, findingId } = req.params;

    if (!Object.values(REVIEW_STATUS).includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid reviewStatus. Allowed: ${Object.values(REVIEW_STATUS).join(', ')}`, statusCode: 400 },
      });
    }

    // Blueprint Section 5: Overriding requires a reason!
    if (reviewStatus === REVIEW_STATUS.OVERRIDDEN && (!overrideReason || !overrideReason.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'A justified override reason is mandatory when overriding an AI flag.', statusCode: 400 },
      });
    }

    // Blueprint Section 5: Rejection requires a reason!
    if (reviewStatus === REVIEW_STATUS.REJECTED && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'A rejection reason is mandatory when declining a suggestion.', statusCode: 400 },
      });
    }

    const review = await Review.findOne({
      contentId,
      'findings._id': findingId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { message: 'Finding not found in review records.', statusCode: 404 },
      });
    }

    const finding = review.findings.id(findingId);
    finding.reviewStatus = reviewStatus;
    if (rejectionReason) finding.rejectionReason = rejectionReason.trim();
    if (overrideReason) finding.overrideReason = overrideReason.trim();
    if (editedText) finding.editedText = editedText.trim();

    await review.save();

    res.json({
      success: true,
      finding,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
