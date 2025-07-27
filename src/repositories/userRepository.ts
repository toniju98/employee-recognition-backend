import UserModel, { IUser } from '../models/userModel';
import mongoose from 'mongoose';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      return await UserModel.create(userData);
    } catch (error) {
      if ((error as any).code === 11000) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  async findOneAndUpdate(query: any, update: any, options?: any): Promise<IUser | null> {
    try {
      const result = await UserModel.findOneAndUpdate(query, update, { 
        new: true,
        ...options
      });
      return result as unknown as IUser | null;
    } catch (error) {
      if ((error as any).code === 11000) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  async deleteByKeycloakId(keycloakId: string): Promise<boolean> {
    const result = await UserModel.findOneAndDelete({ keycloakId });
    return result !== null;
  }

  async findByKeycloakId(keycloakId: string): Promise<IUser | null> {
    return await UserModel.findOne({ keycloakId });
  }

  async findByDepartment(organizationId: string, department: string): Promise<any[]> {
    return await UserModel.find({ organizationId, department });
  }

  async findAll(): Promise<IUser[]> {
    return await UserModel.find({});
  }

  async findByOrganization(organizationId: string): Promise<IUser[]> {
    return await UserModel.find({ organizationId });
  }

  async updatePoints(keycloakId: string, newBalance: number): Promise<void> {
    await UserModel.updateOne(
      { keycloakId },
      { $set: { points: newBalance } }
    );
  }

  async updateRole(keycloakId: string, role: string): Promise<void> {
    await UserModel.updateOne(
      { keycloakId },
      { $set: { role } }
    );
  }

  async addRedeemedReward(keycloakId: string, rewardId: string): Promise<void> {
    try {
      await UserModel.updateOne(
        { keycloakId },
        { $push: { redeemedRewards: new mongoose.Types.ObjectId(rewardId) } }
      );
      console.log(`Successfully added reward ${rewardId} for user ${keycloakId}`);
    } catch (error) {
      console.error(`Failed to add reward ${rewardId} for user ${keycloakId}:`, error);
      throw new Error('Could not add redeemed reward. Please try again later.');
    }
  }

  async findByKeycloakIdWithRewards(keycloakId: string): Promise<IUser | null> {
    return await UserModel.findOne({ keycloakId })
      .populate({
        path: 'redeemedRewards',
        model: 'Reward',
        select: 'name description category pointsCost image'
      });
  }

  async updateAllocationPoints(keycloakId: string, points: number): Promise<void> {
    await UserModel.updateOne(
      { keycloakId },
      { $set: { 'availablePoints.allocation': points } }
    );
  }

  async updatePersonalPoints(keycloakId: string, points: number): Promise<void> {
    await UserModel.updateOne(
      { keycloakId },
      { $set: { 'availablePoints.personal': points } }
    );
  }

  async addPersonalPoints(keycloakId: string, points: number): Promise<void> {
    await UserModel.updateOne(
      { keycloakId },
      { $inc: { 'availablePoints.personal': points } }
    );
  }

  async deductAllocationPoints(keycloakId: string, points: number): Promise<void> {
    await UserModel.updateOne(
      { keycloakId },
      { $inc: { 'availablePoints.allocation': -points } }
    );
  }
}
