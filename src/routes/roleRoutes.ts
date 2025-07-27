import { Router } from 'express';
import { isAdmin } from "../middleware/roleMiddleware";
import { RoleController } from '../controllers/roleController';

const router = Router();
const roleController = new RoleController();

// Assign role (Admin only)
router.post('/assign', 
  isAdmin,
  roleController.assignRole
);

// Get role permissions for the authenticated user
router.get('/permissions', 
  isAdmin,
  roleController.getRolePermissions
);


export default router;
