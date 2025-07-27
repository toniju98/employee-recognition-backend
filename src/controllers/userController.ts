import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { UserRole } from '../models/userModel';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const userData = {
        ...req.body,
        createdBy: keycloakUser.sub
      };
      const user = await this.userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Failed to create user" });
    }
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Failed to update user" });
    }
  };

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const success = await this.userService.deleteUser(req.params.id);
      if (!success) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const profile = await this.userService.getUserProfile(keycloakUser.sub);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "User not found" });
    }
  };

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        department: req.body.department
      };

      const updatedUser = await this.userService.updateProfile(keycloakUser.sub, updateData);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update profile' });
    }
  };

  public uploadProfileImage = async (req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const profileImage = file.filename;
      const updatedUser = await this.userService.updateProfileImage(keycloakUser.sub, profileImage);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: 'Failed to upload profile image' });
    }
  };

  public getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  public getPoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const points = await this.userService.getPoints(keycloakUser.sub);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user points" });
    }
  };
}