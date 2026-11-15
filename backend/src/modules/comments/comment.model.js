import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true,
    },
    contentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentVersion',
      required: true,
    },
    findingId: {
      type: String,
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Comment = mongoose.model('Comment', commentSchema);
