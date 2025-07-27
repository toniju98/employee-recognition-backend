import mongoose, { Schema, Document } from 'mongoose';
import { RewardCategory } from './rewardModel';

export enum SuggestionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface IRewardSuggestion extends Document {
  name: string;
  description: string;
  suggestedPointsCost: number;
  category: RewardCategory;
  organizationId: string;
  suggestedBy: string;
  votes: string[];
  status: SuggestionStatus;
  adminFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSuggestionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  suggestedPointsCost: { type: Number, required: true },
  category: { type: String, enum: Object.values(RewardCategory), required: true },
  organizationId: { type: String, required: true },
  suggestedBy: { type: String, required: true },
  votes: [{ type: String }],
  status: {
    type: String,
    enum: Object.values(SuggestionStatus),
    default: SuggestionStatus.PENDING
  },
  adminFeedback: { type: String },
}, { timestamps: true });

export default mongoose.model<IRewardSuggestion>('RewardSuggestion', rewardSuggestionSchema);
