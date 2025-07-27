import { Request, Response } from 'express';
import { AchievementService } from '../services/achievementService';
import { UserService } from '../services/userService';

export class AchievementController {
  private achievementService: AchievementService;
  private userService: UserService;

  constructor() {
    this.achievementService = new AchievementService();
    this.userService = new UserService();
  }

  public createAchievement = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      
      const achievement = await this.achievementService.createAchievement({
        ...req.body,
        organizationId,
        createdBy: keycloakUser.sub
      });
      
      res.status(201).json(achievement);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create achievement' });
    }
  };

  public getOrganizationAchievements = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      
      const achievements = await this.achievementService.getOrganizationAchievements(organizationId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get achievements' });
    }
  };

  public getUserAchievements = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      
      const achievements = await this.achievementService.getUserAchievements(userId, organizationId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user achievements' });
    }
  };

  public awardAchievement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const achievement = await this.achievementService.awardAchievement(id, userId, organizationId);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ error: 'Failed to award achievement' });
    }
  };
} 