import mongoose from 'mongoose';

const terminologyRuleSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
      index: true,
    },
    preferredTerm: {
      type: String,
      required: [true, 'Preferred term is required'],
      trim: true,
    },
    bannedTerms: {
      type: [String],
      required: [true, 'At least one banned term is required'],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one banned term is required'],
    },
    replacement: {
      type: String,
      default: '',
      trim: true,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },
    scope: {
      type: String,
      default: 'General',
      trim: true,
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

terminologyRuleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const TerminologyRule = mongoose.model('TerminologyRule', terminologyRuleSchema);
