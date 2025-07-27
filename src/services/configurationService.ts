import { ConfigurationRepository } from '../repositories/configurationRepository';
import { RecognitionCategory } from '../models/recognitionModel';
import { UserRole, IUser } from '../models/userModel';
import { UserService } from '../services/userService';
import { UserWalletService } from '../services/userWalletService';

export interface MonthlyAllocation {
  pointsPerMonth: number;
  maxPointsPerRecognition: number;
}

 interface PointsDistributionResponse {
   distributions: Record<
     UserRole,
     {
       monthlyAllocation: number;
       maxPointsPerRecognition: number;
     }
   >;
   yearlyBudget: number;
   remainingBudget: number;
 }

export class ConfigurationService {
  private configRepository: ConfigurationRepository;
  private userService: UserService;
  private userWalletService: UserWalletService;

  constructor() {
    this.configRepository = new ConfigurationRepository();
    this.userService = new UserService();
    this.userWalletService = new UserWalletService();
  }

  async getOrganizationConfig(organizationId: string) {
    return await this.configRepository.findByOrganization(organizationId);
  }

  async updateOrganizationConfig(organizationId: string, data: any) {
    return await this.configRepository.updateByOrganization(organizationId, data);
  }

  async updateCategorySettings(
    organizationId: string,
    category: RecognitionCategory,
    settings: any
  ): Promise<void> {
    await this.configRepository.updateCategorySettings(organizationId, category, settings);
  }

  async getCategorySettings(organizationId: string, category: RecognitionCategory): Promise<any> {
    const config = await this.configRepository.findByOrganization(organizationId);
    if (!config) throw new Error('Configuration not found');
    return config.categorySettings.get(category);
  }

  async getActiveCategories(organizationId: string): Promise<RecognitionCategory[]> {
    const config = await this.configRepository.findByOrganization(organizationId);
    if (!config) throw new Error("Configuration not found");
    
    // Convert MongooseMap to regular object and get entries
    const categorySettings = Object.fromEntries(Array.from((config.categorySettings as unknown) as Map<string, any>));

    return Object.entries(categorySettings)
      .filter(([_category, settings]) => settings.isActive)
      .map(([category]) => category as RecognitionCategory);
  }

  async updateMonthlyAllocation(
    organizationId: string,
    employeeType: UserRole,
    allocation: MonthlyAllocation
  ): Promise<void> {
    /*if (allocation.pointsPerMonth < 0 || allocation.maxPointsPerRecognition < 0) {
      throw new Error('Points allocations cannot be negative');
    }*/
    await this.configRepository.updateMonthlyAllocation(organizationId, employeeType, allocation);
  }

  async getMonthlyAllocation(organizationId: string, employeeType: UserRole): Promise<MonthlyAllocation> {
    const config = await this.configRepository.findByOrganization(organizationId);
    if (!config) throw new Error('Configuration not found');

    const allocation = config.monthlyAllocations.get(employeeType);
    if (!allocation) throw new Error('Invalid employee type');
    return allocation;
  }

  async setYearlyBudget(organizationId: string, amount: number): Promise<void> {
    if (amount < 0) throw new Error('Budget cannot be negative');
    await this.configRepository.updateYearlyBudget(organizationId, amount);
  }

  async getYearlyBudget(organizationId: string): Promise<number> {
    const config = await this.configRepository.findByOrganization(organizationId);
    if (!config) throw new Error('Configuration not found');
    return config.yearlyBudget;
  }

  async validateRecognitionPoints(
    organizationId: string,
    keycloakId: string,
    points: number
  ): Promise<boolean> {
    const user = await this.userService.getUserByKeycloakId(keycloakId);
    if (!user) throw new Error('User not found');

    // Check if user has enough allocation points
    const userBalance = await this.userWalletService.getBalance(keycloakId);
    if (userBalance.allocation < points) {
      return false;
    }

    // Check if points exceed max per recognition
    const allocation = await this.getMonthlyAllocation(organizationId, user.role);
    if (points > allocation.maxPointsPerRecognition) {
      return false;
    }

    return true;
  }

  async distributeMonthlyPoints(organizationId: string): Promise<void> {
    const config = await this.configRepository.findByOrganization(organizationId);
    if (!config) throw new Error('Configuration not found');

    const users = await this.userService.getAllUsers() as IUser[];
    
    for (const user of users) {
      const allocation = config.monthlyAllocations.get(user.role);
      if (allocation && allocation.pointsPerMonth > 0) {
        await this.userWalletService.awardPoints(
          user.keycloakId,
          allocation.pointsPerMonth,
          'MONTHLY_ALLOCATION'
        );
      }
    }
  }

 

  async getPointsDistributionByRole(organizationId: string): Promise<PointsDistributionResponse> {
    const config = await this.configRepository.findByOrganization(organizationId);
    if (!config) {
      throw new Error('Configuration not found');
    }

    const distributions: Record<UserRole, any> = {
      [UserRole.USER]: null,
      [UserRole.EMPLOYEE]: null,
      [UserRole.SUPERVISOR]: null,
      [UserRole.MANAGER]: null,
      [UserRole.ADMIN]: null
    };
    
    let totalMonthlyAllocation = 0;
    for (const [role, allocation] of config.monthlyAllocations.entries()) {
      distributions[role] = {
        monthlyAllocation: allocation.pointsPerMonth,
        maxPointsPerRecognition: allocation.maxPointsPerRecognition
      };
      totalMonthlyAllocation += allocation.pointsPerMonth;
    }

    const users = await this.userService.getAllUsers();
    const yearlyAllocation = totalMonthlyAllocation * 12 * users.length;
    const remainingBudget = config.yearlyBudget - yearlyAllocation;

    return {
      distributions,
      yearlyBudget: config.yearlyBudget,
      remainingBudget: remainingBudget
    };
  }

}
