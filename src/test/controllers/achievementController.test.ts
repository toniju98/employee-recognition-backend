import { Request, Response } from "express";
import { AchievementController } from "../../controllers/achievementController";
import { AchievementService } from "../../services/achievementService";
import { AchievementType } from "../../models/achievementModel";
import mongoose from "mongoose";
import { UserService } from "../../services/userService";
import { IAchievement } from "../../models/achievementModel";
import { IUserAchievement } from "../../models/userAchievementModel";

jest.mock("../../services/achievementService");

describe("AchievementController", () => {
  let achievementController: AchievementController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAchievementService: jest.Mocked<AchievementService>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockAchievementService = {
      createAchievement: jest.fn(),
      getOrganizationAchievements: jest.fn(),
      getUserAchievements: jest.fn(),
      awardAchievement: jest.fn()
    } as any;

    mockUserService = {
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id')
    } as any;

    achievementController = new AchievementController();
    // @ts-ignore - Replace services with mocks
    achievementController['achievementService'] = mockAchievementService;
    achievementController['userService'] = mockUserService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("createAchievement", () => {
    it("should create achievement successfully", async () => {
      const mockAchievement = {
        name: "Test Achievement",
        description: "Test Description",
        type: AchievementType.KUDOS_RECEIVED,
        icon: "test-icon.png",
        criteria: {
          type: AchievementType.KUDOS_RECEIVED,
          threshold: 5,
        },
        points: 10,
      };

      mockRequest = {
        body: mockAchievement,
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

      const expectedAchievement = {
        _id: new mongoose.Types.ObjectId(),
        ...mockAchievement,
        organizationId: 'test-org-id',
        createdBy: 'test-user-id',
        isGlobal: false
      } as unknown as IAchievement;

      mockAchievementService.createAchievement.mockResolvedValue(expectedAchievement);

      await achievementController.createAchievement(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserOrganization).toHaveBeenCalledWith('test-user-id');
      expect(mockAchievementService.createAchievement).toHaveBeenCalledWith({
        ...mockAchievement,
        organizationId: 'test-org-id',
        createdBy: 'test-user-id'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedAchievement);
    });

    it("should handle creation failure", async () => {
      mockRequest = {
        body: {},
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

      mockAchievementService.createAchievement.mockRejectedValue(new Error("Creation failed"));

      await achievementController.createAchievement(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to create achievement"
      });
    });
  });





  describe("getOrganizationAchievements", () => {
    it("should return organization achievements", async () => {
      const mockAchievements = [{
        _id: new mongoose.Types.ObjectId(),
        name: "Test Achievement",
        description: "Test Description",
        organizationId: 'test-org-id',
        type: AchievementType.KUDOS_RECEIVED,
        icon: "test-icon.png",
        criteria: { type: AchievementType.KUDOS_RECEIVED, threshold: 5 },
        points: 10,
        isGlobal: false
      }] as unknown as IAchievement[];

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

      mockAchievementService.getOrganizationAchievements.mockResolvedValue(mockAchievements);

      await achievementController.getOrganizationAchievements(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserOrganization).toHaveBeenCalledWith('test-user-id');
      expect(mockAchievementService.getOrganizationAchievements).toHaveBeenCalledWith('test-org-id');
      expect(mockResponse.json).toHaveBeenCalledWith(mockAchievements);
    });

    it("should handle fetch failure", async () => {
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

      mockAchievementService.getOrganizationAchievements.mockRejectedValue(new Error("Fetch failed"));

      await achievementController.getOrganizationAchievements(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get achievements"
      });
    });
  });

  describe("getUserAchievements", () => {
    it("should return user achievements", async () => {
      const userId = "target-user-id";
      const mockAchievements = [{
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        achievement: new mongoose.Types.ObjectId(),
        progress: 100,
        earnedAt: new Date()
      }] as unknown as IUserAchievement[];

      mockRequest = {
        params: { userId },
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

      mockAchievementService.getUserAchievements.mockResolvedValue(mockAchievements);

      await achievementController.getUserAchievements(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserOrganization).toHaveBeenCalledWith('test-user-id');
      expect(mockAchievementService.getUserAchievements).toHaveBeenCalledWith(userId, 'test-org-id');
      expect(mockResponse.json).toHaveBeenCalledWith(mockAchievements);
    });

    it("should handle fetch failure", async () => {
      mockRequest = {
        params: { userId: "target-user-id" },
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

      mockAchievementService.getUserAchievements.mockRejectedValue(new Error("Fetch failed"));

      await achievementController.getUserAchievements(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get user achievements"
      });
    });
  });
});
