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

// Unique compound indexes
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
export default Membership;
