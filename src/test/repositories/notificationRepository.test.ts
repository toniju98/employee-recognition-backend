import mongoose from "mongoose";
import { NotificationRepository } from "../../repositories/notificationRepository";
import Notification, { NotificationType } from "../../models/notificationModel";

jest.mock("../../models/notificationModel", () => ({
  __esModule: true,
  NotificationType: {
    ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED",
    PROGRESS_MILESTONE: "PROGRESS_MILESTONE",
  },
  default: {
    create: jest.fn(),
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        limit: jest.fn(),
      })),
    })),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

describe("NotificationRepository", () => {
  let notificationRepository: NotificationRepository;
  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    notificationRepository = new NotificationRepository();
    jest.clearAllMocks();
  });

  it("should create a notification", async () => {
    const mockNotificationData = {
      user: userId.toString(),
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: "Achievement Unlocked!",
      message: "You earned a new achievement",
      data: {
        achievementId: new mongoose.Types.ObjectId().toString(),
      },
    };

    const mockCreatedNotification = {
      _id: new mongoose.Types.ObjectId(),
      ...mockNotificationData,
      read: false,
      createdAt: new Date(),
    };

    (Notification.create as jest.Mock).mockResolvedValueOnce(mockCreatedNotification);

    const notification = await notificationRepository.create(mockNotificationData);

    expect(notification._id).toBeDefined();
    expect(notification.user).toEqual(userId.toString());
    expect(notification.read).toBe(false);
  });

  it("should find user notifications", async () => {
    const mockNotifications = [
      {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: "Test 1",
        message: "Message 1",
        read: false,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        type: NotificationType.PROGRESS_MILESTONE,
        title: "Test 2",
        message: "Message 2",
        read: false,
      },
    ];

    const mockSort = jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(mockNotifications) });
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
    (Notification.find as jest.Mock).mockImplementation(mockFind);

    const notifications = await notificationRepository.findByUser(userId.toString());

    expect(notifications).toHaveLength(2);
    expect(notifications[0].title).toBe("Test 1");
    expect(notifications[1].title).toBe("Test 2");
  });

  it("should mark notification as read", async () => {
    const mockNotification = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: "Test",
      message: "Test message",
      read: true,
    };

    (Notification.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(mockNotification);
    (Notification.findById as jest.Mock).mockResolvedValueOnce(mockNotification);

    await notificationRepository.markAsRead(mockNotification._id.toString());
    
    const updated = await Notification.findById(mockNotification._id);
    expect(updated?.read).toBe(true);
  });

  describe('deleteMany', () => {
    it("should delete multiple notifications", async () => {
      const notificationIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      (Notification.deleteMany as jest.Mock).mockResolvedValueOnce({ deletedCount: 2 });

      await notificationRepository.deleteMany(notificationIds);

      expect(Notification.deleteMany).toHaveBeenCalledWith({
        _id: { $in: notificationIds }
      });
    });
  });

  describe('findByIds', () => {
    it("should find notifications by ids", async () => {
      const notificationIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      const mockNotifications = notificationIds.map(id => ({
        _id: id,
        user: userId,
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: "Test",
        message: "Test message",
        read: false
      }));

      (Notification.find as jest.Mock).mockResolvedValueOnce(mockNotifications);

      const notifications = await notificationRepository.findByIds(notificationIds);

      expect(Notification.find).toHaveBeenCalledWith({
        _id: { $in: notificationIds }
      });
      expect(notifications).toHaveLength(2);
      expect(notifications[0]._id).toBe(notificationIds[0]);
      expect(notifications[1]._id).toBe(notificationIds[1]);
    });
  });
});
