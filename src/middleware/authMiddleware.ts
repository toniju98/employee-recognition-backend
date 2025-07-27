import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { OrganizationService } from "../services/organizationService";


export const syncUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
    if (!keycloakUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const organizationService = new OrganizationService();
    const userService = new UserService();

    // Get organization from Keycloak groups
    const organizationName = organizationService.getOrganizationFromKeycloakGroups(keycloakUser.groups || []);
    if (!organizationName) {
      res.status(403).json({ error: 'User must belong to an organization' });
      return;
    }

    // Find or create organization
    const organization = await organizationService.findOrCreateByName(organizationName);

    // Create or update user with organization
    await userService.createOrUpdateUser({
      ...keycloakUser,
      organizationId: organization._id
    });

    next();
  } catch (error) {
    next(error);
  }
};
