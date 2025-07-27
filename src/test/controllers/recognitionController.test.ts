import { RecognitionController } from "../../controllers/recognitionController";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { RecognitionCategory } from "../../models/recognitionModel";
import { RecognitionService } from "../../services/recognitionService";
import { IRecognition } from "../../models/recognitionModel";
import { IUser } from "../../models/userModel";

// Mock the RecognitionService
jest.mock("../../services/recognitionService");

describe("RecognitionController", () => {
  let recognitionController: RecognitionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRecognitionService: jest.Mocked<RecognitionService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup the mock service
    mockRecognitionService = {
      createRecognition: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
        points: 10
      }),
      getOrganizationRecognitions: jest.fn().mockImplementation((filters) => {
        return Promise.resolve([{
          _id: new mongoose.Types.ObjectId(),
          sender: new mongoose.Types.ObjectId(),
          recipient: new mongoose.Types.ObjectId(),
          message: 'Great work!',
          category: RecognitionCategory.EXCELLENCE,
          points: 10,
          kudos: [],
          createdAt: new Date()
        }]);
      }),
      toggleKudos: jest.fn(),
      getLeaderboard: jest.fn(),
    } as any;

    const mockUserService = {
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id')
    } as any;

    recognitionController = new RecognitionController();
    // @ts-ignore - Replace the service with our mock
    recognitionController['recognitionService'] = mockRecognitionService;
    recognitionController['userService'] = mockUserService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it("should create recognition when data is valid", async () => {
    const mockRecognitionData = {
      senderId: new mongoose.Types.ObjectId().toString(),
      recipientId: new mongoose.Types.ObjectId().toString(),
      message: "Great work!",
      category: RecognitionCategory.EXCELLENCE,
      points: 10
    };

    mockRequest = {
      body: mockRecognitionData,
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

    await recognitionController.createRecognition(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it("should fail to create recognition with invalid data", async () => {
    const mockRecognitionData = {
      message: "Great work!"
      // missing required fields
    };

    mockRequest = {
      body: mockRecognitionData
    };

    // Setup mock to throw error for invalid data
    mockRecognitionService.createRecognition.mockRejectedValue(
      new Error("Invalid recognition data")
    );

    await recognitionController.createRecognition(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String)
      })
    );
  });

  describe('getOrganizationRecognitions', () => {
    it('should return all recognitions with 200 status', async () => {
      const mockRecognitions = [
        {
          _id: new mongoose.Types.ObjectId(),
          sender: new mongoose.Types.ObjectId(),
          recipient: new mongoose.Types.ObjectId(),
          message: 'Great work!',
          category: RecognitionCategory.EXCELLENCE,
          points: 10,
          kudos: [],
          createdAt: new Date()
        }
      ] as unknown as IRecognition[];

      // Use mockImplementation instead of mockResolvedValue to maintain parameter checking
      mockRecognitionService.getOrganizationRecognitions.mockImplementation((filters) => {
        return Promise.resolve(mockRecognitions);
      });

      mockRequest = {
        query: {},
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

      await recognitionController.getOrganizationRecognitions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRecognitionService.getOrganizationRecognitions).toHaveBeenCalledWith({
        organizationId: 'test-org-id'
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockRecognitions);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard data', async () => {
      const mockLeaderboardData = [
        { 
          user: {
            _id: new mongoose.Types.ObjectId(),
            name: 'User 1',
            email: 'user1@example.com',
            firstName: 'User',
            lastName: 'One',
            department: 'Engineering',
            role: 'employee',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as IUser,
          totalPoints: 100
        }
      ];

      mockRecognitionService.getLeaderboard.mockResolvedValue(mockLeaderboardData);

      mockRequest = {
        query: {},
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

      await recognitionController.getLeaderboard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRecognitionService.getLeaderboard).toHaveBeenCalledWith('test-org-id', undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLeaderboardData);
    });

    it('should use the provided limit', async () => {
      mockRecognitionService.getLeaderboard.mockResolvedValue([]);

      mockRequest = {
        query: { limit: '5' },
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

      await recognitionController.getLeaderboard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRecognitionService.getLeaderboard).toHaveBeenCalledWith('test-org-id', 5);
    });

    it('should handle errors', async () => {
      mockRecognitionService.getLeaderboard.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        query: {},
      };

      await recognitionController.getLeaderboard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch leaderboard' });
    });
  });
});