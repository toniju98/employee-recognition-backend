import { RecognitionRepository } from "../../repositories/recognitionRepository";
import mongoose from "mongoose";

// Mock the entire module and define the enum
jest.mock("../../models/recognitionModel", () => ({
  __esModule: true,
  RecognitionCategory: {
    EXCELLENCE: 'EXCELLENCE',
    TEAMWORK: 'TEAMWORK',
    INNOVATION: 'INNOVATION',
    OWNERSHIP: 'OWNERSHIP',
    CUSTOMER_FOCUS: 'CUSTOMER_FOCUS'
  },
  default: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn()
  }
}));

// Import after mocking
import Recognition, { RecognitionCategory } from "../../models/recognitionModel";

describe("RecognitionRepository", () => {
  let recognitionRepository: RecognitionRepository;

  beforeEach(() => {
    recognitionRepository = new RecognitionRepository();
    jest.clearAllMocks();

    // Mock create method
    (Recognition.create as jest.Mock).mockImplementation((data) => {
      if (!data.recipient) {
        throw new Error("Recognition validation failed");
      }
      if (data.message && data.message.length > 500) {
        throw new Error("Message cannot exceed 500 characters");
      }
      return {
        ...data,
        _id: new mongoose.Types.ObjectId(),
        kudos: [],
        points: data.points || 0,
        createdAt: new Date(),
        toString: () => 'mocked_id',
        sender: {
          ...data.sender,
          toString: () => data.sender.toString()
        },
        recipient: {
          ...data.recipient,
          toString: () => data.recipient.toString()
        }
      };
    });

    // Mock find method
    (Recognition.find as jest.Mock).mockImplementation(() => Promise.resolve([]));
  });

  describe("createRecognition", () => {
    it("should create a recognition with required fields", async () => {
      const mockData = {
        sender: new mongoose.Types.ObjectId().toString(),
        recipient: new mongoose.Types.ObjectId().toString(),
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
      };

      const recognition = await recognitionRepository.createRecognition(
        mockData
      );

      expect(recognition.sender.toString()).toBe(mockData.sender.toString());
      expect(recognition.recipient.toString()).toBe(
        mockData.recipient.toString()
      );
      expect(recognition.message).toBe(mockData.message);
      expect(recognition.category).toBe(mockData.category);
      expect(recognition.points).toBe(0); // default value
      expect(recognition.kudos).toEqual([]); // default empty array
      expect(recognition.createdAt).toBeDefined();
    });

    it("should create a recognition with optional fields", async () => {
      const mockData = {
        sender: new mongoose.Types.ObjectId().toString(),
        recipient: new mongoose.Types.ObjectId().toString(),
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
        points: 10,
        pinnedUntil: new Date(),
      };

      const recognition = await recognitionRepository.createRecognition(
        mockData
      );

      expect(recognition.points).toBe(mockData.points);
      expect(recognition.pinnedUntil).toEqual(mockData.pinnedUntil);
    });

    it("should throw error if required fields are missing", async () => {
      const invalidData = {
        sender: new mongoose.Types.ObjectId().toString(),
        // missing recipient
        message: "Great work!",
        category: RecognitionCategory.EXCELLENCE,
      };

      await expect(
        recognitionRepository.createRecognition(invalidData)
      ).rejects.toThrow("Recognition validation failed");
    });

    it("should throw error if message exceeds maximum length", async () => {
      const mockData = {
        sender: new mongoose.Types.ObjectId().toString(),
        recipient: new mongoose.Types.ObjectId().toString(),
        message: "a".repeat(501), // exceeds 500 character limit
        category: RecognitionCategory.EXCELLENCE,
      };

      await expect(
        recognitionRepository.createRecognition(mockData)
      ).rejects.toThrow("Message cannot exceed 500 characters");
    });
  });

  describe("findAll", () => {
    it("should return all recognitions", async () => {
      const mockData = [
        {
          _id: new mongoose.Types.ObjectId(),
          sender: new mongoose.Types.ObjectId(),
          recipient: new mongoose.Types.ObjectId(),
          message: "Great work!",
          category: RecognitionCategory.EXCELLENCE,
          points: 10
        }
      ];

      (Recognition.find as jest.Mock).mockResolvedValue(mockData);

      const recognitions = await recognitionRepository.findAll();
      expect(recognitions).toEqual(mockData);
    });
  });

  describe("getLeaderboard", () => {
    const orgId = new mongoose.Types.ObjectId().toString();

    it("should return recipients sorted by total points", async () => {
      const recipient1Id = new mongoose.Types.ObjectId();
      const recipient2Id = new mongoose.Types.ObjectId();
      
      const mockAggregateResult = [
        { _id: recipient1Id, totalPoints: 30 },
        { _id: recipient2Id, totalPoints: 20 }
      ];

      (Recognition.aggregate as jest.Mock).mockResolvedValue(mockAggregateResult);

      const leaderboard = await recognitionRepository.getLeaderboard(orgId);

      expect(Recognition.aggregate).toHaveBeenCalledWith([
        {
          $match: { organizationId: new mongoose.Types.ObjectId(orgId) }
        },
        {
          $group: {
            _id: "$recipient",
            totalPoints: { $sum: "$points" }
          }
        },
        {
          $sort: { totalPoints: -1 }
        },
        {
          $limit: 10
        }
      ]);

      expect(leaderboard).toEqual(mockAggregateResult);
    });

    it("should accept a custom limit", async () => {
      const limit = 5;
      await recognitionRepository.getLeaderboard(orgId, limit);

      expect(Recognition.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $limit: limit
          })
        ])
      );
    });
  });
});
