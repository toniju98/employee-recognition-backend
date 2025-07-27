import { Request, Response } from "express";
import { OrganizationService } from "../services/organizationService";

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  public createOrganization = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const organization = await this.organizationService.createOrganization(
        req.body
      );
      res.status(201).json(organization);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create organization";
      res.status(400).json({ error: message });
    }
  };

  public getOrganization = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const organization = await this.organizationService.getOrganization(id);
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ error: "Failed to get organization" });
    }
  };

  public getAllOrganizations = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const organizations =
        await this.organizationService.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get organizations" });
    }
  };
}
