import Notification, { INotification } from "../models/notificationModel";
import mongoose from "mongoose";

export class NotificationRepository {
  async create(
    notificationData: Partial<INotification>
  ): Promise<INotification> {
    return await Notification.create(notificationData);
  }

  async findByUser(userId: string): Promise<INotification[]> {
    return await Notification.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await Notification.findByIdAndUpdate(notificationId, { read: true });
  }

  async delete(notificationId: string): Promise<void> {
    await Notification.findByIdAndDelete(notificationId);
  }

  async findById(notificationId: string): Promise<INotification | null> {
    return await Notification.findById(notificationId);
  }

  async findByIds(notificationIds: string[]): Promise<INotification[]> {
    return await Notification.find({ _id: { $in: notificationIds } });
  }

  async deleteMany(notificationIds: string[]): Promise<void> {
    await Notification.deleteMany({ _id: { $in: notificationIds } });
  }
}
