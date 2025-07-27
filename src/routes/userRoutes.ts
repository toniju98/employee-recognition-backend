import express from 'express';
import { UserController } from '../controllers/userController';
import { isAdmin } from '../middleware/roleMiddleware';
import { uploadProfileImage } from '../config/multerConfig';
import path from 'path';

const router = express.Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: 
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 department:
 *                   type: string
 *                 role:
 *                   type: string
 *                 points:
 *                   type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     recognitionsReceived:
 *                       type: number
 *                     recognitionsGiven:
 *                       type: number
 *       404:
 *         description: User not found
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid input data
 */
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /api/users/profile/image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *       400:
 *         description: Invalid file format or size
 *       404:
 *         description: User not found
 */
router.post('/profile/image', uploadProfileImage.single('image'), userController.uploadProfileImage);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   department:
 *                     type: string
 *                   role:
 *                     type: string
 *                   points:
 *                     type: number
 *       403:
 *         description: Unauthorized - Admin access required
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /api/users/points:
 *   get:
 *     summary: Get user points
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User points
 *       404:
 *         description: User not found
 */
router.get('/points', userController.getPoints);

// Admin routes
router.post('/', isAdmin, userController.createUser);
router.put('/:id', isAdmin, userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);


export default router;