import { RewardRepository } from '../repositories/rewardRepository';
import { UserWalletService } from '../services/userWalletService';
import { UserService } from '../services/userService';
import { IReward, RewardCategory } from '../models/rewardModel';
import {IOrganizationReward } from '../models/organizationRewardModel';
import { Types } from 'mongoose';
import { OrganizationRepository } from '../repositories/organizationRepository';

interface CreateRewardDTO {
  createdBy: string;
  name: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  quantity: number;
}

export class RewardService {
  private rewardRepository: RewardRepository;
  private userWalletService: UserWalletService;
  private userService: UserService;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.rewardRepository = new RewardRepository();
    this.userWalletService = new UserWalletService();
    this.userService = new UserService();
    this.organizationRepository = new OrganizationRepository();
  }

  async createGlobalReward(data: CreateRewardDTO): Promise<IReward> {
    return await this.rewardRepository.createReward({
      ...data,
      isGlobal: true
    });
  }

  async createOrganizationReward(organizationId: string, data: CreateRewardDTO): Promise<IReward> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    return await this.rewardRepository.createReward({
      ...data,
      isGlobal: false,
      organizationId
    });
  }

  async addRewardToOrganization(organizationId: string, rewardId: string, customizations?: {
    pointsCost?: number;
    quantity?: number;
  }): Promise<IOrganizationReward> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const reward = await this.rewardRepository.findById(rewardId);
    if (!reward || !reward.isGlobal) {
      throw new Error('Invalid reward selected');
    }

    return await this.rewardRepository.addRewardToOrganization(
      organizationId,
      rewardId,
      customizations
    );
  }

  async getOrganizationRewards(organizationId: string): Promise<IReward[]> {
    return await this.rewardRepository.getOrganizationRewards(organizationId);
  }

  async getGlobalCatalog(): Promise<IReward[]> {
    return await this.rewardRepository.getGlobalCatalog();
  }

  async redeemReward(userId: string, rewardId: string): Promise<IReward> {
    // Validate reward exists and is available
    const reward = await this.rewardRepository.findById(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }
    if (!reward.isActive || (reward.quantity ?? 0) <= 0) {
      throw new Error('Reward not available');
    }

    // Check user's personal points balance
    const userBalance = await this.userWalletService.getBalance(userId);
    if (userBalance.personal < reward.pointsCost) {
      throw new Error('Insufficient personal points');
    }

    // Start transaction
    const session = await this.rewardRepository.startTransaction();
    
    try {
      // Deduct points from user's personal balance
      await this.userWalletService.deductPoints(userId, reward.pointsCost, 'PERSONAL');

      // Update reward quantity and redemption count
      const updatedReward = await this.rewardRepository.incrementRedemptionCount(rewardId);
      if (!updatedReward) {
        throw new Error('Failed to update reward');
      }

      // Add to user's redeemed rewards
      await this.userService.addRedeemedReward(userId, rewardId);

      await session.commitTransaction();
      return updatedReward;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  async getRewardById(rewardId: string): Promise<any> {
    // Implement reward retrieval logic here
    return await this.rewardRepository.findById(rewardId);
  }

  async getRedemptionsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return await this.rewardRepository.findRedemptionsByDateRange(
      organizationId,
      startDate,
      endDate
    );
  }

  async updateRewardStatus(
    organizationId: string,
    rewardId: string,
    isActive: boolean
  ): Promise<IOrganizationReward | null> {
    const existingReward = await this.rewardRepository.findById(
      rewardId
    );
    if (!existingReward) {
      throw new Error("Reward not found in organization");
    }

    return await this.rewardRepository.updateOrganizationRewardStatus(
      organizationId,
      rewardId,
      isActive
    );
  }
}