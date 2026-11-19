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

membershipSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
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
      // Collection may not exist yet
      return;
    }

    const legacyIndex = existingIndexes.find(
      (idx) => idx.name === 'organisationId_1_userId_1'
    );

    // If legacy index exists without partialFilterExpression matching objectId
    if (legacyIndex && (!legacyIndex.partialFilterExpression || legacyIndex.partialFilterExpression.userId?.$type !== 'objectId')) {
      try {
        await collection.dropIndex('organisationId_1_userId_1');
      } catch (dropErr) {
        // Ignore if already dropped concurrently
      }
    }

    // Synchronize current schema indexes with partial unique definitions
    await Membership.syncIndexes();
  } catch (error) {
    // Non-blocking warning on startup/migration
    console.warn(`[Membership Index Migration] Notice: ${error.message}`);
  }
}

export default Membership;
