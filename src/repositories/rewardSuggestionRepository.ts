import { FilterQuery } from "mongoose";
import RewardSuggestion, {
  IRewardSuggestion,
  SuggestionStatus,
} from "../models/rewardSuggestionModel";
import { Types } from "mongoose";

export class RewardSuggestionRepository {
  async create(data: Partial<IRewardSuggestion>): Promise<IRewardSuggestion> {
    try {
      return await RewardSuggestion.create(data);
    } catch (error) {
      console.error('Error creating reward suggestion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create reward suggestion: ${message}`);
    }
  }

  async findById(id: string): Promise<IRewardSuggestion | null> {
    try {
      return await RewardSuggestion.findById(id).populate(
        "suggestedBy",
        "firstName lastName email"
      );
    } catch (error) {
      console.error('Error finding reward suggestion:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find reward suggestion: ${message}`);
    }
  }

  async findAll(
    filters: FilterQuery<IRewardSuggestion>
  ): Promise<IRewardSuggestion[]> {
    return await RewardSuggestion.find(filters)
      .populate("suggestedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
  }

  async addVote(
    suggestionId: string,
    userId: string
  ): Promise<IRewardSuggestion | null> {
    return await RewardSuggestion.findByIdAndUpdate(
      suggestionId,
      { $addToSet: { votes: userId } },
      { new: true }
    );
  }

  async removeVote(
    suggestionId: string,
    userId: string
  ): Promise<IRewardSuggestion | null> {
    return await RewardSuggestion.findByIdAndUpdate(
      suggestionId,
      { $pull: { votes: userId } },
      { new: true }
    );
  }

  async updateStatus(
    suggestionId: string,
    status: SuggestionStatus,
    adminFeedback?: string
  ): Promise<IRewardSuggestion | null> {
    return await RewardSuggestion.findByIdAndUpdate(
      suggestionId,
      {
        status,
        adminFeedback,
        updatedAt: new Date(),
      },
      { new: true }
    );
  }
}
