import express from "express";
import { AnalyticsController } from "../controllers/analyticsController";
import { isManager } from "../middleware/roleMiddleware";

const router = express.Router();
const analyticsController = new AnalyticsController();

// TODO: implement analytics logic

/**
 * @swagger
 * /api/analytics/organizations/{organizationId}/engagement:
 *   get:
 *     summary: Get engagement metrics for an organization
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, quarterly]
 *     responses:
 *       200:
 *         description: Engagement metrics
 */
router.get(
  "/organizations/engagement",
  //isManager,
  analyticsController.getEngagementMetrics
);

/**
 * @swagger
 * /api/analytics/organizations/{organizationId}/performance:
 *   get:
 *     summary: Get performance insights for an organization
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance insights
 */
router.get(
  "/organizations/performance",
  // isManager,
  analyticsController.getPerformanceInsights
);

export default router;
