import { NotificationService } from '../../services/notificationService';
import { NotificationRepository } from '../../repositories/notificationRepository';
import { NotificationType } from '../../models/notificationModel';
import mongoose from 'mongoose';
import { IAchievement, AchievementType } from '../../models/achievementModel';

jest.mock('../../repositories/notificationRepository');

describe('NotificationService', () => {
  let notificationService: NotificationService;

  const mockAchievement = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Achievement',
    description: 'Test Description',
    type: AchievementType.RECOGNITION_COUNT,
    criteria: { 
      type: AchievementType.RECOGNITION_COUNT,
      threshold: 5 
    }
  } as IAchievement;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('createAchievementNotification', () => {
    it('should create achievement notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockCreate = jest.spyOn(NotificationRepository.prototype, 'create')
        .mockResolvedValue({} as any);

      await notificationService.createAchievementNotification(userId.toString(), mockAchievement);

      expect(mockCreate).toHaveBeenCalledWith({
        user: userId.toString(),
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: 'Achievement Unlocked!',
        message: `You've earned "${mockAchievement.name}"!`,
        data: {
          achievementId: mockAchievement._id.toString()
        }
      });
    });
  });

  describe('createProgressNotification', () => {
    it('should create progress notification at 25% intervals', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockCreate = jest.spyOn(NotificationRepository.prototype, 'create')
        .mockResolvedValue({} as any);

      await notificationService.createProgressNotification(userId.toString(), mockAchievement, 50);

      expect(mockCreate).toHaveBeenCalledWith({
        user: userId.toString(),
        type: NotificationType.PROGRESS_MILESTONE,
        title: 'Achievement Progress',
        message: `You're 50% of the way to "${mockAchievement.name}"!`,
        data: {
          achievementId: mockAchievement._id.toString(),
          progress: 50
        }
      });
    });

    it('should not create notification for non-milestone progress', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockCreate = jest.spyOn(NotificationRepository.prototype, 'create');

      await notificationService.createProgressNotification(userId.toString(), mockAchievement, 37);

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockNotifications = [
        { read: false },
        { read: true },
        { read: false }
      ];

      jest.spyOn(NotificationRepository.prototype, 'findByUser')
        .mockResolvedValue(mockNotifications as any);

      const count = await notificationService.getUnreadCount(userId);
      expect(count).toBe(2);
    });
  });

  describe('deleteNotifications', () => {
    it('should delete multiple notifications when authorized', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const notificationIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      const mockNotifications = notificationIds.map(id => ({
        _id: id,
        user: userId,
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: 'Test',
        message: 'Test message'
      }));

      jest.spyOn(NotificationRepository.prototype, 'findByIds')
        .mockResolvedValue(mockNotifications as any);
      
      jest.spyOn(NotificationRepository.prototype, 'deleteMany')
        .mockResolvedValue(undefined);

      await notificationService.deleteNotifications(userId, notificationIds);

      expect(NotificationRepository.prototype.deleteMany)
        .toHaveBeenCalledWith(notificationIds);
    });

    it('should throw error when unauthorized', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const notificationIds = [new mongoose.Types.ObjectId().toString()];
      
      const mockNotifications = [{
        _id: notificationIds[0],
        user: 'different-user-id',
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: 'Test',
        message: 'Test message'
      }];

      jest.spyOn(NotificationRepository.prototype, 'findByIds')
        .mockResolvedValue(mockNotifications as any);

      await expect(
        notificationService.deleteNotifications(userId, notificationIds)
      ).rejects.toThrow('Unauthorized to delete one or more notifications');
    });
  });
});
