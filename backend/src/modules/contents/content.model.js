import mongoose from 'mongoose';

export const CONTENT_STATUS = {
  DRAFT: 'DRAFT',
  AUTO_CHECKED: 'AUTO_CHECKED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
};

export const CHANNELS = {
  SOCIAL: 'Social Media',
  WEB: 'Website / Landing Page',
  EMAIL: 'Email Newsletter',
  PRESENTATION: 'Pitch Deck / Presentation',
  BROCHURE: 'Brochure / Print',
  OTHER: 'Other',
};

const contentSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
      maxlength: 200,
    },
    channel: {
      type: String,
      default: CHANNELS.SOCIAL,
    },
    audience: {
      type: String,
      default: 'General Public',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentVersion',
      default: null,
    },
    currentVersionNumber: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: Object.values(CONTENT_STATUS),
      default: CONTENT_STATUS.DRAFT,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

contentSchema.index({ organisationId: 1, status: 1 });
contentSchema.index({ organisationId: 1, createdAt: -1 });

contentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Content = mongoose.model('Content', contentSchema);
