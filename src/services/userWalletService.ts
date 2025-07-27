import { UserService } from "../services/userService";
import { NotificationService } from "./notificationService";

export class UserWalletService {
  private userService: UserService;
  private notificationService: NotificationService;

  constructor() {
    this.userService = new UserService();
    this.notificationService = new NotificationService();
  }

  async awardPoints(
    userId: string,
    points: number,
    type: 'RECOGNITION' | 'ACHIEVEMENT' | 'MONTHLY_ALLOCATION' = 'RECOGNITION'
  ): Promise<void> {
    const user = await this.userService.getUserByKeycloakId(userId);
    if (!user) throw new Error("User not found");

    if (type === 'MONTHLY_ALLOCATION') {
      await this.userService.updateAllocationPoints(userId, points);
      await this.notificationService.create({
        user: userId,
        type: "POINTS_AWARDED",
        title: "Monthly Points Allocation",
        message: `You've received your monthly allocation of ${points} points to give!`,
        data: { points },
      });
    } else {
      await this.userService.addPersonalPoints(userId, points);
      await this.notificationService.create({
        user: userId,
        type: "POINTS_AWARDED",
        title: "Points Received",
        message: `You've earned ${points} points!`,
        data: { points },
      });
    }
  }

  async getBalance(userId: string): Promise<{ allocation: number; personal: number }> {
    const user = await this.userService.getUserByKeycloakId(userId);
    if (!user) throw new Error("User not found");
    
    return {
      allocation: user.availablePoints.allocation,
      personal: user.availablePoints.personal
    };
  }

  async deductPoints(
    userId: string, 
    points: number, 
    type: 'ALLOCATION' | 'PERSONAL' = 'PERSONAL'
  ): Promise<void> {
    const user = await this.userService.getUserByKeycloakId(userId);
    if (!user) throw new Error("User not found");

    const currentPoints = type === 'ALLOCATION' 
      ? user.availablePoints.allocation 
      : user.availablePoints.personal;

    if (currentPoints < points) {
      throw new Error("Insufficient points");
    }

    if (type === 'ALLOCATION') {
      await this.userService.deductAllocationPoints(userId, points);
    } else {
      await this.userService.updatePersonalPoints(userId, currentPoints - points);
    }

    await this.notificationService.create({
      user: userId,
      type: "POINTS_DEDUCTED",
      title: "Points Deducted",
      message: `${points} points have been deducted from your ${type.toLowerCase()} balance`,
      data: { points, type },
    });
  }
}
