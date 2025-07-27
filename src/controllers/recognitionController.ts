import { Request, Response } from 'express';
import { RecognitionService } from '../services/recognitionService';
import { UserService } from '../services/userService';

export class RecognitionController {
  private recognitionService: RecognitionService;
  private userService: UserService;

  constructor() {
    this.recognitionService = new RecognitionService();
    this.userService = new UserService();
  }

  public createRecognition = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      
      const recognition = await this.recognitionService.createRecognition({
        sender: keycloakUser.sub,
        recipient: req.body.recipient,
        message: req.body.message,
        category: req.body.category,
        points: req.body.points,
        organizationId: organizationId
      });
      
      res.status(201).json(recognition);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create recognition' });
    }
  };

  public getOrganizationRecognitions = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { sender, recipient } = req.query;
      const filters: any = { organizationId };
      if (sender) filters.sender = sender;
      if (recipient) filters.recipient = recipient;

      const recognitions = await this.recognitionService.getOrganizationRecognitions(filters);
      res.json(recognitions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recognitions' });
    }
  };

  public toggleKudos = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const recognition = await this.recognitionService.toggleKudos(
        req.params.id,
        keycloakUser.sub,
        organizationId
      );

      if (!recognition) {
        res.status(404).json({ error: 'Recognition not found' });
        return;
      }

      res.json(recognition);
    } catch (error) {
      res.status(400).json({ error: 'Failed to toggle kudos' });
    }
  };

  public getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const leaderboardData = await this.recognitionService.getLeaderboard(organizationId, limit);
      res.json(leaderboardData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  };

  public getUserRecognitionData = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const [stats, receivedRecognitions] = await Promise.all([
        this.recognitionService.getUserRecognitionStats(keycloakUser.sub),
        this.recognitionService.getReceivedRecognitions(keycloakUser.sub)
      ]);

      res.json({
        receivedRecognitions,
        stats: {
          recognitionsReceived: stats.received,
          recognitionsGiven: stats.given
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user recognition data' });
    }
  };
}
