import express from 'express';
import multer from 'multer';
import { Content, CONTENT_STATUS, CHANNELS } from './content.model.js';
import { ContentVersion } from './contentVersion.model.js';
import { Review, REVIEW_STATUS } from '../reviews/review.model.js';
import { executeReview } from '../reviews/review.service.js';
import { AuditLog } from '../audit/audit.model.js';
import { BrandAsset, ASSET_TYPES } from '../assets/asset.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';
import { validateObjectIdParam } from '../../middleware/security.js';
import { uploadRateLimiter } from '../../middleware/rateLimiter.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { validateUploadedFile, MAX_UPLOAD_SIZE_BYTES } from '../../utils/fileValidation.js';
import { extractAndAnalyzeFile } from '../../services/extractionService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 5 },
});

const router = express.Router({ mergeParams: true });

// POST /api/organisations/:organisationId/contents - Create draft and run automated review
router.post('/', authenticate, requireOrgAccess(), uploadRateLimiter, upload.array('files', 5), async (req, res, next) => {
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

    // Parse alt texts mapping (keyed by originalName or index)
    let altTextsMap = {};
    try {
      if (typeof req.body.altTexts === 'string') {
        altTextsMap = JSON.parse(req.body.altTexts);
      } else if (typeof req.body.altTexts === 'object' && req.body.altTexts !== null) {
        altTextsMap = req.body.altTexts;
      }
    } catch {
      altTextsMap = {};
    }

    // Retrieve active brand palette for visual compliance checks
    const paletteAssets = await BrandAsset.find({
      organisationId: orgId,
      type: ASSET_TYPES.PALETTE,
      isActive: true,
    }).lean();
    const brandPalette = paletteAssets.flatMap((a) => a.metadata?.hexColors || []);

    // Extract text and visual checks from uploaded files (Multi-Format Intake)
    if (req.files && req.files.length > 0) {
      for (let idx = 0; idx < req.files.length; idx++) {
        const file = req.files[idx];

        // Strict extension + MIME + size + magic-byte signature validation
        const validation = validateUploadedFile(file, { mode: 'content' });
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: {
              message: validation.error,
              statusCode: 400,
            },
          });
        }

        const safeName = validation.safeName;

        const fileAltText =
          altTextsMap[file.originalname] ||
          altTextsMap[safeName] ||
          altTextsMap[String(idx)] ||
          req.body[`altText_${idx}`] ||
          req.body.altText ||
          '';

        // Extract text & run visual accessibility checks via extraction engine
        const analysis = await extractAndAnalyzeFile(
          { ...file, originalname: safeName },
          {
            altText: typeof fileAltText === 'string' ? fileAltText : '',
            brandPalette,
          }
        );

        const extracted = analysis.extractedText || '';

        // Upload to Cloudinary for durable CDN asset delivery (explicit safe resource type)
        let storageKey = `local_uploads/${Date.now()}_${safeName}`;
        try {
          const resourceType = validation.ext === '.pdf' || validation.ext === '.docx' || validation.ext === '.doc' || validation.ext === '.txt' ? 'raw' : 'image';
          const uploadResult = await uploadToCloudinary(file.buffer, {
            folder: `brandlens/${orgId}/drafts`,
            resource_type: resourceType,
            public_id: `${Date.now()}_${safeName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          });
          if (uploadResult?.secure_url) {
            storageKey = uploadResult.secure_url;
          }
        } catch {
          // Graceful fallback to local reference
        }

        fileReferences.push({
          originalName: safeName,
          mimeType: file.mimetype,
          size: file.size,
          storageKey,
          extractedText: extracted,
          altText: typeof fileAltText === 'string' ? fileAltText : '',
          visualChecks: analysis.visualChecks,
        });

        if (!submittedText && extracted) {
          submittedText = extracted;
        } else if (submittedText && extracted && !submittedText.includes(extracted)) {
          submittedText = `${submittedText}\n\n[Extracted from ${safeName}]:\n${extracted}`;
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

    // Record immutable audit logs for Intake & Review
    await AuditLog.create({
      organisationId: orgId,
      actorId: req.user._id,
      action: 'CONTENT_INTAKE',
      entityType: 'CONTENT',
      entityId: String(content._id),
      details: {
        title: content.title,
        channel: content.channel,
        versionNumber: 1,
        findingsCount: review?.findings?.length || 0,
        actionSummary: 'Content draft submitted for brand compliance evaluation',
      },
    });

    await AuditLog.create({
      organisationId: orgId,
      actorId: req.user._id,
      action: 'REVIEW_RUN',
      entityType: 'CONTENT',
      entityId: String(content._id),
      details: {
        title: content.title,
        versionNumber: 1,
        findingsCount: review?.findings?.length || 0,
        executionTimeMs: review?.processingMetadata?.executionTimeMs || 0,
      },
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

    if (typeof status === 'string' && Object.values(CONTENT_STATUS).includes(status)) {
      filter.status = status;
    }
    if (typeof channel === 'string' && Object.values(CHANNELS).includes(channel)) {
      filter.channel = channel;
    }

    const contents = await Content.find(filter)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      contents,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId/contents/:contentId - Get submission with versions and review findings
router.get('/:contentId', authenticate, requireOrgAccess(), validateObjectIdParam('contentId'), async (req, res, next) => {
  try {
    const content = await Content.findOne({
      _id: req.params.contentId,
      organisationId: req.params.organisationId,
    })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('currentVersionId')
      .lean();

    if (!content) {
      return res.status(404).json({
        success: false,
        error: { message: 'Content submission not found.', statusCode: 404 },
      });
    }

    const versions = await ContentVersion.find({
      contentId: content._id,
      organisationId: req.params.organisationId,
    }).sort({ versionNumber: 1 }).lean();

    let latestReview = await Review.findOne({
      contentId: content._id,
      contentVersionId: content.currentVersionId?._id || content.currentVersionId || versions[versions.length - 1]?._id,
    }).sort({ createdAt: -1 }).lean();

    if (!latestReview) {
      latestReview = await Review.findOne({
        contentId: content._id,
      }).sort({ createdAt: -1 }).lean();
    }

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
router.post('/:contentId/versions', authenticate, requireOrgAccess(), validateObjectIdParam('contentId'), async (req, res, next) => {
  try {
    const { text, changeSummary } = req.body;
    const { contentId, organisationId } = req.params;

    if (typeof text !== 'string' || !text.trim()) {
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

    // Blueprint Section 6.9: Approved & Published versions are locked!
    if (content.status === CONTENT_STATUS.APPROVED || content.status === CONTENT_STATUS.PUBLISHED) {
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

    await AuditLog.create({
      organisationId,
      actorId: req.user._id,
      action: 'CONTENT_INTAKE',
      entityType: 'CONTENT',
      entityId: String(contentId),
      details: {
        title: content.title,
        versionNumber: nextVersionNumber,
        changeSummary: newVersion.changeSummary,
        findingsCount: review?.findings?.length || 0,
        actionSummary: 'New version revision submitted for brand compliance evaluation',
      },
    });

    await AuditLog.create({
      organisationId,
      actorId: req.user._id,
      action: 'REVIEW_RUN',
      entityType: 'CONTENT',
      entityId: String(contentId),
      details: {
        title: content.title,
        versionNumber: nextVersionNumber,
        findingsCount: review?.findings?.length || 0,
        executionTimeMs: review?.processingMetadata?.executionTimeMs || 0,
      },
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
router.patch(
  '/:contentId/findings/:findingId',
  authenticate,
  requireOrgAccess(),
  validateObjectIdParam('contentId', 'findingId'),
  async (req, res, next) => {
  try {
    const { reviewStatus, rejectionReason, overrideReason, editedText } = req.body;
    const { organisationId, contentId, findingId } = req.params;

    if (typeof reviewStatus !== 'string' || !Object.values(REVIEW_STATUS).includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid reviewStatus. Allowed: ${Object.values(REVIEW_STATUS).join(', ')}`, statusCode: 400 },
      });
    }

    // Blueprint Section 5: Overriding requires a reason!
    if (reviewStatus === REVIEW_STATUS.OVERRIDDEN && (typeof overrideReason !== 'string' || !overrideReason.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'A justified override reason is mandatory when overriding an AI flag.', statusCode: 400 },
      });
    }

    // Blueprint Section 5: Rejection requires a reason!
    if (reviewStatus === REVIEW_STATUS.REJECTED && (typeof rejectionReason !== 'string' || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'A rejection reason is mandatory when declining a suggestion.', statusCode: 400 },
      });
    }

    // Enforce tenant isolation by scoping query to organisationId
    const review = await Review.findOne({
      organisationId,
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

    const content = await Content.findById(contentId).select('title').lean();

    await AuditLog.create({
      organisationId,
      actorId: req.user._id,
      action: 'FINDING_DECISION',
      entityType: 'FINDING',
      entityId: String(findingId),
      reason: overrideReason?.trim() || rejectionReason?.trim() || '',
      details: {
        contentId: String(contentId),
        title: content?.title || 'Draft Submission',
        reviewStatus,
        findingType: finding.type,
        term: finding.originalText,
        reason: overrideReason?.trim() || rejectionReason?.trim() || '',
        editedText: editedText?.trim() || '',
      },
    });

    res.json({
      success: true,
      finding,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
