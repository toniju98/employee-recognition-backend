import mongoose from "mongoose";
import UserAchievement, {
  IUserAchievement,
} from "../../models/userAchievementModel";
import Achievement, { AchievementType } from "../../models/achievementModel";

describe("UserAchievement Model", () => {
  let achievementId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/test"
    );

    const achievement = await Achievement.create({
      name: "Test Achievement",
      description: "Test Description",
      type: AchievementType.KUDOS_RECEIVED,
      icon: "test.png",
      criteria: {
        type: AchievementType.KUDOS_RECEIVED,
        threshold: 5,
      },
      points: 10,
    });
    achievementId = achievement._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await UserAchievement.deleteMany({});
  });

  it("should create a user achievement successfully", async () => {
    const userId = new mongoose.Types.ObjectId();

    const userAchievement = new UserAchievement({
      user: userId,
      achievement: achievementId,
      progress: 50,
    });

    const savedUserAchievement = await userAchievement.save();

    expect(savedUserAchievement._id).toBeDefined();
    expect(savedUserAchievement.user.toString()).toBe(userId.toString());
    expect(savedUserAchievement.achievement.toString()).toBe(
      achievementId.toString()
    );
    expect(savedUserAchievement.progress).toBe(50);
  });

  it("should fail validation when required fields are missing", async () => {
    const invalidUserAchievement = {
      progress: 50,
    };

    try {
      const userAchievement = new UserAchievement(invalidUserAchievement);
      await userAchievement.save();
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
      expect(error.errors.achievement).toBeDefined();
    }
  });

  it("should populate achievement reference", async () => {
    const userId = new mongoose.Types.ObjectId();

    const userAchievement = await UserAchievement.create({
      user: userId,
      achievement: achievementId,
      progress: 75,
    });

    const populatedUserAchievement = await UserAchievement.findById(
      userAchievement._id
    ).populate("achievement");

    expect(populatedUserAchievement?.achievement).toBeDefined();
    expect((populatedUserAchievement?.achievement as any).name).toBe(
      "Test Achievement"
    );
  });
});
