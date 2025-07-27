import { NotificationRepository } from '../repositories/notificationRepository';
import { NotificationType, INotification } from '../models/notificationModel';
import { IAchievement } from '../models/achievementModel';
import { Types } from 'mongoose';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createAchievementNotification(
    userId: string,
    achievement: IAchievement
  ): Promise<void> {
    await this.notificationRepository.create({
      user: userId,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: "Achievement Unlocked!",
      message: `You've earned "${achievement.name}"!`,
      data: {
        achievementId: achievement._id.toString(),
      },
    });
  }

  async createProgressNotification(
    userId: string,
    achievement: IAchievement,
    progressPercent: number
  ): Promise<void> {
    // Only notify on significant milestones (25%, 50%, 75%)
    if (progressPercent % 25 === 0 && progressPercent < 100) {
      await this.notificationRepository.create({
        user: userId,
        type: NotificationType.PROGRESS_MILESTONE,
        title: "Achievement Progress",
        message: `You're ${progressPercent}% of the way to "${achievement.name}"!`,
        data: {
          achievementId: achievement._id.toString(),
          progress: progressPercent,
        },
      });
    }
  }

  async getUserNotifications(userId: string): Promise<INotification[]> {
    return await this.notificationRepository.findByUser(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.markAsRead(notificationId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.notificationRepository.findByUser(userId);
    return notifications.filter((n) => !n.read).length;
  }

  async create(notification: {
    user: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<void> {}

  async createRecognitionNotification(
    recipientId: string,
    senderName: string,
    points: number
  ): Promise<void> {
    try {
      await this.notificationRepository.create({
        user: recipientId,
        type: NotificationType.RECOGNITION_RECEIVED,
        title: "New Recognition Received!",
        message: `You received recognition from ${senderName} worth ${points} points!`,
        data: {
          points,
        },
      });
    } catch (error) {
      console.error("Error creating recognition notification:", error);
      // Optionally rethrow the error if you want the calling function to handle it
      throw error;
    }
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.user.toString() !== userId) {
      throw new Error('Unauthorized to delete this notification');
    }
    await this.notificationRepository.delete(notificationId);
  }

  async deleteNotifications(userId: string, notificationIds: string[]): Promise<void> {
    const notifications = await this.notificationRepository.findByIds(notificationIds);

    // Check if all notifications belong to user
    const unauthorized = notifications.some(n => n.user.toString() !== userId);
    if (unauthorized) {
      throw new Error('Unauthorized to delete one or more notifications');
    }

    await this.notificationRepository.deleteMany(notificationIds);
  }
}
