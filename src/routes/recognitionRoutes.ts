import express from 'express';
import { RecognitionController } from '../controllers/recognitionController';
//import { isManagerOrAdmin } from '../middleware/roleMiddleware';

const router = express.Router();
const recognitionController = new RecognitionController();

/**
 * @swagger
 * /api/recognition:
 *   post:
 *     summary: Create a new recognition
 *     tags: [Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - message
 *               - category
 *             properties:
 *               recipientId:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [TEAMWORK, INNOVATION, LEADERSHIP, EXCELLENCE, CORE_VALUES]
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Recognition created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post('/', recognitionController.createRecognition);

/**
 * @swagger
 * /api/recognition:
 *   get:
 *     summary: Get all recognitions
 *     tags: [Recognition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recognitions
 *       500:
 *         description: Server error
 */
router.get('/', recognitionController.getOrganizationRecognitions);

/**
 * @swagger
 * /api/recognition/{id}/kudos:
 *   post:
 *     summary: Toggle kudos on a recognition
 *     tags: [Recognition]
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
 *         description: Kudos toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recognition not found
 */
router.post('/:id/kudos', recognitionController.toggleKudos);

/**
 * @swagger
 * /api/recognitions/leaderboard:
 *   get:
 *     summary: Get recognition leaderboard
 *     tags: [Recognitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of top users to return (default 10)
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/leaderboard', recognitionController.getLeaderboard);

router.get(
  "/user-data",
  recognitionController.getUserRecognitionData
);


export default router;