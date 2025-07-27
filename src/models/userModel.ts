import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - keycloakId
 *         - email
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         keycloakId:
 *           type: string
 *           description: Keycloak user ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         firstName:
 *           type: string
 *           description: User first name
 *         lastName:
 *           type: string
 *           description: User last name
 *         department:
 *           type: string
 *           description: User department
 *         role:
 *           type: string
 *           description: User role
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         points:
 *           type: number
 *           description: User points balance
 */

export enum UserRole {
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export interface IUser extends Document {
  keycloakId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  profileImage?: string;
  points: number;
  organizationId: mongoose.Types.ObjectId;
  availablePoints: {
    allocation: number;  // Points available to give to others
    personal: number;    // Points received that can be redeemed
  };
  createdAt: Date;
  updatedAt: Date;
  redeemedRewards: Array<{
    reward: mongoose.Types.ObjectId;
    redeemedAt: Date;
    pointsCost: number;
    category: string;
    organizationId?: mongoose.Types.ObjectId;
  }>;
}

const userSchema = new Schema({
  keycloakId: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String },
  profileImage: { type: String },
  points: { type: Number, default: 0 },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  availablePoints: {
    allocation: { type: Number, default: 0 },
    personal: { type: Number, default: 0 }
  },
  redeemedRewards: [{
    type: Schema.Types.ObjectId,
    ref: 'Reward'
  }],
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', userSchema);
