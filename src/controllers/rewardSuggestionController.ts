import { Request, Response } from "express";
import { RewardSuggestionService } from "../services/rewardSuggestionService";
import { SuggestionStatus } from "../models/rewardSuggestionModel";
import { UserService } from "../services/userService";

export class RewardSuggestionController {
  private suggestionService: RewardSuggestionService;
  private userService: UserService;

  constructor() {
    this.suggestionService = new RewardSuggestionService();
    this.userService = new UserService();
  }

  public createSuggestion = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(
        keycloakUser.sub
      );
      const suggestion = await this.suggestionService.createSuggestion({
        ...req.body,
        organizationId: organizationId,
        suggestedBy: keycloakUser.sub,
      });
      res.status(201).json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to create suggestion" });
    }
  };

  public getOrganizationSuggestions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const suggestions = await this.suggestionService.getOrganizationSuggestions(organizationId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  };

  public toggleVote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const suggestion = await this.suggestionService.toggleVote(id, keycloakUser.sub);
      res.json(suggestion);
    } catch (error) {
      res.status(400).json({ error: "Failed to toggle vote" });
    }
  };

  public reviewSuggestion = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminFeedback } = req.body;
      const suggestion = await this.suggestionService.reviewSuggestion(
        id,
        status as SuggestionStatus,
        adminFeedback
      );
      res.json(suggestion);
    } catch (error) {
      res.status(400).json({ error: "Failed to review suggestion" });
    }
  };
}
