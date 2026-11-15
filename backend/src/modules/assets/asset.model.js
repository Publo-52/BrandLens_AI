import mongoose from 'mongoose';

export const ASSET_TYPES = {
  LOGO: 'LOGO',
  PALETTE: 'PALETTE',
  FONT: 'FONT',
  IMAGE: 'IMAGE',
  OTHER: 'OTHER',
};

const assetSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ASSET_TYPES),
      default: ASSET_TYPES.PALETTE,
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      default: '',
    },
    secureUrl: {
      type: String,
      default: '',
    },
    metadata: {
      hexColors: [{ type: String }],
      fontFamilies: [{ type: String }],
      dimensions: {
        width: Number,
        height: Number,
      },
      clearSpaceRule: String,
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assetSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Asset = mongoose.model('Asset', assetSchema);
