import mongoose, { Schema, Document, Types } from 'mongoose';
import { RecognitionCategory } from './recognitionModel';
import { UserRole } from './userModel';

export interface IConfiguration extends Document {
  organizationId: Types.ObjectId;
  categorySettings: Map<RecognitionCategory, {
    isActive: boolean;
    maxPoints: number;
  }>;
  monthlyAllocations: Map<UserRole, {
    pointsPerMonth: number;
    maxPointsPerRecognition: number;
  }>;
  yearlyBudget: number;
}

const configurationSchema = new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  categorySettings: {
    type: Map,
    of: {
      isActive: { type: Boolean, default: true },
      maxPoints: { type: Number, default: 100 }
    }
  },
  monthlyAllocations: {
    type: Map,
    of: {
      pointsPerMonth: { type: Number, default: 100 },
      maxPointsPerRecognition: { type: Number, default: 25 }
    }
  },
  yearlyBudget: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IConfiguration>('Configuration', configurationSchema);
