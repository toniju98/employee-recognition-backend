import mongoose from 'mongoose';
import { RewardService } from '../../services/rewardService';
import { UserWalletService } from '../../services/userWalletService';
import { NotificationService } from '../../services/notificationService';
import { AchievementService } from '../../services/achievementService';
import { AnalyticsService } from '../../services/analyticsService';
import { RewardCategory } from '../../models/rewardModel';
import Notification from '../../models/notificationModel';
import { UserService } from '../../services/userService';
import { NotificationType } from '../../models/notificationModel';
import  User, { UserRole } from '../../models/userModel';
import  Reward from '../../models/rewardModel';
import  Organization  from '../../models/organizationModel';

describe('Integration Tests', () => {
  let rewardService: RewardService;
  let userWalletService: UserWalletService;
  let notificationService: NotificationService;
  let achievementService: AchievementService;
  let analyticsService: AnalyticsService;

  // Test data holders
  let testOrg: any;
  let testUser: any;
  let testReward: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');

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
        personal: 200 // Match the expected initial balance in test
      }
    });

    // Create test reward
    testReward = await Reward.create({
      name: 'Test Reward',
      description: 'Test Description',
      pointsCost: 100,
      category: RewardCategory.GIFT_CARD,
      quantity: 5,
      isActive: true,
      organizationId: testOrg._id
    });
  });

  afterAll(async () => {
    // Clean up only test data created for this test suite
    await User.deleteOne({ _id: testUser._id });
    await Organization.deleteOne({ _id: testOrg._id });
    await Reward.deleteOne({ _id: testReward._id });
    await Notification.deleteMany({ user: testUser._id }); // Clean up any notifications created for test user
    await mongoose.connection.close();
  });

  beforeEach(() => {
    // Initialize services before each test
    rewardService = new RewardService();
    userWalletService = new UserWalletService();
    notificationService = new NotificationService();
    achievementService = new AchievementService();
    analyticsService = new AnalyticsService();
  });

  describe('Reward Redemption', () => {
    it('should process complete reward redemption flow', async () => {
      // 1. Initial state checks
      const initialBalance = await userWalletService.getBalance(testUser.keycloakId);
      expect(initialBalance.personal).toBe(200);

      // 2. Redeem reward
      await rewardService.redeemReward(testUser.keycloakId, testReward._id.toString());

      // 3. Verify points deduction
      const newBalance = await userWalletService.getBalance(testUser.keycloakId);
      expect(newBalance.personal).toBe(initialBalance.personal - testReward.pointsCost);
      expect(newBalance.allocation).toBe(initialBalance.allocation);

      // 4. Verify notification was sent
      const notifications = await notificationService.getUserNotifications(testUser.keycloakId);
      expect(notifications).toContainEqual(
        expect.objectContaining({
          type: 'REWARD_REDEMPTION',
          user: testUser._id,
          data: expect.objectContaining({
            rewardName: testReward.name
          })
        })
      );

      // 5. Check if redemption achievement was triggered
      const achievements = await achievementService.getAchievements(testUser.keycloakId);
      expect(achievements).toContainEqual(
        expect.objectContaining({
          type: 'FIRST_REWARD_REDEMPTION',
          progress: 100,
          completed: true
        })
      );

      // 6. Verify analytics data
      const analytics = await analyticsService.getEngagementMetrics(testOrg._id.toString(), 'monthly');
      expect(analytics.rewardStats).toEqual(
        expect.objectContaining({
          totalRedemptions: expect.any(Number),
          popularRewards: expect.arrayContaining([
            expect.objectContaining({
              reward: expect.objectContaining({
                _id: testReward._id
              }),
              redemptionCount: expect.any(Number)
            })
          ])
        })
      );

      // 7. Verify reward quantity decreased
      const updatedReward = await rewardService.getRewardById(testReward._id.toString());
      expect(updatedReward.quantity).toBe(testReward.quantity - 1);
    });
  });

  describe('Notification Integration', () => {
    let notificationService: NotificationService;
    let userService: UserService;

    beforeEach(async () => {
      notificationService = new NotificationService();
      userService = new UserService();
      // Clear only notifications for our test user before each test
      await Notification.deleteMany({ user: testUser._id });
    });

    it('should handle complete notification lifecycle', async () => {
      // 1. Create multiple notifications
      await notificationService.create({
        user: testUser._id,
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: 'Test Achievement',
        message: 'You earned a test achievement!'
      });

      await notificationService.create({
        user: testUser._id,
        type: NotificationType.RECOGNITION_RECEIVED,
        title: 'New Recognition',
        message: 'You received recognition!'
      });

      // 2. Verify notifications were created
      let notifications = await notificationService.getUserNotifications(testUser.keycloakId);
      expect(notifications).toHaveLength(2);
      expect(notifications[0].read).toBe(false);
      expect(notifications[1].read).toBe(false);

      // 3. Mark one notification as read
      const firstNotification = notifications[0] as any;  // Type assertion for test
      await notificationService.markAsRead(testUser.keycloakId, firstNotification._id.toString());
      
      // 4. Verify read status
      notifications = await notificationService.getUserNotifications(testUser.keycloakId);
      expect(notifications[0].read).toBe(true);
      expect(notifications[1].read).toBe(false);

      // 5. Check unread count
      const unreadCount = await notificationService.getUnreadCount(testUser.keycloakId);
      expect(unreadCount).toBe(1);

      // 6. Delete notifications
      await notificationService.deleteNotifications(
        testUser.keycloakId, 
        notifications.map(n => (n as any)._id.toString())
      );

      // 7. Verify notifications were deleted
      notifications = await notificationService.getUserNotifications(testUser.keycloakId);
      expect(notifications).toHaveLength(0);
    });

    it('should handle unauthorized deletion attempts', async () => {
      // Create notification for test user
      const notification = await Notification.create({
        user: testUser._id,
        type: NotificationType.ACHIEVEMENT_UNLOCKED,
        title: 'Test Achievement',
        message: 'You earned a test achievement!'
      });

      // Try to delete with different user ID
      const differentUserId = new mongoose.Types.ObjectId().toString();
      await expect(
        notificationService.deleteNotifications(differentUserId, [notification._id.toString()])
      ).rejects.toThrow('Unauthorized to delete one or more notifications');
    });
  });
});