import { Router } from 'express';
import recognitionRoutes from './recognitionRoutes';
import achievementRoutes from './achievementRoutes';
import userRoutes from './userRoutes';
import rewardRoutes from './rewardRoutes';
import notificationRoutes from './notificationRoutes';
import roleRoutes from "./roleRoutes";
import adminRoutes from "./adminRoutes";
import rewardSuggestionRoutes from "./rewardSuggestionRoutes";
import organizationRoutes from "./organizationRoutes";
import analyticsRoutes from "./analyticsRoutes";
const router = Router();

router.use("/admin", adminRoutes);
router.use('/recognition', recognitionRoutes);
router.use('/achievements', achievementRoutes);
router.use("/reward-suggestions", rewardSuggestionRoutes);
router.use('/users', userRoutes);
router.use("/rewards", rewardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/roles", roleRoutes);
router.use("/organizations", organizationRoutes);
router.use("/analytics", analyticsRoutes);


export default router; 