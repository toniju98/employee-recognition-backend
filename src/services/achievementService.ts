import { AchievementRepository } from '../repositories/achievementRepository';
import { UserService } from './userService';
import { NotificationService } from './notificationService';
import { UserRole } from '../models/userModel';
import { AchievementType } from '../models/achievementModel';
import { IAchievement } from '../models/achievementModel';
import { IUserAchievement } from '../models/userAchievementModel';
import { UserWalletService } from './userWalletService';
import { Types } from 'mongoose';

export class AchievementService {
  private achievementRepository: AchievementRepository;
  private userWalletService: UserWalletService;
  private notificationService: NotificationService;
  private userService: UserService;

  constructor() {
    this.achievementRepository = new AchievementRepository();
    this.userWalletService = new UserWalletService();
    this.notificationService = new NotificationService();
    this.userService = new UserService();
  }

  async checkAndAwardAchievements(
    userId: string,
    type: AchievementType,
    value: number,
    organizationId: string
  ): Promise<void> {
    const achievement = await this.achievementRepository.findByTypeAndThreshold(type, value);
    if (!achievement) return;

    const existingAward = await this.achievementRepository.findAward(userId, achievement._id.toString());
    if (existingAward) return;

    await this.achievementRepository.createAward(userId, achievement._id.toString());

    // Award points as personal points
    await this.userWalletService.awardPoints(userId, achievement.points, 'ACHIEVEMENT');

    await this.notificationService.createAchievementNotification(userId, achievement);

    const progress = Math.floor((value / achievement.criteria.threshold) * 100);
    if (progress < 100) {
      await this.achievementRepository.updateProgress(userId, achievement._id.toString(), value);
      await this.notificationService.createProgressNotification(userId, achievement, progress);
    }
  }

  async getDepartmentStats(managerId: string) {
    const manager = await this.userService.getUserByKeycloakId(managerId);
    if (!manager || ![UserRole.MANAGER, UserRole.ADMIN].includes(manager.role) || !manager.department) {
      throw new Error('Unauthorized access');
    }

    const departmentUsers = await this.userService.getUsersByDepartment(manager.organizationId.toString(), manager.department);
    const stats = await Promise.all(
      departmentUsers.map(async (user) => ({
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        achievements: await this.getAchievements(user._id as string),
        progress: await this.getProgress(user._id as string)
      }))
    );

    return stats;
  }

  async getAchievements(userId: string) {
    return await this.achievementRepository.findByUser(userId);
  }

  async getProgress(userId: string) {
    const achievements = await this.achievementRepository.findAll();
    const userAchievements = await this.achievementRepository.getUserAchievements(userId);

    return achievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievement._id.toString() === achievement._id.toString()
      );

      return {
        achievementId: achievement._id,
        progress: userAchievement?.progress || 0
      };
    });
  }

  private async updateProgress(userId: string, achievementId: string, progress: number): Promise<void> {
    await this.achievementRepository.updateProgress(userId, achievementId, progress);
  }

  async createAchievement(data: {
    name: string;
    description: string;
    type: AchievementType;
    criteria: any;
    points: number;
    organizationId: string;
    createdBy: string;
  }): Promise<IAchievement> {
    return await this.achievementRepository.create({
      ...data,
      organizationId: new Types.ObjectId(data.organizationId)
    });
  }

  async getOrganizationAchievements(organizationId: string): Promise<IAchievement[]> {
    return await this.achievementRepository.findByOrganization(organizationId);
  }

  async getUserAchievements(userId: string, organizationId: string): Promise<IUserAchievement[]> {
    return await this.achievementRepository.findUserAchievementsByOrganization(userId, organizationId);
  }

  async awardAchievement(achievementId: string, userId: string, organizationId: string): Promise<boolean> {
    const achievement = await this.achievementRepository.findOne({
      _id: achievementId,
      organizationId
    });

    if (!achievement) {
      throw new Error('Achievement not found or not accessible');
    }

    const awarded = await this.awardAchievementToUser(userId, achievementId);
    if (awarded && achievement.points > 0) {
      await this.userWalletService.awardPoints(userId, achievement.points);
      await this.notificationService.createAchievementNotification(userId, achievement);
    }
    return awarded;
  }

  private async awardAchievementToUser(userId: string, achievementId: string): Promise<boolean> {
    const existingAward = await this.achievementRepository.findAward(userId, achievementId);
    if (existingAward) {
      return false;
    }

    await this.achievementRepository.createAward(userId, achievementId);
    return true;
  }

  async getLeaderboard(organizationId: string, timeframe: 'weekly' | 'monthly' | 'allTime' = 'allTime'): Promise<any[]> {
    const startDate = new Date();
    switch (timeframe) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setFullYear(2000);
    }

    return await this.achievementRepository.getLeaderboardByOrganization(organizationId, startDate);
  }

  async getEarnedAchievementsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // Implementation depends on your data layer
    return this.achievementRepository.findAll({
      organizationId,
      earnedAt: { $gte: startDate, $lte: endDate }
    });
  }

  async getAchievementsByUserIds(userIds: string[]): Promise<any[]> {
    return await this.achievementRepository.findByUserIds(userIds);
  }
}