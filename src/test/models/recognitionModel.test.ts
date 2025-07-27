import mongoose from 'mongoose';
import Recognition, { IRecognition, RecognitionCategory } from '../../models/recognitionModel';

describe('Recognition Model', () => {
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/employee-recognition"
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });


  it('should create a recognition with required fields', async () => {
    const validRecognition = {
      sender: new mongoose.Types.ObjectId(),
      recipient: new mongoose.Types.ObjectId(),
      message: 'Great work!',
      category: RecognitionCategory.EXCELLENCE,
    };

    const savedRecognition = await Recognition.create(validRecognition);
    
    expect(savedRecognition.sender.toString()).toEqual(validRecognition.sender.toString());
    expect(savedRecognition.recipient.toString()).toEqual(validRecognition.recipient.toString());
    expect(savedRecognition.message).toBe(validRecognition.message);
    expect(savedRecognition.category).toBe(validRecognition.category);
    expect(savedRecognition.points).toBe(0);
    expect(savedRecognition.kudos).toEqual([]);
    expect(savedRecognition.createdAt).toBeDefined();
  });

  it('should fail validation when required fields are missing', async () => {
    const invalidRecognition = {
      sender: new mongoose.Types.ObjectId(),
      // missing recipient
      message: 'Great work!',
      category: RecognitionCategory.EXCELLENCE,
    };

    await expect(Recognition.create(invalidRecognition)).rejects.toThrow();
  });

  it('should fail validation when message exceeds maximum length', async () => {
    const invalidRecognition = {
      sender: new mongoose.Types.ObjectId(),
      recipient: new mongoose.Types.ObjectId(),
      message: 'a'.repeat(501),
      category: RecognitionCategory.EXCELLENCE,
    };

    await expect(Recognition.create(invalidRecognition)).rejects.toThrow();
  });

  it('should create a recognition with optional fields', async () => {
    const validRecognition = {
      sender: new mongoose.Types.ObjectId(),
      recipient: new mongoose.Types.ObjectId(),
      message: 'Great work!',
      category: RecognitionCategory.EXCELLENCE,
      points: 10,
      pinnedUntil: new Date(),
    };

    const savedRecognition = await Recognition.create(validRecognition);
    
    expect(savedRecognition.points).toBe(validRecognition.points);
    expect(savedRecognition.pinnedUntil).toEqual(validRecognition.pinnedUntil);
  });
}); 