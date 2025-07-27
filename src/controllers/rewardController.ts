import { Request, Response } from 'express';
import { RewardService } from '../services/rewardService';
import { UserService } from '../services/userService';

export class RewardController {
  private rewardService: RewardService;
  private userService: UserService;

  constructor() {
    this.rewardService = new RewardService();
    this.userService = new UserService();
  }

  public createGlobalReward = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const reward = await this.rewardService.createGlobalReward({
        ...req.body,
        image: req.file?.filename,
        createdBy: keycloakUser.sub,
      });
      res.status(201).json(reward);
    } catch (error) {
      console.error('Create global reward error:', error);
      res.status(500).json({ error: 'Failed to create global reward' });
    }
  };

  public createOrganizationReward = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);

      const reward = await this.rewardService.createOrganizationReward(
        organizationId,
        {
          ...req.body,
          image: req.file?.filename,
          createdBy: keycloakUser.sub
        }
      );
      res.status(201).json(reward);
    } catch (error) {
      console.error('Create organization reward error:', error);
      res.status(500).json({ error: 'Failed to create organization reward' });
    }
  };

  public addRewardToOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { rewardId } = req.params;
      const customizations = req.body;

      const orgReward = await this.rewardService.addRewardToOrganization(
        organizationId,
        rewardId,
        customizations
      );

      res.status(200).json(orgReward);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add reward to organization';
      res.status(400).json({ error: message });
    }
  };

  public getOrganizationRewards = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const rewards = await this.rewardService.getOrganizationRewards(organizationId);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get organization rewards' });
    }
  };

  public getGlobalCatalog = async (_req: Request, res: Response): Promise<void> => {
    try {
      const rewards = await this.rewardService.getGlobalCatalog();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get global catalog' });
    }
  };

  public redeemReward = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: rewardId } = req.params;
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;

      const redeemedReward = await this.rewardService.redeemReward(
        keycloakUser.sub,
        rewardId
      );

      res.status(200).json({
        message: 'Reward redeemed successfully',
        reward: redeemedReward
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to redeem reward';
      const statusCode = errorMessage.includes('Insufficient') ? 400 : 500;
      res.status(statusCode).json({ error: errorMessage });
    }
  };

  public updateRewardStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rewardId } = req.params;
      const { isActive } = req.body;
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);

      const reward = await this.rewardService.updateRewardStatus(
        organizationId,
        rewardId,
        isActive
      );
      res.json(reward);
    } catch (error) {
      console.error('Error in updateRewardStatus:', error);
      res.status(400).json({ error: "Failed to update reward status" });
    }
  };
}