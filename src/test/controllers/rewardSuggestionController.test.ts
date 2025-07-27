import { RewardSuggestionController } from '../../controllers/rewardSuggestionController';
import { Request, Response } from 'express';
import { RewardSuggestionService } from '../../services/rewardSuggestionService';
import { UserService } from '../../services/userService';
import { RewardCategory } from '../../models/rewardModel';
import { SuggestionStatus } from '../../models/rewardSuggestionModel';
import mongoose from 'mongoose';

jest.mock('../../services/rewardSuggestionService');
jest.mock('../../services/userService');

describe('RewardSuggestionController', () => {
  let suggestionController: RewardSuggestionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSuggestionService: jest.Mocked<RewardSuggestionService>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSuggestionService = {
      createSuggestion: jest.fn(),
      getOrganizationSuggestions: jest.fn(),
      toggleVote: jest.fn(),
      reviewSuggestion: jest.fn()
    } as any;

    mockUserService = {
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id')
    } as any;

    suggestionController = new RewardSuggestionController();
    // @ts-ignore - Replace services with mocks
    suggestionController['suggestionService'] = mockSuggestionService;
    suggestionController['userService'] = mockUserService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should create suggestion', async () => {
    const mockSuggestionData = {
      name: 'New Reward Suggestion',
      description: 'A great new reward idea',
      suggestedPointsCost: 100,
      category: RewardCategory.LOCAL_PERK
    };

    mockRequest = {
      body: mockSuggestionData,
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

    await suggestionController.createSuggestion(mockRequest as Request, mockResponse as Response);

    expect(mockSuggestionService.createSuggestion).toHaveBeenCalledWith({
      ...mockSuggestionData,
      organizationId: 'test-org-id',
      suggestedBy: 'test-user-id'
    });
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  it('should get organization suggestions', async () => {
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

    await suggestionController.getOrganizationSuggestions(mockRequest as Request, mockResponse as Response);

    expect(mockSuggestionService.getOrganizationSuggestions).toHaveBeenCalledWith('test-org-id');
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should toggle vote on suggestion', async () => {
    const suggestionId = new mongoose.Types.ObjectId().toString();
    mockRequest = {
      params: { id: suggestionId },
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

    await suggestionController.toggleVote(mockRequest as Request, mockResponse as Response);

    expect(mockSuggestionService.toggleVote).toHaveBeenCalledWith(suggestionId, 'test-user-id');
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should review suggestion', async () => {
    const suggestionId = new mongoose.Types.ObjectId().toString();
    const reviewData = {
      status: SuggestionStatus.APPROVED,
      adminFeedback: 'Great suggestion!'
    };

    mockRequest = {
      params: { id: suggestionId },
      body: reviewData
    } as any as Partial<Request>;

    await suggestionController.reviewSuggestion(mockRequest as Request, mockResponse as Response);

    expect(mockSuggestionService.reviewSuggestion).toHaveBeenCalledWith(
      suggestionId,
      reviewData.status,
      reviewData.adminFeedback
    );
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should handle errors when creating suggestion', async () => {
    mockRequest = {
      body: {},
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

    mockSuggestionService.createSuggestion.mockRejectedValueOnce(new Error('Creation failed'));

    await suggestionController.createSuggestion(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to create suggestion' });
  });
}); 