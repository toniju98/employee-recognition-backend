import { RewardRepository } from '../../repositories/rewardRepository';
import Reward, { RewardCategory } from '../../models/rewardModel';
import OrganizationReward from '../../models/organizationRewardModel';
import mongoose from 'mongoose';

jest.mock('../../models/rewardModel');
jest.mock('../../models/organizationRewardModel');

describe('RewardRepository', () => {
  let rewardRepo: RewardRepository;
  const mockData = {
    name: 'Global Coffee Reward',
    description: 'Coffee reward available to all orgs',
    pointsCost: 100,
    category: RewardCategory.LOCAL_PERK,
    quantity: 999,
    isGlobal: true,
    createdBy: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    rewardRepo = new RewardRepository();
  });

  describe('create', () => {
    it('should create a global catalog reward', async () => {
      const mockDate = new Date('2024-12-28T14:39:02.338Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      (Reward.create as jest.Mock).mockResolvedValue({
        ...mockData,
        isActive: false,
        redemptionCount: 0,
        updatedAt: mockDate
      });

      const reward = await rewardRepo.createReward(mockData);
      expect(reward.isGlobal).toBe(true);
      expect(Reward.create).toHaveBeenCalledWith({
        ...mockData,
        isActive: false,
        redemptionCount: 0,
        updatedAt: mockDate
      });

      jest.restoreAllMocks();
    });

    it('should create an organization-specific reward', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const mockData = {
        name: 'Org Coffee Reward',
        description: 'Coffee reward for specific org',
        pointsCost: 100,
        category: RewardCategory.LOCAL_PERK,
        quantity: 50,
        isGlobal: false,
        organizationId: orgId,
        createdBy: new mongoose.Types.ObjectId().toString()
      };

      (Reward.create as jest.Mock).mockResolvedValue({
        ...mockData,
        _id: new mongoose.Types.ObjectId(),
        redemptionCount: 0,
        isActive: true
      });

      const reward = await rewardRepo.createReward(mockData);
      
      expect(reward.isGlobal).toBe(false);
      expect(reward.organizationId).toBe(orgId);
    });
  });

  describe('findById', () => {
    it('should find reward by id with populated creator', async () => {
      const mockId = new mongoose.Types.ObjectId();
      const mockReward = {
        _id: mockId,
        name: 'Test Reward',
        createdBy: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const populateMock = jest.fn().mockResolvedValue(mockReward);
      (Reward.findById as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      const result = await rewardRepo.findById(mockId.toString());

      expect(Reward.findById).toHaveBeenCalledWith(mockId.toString());
      expect(populateMock).toHaveBeenCalledWith('createdBy', 'firstName lastName');
      expect(result).toEqual(mockReward);
    });
  });

  describe('getOrganizationRewards', () => {
    it('should get all rewards for an organization', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const mockGlobalReward = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Global Reward',
        pointsCost: 100,
        quantity: 10,
        toObject: () => ({
          _id: mockGlobalReward._id,
          name: mockGlobalReward.name,
          pointsCost: mockGlobalReward.pointsCost,
          quantity: mockGlobalReward.quantity
        })
      };

      const mockOrgRewards = [{
        rewardId: mockGlobalReward,
        customPointsCost: 150,
        customQuantity: 5
      }];

      const mockOrgSpecificRewards = [
        { 
          _id: new mongoose.Types.ObjectId(),
          name: 'Org Specific Reward',
          organizationId: orgId,
          isActive: true
        }
      ];

      // Mock OrganizationReward.find().populate()
      const populateRewardMock = jest.fn().mockResolvedValue(mockOrgRewards);
      (OrganizationReward.find as jest.Mock).mockReturnValue({
        populate: populateRewardMock
      });

      // Mock Reward.find() for org-specific rewards
      (Reward.find as jest.Mock).mockResolvedValue(mockOrgSpecificRewards);

      const result = await rewardRepo.getOrganizationRewards(orgId);

      expect(OrganizationReward.find).toHaveBeenCalledWith({
        organizationId: orgId
      });
      expect(populateRewardMock).toHaveBeenCalledWith('rewardId');
      
      expect(Reward.find).toHaveBeenCalledWith({
        organizationId: orgId
      });

      // Verify combined results
      expect(result).toHaveLength(2);
      expect(result[0].pointsCost).toBe(150); // Customized cost
      expect(result[0].quantity).toBe(5); // Customized quantity
      expect(result[1]).toEqual(mockOrgSpecificRewards[0]);
    });
  });

  describe('addRewardToOrganization', () => {
    it('should add a global reward to an organization with customizations', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const rewardId = new mongoose.Types.ObjectId();
      const customizations = {
        pointsCost: 200,
        quantity: 20
      };

      const mockOrgReward = {
        _id: new mongoose.Types.ObjectId(),
        organizationId: orgId,
        rewardId: rewardId,
        customPointsCost: customizations.pointsCost,
        customQuantity: customizations.quantity,
        isActive: true
      };

      (OrganizationReward.create as jest.Mock).mockResolvedValue(mockOrgReward);

      const result = await rewardRepo.addRewardToOrganization(
        orgId,
        rewardId.toString(),
        customizations
      );

      expect(OrganizationReward.create).toHaveBeenCalledWith({
        organizationId: orgId,
        rewardId: rewardId,
        customPointsCost: customizations.pointsCost,
        customQuantity: customizations.quantity,
        isActive: false
      });
      expect(result).toEqual(mockOrgReward);
    });
  });

  describe('incrementRedemptionCount', () => {
    it('should increment redemption count and decrease quantity', async () => {
      const rewardId = new mongoose.Types.ObjectId();
      const mockUpdatedReward = {
        _id: rewardId,
        redemptionCount: 1,
        quantity: 9
      };

      // Mock Date.now() to return a fixed timestamp
      const mockDate = new Date('2024-01-01T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      (Reward.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedReward);

      const result = await rewardRepo.incrementRedemptionCount(rewardId.toString());

      expect(Reward.findByIdAndUpdate).toHaveBeenCalledWith(
        rewardId.toString(),
        {
          $inc: { redemptionCount: 1, quantity: -1 },
          updatedAt: mockDate
        },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedReward);

      // Restore Date mock
      jest.restoreAllMocks();
    });
  });

  describe('getGlobalCatalog', () => {
    it('should return all active global rewards', async () => {
      const mockGlobalRewards = [
        { 
          _id: new mongoose.Types.ObjectId(),
          name: 'Global Reward 1',
          isGlobal: true,
          isActive: true
        },
        { 
          _id: new mongoose.Types.ObjectId(),
          name: 'Global Reward 2',
          isGlobal: true,
          isActive: true
        }
      ];

      // Simply mock the find result
      (Reward.find as jest.Mock).mockResolvedValue(mockGlobalRewards);

      const result = await rewardRepo.getGlobalCatalog();

      expect(Reward.find).toHaveBeenCalledWith({
        isGlobal: true
      });
      expect(result).toEqual(mockGlobalRewards);
    });
  });
});