// BrandLens AI - Module Router Registry
import authRoutes from './auth/auth.routes.js';
import organisationRoutes from './organisations/organisation.routes.js';
import membershipRoutes from './members/membership.routes.js';
import guidelineRoutes from './guidelines/guideline.routes.js';
import factRoutes from './facts/fact.routes.js';
import terminologyRoutes from './terminology/terminology.routes.js';
import assetRoutes from './assets/asset.routes.js';
import knowledgeRoutes from './brand-knowledge/knowledge.routes.js';

export const modules = {
  auth: authRoutes,
  organisations: organisationRoutes,
  members: membershipRoutes,
  guidelines: guidelineRoutes,
  facts: factRoutes,
  terminology: terminologyRoutes,
  assets: assetRoutes,
  knowledge: knowledgeRoutes,
  contents: null,
  reviews: null,
  approvals: null,
  comments: null,
  insights: null,
  audit: null,
};
