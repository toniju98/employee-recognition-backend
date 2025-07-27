import mongoose from "mongoose";
import Notification, { NotificationType } from "../../models/notificationModel";

describe("Notification Model", () => {
  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/test"
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });


  it("should create an achievement notification successfully", async () => {
    const userId = new mongoose.Types.ObjectId();
    const achievementId = new mongoose.Types.ObjectId();

    const validNotification = {
      user: userId,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: "Achievement Unlocked!",
      message: "You earned a new achievement",
      data: {
        achievementId: achievementId.toString(),
      },
    };

    const notification = new Notification(validNotification);
    const savedNotification = await notification.save();

    expect(savedNotification._id).toBeDefined();
    expect(savedNotification.user.toString()).toBe(userId.toString());
    expect(savedNotification.type).toBe(NotificationType.ACHIEVEMENT_UNLOCKED);
    expect(savedNotification.read).toBe(false);
  });

  it("should fail validation when required fields are missing", async () => {
    const invalidNotification = {
      title: "Test",
    };

    try {
      const notification = new Notification(invalidNotification);
      await notification.save();
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
      expect(error.errors.type).toBeDefined();
      expect(error.errors.message).toBeDefined();
    }
  });
});
