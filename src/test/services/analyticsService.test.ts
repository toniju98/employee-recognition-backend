import { AnalyticsService } from '../../services/analyticsService';
import { RecognitionService } from '../../services/recognitionService';
import { UserService } from '../../services/userService';
import mongoose from 'mongoose';
import { UserRole } from '../../models/userModel';
import { IUser } from '../../models/userModel';
import { AchievementService } from '../../services/achievementService';
import { RewardService } from '../../services/rewardService';

jest.mock('../../services/recognitionService');
jest.mock('../../services/userService');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockRecognitionService: jest.Mocked<RecognitionService>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockRecognitionService = {
      getRecognitionsByDateRange: jest.fn().mockResolvedValue([
        { giverId: 'user1', receiverId: 'user2' },
        { giverId: 'user2', receiverId: 'user3' }
      ]),
      getOrganizationRecognitions: jest.fn().mockResolvedValue([]),
      getLeaderboard: jest.fn().mockResolvedValue([]),
      getRecognitionStats: jest.fn().mockResolvedValue({
        totalRecognitions: 0,
        uniqueGivers: 0,
        uniqueReceivers: 0,
        topReceivers: []
      })
    } as any;

    mockUserService = {
      getUsersByDepartment: jest.fn().mockResolvedValue([]),
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id'),
      getUserByKeycloakId: jest.fn().mockResolvedValue({
        id: 'test-id',
        name: 'Test User'
      }),
      getOrganizationUserCount: jest.fn().mockResolvedValue(10)
    } as any;

    const mockAchievementService = {
      getOrganizationAchievements: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      getEarnedAchievementsByDateRange: jest.fn().mockResolvedValue([{ id: 'earned1' }])
    } as any as AchievementService;

    const mockRewardService = {
      getRedemptionsByDateRange: jest.fn().mockResolvedValue([
        { rewardId: 'reward1' },
        { rewardId: 'reward2' }
      ]),
      getRewardById: jest.fn().mockResolvedValue({ id: 'reward1', name: 'Reward 1' })
    } as any as RewardService;

    analyticsService = new AnalyticsService();
    // @ts-ignore
    analyticsService['recognitionService'] = mockRecognitionService;
    analyticsService['userService'] = mockUserService;
    analyticsService['achievementService'] = mockAchievementService;
    analyticsService['rewardService'] = mockRewardService;
  });


  describe('getEngagementMetrics', () => {
    it('should return engagement metrics', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      
      const mockLeaderboard = [
        { 
          user: { 
            keycloakId: 'test-id',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            department: 'Engineering',
            role: UserRole.USER,
            organizationId: new mongoose.Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
          } as IUser,
          totalPoints: 100,
          recognitions: []
        }
      ];

      mockRecognitionService.getLeaderboard = jest.fn().mockResolvedValue(mockLeaderboard);

      const result = await analyticsService.getEngagementMetrics(orgId, "monthly");

      expect(result).toEqual({
        recognitionStats: expect.any(Object),
        achievementStats: expect.any(Object),
        rewardStats: expect.any(Object)
      });
    }, 10000);
  });

}); 