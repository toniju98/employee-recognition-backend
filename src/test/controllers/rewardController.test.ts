import { RewardController } from '../../controllers/rewardController';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { RewardCategory } from '../../models/rewardModel';
import { RewardService } from '../../services/rewardService';

jest.mock('../../services/rewardService');

describe('RewardController', () => {
  let rewardController: RewardController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRewardService: jest.Mocked<RewardService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRewardService = {
      createGlobalReward: jest.fn(),
      createOrganizationReward: jest.fn(),
      addRewardToOrganization: jest.fn(),
      getOrganizationRewards: jest.fn(),
      getGlobalCatalog: jest.fn(),
      redeemReward: jest.fn()
    } as any;

    const mockUserService = {
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id')
    } as any;

   

    rewardController = new RewardController();
    // @ts-ignore - Replace services with mocks
    rewardController['rewardService'] = mockRewardService;
    rewardController['userService'] = mockUserService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should create global reward', async () => {
    const mockRewardData = {
      name: 'Global Coffee',
      description: 'Free coffee reward',
      pointsCost: 100,
      category: RewardCategory.LOCAL_PERK,
      quantity: 50,
      createdBy: "test-user-id"
    };

    mockRequest = {
      body: mockRewardData,
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: "test-user-id"
            }
          }
        }
      }
    } as any as Partial<Request>;
    
    await rewardController.createGlobalReward(mockRequest as Request, mockResponse as Response);

    expect(mockRewardService.createGlobalReward).toHaveBeenCalledWith(mockRewardData);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  it('should create organization reward', async () => {
    const mockRewardData = {
      name: 'Org Coffee',
      description: 'Free coffee reward',
      pointsCost: 100,
      category: RewardCategory.LOCAL_PERK,
      quantity: 50,
      createdBy: "test-user-id"
    };

    mockRequest = {
      body: mockRewardData,
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: "test-user-id"
            }
          }
        }
      }
    } as any as Partial<Request>;

    await rewardController.createOrganizationReward(mockRequest as Request, mockResponse as Response);

    expect(mockRewardService.createOrganizationReward).toHaveBeenCalledWith('test-org-id', mockRewardData);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  it('should add reward to organization', async () => {
    const rewardId = new mongoose.Types.ObjectId().toString();
    const customizations = { pointsCost: 150, quantity: 20 };

    mockRequest = {
      params: { rewardId },
      body: customizations,
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: "test-user-id"
            }
          }
        }
      }
    } as any as Partial<Request>;

    await rewardController.addRewardToOrganization(mockRequest as Request, mockResponse as Response);

    expect(mockRewardService.addRewardToOrganization).toHaveBeenCalledWith(
      'test-org-id',
      rewardId,
      customizations
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it('should get organization rewards', async () => {
    const orgId = new mongoose.Types.ObjectId().toString();
    mockRequest = {
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: "test-user-id"
            }
          }
        }
      }
    } as any as Partial<Request>;

    await rewardController.getOrganizationRewards(mockRequest as Request, mockResponse as Response);

    expect(mockRewardService.getOrganizationRewards).toHaveBeenCalledWith('test-org-id');
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should get global catalog', async () => {
    mockRequest = {};

    await rewardController.getGlobalCatalog(mockRequest as Request, mockResponse as Response);

    expect(mockRewardService.getGlobalCatalog).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalled();
  });
}); 