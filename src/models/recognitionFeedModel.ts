import mongoose, { Document, Schema } from 'mongoose';

export interface IRecognitionFeed extends Document {
  recognition: mongoose.Types.ObjectId;
  isPublic: boolean;
  pinnedUntil?: Date;
  createdAt: Date;
}

const recognitionFeedSchema = new Schema({
  recognition: { type: Schema.Types.ObjectId, ref: 'Recognition', required: true },
  isPublic: { type: Boolean, default: true },
  pinnedUntil: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

recognitionFeedSchema.index({ createdAt: -1 });
recognitionFeedSchema.index({ pinnedUntil: -1 }, { sparse: true });

export default mongoose.model<IRecognitionFeed>('RecognitionFeed', recognitionFeedSchema); 