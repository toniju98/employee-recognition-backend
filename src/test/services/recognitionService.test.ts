import { RecognitionService } from "../../services/recognitionService";
import { UserService } from "../../services/userService";
import { RecognitionCategory } from "../../models/recognitionModel";
import mongoose from "mongoose";
import { IUser, UserRole } from "../../models/userModel";
import { RecognitionRepository } from "../../repositories/recognitionRepository";
import { IRecognition } from "../../models/recognitionModel";
import { ConfigurationService } from "../../services/configurationService";
import { AchievementService } from "../../services/achievementService";
import { UserWalletService } from "../../services/userWalletService";

// Mock all dependencies
jest.mock('../../repositories/recognitionRepository');
jest.mock('../../services/userService');
jest.mock('../../services/configurationService');
jest.mock('../../services/achievementService');
jest.mock('../../services/userWalletService');

describe("RecognitionService", () => {
  let recognitionService: RecognitionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    recognitionService = new RecognitionService();
  });

  describe('createRecognition', () => {
    it("should create a valid recognition", async () => {
      const senderId = new mongoose.Types.ObjectId();
      const recipientId = new mongoose.Types.ObjectId();
      
      const mockData = {
        sender: senderId.toString(),
        recipient: recipientId.toString(),
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
        points: 10,
        organizationId: 'test-org-id'
      };

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        role: UserRole.USER,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      } as unknown as IUser;

      // Mock service responses
      jest.spyOn(UserService.prototype as any, 'getUserByKeycloakId')
        .mockResolvedValue(mockUser);
      
      jest.spyOn(ConfigurationService.prototype, 'getActiveCategories')
        .mockResolvedValue([RecognitionCategory.EXCELLENCE]);
      
      jest.spyOn(ConfigurationService.prototype, 'getCategorySettings')
        .mockResolvedValue({ defaultPoints: 10 });
      
      jest.spyOn(ConfigurationService.prototype, 'validateRecognitionPoints')
        .mockResolvedValue(true);
      
      jest.spyOn(RecognitionRepository.prototype, 'createRecognition')
        .mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          sender: senderId,
          recipient: recipientId,
          message: mockData.message,
          category: mockData.category,
          points: mockData.points,
          kudos: [],
          createdAt: new Date()
        } as unknown as IRecognition);

      jest.spyOn(UserWalletService.prototype, 'awardPoints')
        .mockResolvedValue(undefined);

      const recognition = await recognitionService.createRecognition(mockData);

      expect(UserService.prototype.getUserByKeycloakId).toHaveBeenCalledWith(mockData.sender);
      expect(ConfigurationService.prototype.getActiveCategories).toHaveBeenCalled();
      expect(ConfigurationService.prototype.getCategorySettings)
        .toHaveBeenCalledWith('test-org-id', mockData.category);
      expect(RecognitionRepository.prototype.createRecognition).toHaveBeenCalled();
      expect(UserWalletService.prototype.awardPoints)
        .toHaveBeenCalledWith(mockData.recipient, mockData.points, 'RECOGNITION');
      
      expect(recognition).toMatchObject({
        message: mockData.message,
        category: mockData.category,
        points: mockData.points
      });
    });

    it("should throw error when sender not found", async () => {
      jest.spyOn(UserService.prototype, 'getUserByKeycloakId')
        .mockResolvedValue(null);

      await expect(recognitionService.createRecognition({
        sender: 'invalid-id',
        recipient: 'recipient-id',
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
        organizationId: 'test-org-id'
      })).rejects.toThrow("Sender not found");
    });

    it("should throw error when recipient not found", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        role: UserRole.USER
      } as unknown as IUser;

      jest.spyOn(UserService.prototype, 'getUserByKeycloakId')
        .mockImplementation(async (id) => id === 'sender-id' ? mockUser : null);

      await expect(recognitionService.createRecognition({
        sender: 'sender-id',
        recipient: 'invalid-id',
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
        organizationId: 'test-org-id'
      })).rejects.toThrow("Recipient not found");
    });

    it("should throw error when sending recognition to self", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        role: UserRole.USER
      } as unknown as IUser;

      jest.spyOn(UserService.prototype, 'getUserByKeycloakId')
        .mockResolvedValue(mockUser);

      await expect(recognitionService.createRecognition({
        sender: 'same-id',
        recipient: 'same-id',
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
        organizationId: 'test-org-id'
      })).rejects.toThrow("Cannot send recognition to yourself");
    });
  });
});
