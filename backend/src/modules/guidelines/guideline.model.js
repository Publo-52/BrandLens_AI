import mongoose from 'mongoose';

export const GUIDELINE_CATEGORIES = {
  TONE: 'TONE',
  MESSAGING: 'MESSAGING',
  VISUAL: 'VISUAL',
  ACCESSIBILITY: 'ACCESSIBILITY',
  LEGAL: 'LEGAL',
  OTHER: 'OTHER',
};

export const GUIDELINE_SEVERITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const GUIDELINE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
};

const guidelineSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Guideline title is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      enum: Object.values(GUIDELINE_CATEGORIES),
      default: GUIDELINE_CATEGORIES.TONE,
      required: true,
      index: true,
    },
    ruleText: {
      type: String,
      required: [true, 'Rule text is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: Object.values(GUIDELINE_SEVERITIES),
      default: GUIDELINE_SEVERITIES.MEDIUM,
      required: true,
    },
    sourceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SourceDocument',
      default: null,
    },
    sourceLocation: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(GUIDELINE_STATUS),
      default: GUIDELINE_STATUS.ACTIVE,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

guidelineSchema.index({ organisationId: 1, status: 1 });
guidelineSchema.index({ organisationId: 1, category: 1 });

guidelineSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Guideline = mongoose.model('Guideline', guidelineSchema);
