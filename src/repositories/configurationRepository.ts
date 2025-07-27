import Configuration, { IConfiguration } from "../models/configurationModel";
import { RecognitionCategory } from "../models/recognitionModel";
import { UserRole } from "../models/userModel";
import { MonthlyAllocation } from '../services/configurationService';
import { Types } from 'mongoose';

export class ConfigurationRepository {
  async findByOrganization(organizationId: string): Promise<IConfiguration | null> {
    return await Configuration.findOne({ organizationId });
  }

  async updateByOrganization(organizationId: string, data: Partial<IConfiguration>): Promise<IConfiguration | null> {
    return await Configuration.findOneAndUpdate(
      { organizationId },
      { ...data, updatedAt: new Date() },
      { new: true }
    );
  }

  async updateCategorySettings(
    organizationId: string,
    category: RecognitionCategory,
    settings: any
  ): Promise<IConfiguration | null> {
    const key = `categorySettings.${category}`;
    return await Configuration.findOneAndUpdate(
      { organizationId },
      {
        $set: { [key]: settings },
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  async updateMonthlyAllocation(
    organizationId: string,
    employeeType: UserRole,
    allocation: MonthlyAllocation
  ): Promise<IConfiguration | null> {
    try {
      return await Configuration.findOneAndUpdate(
        { organizationId },
        {
          $set: {
            [`monthlyAllocations.${employeeType}.pointsPerMonth`]: allocation.pointsPerMonth,
            [`monthlyAllocations.${employeeType}.maxPointsPerRecognition`]: allocation.maxPointsPerRecognition
          },
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating monthly allocation:', error);
      throw error;
    }
  }

  async updateYearlyBudget(organizationId: string, amount: number): Promise<IConfiguration | null> {
    return await Configuration.findOneAndUpdate(
      { organizationId },
      {
        $set: { yearlyBudget: amount },
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  async createDefaultConfig(organizationId: string): Promise<IConfiguration> {
    return await Configuration.create({
      organizationId,
      categorySettings: new Map(),
      monthlyAllocations: new Map(),
      yearlyBudget: 0,
    });
  }
}
