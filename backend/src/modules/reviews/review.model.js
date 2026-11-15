import mongoose from 'mongoose';

export const FINDING_TYPES = {
  TERMINOLOGY: 'TERMINOLOGY',
  TONE_MISMATCH: 'TONE_MISMATCH',
  CLAIM_UNSUPPORTED: 'CLAIM_UNSUPPORTED',
  CLAIM_CONTRADICTED: 'CLAIM_CONTRADICTED',
  CLAIM_SUPPORTED: 'CLAIM_SUPPORTED',
  CONTRAST_FAIL: 'CONTRAST_FAIL',
  ALT_TEXT_MISSING: 'ALT_TEXT_MISSING',
  ACCESSIBILITY: 'ACCESSIBILITY',
  OTHER: 'OTHER',
};

export const FINDING_SEVERITY = {
  INFO: 'INFO',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const CHECK_METHOD = {
  DETERMINISTIC: 'DETERMINISTIC',
  AI: 'AI',
};

export const REVIEW_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EDITED: 'EDITED',
  REJECTED: 'REJECTED',
  OVERRIDDEN: 'OVERRIDDEN',
};

const findingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(FINDING_TYPES),
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(FINDING_SEVERITY),
      default: FINDING_SEVERITY.MEDIUM,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0.0,
      max: 1.0,
    },
    location: {
      start: { type: Number, default: 0 },
      end: { type: Number, default: 0 },
      page: { type: Number, default: 1 },
    },
    originalText: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    sourceReferences: [
      {
        sourceType: { type: String, required: true }, // 'GUIDELINE' | 'FACT' | 'TERMINOLOGY'
        sourceId: { type: String, default: '' },
        quote: { type: String, default: '' },
      },
    ],
    suggestedCorrection: {
      type: String,
      default: '',
    },
    checkMethod: {
      type: String,
      enum: Object.values(CHECK_METHOD),
      default: CHECK_METHOD.DETERMINISTIC,
    },
    reviewStatus: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PENDING,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    overrideReason: {
      type: String,
      default: '',
    },
    editedText: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: [true, 'Content ID is required'],
      index: true,
    },
    contentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentVersion',
      required: [true, 'ContentVersion ID is required'],
      index: true,
    },
    status: {
      type: String,
      default: 'COMPLETED',
    },
    findings: [findingSchema],
    processingMetadata: {
      modelProvider: { type: String, default: 'BrandLens Hybrid Engine' },
      modelName: { type: String, default: 'Deterministic Rules + Gemini 1.5' },
      completedAt: { type: Date, default: Date.now },
      executionTimeMs: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ contentId: 1, createdAt: -1 });
reviewSchema.index({ organisationId: 1, createdAt: -1 });

reviewSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Review = mongoose.model('Review', reviewSchema);
