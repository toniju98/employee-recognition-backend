import mongoose, { Document, Schema, Types } from 'mongoose';

export enum RecognitionCategory {
  TEAMWORK = 'TEAMWORK',
  INNOVATION = 'INNOVATION',
  LEADERSHIP = 'LEADERSHIP',
  EXCELLENCE = 'EXCELLENCE',
  CORE_VALUES = 'CORE_VALUES'
}

// Add a configuration object for category settings
export const CategoryConfig: Record<RecognitionCategory, {
  defaultPoints: number;
  description: string;
  isActive: boolean;
}> = {
  [RecognitionCategory.TEAMWORK]: {
    defaultPoints: 10,
    description: 'Recognition for exceptional teamwork',
    isActive: true
  },
  [RecognitionCategory.INNOVATION]: {
    defaultPoints: 15,
    description: 'Recognition for innovative solutions',
    isActive: true
  },
  [RecognitionCategory.LEADERSHIP]: {
    defaultPoints: 20,
    description: 'Recognition for leadership qualities',
    isActive: true
  },
  [RecognitionCategory.EXCELLENCE]: {
    defaultPoints: 15,
    description: 'Recognition for excellence in work',
    isActive: true
  },
  [RecognitionCategory.CORE_VALUES]: {
    defaultPoints: 10,
    description: 'Recognition for embodying core values',
    isActive: true
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Recognition:
 *       type: object
 *       required:
 *         - sender
 *         - recipient
 *         - message
 *         - category
 *       properties:
 *         sender:
 *           type: string
 *           description: Reference to the user giving recognition
 *         recipient:
 *           type: string
 *           description: Reference to the user receiving recognition
 *         message:
 *           type: string
 *           description: Recognition message
 *         category:
 *           type: string
 *           enum: [TEAMWORK, INNOVATION, LEADERSHIP, EXCELLENCE, CORE_VALUES]
 *           description: Type of recognition
 *         points:
 *           type: number
 *           description: Points awarded with recognition
 *         kudos:
 *           type: array
 *           items:
 *             type: string
 *           description: Users who liked/supported this recognition
 *         createdAt:
 *           type: string
 *           format: date-time
 *         pinnedUntil:
 *           type: string
 *           format: date-time
 */

export interface IRecognition extends Document {
  _id: Types.ObjectId;
  sender: string;
  recipient: string;
  message: string;
  category: RecognitionCategory;
  points: number;
  kudos: string[];
  organizationId: string;
  pinnedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const recognitionSchema = new Schema({
  sender: { 
    type: String,
    ref: 'User',
    refPath: 'keycloakId',
    required: [true, 'Sender is required'] 
  },
  recipient: { 
    type: String,
    ref: 'User',
    refPath: 'keycloakId',
    required: [true, 'Recipient is required']
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  message: {
    type: String, 
    required: [true, 'Message is required'], 
    maxlength: [500, 'Message cannot exceed 500 characters'],
    minlength: [1, 'Message cannot be empty']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: {
      values: Object.values(RecognitionCategory),
      message: '{VALUE} is not a valid category'
    }
  },
  points: { 
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  kudos: [{
    type: String,
    ref: 'User',
    refPath: 'keycloakId'
  }],
  createdAt: { type: Date, default: Date.now },
  pinnedUntil: { type: Date, default: null }
});

export default mongoose.model<IRecognition>('Recognition', recognitionSchema); 