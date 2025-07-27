import { FilterQuery } from 'mongoose';
import Achievement, { IAchievement, AchievementType } from '../models/achievementModel';
import UserAchievement, { IUserAchievement } from '../models/userAchievementModel';

export class AchievementRepository {
  async create(data: Partial<IAchievement>): Promise<IAchievement> {
    return await Achievement.create(data);
  }

  async findById(id: string): Promise<IAchievement | null> {
    return await Achievement.findById(id);
  }

  async findByType(type: AchievementType): Promise<IAchievement[]> {
    return await Achievement.find({ type });
  }

  async findAll(filters?: FilterQuery<IAchievement>): Promise<IAchievement[]> {
    return await Achievement.find(filters || {}).sort({ createdAt: -1 });
  }

  async getUserAchievements(userId: string): Promise<IUserAchievement[]> {
    return await UserAchievement.find({ user: userId })
      .populate('achievement')
      .sort({ earnedAt: -1 });
  }

  async getUserProgress(userId: string, achievementId: string): Promise<IUserAchievement | null> {
    return await UserAchievement.findOne({
      user: userId,
      achievement: achievementId
    });
  }

  async updateProgress(
    userId: string, 
    achievementId: string, 
    progress: number
  ): Promise<IUserAchievement> {
    return await UserAchievement.findOneAndUpdate(
      { 
        user: userId, 
        achievement: achievementId 
      },
      { 
        $set: { progress },
        $setOnInsert: { user: userId, achievement: achievementId }
      },
      { 
        new: true,
        upsert: true
      }
    );
  }

  async findAward(userId: string, achievementId: string): Promise<IUserAchievement | null> {
    return await UserAchievement.findOne({ 
      user: userId, 
      achievement: achievementId,
      progress: { $gte: 100 }
    });
  }

  async createAward(userId: string, achievementId: string): Promise<IUserAchievement> {
    const award = await UserAchievement.findOneAndUpdate(
      { user: userId, achievement: achievementId },
      { 
        $set: { 
          progress: 100,
          earnedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    if (!award) throw new Error('Failed to create achievement award');
    return award;
  }

  async findByUser(userId: string): Promise<IUserAchievement[]> {
    return await UserAchievement.find({ user: userId }).populate('achievement');
  }

  async getLeaderboardData(startDate: Date) {
    const aggregation = await UserAchievement.aggregate([
      { $match: { awardedAt: { $gte: startDate } } },
      { $group: {
        _id: "$userId",
        points: { $sum: "$points" },
        achievementCount: { $sum: 1 }
      }},
      { $sort: { points: -1 } },
      { $addFields: { 
        userId: "$_id",
        rank: { $add: [{ $indexOfArray: [ "$points", "$points" ] }, 1] }
      }}
    ]);
    
    return aggregation;
  }

  async findByOrganization(organizationId: string): Promise<IAchievement[]> {
    return await Achievement.find({ organizationId });
  }

  async findUserAchievementsByOrganization(userId: string, organizationId: string): Promise<IUserAchievement[]> {
    return await UserAchievement.find({ userId, organizationId }).populate('achievement');
  }

  async findOne(filter: FilterQuery<IAchievement>): Promise<IAchievement | null> {
    return await Achievement.findOne(filter);
  }

  async getLeaderboardByOrganization(organizationId: string, startDate: Date) {
    return await UserAchievement.aggregate([
      { $match: { organizationId, earnedAt: { $gte: startDate } } },
      { $group: {
        _id: "$userId",
        points: { $sum: "$points" },
        achievementCount: { $sum: 1 }
      }},
      { $sort: { points: -1 } }
    ]);
  }

  async findByUserIds(userIds: string[]): Promise<any[]> {
    return await Achievement.find({
      userId: { $in: userIds }
    });
  }

  async findByTypeAndThreshold(type: AchievementType, threshold: number): Promise<IAchievement | null> {
    return await Achievement.findOne({
      type,
      'criteria.threshold': { $lte: threshold }
    }).sort({ 'criteria.threshold': -1 });
  }
} 