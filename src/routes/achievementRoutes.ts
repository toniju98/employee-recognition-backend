import express from 'express';
// import { keycloak } from '../config/keycloak';
// import { syncUserProfile } from '../middleware/authMiddleware';
import { isAdmin, isManager } from '../middleware/roleMiddleware';
import { AchievementController } from '../controllers/achievementController';

const router = express.Router();
const achievementController = new AchievementController();

//TODO: test achievement functionality

/**
 * @swagger
 * /api/achievements:
 *   post:
 *     summary: Create a new achievement
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *               - criteria
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [RECOGNITION_COUNT, POINTS_EARNED, KUDOS_RECEIVED]
 *               criteria:
 *                 type: object
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Achievement created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/',
  isAdmin,
  achievementController.createAchievement
);


/**
 * @swagger
 * /api/achievements/department-stats:
 *   get:
 *     summary: Get department achievement statistics
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Manager access required
 */
/*router.get('/department-stats',
  // isManager,
  achievementController.getDepartmentStats
);*/

/**
 * @swagger
 * /api/achievements/my:
 *   get:
 *     summary: Get user's achievements
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User achievements retrieved successfully
 *       401:
 *         description: Unauthorized
 */
//TODO: rename route
router.get('/my',
  achievementController.getUserAchievements
);

/**
 * @swagger
 * /api/achievements/progress:
 *   get:
 *     summary: Get user's achievement progress
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievement progress retrieved successfully
 *       401:
 *         description: Unauthorized
 */
/*router.get('/progress',
  achievementController.getProgress
);*/

/**
 * @swagger
 * /api/achievements/leaderboard:
 *   get:
 *     summary: Get achievement leaderboard
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: integer
 *         description: Timeframe in days (default 30)
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *       401:
 *         description: Unauthorized
 */
/*router.get('/leaderboard',
  achievementController.getLeaderboard
);*/

export default router; 