import express from 'express';
import { TerminologyRule } from './terminology.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// GET /api/organisations/:organisationId/terminology - List terminology rules
router.get('/', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const rules = await TerminologyRule.find({
      organisationId: req.params.organisationId,
      isActive: true,
    })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rules,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/terminology - Create terminology rule (ADMIN, MANAGER)
router.post('/', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { preferredTerm, bannedTerms, replacement, explanation, caseSensitive, scope } = req.body;

    if (!preferredTerm || !bannedTerms || !Array.isArray(bannedTerms) || bannedTerms.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Preferred term and at least one banned term are required.', statusCode: 400 },
      });
    }

    const cleanBanned = bannedTerms
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter((t) => t.length > 0);

    const rule = await TerminologyRule.create({
      organisationId: req.params.organisationId,
      preferredTerm: preferredTerm.trim(),
      bannedTerms: cleanBanned,
      replacement: replacement?.trim() || preferredTerm.trim(),
      explanation: explanation?.trim() || '',
      caseSensitive: Boolean(caseSensitive),
      scope: scope?.trim() || 'General',
      ownerId: req.user._id,
      version: 1,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      rule,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId/terminology/:ruleId - Update terminology rule (ADMIN, MANAGER)
router.patch('/:ruleId', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { preferredTerm, bannedTerms, replacement, explanation, caseSensitive, scope, isActive } = req.body;
    const rule = await TerminologyRule.findOne({
      _id: req.params.ruleId,
      organisationId: req.params.organisationId,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: { message: 'Terminology rule not found.', statusCode: 404 },
      });
    }

    if (preferredTerm) rule.preferredTerm = preferredTerm.trim();
    if (Array.isArray(bannedTerms)) {
      rule.bannedTerms = bannedTerms.map((t) => t.trim()).filter(Boolean);
    }
    if (replacement !== undefined) rule.replacement = replacement.trim();
    if (explanation !== undefined) rule.explanation = explanation.trim();
    if (caseSensitive !== undefined) rule.caseSensitive = Boolean(caseSensitive);
    if (scope !== undefined) rule.scope = scope.trim();
    if (isActive !== undefined) rule.isActive = Boolean(isActive);

    rule.version += 1;
    await rule.save();

    res.json({
      success: true,
      rule,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
