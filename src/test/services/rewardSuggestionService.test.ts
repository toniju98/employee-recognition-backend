import { RewardSuggestionService } from '../../services/rewardSuggestionService';
import { RewardSuggestionRepository } from '../../repositories/rewardSuggestionRepository';
import { RewardRepository } from '../../repositories/rewardRepository';
import { RewardCategory } from '../../models/rewardModel';
import { SuggestionStatus } from '../../models/rewardSuggestionModel';
import mongoose from 'mongoose';

jest.mock('../../repositories/rewardSuggestionRepository');
jest.mock('../../repositories/rewardRepository');

describe('RewardSuggestionService', () => {
  let suggestionService: RewardSuggestionService;
  let mockSuggestionRepository: jest.Mocked<RewardSuggestionRepository>;
  let mockRewardRepository: jest.Mocked<RewardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSuggestionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      addVote: jest.fn(),
      removeVote: jest.fn(),
      updateStatus: jest.fn()
    } as jest.Mocked<RewardSuggestionRepository>;

    mockRewardRepository = {
      createReward: jest.fn(),
      addRewardToOrganization: jest.fn(),
      getOrganizationRewards: jest.fn(),
      getGlobalCatalog: jest.fn(),
      removeRewardFromOrganization: jest.fn(),
      findById: jest.fn(),
      incrementRedemptionCount: jest.fn(),
      updateReward: jest.fn(),
      startTransaction: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      findOrganizationReward: jest.fn(),
      updateOrganizationRewardStatus: jest.fn(),
      findRedemptionsByDateRange: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      deleteReward: jest.fn()
    } as unknown as jest.Mocked<RewardRepository>;

    suggestionService = new RewardSuggestionService();
    // @ts-ignore
    suggestionService['suggestionRepository'] = mockSuggestionRepository;
    suggestionService['rewardRepository'] = mockRewardRepository;
  });

  const mockSuggestionData = {
    name: 'Team Lunch',
    description: 'Monthly team lunch reward',
    suggestedPointsCost: 200,
    category: RewardCategory.LOCAL_PERK,
    organizationId: new mongoose.Types.ObjectId().toString(),
    suggestedBy: new mongoose.Types.ObjectId().toString(),
    votes: [],
    status: SuggestionStatus.PENDING
  };

  describe('createSuggestion', () => {
    it('should create a new suggestion', async () => {
      const expectedSuggestion = {
        ...mockSuggestionData,
        _id: new mongoose.Types.ObjectId()
      };

      mockSuggestionRepository.create.mockResolvedValue(expectedSuggestion as any);

      const result = await suggestionService.createSuggestion(mockSuggestionData);

      expect(mockSuggestionRepository.create).toHaveBeenCalledWith(mockSuggestionData);
      expect(result).toEqual(expectedSuggestion);
    });
  });

  describe('getOrganizationSuggestions', () => {
    it('should return organization suggestions', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const mockSuggestions = [
        { ...mockSuggestionData, _id: new mongoose.Types.ObjectId() },
        { ...mockSuggestionData, _id: new mongoose.Types.ObjectId(), name: 'Another Suggestion' }
      ];

      mockSuggestionRepository.findAll.mockResolvedValue(mockSuggestions as any);

      const result = await suggestionService.getOrganizationSuggestions(orgId);

      expect(mockSuggestionRepository.findAll).toHaveBeenCalledWith({ organizationId: orgId });
      expect(result).toEqual(mockSuggestions);
    });
  });

  describe('toggleVote', () => {
    it('should add vote when user has not voted', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const suggestion = { ...mockSuggestionData, _id: suggestionId, votes: [] };
      const updatedSuggestion = { ...suggestion, votes: [userId] };

      mockSuggestionRepository.findById.mockResolvedValue(suggestion as any);
      mockSuggestionRepository.addVote.mockResolvedValue(updatedSuggestion as any);

      const result = await suggestionService.toggleVote(suggestionId, userId);

      expect(mockSuggestionRepository.addVote).toHaveBeenCalledWith(suggestionId, userId);
      expect(result).toEqual(updatedSuggestion);
    });

    it('should remove vote when user has already voted', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const suggestion = { ...mockSuggestionData, _id: suggestionId, votes: [userId] };
      const updatedSuggestion = { ...suggestion, votes: [] };

      mockSuggestionRepository.findById.mockResolvedValue(suggestion as any);
      mockSuggestionRepository.removeVote.mockResolvedValue(updatedSuggestion as any);

      const result = await suggestionService.toggleVote(suggestionId, userId);

      expect(mockSuggestionRepository.removeVote).toHaveBeenCalledWith(suggestionId, userId);
      expect(result).toEqual(updatedSuggestion);
    });

    it('should throw error if suggestion is not found', async () => {
      mockSuggestionRepository.findById.mockResolvedValue(null);

      await expect(
        suggestionService.toggleVote(
          new mongoose.Types.ObjectId().toString(),
          new mongoose.Types.ObjectId().toString()
        )
      ).rejects.toThrow('Suggestion not found');
    });
  });

  describe('reviewSuggestion', () => {
    it('should approve suggestion and create reward', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const suggestion = { ...mockSuggestionData, _id: suggestionId };
      const updatedSuggestion = { 
        ...suggestion, 
        status: SuggestionStatus.APPROVED,
        adminFeedback: 'Great suggestion!' 
      };

      mockSuggestionRepository.findById.mockResolvedValue(suggestion as any);
      mockSuggestionRepository.updateStatus.mockResolvedValue(updatedSuggestion as any);

      const result = await suggestionService.reviewSuggestion(
        suggestionId,
        SuggestionStatus.APPROVED,
        'Great suggestion!'
      );

      expect(mockRewardRepository.createReward).toHaveBeenCalled();
      expect(mockSuggestionRepository.updateStatus).toHaveBeenCalledWith(
        suggestionId,
        SuggestionStatus.APPROVED,
        'Great suggestion!'
      );
      expect(result).toEqual(updatedSuggestion);
    });

    it('should reject suggestion without creating reward', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const suggestion = { ...mockSuggestionData, _id: suggestionId };
      const updatedSuggestion = { 
        ...suggestion, 
        status: SuggestionStatus.REJECTED,
        adminFeedback: 'Not feasible at this time' 
      };

      mockSuggestionRepository.findById.mockResolvedValue(suggestion as any);
      mockSuggestionRepository.updateStatus.mockResolvedValue(updatedSuggestion as any);

      const result = await suggestionService.reviewSuggestion(
        suggestionId,
        SuggestionStatus.REJECTED,
        'Not feasible at this time'
      );

      expect(mockRewardRepository.createReward).not.toHaveBeenCalled();
      expect(mockSuggestionRepository.updateStatus).toHaveBeenCalledWith(
        suggestionId,
        SuggestionStatus.REJECTED,
        'Not feasible at this time'
      );
      expect(result).toEqual(updatedSuggestion);
    });

    it('should throw error if suggestion is not found', async () => {
      mockSuggestionRepository.findById.mockResolvedValue(null);

      await expect(
        suggestionService.reviewSuggestion(
          new mongoose.Types.ObjectId().toString(),
          SuggestionStatus.APPROVED
        )
      ).rejects.toThrow('Suggestion not found');
    });
  });
}); 