import mongoose from 'mongoose';
import { AchievementRepository } from '../../repositories/achievementRepository';
import { AchievementType } from '../../models/achievementModel';
import Achievement from '../../models/achievementModel';
import UserAchievement from '../../models/userAchievementModel';

// Mock the AchievementType enum and Achievement model
jest.mock('../../models/achievementModel', () => ({
  __esModule: true,
  AchievementType: {
    RECOGNITION_COUNT: 'RECOGNITION_COUNT',
    KUDOS_RECEIVED: 'KUDOS_RECEIVED',
    POINTS_EARNED: 'POINTS_EARNED',
    WORK_ANNIVERSARY: 'WORK_ANNIVERSARY',
    TEAM_PLAYER: 'TEAM_PLAYER',
    LEADERSHIP: 'LEADERSHIP'
  },
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    deleteMany: jest.fn(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis()
  }
}));

// Mock UserAchievement model
jest.mock('../../models/userAchievementModel', () => {
  const mockFind = jest.fn();
  const mockPopulate = jest.fn();
  const mockSort = jest.fn();

  mockFind.mockReturnValue({ populate: mockPopulate });
  mockPopulate.mockReturnValue({ sort: mockSort });

  return {
    __esModule: true,
    default: {
      create: jest.fn(),
      find: mockFind,
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteMany: jest.fn(),
      populate: mockPopulate,
      sort: mockSort
    }
  };
});

describe('AchievementRepository', () => {
  let achievementRepository: AchievementRepository;

  beforeEach(() => {
    achievementRepository = new AchievementRepository();
    jest.clearAllMocks();
  });

  const mockAchievement = {
    name: 'Test Achievement',
    description: 'Test Description',
    type: AchievementType.KUDOS_RECEIVED,
    icon: 'test-icon.png',
    criteria: {
      type: AchievementType.KUDOS_RECEIVED,
      threshold: 5
    },
    points: 10
  };

  it('should create and retrieve user achievement progress', async () => {
    const achievement = { _id: new mongoose.Types.ObjectId(), ...mockAchievement };
    const userId = new mongoose.Types.ObjectId().toString();
    
    (Achievement.create as jest.Mock).mockResolvedValueOnce(achievement);
    (UserAchievement.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({
      progress: 50,
      user: userId,
      achievement: achievement._id,
      toString: () => userId
    });

    const progress = await achievementRepository.updateProgress(
      userId,
      achievement._id.toString(),
      50
    );

    expect(progress.progress).toBe(50);
    expect(progress.user.toString()).toBe(userId);
    expect(progress.achievement.toString()).toBe(achievement._id.toString());
  });

  it('should get user achievements with populated data', async () => {
    const achievement = { _id: new mongoose.Types.ObjectId(), ...mockAchievement };
    const userId = new mongoose.Types.ObjectId().toString();
    
    const mockUserAchievement = [{
      progress: 100,
      user: userId,
      achievement: achievement,
      toString: () => userId
    }];

    (UserAchievement.find as jest.Mock)().populate().sort.mockResolvedValue(mockUserAchievement);

    const userAchievements = await achievementRepository.getUserAchievements(userId);
    expect(userAchievements).toHaveLength(1);
    expect(userAchievements[0].achievement).toBeDefined();
    expect((userAchievements[0].achievement as any).name).toBe(mockAchievement.name);
  });

  it('should not create duplicate user achievements', async () => {
    const achievement = { _id: new mongoose.Types.ObjectId(), ...mockAchievement };
    const userId = new mongoose.Types.ObjectId().toString();
    
    const mockUserAchievement = {
      progress: 75,
      user: userId,
      achievement: achievement._id,
      toString: () => userId
    };

    (UserAchievement.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUserAchievement);
    (UserAchievement.find as jest.Mock)().populate().sort.mockResolvedValue([mockUserAchievement]);

    await achievementRepository.updateProgress(userId, achievement._id.toString(), 50);
    await achievementRepository.updateProgress(userId, achievement._id.toString(), 75);

    const userAchievements = await achievementRepository.getUserAchievements(userId);
    expect(userAchievements).toHaveLength(1);
    expect(userAchievements[0].progress).toBe(75);
  });

  describe('findByUser', () => {
    it('should find user achievements with populated achievement data', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockAchievement = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Achievement',
        description: 'Test Description',
        type: AchievementType.KUDOS_RECEIVED,
        icon: 'test-icon.png',
        criteria: {
          type: AchievementType.KUDOS_RECEIVED,
          threshold: 5
        },
        points: 10
      };

      const mockUserAchievement = {
        user: userId,
        achievement: mockAchievement,
        progress: 50,
        earnedAt: new Date()
      };

      (UserAchievement.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockUserAchievement])
      });

      const result = await achievementRepository.findByUser(userId);

      expect(UserAchievement.find).toHaveBeenCalledWith({ user: userId });
      expect(result).toHaveLength(1);
      expect(result[0].achievement).toEqual(mockAchievement);
      expect(result[0].progress).toBe(50);
    });
  });
}); 