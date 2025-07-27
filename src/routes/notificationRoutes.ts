import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';

const router = Router();
const notificationController = new NotificationController();

router.get('/', notificationController.getUserNotifications);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/', notificationController.deleteNotifications);

export default router;
