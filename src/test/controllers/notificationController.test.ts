import { Request, Response } from "express";
import { NotificationController } from "../../controllers/notificationController";
import { NotificationService } from "../../services/notificationService";
import mongoose from "mongoose";

jest.mock("../../services/notificationService");

describe("NotificationController", () => {
  let notificationController: NotificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNotificationService = {
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      deleteNotifications: jest.fn()
    } as any;

    notificationController = new NotificationController();
    // @ts-ignore
    notificationController['notificationService'] = mockNotificationService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("getUserNotifications", () => {
    it("should return user notifications", async () => {
      const mockNotifications = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Test Notification",
          read: false,
        },
      ];

      mockRequest = {
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      (
        NotificationService.prototype.getUserNotifications as jest.Mock
      ).mockResolvedValueOnce(mockNotifications);

      await notificationController.getUserNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockNotifications);
    });

    it("should handle fetch failure", async () => {
      (
        NotificationService.prototype.getUserNotifications as jest.Mock
      ).mockRejectedValueOnce(new Error("Fetch failed"));

      await notificationController.getUserNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to fetch notifications",
      });
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const notificationId = new mongoose.Types.ObjectId().toString();
      
      mockRequest = {
        params: { notificationId },
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      (
        NotificationService.prototype.markAsRead as jest.Mock
      ).mockResolvedValueOnce(undefined);

      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Notification marked as read",
      });
    });

    it("should handle mark as read failure", async () => {
      const notificationId = new mongoose.Types.ObjectId().toString();
      mockRequest.params = { notificationId };

      (
        NotificationService.prototype.markAsRead as jest.Mock
      ).mockRejectedValueOnce(new Error("Update failed"));

      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to mark notification as read",
      });
    });
  });

  describe("deleteNotifications", () => {
    it("should delete notifications successfully", async () => {
      const notificationIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString()
      ];

      mockRequest = {
        body: { notificationIds },
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      mockNotificationService.deleteNotifications.mockResolvedValue(undefined);

      await notificationController.deleteNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockNotificationService.deleteNotifications)
        .toHaveBeenCalledWith("test-user-id", notificationIds);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Notifications deleted successfully"
      });
    });

    it("should handle invalid input", async () => {
      mockRequest = {
        body: { notificationIds: "not-an-array" },
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      await notificationController.deleteNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "notificationIds must be an array"
      });
    });

    it("should handle deletion failure", async () => {
      const notificationIds = [new mongoose.Types.ObjectId().toString()];

      mockRequest = {
        body: { notificationIds },
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      mockNotificationService.deleteNotifications
        .mockRejectedValue(new Error("Delete failed"));

      await notificationController.deleteNotifications(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to delete notifications"
      });
    });
  });
});
