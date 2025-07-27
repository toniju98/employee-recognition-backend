import express from 'express';
import { RewardController } from '../controllers/rewardController';
import { isAdmin, 
    //isManagerOrAdmin 
    } from '../middleware/roleMiddleware';
import { rewardImageUpload } from '../config/rewardImageMiddleware';
const router = express.Router();
const rewardController = new RewardController();

// TODO: include patch route which sets reward on available

/**
 * @swagger
 * /api/rewards/global:
 *   post:
 *     summary: Create a new global reward
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRewardDTO'
 *     responses:
 *       201:
 *         description: Global reward created successfully
 *       500:
 *         description: Server error
 */

// TODO: new role superAdmin for me
router.post('/global', 
  isAdmin, 
  rewardImageUpload.single('image'),
  rewardController.createGlobalReward
);

/**
 * @swagger
 * /api/rewards/organizations/{organizationId}:
 *   post:
 *     summary: Create an organization-specific reward
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRewardDTO'
 *     responses:
 *       201:
 *         description: Organization reward created successfully
 *       500:
 *         description: Server error
 */
router.post('/organization', 
  isAdmin, 
  rewardImageUpload.single('image'),
  rewardController.createOrganizationReward
);

/**
 * @swagger
 * /api/rewards/organizations/{organizationId}/rewards/{rewardId}:
 *   post:
 *     summary: Add a global reward to an organization with customizations
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pointsCost:
 *                 type: number
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reward added to organization successfully
 *       400:
 *         description: Invalid request
 */
router.post('/organization/add/:rewardId', isAdmin, rewardController.addRewardToOrganization);

/**
 * @swagger
 * /api/rewards/organizations/{organizationId}/rewards:
 *   get:
 *     summary: Get all rewards for an organization
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of organization rewards
 *       500:
 *         description: Server error
 */
router.get('/organization', rewardController.getOrganizationRewards);

/**
 * @swagger
 * /api/rewards/global:
 *   get:
 *     summary: Get global rewards catalog
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of global rewards
 *       500:
 *         description: Server error
 */
router.get('/global', rewardController.getGlobalCatalog);

/**
 * @swagger
 * /api/rewards/{id}/redeem:
 *   post:
 *     summary: Redeem a reward
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reward redeemed successfully
 *       400:
 *         description: Insufficient points or invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/redeem/:id', rewardController.redeemReward);

/**
 * @swagger
 * /api/rewards/organization/rewards/{rewardId}/status:
 *   patch:
 *     summary: Update the status of a reward
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reward status updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch(
  "/organization/:rewardId/status",
  isAdmin,
  rewardController.updateRewardStatus
);

export default router;