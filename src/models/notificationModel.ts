import mongoose, { Schema, Document } from "mongoose";

export enum NotificationType {
  ACHIEVEMENT_UNLOCKED = "ACHIEVEMENT_UNLOCKED",
  PROGRESS_MILESTONE = "PROGRESS_MILESTONE",
  RECOGNITION_RECEIVED = "RECOGNITION_RECEIVED"
}

export interface INotification extends Document {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: {
    achievementId?: string;
    progress?: number;
    points?: number;
  };
  createdAt: Date;
}

const notificationSchema = new Schema(
  {
    user: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    data: {
      achievementId: { type: String },
      progress: { type: Number },
      points: { type: Number }
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
