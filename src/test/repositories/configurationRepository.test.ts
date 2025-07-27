import { ConfigurationRepository } from "../../repositories/configurationRepository";
import Configuration from "../../models/configurationModel";
import { RecognitionCategory } from "../../models/recognitionModel";
import { UserRole } from "../../models/userModel";
import mongoose from "mongoose";

jest.mock("../../models/configurationModel");

describe("ConfigurationRepository", () => {
  let configRepo: ConfigurationRepository;
  const orgId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    configRepo = new ConfigurationRepository();
    jest.clearAllMocks();

    // Mock Configuration model methods
    (Configuration.findOne as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      organizationId: orgId,
      categorySettings: {},
      monthlyAllocations: {},
      yearlyBudget: 10000,
      fiscalYear: 2024
    });

    (Configuration.findOneAndUpdate as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      organizationId: orgId,
      categorySettings: {},
      monthlyAllocations: {},
      yearlyBudget: 10000,
      fiscalYear: 2024,
      updatedAt: new Date()
    });
  });

  describe("getCurrentConfig", () => {
    it("should return organization configuration", async () => {
      const mockConfig = {
        _id: new mongoose.Types.ObjectId(),
        organizationId: orgId,
        categorySettings: new Map(),
        monthlyAllocations: new Map(),
        yearlyBudget: 10000,
        fiscalYear: 2024,
      };

      (Configuration.findOne as jest.Mock).mockResolvedValue(mockConfig);

      const config = await configRepo.findByOrganization(orgId);
      expect(config).toEqual(mockConfig);
    });
  });

  describe("updateCategorySettings", () => {
    it("should update category settings", async () => {
      const settings = {
        defaultPoints: 10,
        description: "Excellence in work",
        isActive: true,
      };

      const result = await configRepo.updateCategorySettings(
        orgId,
        RecognitionCategory.EXCELLENCE,
        settings
      );

      expect(Configuration.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: orgId },
        {
          $set: { [`categorySettings.${RecognitionCategory.EXCELLENCE}`]: settings },
          updatedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toBeDefined();
    });
  });

  describe("updateMonthlyAllocation", () => {
    it("should update monthly allocation", async () => {
      const allocation = {
        pointsPerMonth: 100,
        maxPointsPerRecognition: 20,
      };

      const result = await configRepo.updateMonthlyAllocation(
        orgId,
        UserRole.EMPLOYEE,
        allocation
      );

      expect(Configuration.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: orgId },
        {
          $set: {
            'monthlyAllocations.EMPLOYEE.pointsPerMonth': 100,
            'monthlyAllocations.EMPLOYEE.maxPointsPerRecognition': 20
          },
          updatedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toBeDefined();
    });
  });

  describe("updateYearlyBudget", () => {
    it("should update yearly budget", async () => {
      const result = await configRepo.updateYearlyBudget(orgId, 10000);

      expect(Configuration.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: orgId },
        {
          $set: { yearlyBudget: 10000 },
          updatedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toBeDefined();
    });
  });
});
