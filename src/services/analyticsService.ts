import { RecognitionService } from "./recognitionService";
import { AchievementService } from "./achievementService";
import { UserService } from "./userService";
import { RewardService } from "./rewardService";

export class AnalyticsService {
  private recognitionService: RecognitionService;
  private achievementService: AchievementService;
  private userService: UserService;
  private rewardService: RewardService;

  constructor() {
    this.recognitionService = new RecognitionService();
    this.achievementService = new AchievementService();
    this.userService = new UserService();
    this.rewardService = new RewardService();
  }

  async getEngagementMetrics(
    organizationId: string,
    timeframe: "weekly" | "monthly" | "quarterly"
  ): Promise<{
    recognitionStats: {
      totalRecognitions: number;
      uniqueGivers: number;
      uniqueReceivers: number;
      topReceivers: Array<{ user: any; count: number }>;
    };
    rewardStats: {
      totalRedemptions: number;
      popularRewards: Array<{ reward: any; redemptionCount: number }>;
    };
    achievementStats: {
      totalAchievementsEarned: number;
      completionRate: number;
    };
  }> {
    const [recognitionStats, rewardStats, achievementStats] = await Promise.all(
      [
        this.getRecognitionStats(organizationId, timeframe),
        this.getRewardStats(organizationId, timeframe),
        this.getAchievementStats(organizationId, timeframe),
      ]
    );

    return {
      recognitionStats,
      rewardStats,
      achievementStats,
    };
  }

  async getPerformanceInsights(
    organizationId: string,
    department?: string
  ): Promise<{
    departmentStats: Array<{
      department: string;
      engagementScore: number;
      recognitionRate: number;
      achievementRate: number;
    }>;
    trends: {
      weekly: Array<{ date: string; recognitionCount: number }>;
      monthly: Array<{ date: string; recognitionCount: number }>;
    };
  }> {
    const departmentStats = await this.getDepartmentStats(
      organizationId,
      department
    );
    const trends = await this.getRecognitionTrends(organizationId);

    return {
      departmentStats,
      trends,
    };
  }

  private async getRecognitionStats(organizationId: string, timeframe: string) {
    const startDate = this.getStartDateForTimeframe(timeframe);
    
    // Get all recognitions for the organization within timeframe
    const recognitions = await this.recognitionService.getRecognitionsByDateRange(
      organizationId,
      startDate,
      new Date()
    );

    // Calculate unique givers and receivers
    const givers = new Set(recognitions.map(r => r.giverId));
    const receivers = new Set(recognitions.map(r => r.receiverId));

    // Calculate top receivers
    const receiverCounts = recognitions.reduce((acc, r) => {
      acc[r.receiverId] = (acc[r.receiverId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReceivers = await Promise.all(
      Object.entries(receiverCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(async ([userId, count]) => ({
          user: await this.userService.getUserByKeycloakId(userId),
          count: count as number
        }))
    );

    return {
      totalRecognitions: recognitions.length,
      uniqueGivers: givers.size,
      uniqueReceivers: receivers.size,
      topReceivers
    };
  }

  private async getRewardStats(organizationId: string, timeframe: string) {
    const startDate = this.getStartDateForTimeframe(timeframe);
    
    const redemptions = await this.rewardService.getRedemptionsByDateRange(
      organizationId,
      startDate,
      new Date()
    );

    const rewardCounts = redemptions.reduce((acc: Record<string, number>, r: { rewardId: string }) => {
      acc[r.rewardId] = (acc[r.rewardId] || 0) + 1;
      return acc;
    }, {});

    const popularRewards = await Promise.all(
      Object.entries(rewardCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(async ([rewardId, count]) => ({
          reward: await this.rewardService.getRewardById(rewardId),
          redemptionCount: count as number
        }))
    );

    return {
      totalRedemptions: redemptions.length,
      popularRewards
    };
  }

  private async getAchievementStats(organizationId: string, timeframe: string) {
    const startDate = this.getStartDateForTimeframe(timeframe);
    
    // Get all achievements and earned achievements within timeframe
    const [achievements, earnedAchievements] = await Promise.all([
      this.achievementService.getOrganizationAchievements(organizationId),
      this.achievementService.getEarnedAchievementsByDateRange(
        organizationId,
        startDate,
        new Date()
      )
    ]);

    const totalPossibleAchievements = achievements.length * 
      await this.userService.getOrganizationUserCount(organizationId);

    return {
      totalAchievementsEarned: earnedAchievements.length,
      completionRate: totalPossibleAchievements > 0 
        ? (earnedAchievements.length / totalPossibleAchievements) * 100 
        : 0
    };
  }

  private async getDepartmentStats(organizationId: string, department?: string) {
    // Get all departments or specific department
    const departments = department 
      ? [department] 
      : await this.userService.getOrganizationDepartments(organizationId);

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const users = await this.userService.getUsersByDepartment(organizationId, dept);
        const userIds = users.map(u => (u as { _id: { toString: () => string } })._id.toString());

        const [recognitions, achievements] = await Promise.all([
          this.recognitionService.getRecognitionsByUsers(userIds),
          this.achievementService.getAchievementsByUserIds(userIds)
        ]);

        const recognitionRate = users.length > 0 
          ? recognitions.length / users.length 
          : 0;
        const achievementRate = users.length > 0 
          ? achievements.length / users.length 
          : 0;
        
        return {
          department: dept,
          engagementScore: (recognitionRate + achievementRate) / 2 * 100,
          recognitionRate: recognitionRate * 100,
          achievementRate: achievementRate * 100
        };
      })
    );

    return departmentStats;
  }

  private async getRecognitionTrends(organizationId: string) {
    const weeklyData = await this.getRecognitionTrendData(
      organizationId,
      'weekly',
      12
    ); // Last 12 weeks

    const monthlyData = await this.getRecognitionTrendData(
      organizationId,
      'monthly',
      12
    ); // Last 12 months

    return {
      weekly: weeklyData,
      monthly: monthlyData
    };
  }

  private async getRecognitionTrendData(
    organizationId: string,
    interval: 'weekly' | 'monthly',
    periods: number
  ) {
    const endDate = new Date();
    const startDate = new Date();
    
    if (interval === 'weekly') {
      startDate.setDate(startDate.getDate() - (periods * 7));
    } else {
      startDate.setMonth(startDate.getMonth() - periods);
    }

    const recognitions = await this.recognitionService.getRecognitionsByDateRange(
      organizationId,
      startDate,
      endDate
    );

    return this.aggregateRecognitionsByInterval(recognitions, interval, periods);
  }

  private getStartDateForTimeframe(timeframe: string): Date {
    const startDate = new Date();
    switch (timeframe) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to monthly
    }
    return startDate;
  }

  private aggregateRecognitionsByInterval(
    recognitions: any[],
    interval: 'weekly' | 'monthly',
    periods: number
  ): Array<{ date: string; recognitionCount: number }> {
    const data: Array<{ date: string; recognitionCount: number }> = [];
    const endDate = new Date();
    
    for (let i = 0; i < periods; i++) {
      const periodEnd = new Date(endDate);
      const periodStart = new Date(endDate);
      
      if (interval === 'weekly') {
        periodStart.setDate(periodEnd.getDate() - 7);
        endDate.setDate(endDate.getDate() - 7);
      } else {
        periodStart.setMonth(periodEnd.getMonth() - 1);
        endDate.setMonth(endDate.getMonth() - 1);
      }

      const periodRecognitions = recognitions.filter(r => 
        new Date(r.createdAt) >= periodStart && 
        new Date(r.createdAt) < periodEnd
      );

      data.unshift({
        date: periodStart.toISOString().split('T')[0],
        recognitionCount: periodRecognitions.length
      });
    }

    return data;
  }
}
