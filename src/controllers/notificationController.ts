import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';


export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  public getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const notifications = await this.notificationService.getUserNotifications(keycloakUser.sub);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };

  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const { notificationId } = req.params;
      await this.notificationService.markAsRead(keycloakUser.sub, notificationId);
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  };

  public deleteNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds)) {
        res.status(400).json({ error: "notificationIds must be an array" });
        return;
      }

      await this.notificationService.deleteNotifications(keycloakUser.sub, notificationIds);
      res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (error) {
      console.error("Error deleting notifications:", error);
      res.status(500).json({ error: "Failed to delete notifications" });
    }
  };
}
