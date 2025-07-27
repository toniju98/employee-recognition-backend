import mongoose from "mongoose";
import Achievement, {
  AchievementType,
  IAchievement,
} from "../../models/achievementModel";

describe("Achievement Model", () => {
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/test"
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });


  it("should create an achievement successfully", async () => {
    const validAchievement = {
      name: "Team Player",
      description: "Receive 10 kudos",
      type: AchievementType.KUDOS_RECEIVED,
      icon: "kudos.png",
      criteria: {
        type: AchievementType.KUDOS_RECEIVED,
        threshold: 10,
      },
      points: 100,
    };

    const achievement = new Achievement(validAchievement);
    const savedAchievement = await achievement.save();

    expect(savedAchievement._id).toBeDefined();
    expect(savedAchievement.name).toBe(validAchievement.name);
    expect(savedAchievement.criteria.threshold).toBe(
      validAchievement.criteria.threshold
    );
  });

  it("should fail validation when required fields are missing", async () => {
    const invalidAchievement = {
      name: "Team Player",
    };

    const achievement = new Achievement(invalidAchievement);
    await expect(achievement.save()).rejects.toThrow("Achievement validation failed");
  });
});
