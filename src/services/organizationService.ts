import { OrganizationRepository } from "../repositories/organizationRepository";
import { IOrganization } from "../models/organizationModel";

export interface CreateOrganizationDTO {
  name: string;
  description?: string;
}

export class OrganizationService {
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.organizationRepository = new OrganizationRepository();
  }

  getOrganizationFromKeycloakGroups(groups: string[]): string | null {
    // Groups in Keycloak token come as paths, e.g. ["/OrganizationA", "/OrganizationA/Department1"]
    const orgGroup = groups.find(g => g.split('/').length === 2);
    return orgGroup ? orgGroup.substring(1) : null;
    
  }

  async findOrCreateByName(name: string): Promise<IOrganization> {
    const existingOrg = await this.organizationRepository.findByName(name);
    if (existingOrg) {
      return existingOrg;
    }
    return await this.createOrganization({ name });
  }

  async createOrganization(
    data: CreateOrganizationDTO
  ): Promise<IOrganization> {
    if (!data.name) {
      throw new Error("Organization name is required");
    }
    return await this.organizationRepository.create(data);
  }

  async getOrganization(id: string): Promise<IOrganization | null> {
    return await this.organizationRepository.findById(id);
  }

  async getAllOrganizations(): Promise<IOrganization[]> {
    return await this.organizationRepository.findActive();
  }
}
