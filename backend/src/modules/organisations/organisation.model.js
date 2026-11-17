import mongoose from 'mongoose';

const organisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organisation name is required'],
      trim: true,
      maxlength: [100, 'Organisation name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organisation slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    logoAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    settings: {
      defaultLanguage: {
        type: String,
        default: 'en',
      },
      retentionDays: {
        type: Number,
        default: 90,
      },
    },
  },
  {
    timestamps: true,
  }
);

organisationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Organisation = mongoose.models.Organisation || mongoose.model('Organisation', organisationSchema);
export default Organisation;
