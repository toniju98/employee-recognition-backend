import mongoose from 'mongoose';
import { AchievementService } from '../../services/achievementService';
import { NotificationService } from '../../services/notificationService';
import { UserService } from '../../services/userService';
import { AchievementType } from '../../models/achievementModel';
import Achievement from '../../models/achievementModel';
import User, { UserRole } from '../../models/userModel';
import Organization from '../../models/organizationModel';
import Notification from '../../models/notificationModel';
import { UserWalletService } from '../../services/userWalletService';

describe('Achievement Creation Integration Tests', () => {
  let achievementService: AchievementService;
  let notificationService: NotificationService;
  let userService: UserService;
  let userWalletService: UserWalletService;

  // Test data holders
  let testOrg: any;
  let testUser: any;
  let testAchievement: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');

    // Clean up any existing test data
    await User.deleteMany({ keycloakId: 'test-keycloak-id' });
    await Organization.deleteMany({ domain: 'test.com' });

    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Organization',
      domain: 'test.com'
    });

    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      keycloakId: 'test-keycloak-id',
      role: UserRole.EMPLOYEE,
      organizationId: testOrg._id,
      availablePoints: {
        allocation: 100,
        personal: 50
      }
    });

    // Verify user creation
    const verifyUser = await User.findOne({ keycloakId: 'test-keycloak-id' });
    console.log('Created test user:', verifyUser);

    // Initialize services with proper repositories
    userService = new UserService();
    userWalletService = new UserWalletService();
    notificationService = new NotificationService();
    achievementService = new AchievementService();

    // Inject the initialized userService into other services that depend on it
    (userWalletService as any).userService = userService;
    (notificationService as any).userService = userService;
    (achievementService as any).userService = userService;
    (achievementService as any).userWalletService = userWalletService;
    (achievementService as any).notificationService = notificationService;
  }, 10000);

  afterAll(async () => {
    await User.deleteOne({ _id: testUser._id });
    await Organization.deleteOne({ _id: testOrg._id });
    await Achievement.deleteMany({ organizationId: testOrg._id });
    await Notification.deleteMany({ user: testUser._id });
    await mongoose.connection.close();
  });


  describe('Achievement Creation and Progress', () => {
    it('should create and track achievement progress', async () => {
      // 1. Create achievement definition
      const achievementDefinition = await Achievement.create({
        name: 'Recognition Champion',
        description: 'Give 3 recognitions',
        type: AchievementType.RECOGNITION_COUNT,
        icon: 'trophy.png',
        criteria: {
          type: AchievementType.RECOGNITION_COUNT,
          threshold: 3
        },
        points: 50,
        organizationId: testOrg._id,
        isGlobal: true
      });

      // 2. Simulate partial progress (1/3)
      await achievementService.checkAndAwardAchievements(
        testUser.keycloakId,
        AchievementType.RECOGNITION_COUNT,
        3,
        testOrg._id.toString()
      );

      // 3. Verify progress notification
      let notifications = await notificationService.getUserNotifications(testUser.keycloakId);
      expect(notifications).toContainEqual(
        expect.objectContaining({
          type: 'ACHIEVEMENT_PROGRESS',
          user: testUser._id,
          data: expect.objectContaining({
            progress: 33 // 1/3 * 100
          })
        })
      );

      // 4. Complete the achievement (3/3)
      await achievementService.checkAndAwardAchievements(
        testUser.keycloakId,
        AchievementType.RECOGNITION_COUNT,
        3,
        testOrg._id.toString()
      );

      // 5. Verify achievement completion
      const achievements = await achievementService.getAchievements(testUser.keycloakId);
      expect(achievements).toContainEqual(
        expect.objectContaining({
          type: AchievementType.RECOGNITION_COUNT,
          progress: 100,
          completed: true
        })
      );

      // 6. Verify completion notification
      notifications = await notificationService.getUserNotifications(testUser.keycloakId);
      expect(notifications).toContainEqual(
        expect.objectContaining({
          type: 'ACHIEVEMENT_UNLOCKED',
          user: testUser._id,
          data: expect.objectContaining({
            achievementName: achievementDefinition.name
          })
        })
      );
    }, 30000);
  });
}); 