// BrandLens AI - Module Router Registry
import authRoutes from './auth/auth.routes.js';
import organisationRoutes from './organisations/organisation.routes.js';
import membershipRoutes from './members/membership.routes.js';

export const modules = {
  auth: authRoutes,
  organisations: organisationRoutes,
  members: membershipRoutes,
  guidelines: null,
  facts: null,
  terminology: null,
  assets: null,
  contents: null,
  reviews: null,
  approvals: null,
  comments: null,
  insights: null,
  audit: null,
};
