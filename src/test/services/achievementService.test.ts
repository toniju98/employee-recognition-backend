import { AchievementService } from '../../services/achievementService';
import { AchievementRepository } from '../../repositories/achievementRepository';
import { NotificationService } from '../../services/notificationService';
import { UserService } from '../../services/userService';
import { UserWalletService } from '../../services/userWalletService';
import { AchievementType } from '../../models/achievementModel';
import { UserRole } from '../../models/userModel';
import { Types } from 'mongoose';
import { IAchievement } from '../../models/achievementModel';
import { IUserAchievement } from '../../models/userAchievementModel';
import { IUser } from '../../models/userModel';
import { UserRepository } from '../../repositories/userRepository';
import mongoose from 'mongoose';

jest.mock('../../repositories/achievementRepository');
jest.mock('../../services/notificationService');
jest.mock('../../services/userService');
jest.mock('../../services/userWalletService');
jest.mock('../../repositories/userRepository');

describe('AchievementService', () => {
  let achievementService: AchievementService;
  let mockUserService: jest.Mocked<UserService>;
  let mockAchievementRepository: jest.Mocked<AchievementRepository>;

  const mockAchievementData = {
    name: 'Test Achievement',
    description: 'Test Description',
    type: AchievementType.RECOGNITION_COUNT,
    icon: 'test-icon.png',
    criteria: {
      type: AchievementType.RECOGNITION_COUNT,
      threshold: 5,
      timeframe: '30'
    },
    points: 50
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserService = {
      getUserByKeycloakId: jest.fn(),
      getUsersByDepartment: jest.fn(),
      getUserOrganization: jest.fn()
    } as any;

    mockAchievementRepository = {
      findByType: jest.fn(),
      findAward: jest.fn(),
      findOne: jest.fn(),
      createAward: jest.fn(),
      updateProgress: jest.fn(),
      findAll: jest.fn(),
      getUserAchievements: jest.fn(),
      findByUser: jest.fn(),
      findByTypeAndThreshold: jest.fn()
    } as any;

    const mockUserWalletService = {
      awardPoints: jest.fn(),
      getBalance: jest.fn()
    } as any;

    const mockNotificationService = {
      createAchievementNotification: jest.fn(),
      createProgressNotification: jest.fn()
    } as any;

    const mockRecognitionRepository = {
      findByUser: jest.fn()
    } as any;

    achievementService = new AchievementService();
    // @ts-ignore
    achievementService['userService'] = mockUserService;
    // @ts-ignore
    achievementService['achievementRepository'] = mockAchievementRepository;
    // @ts-ignore
    achievementService['userWalletService'] = mockUserWalletService;
    // @ts-ignore
    achievementService['notificationService'] = mockNotificationService;
    // @ts-ignore
    achievementService['recognitionRepository'] = mockRecognitionRepository;
  });

  describe('checkAndAwardAchievements', () => {
    it('should award achievement and create notification when threshold is met', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const organizationId = new mongoose.Types.ObjectId().toString();
      
      const achievement = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Recognition Master',
        description: 'Give 5 recognitions',
        type: AchievementType.RECOGNITION_COUNT,
        icon: 'recognition.png',
        isGlobal: true,
        criteria: {
          type: AchievementType.RECOGNITION_COUNT,
          threshold: 5,
          timeframe: '30'
        },
        points: 50
      } as unknown as IAchievement;

      mockAchievementRepository.findByTypeAndThreshold.mockResolvedValue(achievement);
      mockAchievementRepository.findAward.mockResolvedValue(null);
      mockAchievementRepository.createAward.mockResolvedValue(undefined);
      
      jest.spyOn(UserRepository.prototype, 'findByKeycloakId')
        .mockResolvedValue({
          _id: userId,
          keycloakId: userId,
          availablePoints: {
            allocation: 100,
            personal: 50
          }
        } as unknown as IUser);

      await achievementService.checkAndAwardAchievements(
        userId,
        AchievementType.RECOGNITION_COUNT,
        5,
        organizationId
      );

      expect(mockAchievementRepository.createAward)
        .toHaveBeenCalledWith(userId, achievement._id.toString());
      expect(mockUserWalletService.awardPoints)
        .toHaveBeenCalledWith(userId, achievement.points, 'ACHIEVEMENT');
      expect(mockNotificationService.createAchievementNotification)
        .toHaveBeenCalledWith(userId, achievement);
    });

    it('should update progress and create progress notification when below threshold', async () => {
      const userId = new Types.ObjectId().toString();
      const organizationId = new Types.ObjectId().toString();
      const achievement = {
        _id: new Types.ObjectId(),
        ...mockAchievementData
      } as unknown as IAchievement;

      jest.spyOn(AchievementRepository.prototype, 'findByType')
        .mockResolvedValue([achievement] as unknown as IAchievement[]);
      jest.spyOn(AchievementRepository.prototype, 'findAward')
        .mockResolvedValue(null);
      jest.spyOn(AchievementRepository.prototype, 'updateProgress')
        .mockResolvedValue({
          user: new Types.ObjectId(userId),
          achievement: achievement._id,
          progress: 3
        } as unknown as IUserAchievement);
      jest.spyOn(NotificationService.prototype, 'createProgressNotification')
        .mockResolvedValue(undefined);

      await achievementService.checkAndAwardAchievements(
        userId,
        AchievementType.RECOGNITION_COUNT,
        3,
        organizationId
      );

      expect(AchievementRepository.prototype.createAward).not.toHaveBeenCalled();
      expect(AchievementRepository.prototype.updateProgress)
        .toHaveBeenCalledWith(userId, achievement._id.toString(), 3);
      expect(NotificationService.prototype.createProgressNotification)
        .toHaveBeenCalledWith(userId, achievement, 60);
    });
  });

  //TODO: fix this test

  describe('getDepartmentStats', () => {
    it('should return department stats for authorized manager', async () => {
      const mockManager = {
        _id: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(),
        department: 'Engineering',
        role: UserRole.MANAGER,
        keycloakId: 'test-id',
        firstName: 'Test',
        lastName: 'Manager',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      } as IUser;

      const mockDepartmentUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          department: 'Engineering',
          role: UserRole.USER,
          keycloakId: 'test-user-1',
          email: 'john@example.com',
          organizationId: new mongoose.Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date()
        } as IUser
      ];

      mockUserService.getUserByKeycloakId.mockResolvedValue(mockManager);
      mockUserService.getUsersByDepartment.mockResolvedValue(mockDepartmentUsers);

      const result = await achievementService.getDepartmentStats(mockManager.keycloakId);

      expect(mockUserService.getUsersByDepartment).toHaveBeenCalledWith(
        mockManager.organizationId.toString(),
        mockManager.department
      );
      expect(result).toHaveLength(mockDepartmentUsers.length);
    });

    it('should throw error for unauthorized access', async () => {
      const userId = new Types.ObjectId().toString();
      
      jest.spyOn(UserService.prototype, 'getUserByKeycloakId')
        .mockResolvedValue({ role: UserRole.USER } as unknown as IUser);

      await expect(achievementService.getDepartmentStats(userId))
        .rejects.toThrow('Unauthorized access');
    });
  });
});
