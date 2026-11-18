import express from 'express';
import { ApprovedFact, FACT_STATUS } from './fact.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';
import { validateObjectIdParam } from '../../middleware/security.js';

const router = express.Router({ mergeParams: true });

// GET /api/organisations/:organisationId/facts - List approved facts
router.get('/', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const { status, product } = req.query;
    const filter = { organisationId: req.params.organisationId };

    if (status && Object.values(FACT_STATUS).includes(status)) {
      filter.status = status;
    } else if (!status) {
      filter.status = FACT_STATUS.ACTIVE;
    }
    if (typeof product === 'string' && product.trim()) {
      filter['applicability.product'] = product.trim();
    }

    const facts = await ApprovedFact.find(filter)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      facts,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/facts - Create approved fact (ADMIN, MANAGER)
router.post('/', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { statement, sourceReference, applicability, expiresAt } = req.body;

    if (!statement || !statement.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Fact statement is required.', statusCode: 400 },
      });
    }

    const fact = await ApprovedFact.create({
      organisationId: req.params.organisationId,
      statement: statement.trim(),
      sourceReference: sourceReference?.trim() || 'Official Brand Fact Sheet',
      applicability: applicability || { product: 'All', region: 'Global', channel: 'All' },
      expiresAt: expiresAt || null,
      ownerId: req.user._id,
      version: 1,
      status: FACT_STATUS.ACTIVE,
    });

    res.status(201).json({
      success: true,
      fact,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId/facts/:factId - Update fact (ADMIN, MANAGER)
router.patch('/:factId', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), validateObjectIdParam('factId'), async (req, res, next) => {
  try {
    const { statement, sourceReference, applicability, status } = req.body;
    const fact = await ApprovedFact.findOne({
      _id: req.params.factId,
      organisationId: req.params.organisationId,
    });

    if (!fact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Approved fact not found.', statusCode: 404 },
      });
    }

    if (statement && statement.trim() !== fact.statement) {
      fact.statement = statement.trim();
      fact.version += 1;
    }
    if (sourceReference) fact.sourceReference = sourceReference.trim();
    if (applicability) fact.applicability = applicability;
    if (status) fact.status = status;

    await fact.save();

    res.json({
      success: true,
      fact,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
