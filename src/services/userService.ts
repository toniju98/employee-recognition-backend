import UserModel, { UserRole, IUser } from '../models/userModel';
import { UserRepository } from '../repositories/userRepository';
import { RecognitionRepository } from '../repositories/recognitionRepository';
import fs from 'fs/promises';
import path from 'path';
import { RecognitionService } from './recognitionService';

export class UserService {
  private userRepository: UserRepository;
  private recognitionService?: RecognitionService;

  constructor(recognitionService?: RecognitionService) {
    this.userRepository = new UserRepository();
  }



  async createOrUpdateUser(keycloakUser: any): Promise<IUser> {
    const userData = {
      keycloakId: keycloakUser.sub,
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      role: this.determineUserRole(keycloakUser.realm_access?.roles || []),
      organizationId: keycloakUser.organizationId
    };

    const user = await this.userRepository.findOneAndUpdate(
      { keycloakId: userData.keycloakId },
      userData,
      { upsert: true }
    );
    if (!user) throw new Error('Failed to create/update user');
    return user;
  }

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    if (!userData.keycloakId) {
      throw new Error('KeycloakId is required');
    }
    return await this.userRepository.create(userData);
  }

  async updateUser(keycloakId: string, userData: Partial<IUser>): Promise<IUser | null> {
    return await this.userRepository.findOneAndUpdate(
      { keycloakId },
      { ...userData, updatedAt: new Date() }
    );
  }

  async deleteUser(keycloakId: string): Promise<boolean> {
    return await this.userRepository.deleteByKeycloakId(keycloakId);
  }

  private determineUserRole(roles: string[]): UserRole {
    if (roles.includes('admin')) return UserRole.ADMIN;
    if (roles.includes('manager')) return UserRole.MANAGER;
    if (roles.includes('supervisor')) return UserRole.SUPERVISOR;
    if (roles.includes('employee')) return UserRole.EMPLOYEE;
    return UserRole.USER;
  }

  async getUserByKeycloakId(keycloakId: string): Promise<IUser | null> {
    return await this.userRepository.findByKeycloakId(keycloakId);
  }

  async getUsersByDepartment(organizationId: string, department: string): Promise<any[]> {
    return await this.userRepository.findByDepartment(organizationId, department);
  }

  async getAllUsers(): Promise<IUser[]> {
    return await this.userRepository.findAll();
  }

  async getUsersByOrganization(organizationId: string): Promise<IUser[]> {
    return await this.userRepository.findByOrganization(organizationId);
  }

  async getOrganizationUserCount(organizationId: string): Promise<number> {
    const users = await this.getUsersByOrganization(organizationId);
    return users.length;
  }

  async getUserProfile(keycloakId: string) {
    const user = await this.userRepository.findByKeycloakId(keycloakId);
    if (!user) {
      throw new Error('User not found');
    }
    const populatedUser = await this.userRepository.findByKeycloakIdWithRewards(keycloakId);

    return {
      id: user.keycloakId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      role: user.role,
      points: user.points,
      profileImage: user.profileImage,
      redeemedRewards: populatedUser?.redeemedRewards || []
    };
  }

  async addRedeemedReward(userId: string, rewardId: string): Promise<void> {
    await this.userRepository.addRedeemedReward(userId, rewardId);
  }

  async updateProfile(keycloakId: string, updateData: Partial<IUser>): Promise<IUser> {
    const updatedUser = await this.userRepository.findOneAndUpdate(
      { keycloakId },
      { ...updateData, updatedAt: new Date() }
    );
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async updateProfileImage(keycloakId: string, filename: string): Promise<IUser> {
    const user = await this.userRepository.findByKeycloakId(keycloakId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete old profile image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', user.profileImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.error('Failed to delete old profile image:', error);
      }
    }

    const updatedUser = await this.userRepository.findOneAndUpdate(
      { keycloakId },
      { profileImage: filename }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  async getUserOrganization(keycloakId: string): Promise<string> {
    const user = await this.userRepository.findByKeycloakId(keycloakId);
    if (!user?.organizationId) {
      throw new Error('User not found or has no organization');
    }
    return user.organizationId.toString();
  }

  async getOrganizationDepartments(organizationId: string): Promise<string[]> {
    const users = await this.userRepository.findByOrganization(organizationId);
    return [...new Set(users.map(user => user.department).filter((dept): dept is string => dept !== undefined))];
  }

  async getPoints(keycloakId: string): Promise<{ allocation: number; personal: number }> {
    const user = await this.userRepository.findByKeycloakId(keycloakId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      allocation: user.availablePoints.allocation || 0,
      personal: user.availablePoints.personal || 0
    };
  }

  async updateAllocationPoints(keycloakId: string, points: number): Promise<void> {
    await this.userRepository.updateAllocationPoints(keycloakId, points);
  }

  async updatePersonalPoints(keycloakId: string, points: number): Promise<void> {
    await this.userRepository.updatePersonalPoints(keycloakId, points);
  }

  async addPersonalPoints(keycloakId: string, points: number): Promise<void> {
    await this.userRepository.addPersonalPoints(keycloakId, points);
  }

  async deductAllocationPoints(keycloakId: string, points: number): Promise<void> {
    await this.userRepository.deductAllocationPoints(keycloakId, points);
  }
}
