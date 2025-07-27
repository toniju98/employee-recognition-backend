import express from "express";
import { AdminController } from "../controllers/adminController";
import { isAdmin } from "../middleware/roleMiddleware";

const router = express.Router();
const adminController = new AdminController();

/**
 * @swagger
 * /api/admin/category-settings:
 *   put:
 *     summary: Update category settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - settings
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [TEAMWORK, INNOVATION, LEADERSHIP, EXCELLENCE, CORE_VALUES]
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       403:
 *         description: Admin access required
 */
router.put(
  "/category-settings",
  isAdmin,
  adminController.updateCategorySettings
);

router.put(
  "/monthly-allocation",
  isAdmin,
  adminController.updateMonthlyAllocation
);

router.put("/yearly-budget",
    isAdmin,
    adminController.setYearlyBudget);

/**
 * @swagger
 * /api/admin/yearly-budget:
 *   get:
 *     summary: Get yearly budget
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the yearly budget
 *       403:
 *         description: Admin access required
 */
router.get(
  "/yearly-budget",
  isAdmin,
  adminController.getYearlyBudget
);

/**
 * @swagger
 * /api/admin/monthly-allocation/{employeeType}:
 *   get:
 *     summary: Get monthly allocation for employee type
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the monthly allocation for the specified employee type
 *       403:
 *         description: Admin access required
 */
router.get(
  "/monthly-allocation/{employeeType}",
  isAdmin,
  adminController.getMonthlyAllocation
);

/**
 * @swagger
 * /api/admin/points-distribution:
 *   get:
 *     summary: Get points distribution settings for all roles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Points distribution settings by role
 *       400:
 *         description: Error retrieving points distribution
 */
router.get('/points-distribution', isAdmin, adminController.getPointsDistributionByRole);

export default router;
