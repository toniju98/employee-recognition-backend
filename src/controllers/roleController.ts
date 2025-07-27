import { Request, Response } from 'express';
import { RoleService } from '../services/roleService';
import { UserRole } from '../models/userModel';

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  public assignRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, role } = req.body;
      const assignerId = req.headers['user-id'] as string;

      await this.roleService.assignRole(userId, role as UserRole, assignerId);
      res.status(200).json({ message: 'Role assigned successfully' });
    } catch (error) {
      res.status(403).json({ error: 'Unauthorized to assign roles' });
    }
  };

  public getRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.params;
      const permissions = await this.roleService.getRolePermissions(role as UserRole);
      res.json(permissions);
    } catch (error) {
      res.status(400).json({ error: 'Invalid role' });
    }
  };
}
