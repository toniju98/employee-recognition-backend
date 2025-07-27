import { UserRepository } from "../repositories/userRepository";
import { UserRole } from "../models/userModel";

export class RoleService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignerId: string
  ): Promise<void> {
    const assigner = await this.userRepository.findByKeycloakId(assignerId);
    if (!assigner || assigner.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized to assign roles");
    }

    await this.userRepository.updateRole(userId, role);
  }

  async getRolePermissions(role: UserRole): Promise<string[]> {
    const permissionMap: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: [
        "manage_users",
        "manage_achievements",
        "manage_departments",
        "view_all",
      ],
      [UserRole.MANAGER]: [
        "manage_department",
        "view_department",
        "award_achievements",
      ],
      [UserRole.USER]: ["view_own", "earn_achievements"],
      [UserRole.EMPLOYEE]: ["view_own", "earn_achievements"],
      [UserRole.SUPERVISOR]: ["view_department", "award_achievements"]
    };

    return permissionMap[role];
  }
}
