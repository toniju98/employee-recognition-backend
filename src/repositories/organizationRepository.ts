import Organization, { IOrganization } from "../models/organizationModel";
import { Types } from "mongoose";

export class OrganizationRepository {
  async findById(id: string): Promise<IOrganization | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Organization.findById(id);
  }

  async findActive(): Promise<IOrganization[]> {
    return await Organization.find({ isActive: true });
  }

  async create(data: Partial<IOrganization>): Promise<IOrganization> {
    return await Organization.create(data);
  }

  async update(
    id: string,
    data: Partial<IOrganization>
  ): Promise<IOrganization | null> {
    return await Organization.findByIdAndUpdate(id, data, { new: true });
  }

  async findByName(name: string): Promise<IOrganization | null> {
    return await Organization.findOne({ name });
  }
}
