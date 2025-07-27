import mongoose, { Document, Schema } from "mongoose";

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

organizationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IOrganization>(
  "Organization",
  organizationSchema
);
