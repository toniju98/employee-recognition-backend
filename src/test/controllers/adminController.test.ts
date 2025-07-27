import { AdminController } from "../../controllers/adminController";
import { ConfigurationService } from "../../services/configurationService";
import { Request, Response } from "express";
import { RecognitionCategory } from "../../models/recognitionModel";
import { UserRole } from "../../models/userModel";

jest.mock("../../services/configurationService");

describe("AdminController", () => {
  let adminController: AdminController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockConfigService: jest.Mocked<ConfigurationService>;

  beforeEach(() => {
    mockConfigService = {
      updateCategorySettings: jest.fn().mockResolvedValue({}),
      updateMonthlyAllocation: jest.fn().mockResolvedValue({}),
      setYearlyBudget: jest.fn().mockResolvedValue({}),
      getOrganizationConfig: jest.fn(),
      updateOrganizationConfig: jest.fn(),
      getCategorySettings: jest.fn(),
      getActiveCategories: jest.fn(),
      getMonthlyAllocation: jest.fn(),
      getYearlyBudget: jest.fn(),
      distributeMonthlyPoints: jest.fn(),
      validateRecognitionPoints: jest.fn(),
      getPointsDistributionByRole: jest.fn()
    } as unknown as jest.Mocked<ConfigurationService>;

    const mockUserService = {
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id')
    } as any;

    adminController = new AdminController();
    (adminController as any).configService = mockConfigService;
    (adminController as any).userService = mockUserService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: "test-user-id"
            }
          }
        }
      }
    } as any as Partial<Request>;
  });

  describe("updateCategorySettings", () => {
    it("should successfully update category settings", async () => {
      const categorySettings = {
        defaultPoints: 10,
        description: "Excellence in work",
        isActive: true,
      };

      mockRequest.body = {
        category: RecognitionCategory.EXCELLENCE,
        settings: categorySettings,
      };

      await adminController.updateCategorySettings(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Category settings updated successfully",
      });
    });

    it("should handle errors when updating category settings", async () => {
      mockRequest.body = {
        category: RecognitionCategory.EXCELLENCE,
        settings: {},
      };

      mockConfigService.updateCategorySettings.mockRejectedValueOnce(
        new Error("Update failed")
      );

      await adminController.updateCategorySettings(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to update category settings",
      });
    });
  });

  describe("updateMonthlyAllocation", () => {
    it("should successfully update monthly allocation", async () => {
      const allocation = {
        pointsPerMonth: 100,
        maxPointsPerRecognition: 20,
      };

      mockRequest.body = {
        employeeType: UserRole.EMPLOYEE,
        allocation,
      };

      await adminController.updateMonthlyAllocation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Monthly allocation updated successfully",
      });
    });

    it("should handle errors when updating monthly allocation", async () => {
      mockRequest.body = {
        employeeType: UserRole.EMPLOYEE,
        allocation: {},
      };

      mockConfigService.updateMonthlyAllocation.mockRejectedValueOnce(
        new Error("Update failed")
      );

      await adminController.updateMonthlyAllocation(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to update monthly allocation",
      });
    });
  });

  describe("setYearlyBudget", () => {
    it("should successfully update yearly budget", async () => {
      mockRequest.body = {
        amount: 10000,
      };

      await adminController.setYearlyBudget(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Yearly budget updated successfully",
      });
    });

    it("should handle errors when updating yearly budget", async () => {
      mockRequest.body = {
        amount: -1000,
      };

      mockConfigService.setYearlyBudget.mockRejectedValueOnce(
        new Error("Invalid amount")
      );

      await adminController.setYearlyBudget(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to update yearly budget",
      });
    });
  });

  describe('getPointsDistributionByRole', () => {
    it('should return points distribution for all roles', async () => {
      const mockDistributions = {
        distributions: {
          [UserRole.USER]: { monthlyAllocation: 100, maxPointsPerRecognition: 25 },
          [UserRole.EMPLOYEE]: { monthlyAllocation: 100, maxPointsPerRecognition: 25 },
          [UserRole.SUPERVISOR]: { monthlyAllocation: 150, maxPointsPerRecognition: 35 },
          [UserRole.MANAGER]: { monthlyAllocation: 200, maxPointsPerRecognition: 50 },
          [UserRole.ADMIN]: { monthlyAllocation: 250, maxPointsPerRecognition: 75 }
        },
        yearlyBudget: 10000,
        remainingBudget: 5000
      };

      mockConfigService.getPointsDistributionByRole.mockResolvedValue(mockDistributions);

      await adminController.getPointsDistributionByRole(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(mockDistributions);
    });
  });
});
