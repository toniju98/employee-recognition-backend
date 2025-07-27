import { Request, Response } from "express";
import { ConfigurationService } from "../services/configurationService";
import { UserService } from "../services/userService";
import { RecognitionCategory } from "../models/recognitionModel";
import { UserRole } from "../models/userModel";

export class AdminController {
  private configService: ConfigurationService;
  private userService: UserService;

  constructor() {
    this.configService = new ConfigurationService();
    this.userService = new UserService();
  }

  public updateCategorySettings = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { category, settings } = req.body;
      await this.configService.updateCategorySettings(organizationId, category, settings);
      res.json({ message: "Category settings updated successfully" });
    } catch (error) {
      res.status(400).json({ error: "Failed to update category settings" });
    }
  };

  public updateMonthlyAllocation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { employeeType, allocation } = req.body;
      await this.configService.updateMonthlyAllocation(organizationId, employeeType as UserRole, allocation);
      res.json({ message: "Monthly allocation updated successfully" });
    } catch (error) {
      res.status(400).json({ error: "Failed to update monthly allocation" });
    }
  };

  public setYearlyBudget = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { budget } = req.body;
      await this.configService.setYearlyBudget(organizationId, budget);
      res.json({ message: "Yearly budget updated successfully" });
    } catch (error) {
      res.status(400).json({ error: "Failed to update yearly budget" });
    }
  };

  public getYearlyBudget = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const budget = await this.configService.getYearlyBudget(organizationId);
      res.json({ budget });
    } catch (error) {
      res.status(400).json({ error: "Failed to get yearly budget" });
    }
  };

  public getMonthlyAllocation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { employeeType } = req.params;
      const allocation = await this.configService.getMonthlyAllocation(organizationId, employeeType as UserRole);
      res.json(allocation);
    } catch (error) {
      res.status(400).json({ error: "Failed to get monthly allocation" });
    }
  };

  public getPointsDistributionByRole = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const distributions = await this.configService.getPointsDistributionByRole(organizationId);
      res.json(distributions);
    } catch (error) {
      res.status(400).json({ error: "Failed to get points distribution" });
    }
  };
}
