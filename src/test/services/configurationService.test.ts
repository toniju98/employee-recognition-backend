import { ConfigurationService } from "../../services/configurationService";
import { ConfigurationRepository } from "../../repositories/configurationRepository";
import { RecognitionCategory } from "../../models/recognitionModel";
import { UserRole } from "../../models/userModel";
import { IConfiguration } from "../../models/configurationModel";
import { UserService } from "../../services/userService";
import { UserWalletService } from "../../services/userWalletService";
import { IUser } from "../../models/userModel";

jest.mock("../../repositories/configurationRepository");

describe("ConfigurationService", () => {
  let configService: ConfigurationService;
  let mockConfigRepo: jest.Mocked<ConfigurationRepository>;
  let mockUserService: jest.Mocked<UserService>;
  let mockUserWalletService: jest.Mocked<UserWalletService>;

  beforeEach(() => {
    mockConfigRepo = {
      findByOrganization: jest.fn(),
      updateMonthlyAllocations: jest.fn(),
      updateYearlyBudget: jest.fn(),
      updateCategorySettings: jest.fn()
    } as any;

    mockUserService = {
      getUserByKeycloakId: jest.fn(),
      getAllUsers: jest.fn()
    } as any;

    mockUserWalletService = {
      getBalance: jest.fn(),
      awardPoints: jest.fn()
    } as any;

    configService = new ConfigurationService();
    // @ts-ignore
    configService['configRepository'] = mockConfigRepo;
    // @ts-ignore
    configService['userService'] = mockUserService;
    // @ts-ignore
    configService['userWalletService'] = mockUserWalletService;
  });

  describe("updateCategorySettings", () => {
    it("should update category settings successfully", async () => {
      const settings = {
        defaultPoints: 10,
        description: "Excellence in work",
        isActive: true,
      };

      await configService.updateCategorySettings(
        'org-id',
        RecognitionCategory.EXCELLENCE,
        settings
      );

      expect(mockConfigRepo.updateCategorySettings).toHaveBeenCalledWith(
        'org-id',
        RecognitionCategory.EXCELLENCE,
        settings
      );
    });

    it("should validate settings before update", async () => {
      const invalidSettings = {
        defaultPoints: -10,
        description: "",
        isActive: true,
      };

      mockConfigRepo.updateCategorySettings.mockRejectedValue(
        new Error("Invalid settings")
      );

      await expect(
        configService.updateCategorySettings(
          'org-id',
          RecognitionCategory.EXCELLENCE,
          invalidSettings
        )
      ).rejects.toThrow("Invalid settings");
    });
  });

  describe("validateRecognitionPoints", () => {
    it("should validate points against monthly allocation", async () => {
      const mockAllocation = {
        pointsPerMonth: 100,
        maxPointsPerRecognition: 20,
      };

      mockConfigRepo.findByOrganization.mockResolvedValue({
        monthlyAllocations: new Map([
          [UserRole.EMPLOYEE, mockAllocation],
          [UserRole.USER, { pointsPerMonth: 0, maxPointsPerRecognition: 0 }],
          [UserRole.SUPERVISOR, { pointsPerMonth: 0, maxPointsPerRecognition: 0 }],
          [UserRole.MANAGER, { pointsPerMonth: 0, maxPointsPerRecognition: 0 }],
          [UserRole.ADMIN, { pointsPerMonth: 0, maxPointsPerRecognition: 0 }]
        ]),
      } as any);

      mockUserService.getUserByKeycloakId.mockResolvedValue({
        keycloakId: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
        organizationId: 'org-id',
        availablePoints: { allocation: 100, personal: 50 },
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as IUser);

      mockUserWalletService.getBalance.mockResolvedValue({
        allocation: 100,
        personal: 50
      });

      const result = await configService.validateRecognitionPoints(
        'org-id',
        UserRole.EMPLOYEE,
        15
      );

      expect(result).toBe(true);
    });

    it("should reject points exceeding max allowed", async () => {
      const mockAllocation = {
        pointsPerMonth: 100,
        maxPointsPerRecognition: 20,
      };

      mockUserService.getUserByKeycloakId.mockResolvedValue({
        keycloakId: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
        organizationId: 'org-id',
        availablePoints: { allocation: 100, personal: 50 },
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as IUser);

      mockUserWalletService.getBalance.mockResolvedValue({
        allocation: 100,
        personal: 50
      });

      mockConfigRepo.findByOrganization.mockResolvedValue({
        monthlyAllocations: new Map([
          [UserRole.EMPLOYEE, mockAllocation],
        ])
      } as any);

      const result = await configService.validateRecognitionPoints(
        'org-id',
        'user-id',
        25
      );

      expect(result).toBe(false);
    });
  });

  describe("setYearlyBudget", () => {
    it("should set yearly budget successfully", async () => {
      await configService.setYearlyBudget('org-id', 10000);

      expect(mockConfigRepo.updateYearlyBudget).toHaveBeenCalledWith('org-id', 10000);
    });

    it("should reject negative budget values", async () => {
      await expect(configService.setYearlyBudget('org-id', -1000)).rejects.toThrow(
        "Budget cannot be negative"
      );
    });
  });
});
