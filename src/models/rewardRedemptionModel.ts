import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardRedemption extends Document {
  organizationId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const rewardRedemptionSchema = new Schema<IRewardRedemption>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  rewardId: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRewardRedemption>('RewardRedemption', rewardRedemptionSchema);