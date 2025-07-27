import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AchievementType {
  KUDOS_RECEIVED = 'KUDOS_RECEIVED',
  RECOGNITION_COUNT = 'RECOGNITION_COUNT',
  LOGIN_STREAK = 'LOGIN_STREAK',
  PROFILE_COMPLETION = 'PROFILE_COMPLETION'
}

export interface IAchievement extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  type: AchievementType;
  icon: string;
  criteria: {
    type: AchievementType;
    threshold: number;
  };
  points: number;
  organizationId?: Types.ObjectId;
  isGlobal: boolean;
}

const achievementSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: Object.values(AchievementType), required: true },
  icon: { type: String, required: true },
  criteria: {
    type: {
      type: String,
      enum: Object.values(AchievementType),
      required: true
    },
    threshold: { type: Number, required: true }
  },
  points: { type: Number, required: true },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: false
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

export default mongoose.model<IAchievement>('Achievement', achievementSchema); 