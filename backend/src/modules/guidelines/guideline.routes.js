import express from 'express';
import { Guideline, GUIDELINE_CATEGORIES, GUIDELINE_SEVERITIES, GUIDELINE_STATUS } from './guideline.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// GET /api/organisations/:organisationId/guidelines - List guidelines
router.get('/', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filter = { organisationId: req.params.organisationId };

    if (category && Object.values(GUIDELINE_CATEGORIES).includes(category)) {
      filter.category = category;
    }
    if (status && Object.values(GUIDELINE_STATUS).includes(status)) {
      filter.status = status;
    } else if (!status) {
      filter.status = GUIDELINE_STATUS.ACTIVE;
    }

    const guidelines = await Guideline.find(filter)
      .populate('ownerId', 'name email')
      .sort({ category: 1, severity: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      guidelines,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/guidelines - Create guideline rule (ADMIN, MANAGER)
router.post('/', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { title, category, ruleText, severity, sourceLocation, effectiveUntil } = req.body;

    if (!title || !ruleText) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and rule text are required.', statusCode: 400 },
      });
    }

    const guideline = await Guideline.create({
      organisationId: req.params.organisationId,
      title: title.trim(),
      category: category || GUIDELINE_CATEGORIES.TONE,
      ruleText: ruleText.trim(),
      severity: severity || GUIDELINE_SEVERITIES.MEDIUM,
      sourceLocation: sourceLocation || '',
      effectiveUntil: effectiveUntil || null,
      ownerId: req.user._id,
      version: 1,
      status: GUIDELINE_STATUS.ACTIVE,
    });

    res.status(201).json({
      success: true,
      guideline,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId/guidelines/:guidelineId - Update or version guideline (ADMIN, MANAGER)
router.patch('/:guidelineId', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { title, ruleText, severity, category, status } = req.body;
    const guideline = await Guideline.findOne({
      _id: req.params.guidelineId,
      organisationId: req.params.organisationId,
    });

    if (!guideline) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guideline not found.', statusCode: 404 },
      });
    }

    if (title) guideline.title = title.trim();
    if (ruleText && ruleText.trim() !== guideline.ruleText) {
      guideline.ruleText = ruleText.trim();
      guideline.version += 1; // Increment version on ruleText change as per Blueprint Section 6.1
    }
    if (severity) guideline.severity = severity;
    if (category) guideline.category = category;
    if (status) guideline.status = status;

    await guideline.save();

    res.json({
      success: true,
      guideline,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
