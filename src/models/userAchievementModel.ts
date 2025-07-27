import mongoose, { Schema, Document } from 'mongoose';
import { IAchievement } from './achievementModel';

export interface IUserAchievement extends Document {
  user: string;
  achievement: IAchievement | mongoose.Types.ObjectId;
  progress: number;
  earnedAt?: Date;
}

const userAchievementSchema = new Schema({
  user: { type: String, ref: 'User', refPath: 'keycloakId', required: true },
  achievement: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
  progress: { type: Number, default: 0 },
  earnedAt: { type: Date }
}, {
  timestamps: true
});

// Create a compound index to prevent duplicate user achievements
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

export default mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema); 