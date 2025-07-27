import { RewardSuggestionRepository } from "../repositories/rewardSuggestionRepository";
import { RewardRepository } from "../repositories/rewardRepository";
import {
  IRewardSuggestion,
  SuggestionStatus,
} from "../models/rewardSuggestionModel";
import { CreateRewardDTO } from "../repositories/rewardRepository";

export class RewardSuggestionService {
  private suggestionRepository: RewardSuggestionRepository;
  private rewardRepository: RewardRepository;

  constructor() {
    this.suggestionRepository = new RewardSuggestionRepository();
    this.rewardRepository = new RewardRepository();
  }

  async createSuggestion(
    data: Partial<IRewardSuggestion>
  ): Promise<IRewardSuggestion> {
    return await this.suggestionRepository.create(data);
  }

  async getOrganizationSuggestions(
    organizationId: string
  ): Promise<IRewardSuggestion[]> {
    return await this.suggestionRepository.findAll({ organizationId });
  }

  async toggleVote(
    suggestionId: string,
    userId: string
  ): Promise<IRewardSuggestion | null> {
    const suggestion = await this.suggestionRepository.findById(suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    const hasVoted = suggestion.votes.some(
      (vote) => vote.toString() === userId
    );
    if (hasVoted) {
      return await this.suggestionRepository.removeVote(suggestionId, userId);
    } else {
      return await this.suggestionRepository.addVote(suggestionId, userId);
    }
  }

  async reviewSuggestion(
    suggestionId: string,
    status: SuggestionStatus,
    adminFeedback?: string
  ): Promise<IRewardSuggestion | null> {
    const suggestion = await this.suggestionRepository.findById(suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (status === SuggestionStatus.APPROVED) {
      // Create new organization-specific reward from suggestion
      const rewardData: CreateRewardDTO = {
        name: suggestion.name,
        description: suggestion.description,
        pointsCost: suggestion.suggestedPointsCost,
        category: suggestion.category,
        organizationId: suggestion.organizationId,
        createdBy: suggestion.suggestedBy.toString(),
        quantity: 100, // Default quantity
        isGlobal: false // Ensure it's an organization-specific reward
      };
      await this.rewardRepository.createReward(rewardData);
    }

    return await this.suggestionRepository.updateStatus(
      suggestionId,
      status,
      adminFeedback
    );
  }
}
