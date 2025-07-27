import mongoose, { Document, Schema, Types } from "mongoose";

export enum RewardCategory {
  LOCAL_PERK = 'LOCAL_PERK',
  GIFT_CARD = 'GIFT_CARD',
  MERCHANDISE = 'MERCHANDISE'
}

// TODO: add image, similar like profileImage

export interface IReward extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  quantity?: number;
  image?: string;
  isGlobal: boolean;
  organizationId?: string;
  createdBy: string;
  isActive: boolean;
  redemptionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema({
  createdBy: { 
    type: String,
    ref: 'User',
    refPath: 'keycloakId',
    required: true 
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  pointsCost: { type: Number, required: true },
  category: { 
    type: String, 
    enum: Object.values(RewardCategory),
    required: true 
  },
  redemptionCount: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  isGlobal: { type: Boolean, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReward>('Reward', rewardSchema);
