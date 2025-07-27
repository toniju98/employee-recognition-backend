import { RewardSuggestionRepository } from '../../repositories/rewardSuggestionRepository';
import RewardSuggestion from '../../models/rewardSuggestionModel';
import { RewardCategory } from '../../models/rewardModel';
import { SuggestionStatus } from '../../models/rewardSuggestionModel';
import mongoose from 'mongoose';

jest.mock('../../models/rewardSuggestionModel');

describe('RewardSuggestionRepository', () => {
  let suggestionRepo: RewardSuggestionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    suggestionRepo = new RewardSuggestionRepository();
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

  describe('create', () => {
    it('should create a new suggestion', async () => {
      (RewardSuggestion.create as jest.Mock).mockResolvedValue({
        ...mockSuggestionData,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const suggestion = await suggestionRepo.create(mockSuggestionData);

      expect(RewardSuggestion.create).toHaveBeenCalledWith(mockSuggestionData);
      expect(suggestion.name).toBe(mockSuggestionData.name);
      expect(suggestion.status).toBe(SuggestionStatus.PENDING);
    });
  });

  describe('findById', () => {
    it('should find suggestion by id with populated suggestedBy', async () => {
      const mockId = new mongoose.Types.ObjectId();
      const mockSuggestion = {
        _id: mockId,
        ...mockSuggestionData,
        suggestedBy: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const populateMock = jest.fn().mockResolvedValue(mockSuggestion);
      (RewardSuggestion.findById as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      const result = await suggestionRepo.findById(mockId.toString());

      expect(RewardSuggestion.findById).toHaveBeenCalledWith(mockId.toString());
      expect(populateMock).toHaveBeenCalledWith(
        "suggestedBy",
        "firstName lastName email"
      );
      expect(result).toEqual(mockSuggestion);
    });
  });

  describe('findAll', () => {
    it('should find all suggestions with filters', async () => {
      const orgId = new mongoose.Types.ObjectId().toString();
      const mockSuggestions = [
        { ...mockSuggestionData, _id: new mongoose.Types.ObjectId() },
        { ...mockSuggestionData, _id: new mongoose.Types.ObjectId() }
      ];

      const sortMock = jest.fn().mockResolvedValue(mockSuggestions);
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
      (RewardSuggestion.find as jest.Mock).mockReturnValue({ populate: populateMock });

      const result = await suggestionRepo.findAll({ organizationId: orgId });

      expect(RewardSuggestion.find).toHaveBeenCalledWith({ organizationId: orgId });
      expect(result).toEqual(mockSuggestions);
    });
  });

  describe('addVote', () => {
    it('should add vote to suggestion', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const updatedSuggestion = {
        ...mockSuggestionData,
        votes: [userId]
      };

      (RewardSuggestion.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedSuggestion);

      const result = await suggestionRepo.addVote(suggestionId, userId);

      expect(RewardSuggestion.findByIdAndUpdate).toHaveBeenCalledWith(
        suggestionId,
        { $addToSet: { votes: userId } },
        { new: true }
      );
      expect(result).toEqual(updatedSuggestion);
    });
  });

  describe('removeVote', () => {
    it('should remove vote from suggestion', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const updatedSuggestion = {
        ...mockSuggestionData,
        votes: []
      };

      (RewardSuggestion.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedSuggestion);

      const result = await suggestionRepo.removeVote(suggestionId, userId);

      expect(RewardSuggestion.findByIdAndUpdate).toHaveBeenCalledWith(
        suggestionId,
        { $pull: { votes: userId } },
        { new: true }
      );
      expect(result).toEqual(updatedSuggestion);
    });
  });

  describe('updateStatus', () => {
    it('should update suggestion status', async () => {
      const suggestionId = new mongoose.Types.ObjectId().toString();
      const updatedSuggestion = {
        ...mockSuggestionData,
        status: SuggestionStatus.APPROVED,
        adminFeedback: 'Great suggestion!'
      };

      (RewardSuggestion.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedSuggestion);

      const result = await suggestionRepo.updateStatus(
        suggestionId,
        SuggestionStatus.APPROVED,
        'Great suggestion!'
      );

      expect(RewardSuggestion.findByIdAndUpdate).toHaveBeenCalledWith(
        suggestionId,
        {
          status: SuggestionStatus.APPROVED,
          adminFeedback: 'Great suggestion!',
          updatedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toEqual(updatedSuggestion);
    });
  });
});