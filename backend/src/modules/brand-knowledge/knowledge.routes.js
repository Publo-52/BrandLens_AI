import express from 'express';
import { Guideline, GUIDELINE_CATEGORIES, GUIDELINE_SEVERITIES } from '../guidelines/guideline.model.js';
import { ApprovedFact } from '../facts/fact.model.js';
import { TerminologyRule } from '../terminology/terminology.model.js';
import { Asset, ASSET_TYPES } from '../assets/asset.model.js';
import { ROLES } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// POST /api/organisations/:organisationId/knowledge/seed-demo
// Seeds the official fictional "NovaTech" brand guidelines pack (Blueprint Section 20)
router.post('/seed-demo', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const orgId = req.params.organisationId;
    const userId = req.user._id;

    // 1. Seed Guidelines
    const demoGuidelines = [
      {
        organisationId: orgId,
        title: 'Clear, Helpful & Confident Tone',
        category: GUIDELINE_CATEGORIES.TONE,
        ruleText: 'Brand communications must sound clear, helpful, and confident. Avoid exaggerated hype, hyperbole, or high-pressure sales pitches.',
        severity: GUIDELINE_SEVERITIES.HIGH,
        sourceLocation: 'NovaTech Voice & Messaging Guide 2026, Section 2.1',
        ownerId: userId,
      },
      {
        organisationId: orgId,
        title: 'Prohibition of Unsubstantiated Guarantees',
        category: GUIDELINE_CATEGORIES.LEGAL,
        ruleText: 'Never promise 100% risk-free outcomes, absolute invulnerability, or unconditional guarantees without linking to approved legal terms.',
        severity: GUIDELINE_SEVERITIES.CRITICAL,
        sourceLocation: 'Legal Compliance Policy 2026, Clause 5.3',
        ownerId: userId,
      },
      {
        organisationId: orgId,
        title: 'Accessible Contrast & Visual Clarity',
        category: GUIDELINE_CATEGORIES.ACCESSIBILITY,
        ruleText: 'All text overlays on images and graphics must achieve a minimum WCAG 2.1 AA contrast ratio of 4.5:1 against the background.',
        severity: GUIDELINE_SEVERITIES.MEDIUM,
        sourceLocation: 'Digital Accessibility Standard 2026, Section 3',
        ownerId: userId,
      },
    ];

    // 2. Seed Terminology
    const demoTerminology = [
      {
        organisationId: orgId,
        preferredTerm: 'NovaTech Cloud',
        bannedTerms: ['Nova Cloud', 'Novatech Cloud', 'Nova-Tech'],
        replacement: 'NovaTech Cloud',
        explanation: 'Always write NovaTech as a single camelCase word followed by Cloud.',
        scope: 'Product Naming',
        ownerId: userId,
      },
      {
        organisationId: orgId,
        preferredTerm: 'Enterprise-grade reliability with 99.9% uptime SLA',
        bannedTerms: ['100% risk-free', 'zero risk guarantee', 'unbreakable security'],
        replacement: 'enterprise-grade reliability with 99.9% uptime SLA',
        explanation: 'Absolute zero-risk claims violate compliance standards.',
        scope: 'Marketing Claims',
        ownerId: userId,
      },
    ];

    // 3. Seed Approved Facts
    const demoFacts = [
      {
        organisationId: orgId,
        statement: 'NovaTech Cloud supports automated scheduled backups with multi-region redundancy.',
        sourceReference: 'NovaTech Architecture Specification 2026, Sec 4.1',
        applicability: { product: 'NovaTech Cloud', region: 'Global', channel: 'All' },
        ownerId: userId,
      },
      {
        organisationId: orgId,
        statement: 'NovaTech Enterprise Tier includes a guaranteed 99.9% uptime Service Level Agreement (SLA).',
        sourceReference: 'NovaTech Master Services Agreement 2026, SLA Appendix A',
        applicability: { product: 'Enterprise Tier', region: 'Global', channel: 'All' },
        ownerId: userId,
      },
      {
        organisationId: orgId,
        statement: 'NovaTech is certified under SOC 2 Type II and operates in compliance with GDPR standards.',
        sourceReference: 'Trust & Security Audit Report 2026',
        applicability: { product: 'All Products', region: 'Global', channel: 'Security & Compliance' },
        ownerId: userId,
      },
    ];

    // 4. Seed Assets (Palettes, Typography & Logo references)
    const demoAssets = [
      {
        organisationId: orgId,
        name: 'NovaTech Primary Brand Palette',
        type: ASSET_TYPES.PALETTE,
        metadata: {
          hexColors: ['#0c8ee9', '#0259a1', '#072849', '#f0f7ff'],
        },
        ownerId: userId,
      },
      {
        organisationId: orgId,
        name: 'NovaTech Official Monogram Logo',
        type: ASSET_TYPES.LOGO,
        secureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        metadata: {
          clearSpaceRule: 'Minimum 24px padding required on all sides of the logo mark.',
        },
        ownerId: userId,
      },
    ];

    // Insert only if not already present to avoid duplication
    let guidelinesCount = 0;
    for (const g of demoGuidelines) {
      const exists = await Guideline.findOne({ organisationId: orgId, title: g.title });
      if (!exists) {
        await Guideline.create(g);
        guidelinesCount++;
      }
    }

    let termsCount = 0;
    for (const t of demoTerminology) {
      const exists = await TerminologyRule.findOne({ organisationId: orgId, preferredTerm: t.preferredTerm });
      if (!exists) {
        await TerminologyRule.create(t);
        termsCount++;
      }
    }

    let factsCount = 0;
    for (const f of demoFacts) {
      const exists = await ApprovedFact.findOne({ organisationId: orgId, statement: f.statement });
      if (!exists) {
        await ApprovedFact.create(f);
        factsCount++;
      }
    }

    let assetsCount = 0;
    for (const a of demoAssets) {
      const exists = await Asset.findOne({ organisationId: orgId, name: a.name });
      if (!exists) {
        await Asset.create(a);
        assetsCount++;
      }
    }

    res.json({
      success: true,
      message: 'NovaTech Demo Brand Pack seeded successfully!',
      seeded: {
        guidelines: guidelinesCount,
        terminology: termsCount,
        facts: factsCount,
        assets: assetsCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
