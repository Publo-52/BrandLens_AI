import mongoose from 'mongoose';

export const FACT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  SUPERSEDED: 'SUPERSEDED',
};

const approvedFactSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    statement: {
      type: String,
      required: [true, 'Fact statement is required'],
      trim: true,
    },
    sourceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SourceDocument',
      default: null,
    },
    sourceReference: {
      type: String,
      default: 'Official Brand Fact Sheet',
      trim: true,
    },
    applicability: {
      product: { type: String, default: 'All' },
      region: { type: String, default: 'Global' },
      channel: { type: String, default: 'All' },
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: Object.values(FACT_STATUS),
      default: FACT_STATUS.ACTIVE,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

approvedFactSchema.index({ organisationId: 1, status: 1 });

approvedFactSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const ApprovedFact = mongoose.model('ApprovedFact', approvedFactSchema);
