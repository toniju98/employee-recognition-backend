import { RewardService } from '../../services/rewardService';
import { RewardRepository } from '../../repositories/rewardRepository';
import { UserWalletService } from '../../services/userWalletService';
import { UserService } from '../../services/userService';
import { RewardCategory } from '../../models/rewardModel';
import { IReward } from '../../models/rewardModel';
import mongoose from 'mongoose';
import { OrganizationRepository } from '../../repositories/organizationRepository';

jest.mock('../../repositories/rewardRepository');
jest.mock('../../services/userWalletService');
jest.mock('../../services/userService');

describe('RewardService', () => {
  let rewardService: RewardService;
  let mockRewardRepository: jest.Mocked<RewardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRewardRepository = {
      createReward: jest.fn(),
      findById: jest.fn(),
      addRewardToOrganization: jest.fn(),
      getOrganizationRewards: jest.fn(),
      getGlobalCatalog: jest.fn(),
      incrementRedemptionCount: jest.fn(),
      removeRewardFromOrganization: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      startTransaction: jest.fn(),
      updateReward: jest.fn(),
      deleteReward: jest.fn(),
      findOrganizationReward: jest.fn(),
      updateOrganizationRewardStatus: jest.fn(),
      findRedemptionsByDateRange: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn()
    } as unknown as jest.Mocked<RewardRepository>;

    const mockOrganizationRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Organization'
      }),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActive: jest.fn(),
      findByName: jest.fn()
    } as unknown as jest.Mocked<OrganizationRepository>;

    const mockUserWalletService = {
      getBalance: jest.fn(),
      deductPoints: jest.fn(),
      awardPoints: jest.fn()
    } as unknown as UserWalletService;

    const mockUserService = {
      getUserById: jest.fn(),
      addRedeemedReward: jest.fn()
    } as unknown as UserService;

    rewardService = new RewardService();
    // @ts-ignore
    rewardService['rewardRepository'] = mockRewardRepository;
    rewardService['organizationRepository'] = mockOrganizationRepository;
    rewardService['userWalletService'] = mockUserWalletService;
    rewardService['userService'] = mockUserService;
  });

  const mockRewardData = {
    name: 'Free Lunch',
    description: 'Enjoy a free lunch at the cafeteria',
    pointsCost: 150,
    category: RewardCategory.LOCAL_PERK,
    quantity: 10,
    createdBy: new mongoose.Types.ObjectId().toString(),
    isActive: true,
    redemptionCount: 0,
    isGlobal: true
  };

  describe('createGlobalReward', () => {
    it('should create a global reward', async () => {
      const expectedReward = {
        ...mockRewardData,
        isGlobal: true,
        _id: new mongoose.Types.ObjectId(),
        redemptionCount: 0,
        isActive: true
      };

      mockRewardRepository.createReward.mockResolvedValue(expectedReward as any);

      const result = await rewardService.createGlobalReward(mockRewardData);

      expect(mockRewardRepository.createReward).toHaveBeenCalledWith({
        ...mockRewardData,
        isGlobal: true,
        redemptionCount: 0,
        isActive: true
      });
      expect(result).toEqual(expectedReward);
    }, 10000);
  });

  describe('createOrganizationReward', () => {
    it('should create an organization-specific reward', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const expectedReward = {
        ...mockRewardData,
        organizationId: orgId,
        isGlobal: false,
        _id: new mongoose.Types.ObjectId(),
        redemptionCount: 0,
        isActive: true
      };

      mockRewardRepository.createReward.mockResolvedValue(expectedReward as any);

      const result = await rewardService.createOrganizationReward(orgId, mockRewardData);

      expect(mockRewardRepository.createReward).toHaveBeenCalledWith({
        ...mockRewardData,
        organizationId: orgId,
        isGlobal: false,
        redemptionCount: 0,
        isActive: true
      });
      expect(result).toEqual(expectedReward);
    }, 10000);
  });

  describe('addRewardToOrganization', () => {
    it('should add a global reward to an organization with customizations', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const rewardId = new mongoose.Types.ObjectId().toString();
      const customizations = {
        pointsCost: 200,
        quantity: 20
      };

      const mockReward = {
        _id: rewardId,
        name: 'Test Reward',
        isGlobal: true,
        isActive: true
      };

      mockRewardRepository.findById.mockResolvedValue(mockReward as any);

      const mockOrgReward = {
        _id: new mongoose.Types.ObjectId(),
        organizationId: orgId,
        rewardId: rewardId,
        customPointsCost: customizations.pointsCost,
        customQuantity: customizations.quantity,
        isActive: true
      };

      mockRewardRepository.addRewardToOrganization.mockResolvedValue(mockOrgReward as any);

      const result = await rewardService.addRewardToOrganization(
        orgId,
        rewardId,
        customizations
      );

      expect(mockRewardRepository.findById).toHaveBeenCalledWith(rewardId);
      expect(mockRewardRepository.addRewardToOrganization).toHaveBeenCalledWith(
        orgId,
        rewardId,
        customizations
      );
      expect(result).toEqual(mockOrgReward);
    }, 10000);

    it('should throw error if reward is not found', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const rewardId = new mongoose.Types.ObjectId().toString();

      mockRewardRepository.findById.mockResolvedValue(null);

      await expect(
        rewardService.addRewardToOrganization(orgId, rewardId, {})
      ).rejects.toThrow('Invalid reward selected');
    }, 10000);
  });

  describe('getOrganizationRewards', () => {
    it('should return organization rewards', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const mockRewards = [
        { ...mockRewardData, _id: new mongoose.Types.ObjectId() },
        { ...mockRewardData, _id: new mongoose.Types.ObjectId(), name: 'Another Reward' }
      ];

      mockRewardRepository.getOrganizationRewards.mockResolvedValue(mockRewards as any);

      const result = await rewardService.getOrganizationRewards(orgId);

      expect(mockRewardRepository.getOrganizationRewards).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockRewards);
    }, 10000);
  });

  describe('getGlobalCatalog', () => {
    it('should return global rewards catalog', async () => {
      const mockGlobalRewards = [
        { ...mockRewardData, _id: new mongoose.Types.ObjectId(), isGlobal: true },
        { ...mockRewardData, _id: new mongoose.Types.ObjectId(), name: 'Another Global Reward', isGlobal: true }
      ];

      mockRewardRepository.getGlobalCatalog.mockResolvedValue(mockGlobalRewards as any);

      const result = await rewardService.getGlobalCatalog();

      expect(mockRewardRepository.getGlobalCatalog).toHaveBeenCalled();
      expect(result).toEqual(mockGlobalRewards);
    }, 10000);
  });
});

describe('RewardService - Redemption', () => {
  let rewardService: RewardService;
  const mockRewardId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    rewardService = new RewardService();
  });

  describe('redeemReward', () => {
    const mockReward = {
      _id: mockRewardId,
      name: 'Test Reward',
      pointsCost: 100,
      quantity: 5,
      isActive: true,
      category: RewardCategory.GIFT_CARD
    };

    it('should successfully redeem a reward when user has sufficient personal points', async () => {
      // Mock reward existence check
      (RewardRepository.prototype.findById as jest.Mock).mockResolvedValue(mockReward);
      
      // Mock user points check with both allocation and personal points
      (UserWalletService.prototype.getBalance as jest.Mock).mockResolvedValue({
        allocation: 50,
        personal: 150
      });
      
      // Mock successful transaction
      (RewardRepository.prototype.startTransaction as jest.Mock).mockResolvedValue({
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn()
      });

      // Mock reward update
      (RewardRepository.prototype.incrementRedemptionCount as jest.Mock)
        .mockResolvedValue({ ...mockReward, quantity: 4, redemptionCount: 1 });

      await rewardService.redeemReward(mockUserId, mockRewardId);

      expect(UserWalletService.prototype.deductPoints)
        .toHaveBeenCalledWith(mockUserId, mockReward.pointsCost, 'PERSONAL');
      
      expect(UserService.prototype.addRedeemedReward)
        .toHaveBeenCalledWith(mockUserId, mockRewardId);
    });

    it('should throw error when user has insufficient personal points', async () => {
      (RewardRepository.prototype.findById as jest.Mock).mockResolvedValue(mockReward);
      (UserWalletService.prototype.getBalance as jest.Mock).mockResolvedValue({
        allocation: 200,
        personal: 50  // Less than reward cost
      });

      await expect(rewardService.redeemReward(mockUserId, mockRewardId))
        .rejects.toThrow('Insufficient personal points');
    });
  });
});