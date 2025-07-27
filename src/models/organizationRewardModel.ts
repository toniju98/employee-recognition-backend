import mongoose, { Document, Schema, Types } from "mongoose";

export interface IOrganizationReward extends Document {
  _id: Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  rewardId: Types.ObjectId;
  isActive: boolean;
  customPointsCost?: number;
  customQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const organizationRewardSchema = new Schema<IOrganizationReward>({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  rewardId: { type: Schema.Types.ObjectId, ref: "Reward", required: true },
  isActive: { type: Boolean, default: false },
  customPointsCost: { type: Number },
  customQuantity: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

organizationRewardSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IOrganizationReward>(
  "OrganizationReward",
  organizationRewardSchema
);
