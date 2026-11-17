import mongoose from 'mongoose';

const contentVersionSchema = new mongoose.Schema(
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
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    text: {
      type: String,
      required: [true, 'Content text is required'],
    },
    fileReferences: [
      {
        originalName: String,
        mimeType: String,
        size: Number,
        storageKey: String,
        extractedText: String,
        altText: { type: String, default: '' },
        visualChecks: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
    changeSummary: {
      type: String,
      default: 'Initial draft submission',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

contentVersionSchema.index({ organisationId: 1, contentId: 1, versionNumber: 1 }, { unique: true });
contentVersionSchema.index({ contentId: 1, versionNumber: -1 });

contentVersionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const ContentVersion = mongoose.model('ContentVersion', contentVersionSchema);
