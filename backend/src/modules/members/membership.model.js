import mongoose from 'mongoose';

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  REVIEWER: 'REVIEWER',
  CREATOR: 'CREATOR',
};

export const MEMBERSHIP_STATUS = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
};

const membershipSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    invitedEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      index: true,
    },
    invitedName: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CREATOR,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique compound indexes: partialFilterExpression allows multiple pending INVITED records with userId: null
membershipSchema.index(
  { organisationId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } }
);

membershipSchema.index(
  { organisationId: 1, invitedEmail: 1 },
  { unique: true, partialFilterExpression: { invitedEmail: { $type: 'string' } } }
);

membershipSchema.virtual('fullName').get(function () {
  return this.invitedName || this.userId?.name || '';
});

membershipSchema.virtual('name').get(function () {
  return this.invitedName || this.userId?.name || '';
});

membershipSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  obj.invitedName = this.invitedName || obj.invitedName || '';
  obj.fullName = obj.fullName || this.invitedName || obj.invitedName || obj.userId?.name || '';
  obj.name = obj.name || this.invitedName || obj.fullName || obj.userId?.name || '';
  return obj;
};

export const Membership = mongoose.models.Membership || mongoose.model('Membership', membershipSchema);

/**
 * Migration helper to drop legacy non-partial organisationId_1_userId_1 index if it exists,
 * allowing multiple pending INVITED records with userId: null per workspace.
 */
export async function migrateMembershipIndexes() {
  try {
    const collection = Membership.collection;
    if (!collection) return;

    let existingIndexes = [];
    try {
      existingIndexes = await collection.indexes();
    } catch {
      // Collection may not exist yet in fresh database
      return;
    }

    // Inspect all indexes and drop any index on { organisationId: 1, userId: 1 }
    // that lacks the partialFilterExpression { userId: { $type: 'objectId' } }
    for (const idx of existingIndexes) {
      const keys = idx.key || {};
      const isOrgUserIndex = keys.organisationId === 1 && keys.userId === 1;
      if (isOrgUserIndex) {
        const isPartialObjectId = idx.partialFilterExpression?.userId?.$type === 'objectId';
        if (!isPartialObjectId) {
          try {
            console.log(`[Membership Index Migration] Dropping legacy non-partial index: ${idx.name}`);
            await collection.dropIndex(idx.name);
            console.log(`[Membership Index Migration] Successfully dropped legacy index: ${idx.name}`);
          } catch (dropErr) {
            console.warn(`[Membership Index Migration] Drop index note: ${dropErr.message}`);
          }
        }
      }

      // Also check { organisationId: 1, invitedEmail: 1 }
      const isOrgEmailIndex = keys.organisationId === 1 && keys.invitedEmail === 1;
      if (isOrgEmailIndex) {
        const isPartialEmail = idx.partialFilterExpression?.invitedEmail?.$type === 'string';
        if (!isPartialEmail) {
          try {
            console.log(`[Membership Index Migration] Dropping legacy non-partial index: ${idx.name}`);
            await collection.dropIndex(idx.name);
            console.log(`[Membership Index Migration] Successfully dropped legacy index: ${idx.name}`);
          } catch (dropErr) {
            console.warn(`[Membership Index Migration] Drop index note: ${dropErr.message}`);
          }
        }
      }
    }

    // Rebuild/sync indexes with partial unique definitions
    await Membership.syncIndexes();
    console.log('[Membership Index Migration] Membership partial unique indexes verified and synchronized successfully.');
  } catch (error) {
    console.warn(`[Membership Index Migration] Non-blocking migration warning: ${error.message}`);
  }
}

export default Membership;
