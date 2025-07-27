import { FilterQuery } from 'mongoose';
import Reward, { IReward } from '../models/rewardModel';
import mongoose from 'mongoose';
import OrganizationReward, { IOrganizationReward } from '../models/organizationRewardModel';
import RewardRedemption from '../models/rewardRedemptionModel';



/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRewardDTO:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - pointsCost
 *         - category
 *         - quantity
 *         - createdBy
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         pointsCost:
 *           type: number
 *         category:
 *           type: string
 *           enum: [LOCAL_PERK, GIFT_CARD, MERCHANDISE]
 *         quantity:
 *           type: number
 *         createdBy:
 *           type: string
 *         isGlobal:
 *           type: boolean
 *         organizationId:
 *           type: string
 */
export interface CreateRewardDTO {
  name: string;
  description: string;
  pointsCost: number;
  quantity?: number;
  isGlobal?: boolean;
  organizationId?: string;
  createdBy: string;
  category: string;
}

export class RewardRepository {
  async createReward(data: CreateRewardDTO): Promise<IReward> {
    return await Reward.create({
      ...data,
      isActive: false,
      redemptionCount: 0,
      updatedAt: new Date()
    });
  }

  async addRewardToOrganization(organizationId: string, rewardId: string, customizations?: {
    pointsCost?: number;
    quantity?: number;
  }): Promise<IOrganizationReward> {
    return await OrganizationReward.create({
      organizationId,
      rewardId: new mongoose.Types.ObjectId(rewardId),
      customPointsCost: customizations?.pointsCost,
      customQuantity: customizations?.quantity,
      isActive: false
    });
  }

  async getOrganizationRewards(organizationId: string): Promise<IReward[]> {
    const orgRewards = await OrganizationReward.find({ 
      organizationId,
    }).populate('rewardId');

    const organizationSpecificRewards = await Reward.find({
      organizationId,
    });

    let rewards: IReward[] = [];

    try {
      rewards = [
        ...orgRewards.map((or: IOrganizationReward) => {
          try {
            if (!or.rewardId) {
              console.error("Reward ID is null for organization reward");
              return null;
            }
            const reward = (or.rewardId as unknown as IReward).toObject();
            return {
              ...reward,
              pointsCost: or.customPointsCost || (or.rewardId as unknown as IReward).pointsCost,
              quantity: or.customQuantity || (or.rewardId as unknown as IReward).quantity
            };
          } catch (error) {
            console.error("Error processing reward:", error);
            return null;
          }
        }).filter(Boolean),
        ...organizationSpecificRewards
      ];
    } catch (error) {
      console.error("Error processing orgRewards:", error);
    }

    return rewards;
  }

  async getGlobalCatalog(): Promise<IReward[]> {
    return await Reward.find({ 
      isGlobal: true,    });
  }

  async removeRewardFromOrganization(organizationId: string, rewardId: string): Promise<void> {
    await OrganizationReward.findOneAndUpdate(
      { organizationId, rewardId },
      { isActive: false }
    );
  }

  async findById(id: string): Promise<IReward | null> {
    return await Reward.findById(id)
      .populate('createdBy', 'firstName lastName');
  }

  async findAll(filters?: FilterQuery<IReward>): Promise<IReward[]> {
    return await Reward.find({ ...filters, isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  async update(id: string, data: Partial<IReward>): Promise<IReward | null> {
    return await Reward.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
  }

  async incrementRedemptionCount(id: string): Promise<IReward | null> {
    return await Reward.findByIdAndUpdate(
      id,
      { 
        $inc: { redemptionCount: 1, quantity: -1 },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  async startTransaction(): Promise<mongoose.ClientSession> {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  }

  async findOrganizationReward(
    organizationId: string,
    rewardId: string
  ): Promise<IOrganizationReward | null> {
    return await OrganizationReward.findOne({ organizationId, rewardId });
  }

  async updateOrganizationRewardStatus(
    organizationId: string,
    rewardId: string,
    isActive: boolean
  ): Promise<IOrganizationReward | null> {
    try {
      console.log('Updating status:', { organizationId, rewardId, isActive });
      return await Reward.findByIdAndUpdate(
        rewardId,
        { 
          isActive,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating organization reward status:', error);
      throw new Error('Failed to update reward status');
    }
  }

  async findRedemptionsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return await RewardRedemption.find({
      organizationId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
  }

}