import { UserService } from '../../services/userService';
import { UserWalletService } from '../../services/userWalletService';
import { UserRepository } from '../../repositories/userRepository';
import { NotificationService } from '../../services/notificationService';
import mongoose from 'mongoose';
import { IUser } from '../../models/userModel';

jest.mock('../../services/userService');
jest.mock('../../services/notificationService');

describe('UserWalletService', () => {
  let userWalletService: UserWalletService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepository = {
      findByKeycloakId: jest.fn(),
      updateAllocationPoints: jest.fn(),
      updatePersonalPoints: jest.fn(),
      addPersonalPoints: jest.fn(),
      deductAllocationPoints: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;

    userWalletService = new UserWalletService();
  });

  describe('awardPoints', () => {
    const mockUser = {
      _id: 'userId',
      keycloakId: 'userId',
      availablePoints: {
        allocation: 100,
        personal: 50
      }
    } as IUser;

    it('should award monthly allocation points', async () => {
      const points = 50;
      jest.spyOn(UserService.prototype, 'getUserByKeycloakId').mockResolvedValue(mockUser);
      jest.spyOn(UserService.prototype, 'updateAllocationPoints').mockResolvedValue();

      await userWalletService.awardPoints('userId', points, 'MONTHLY_ALLOCATION');

      expect(UserService.prototype.updateAllocationPoints).toHaveBeenCalledWith('userId', points);
    });

    it('should award personal points for recognition', async () => {
      const points = 30;
      jest.spyOn(UserService.prototype, 'getUserByKeycloakId').mockResolvedValue(mockUser);
      jest.spyOn(UserService.prototype, 'addPersonalPoints').mockResolvedValue();

      await userWalletService.awardPoints('userId', points, 'RECOGNITION');

      expect(UserService.prototype.addPersonalPoints).toHaveBeenCalledWith('userId', points);
    });
  });

  describe('getBalance', () => {
    it('should return both allocation and personal points', async () => {
      const mockUser = {
        availablePoints: {
          allocation: 100,
          personal: 50
        }
      } as IUser;

      jest.spyOn(UserService.prototype, 'getUserByKeycloakId').mockResolvedValue(mockUser);

      const balance = await userWalletService.getBalance('userId');

      expect(balance).toEqual({
        allocation: 100,
        personal: 50
      });
    });
  });

  describe('deductPoints', () => {
    const mockUser = {
      availablePoints: {
        allocation: 100,
        personal: 150
      }
    } as IUser;

    it('should deduct allocation points', async () => {
      jest.spyOn(UserService.prototype, 'getUserByKeycloakId').mockResolvedValue(mockUser);
      jest.spyOn(UserService.prototype, 'deductAllocationPoints').mockResolvedValue();

      await userWalletService.deductPoints('userId', 50, 'ALLOCATION');

      expect(UserService.prototype.deductAllocationPoints).toHaveBeenCalledWith('userId', 50);
    });

    it('should throw error on insufficient points', async () => {
      jest.spyOn(UserService.prototype, 'getUserByKeycloakId').mockResolvedValue(mockUser);

      await expect(userWalletService.deductPoints('userId', 200, 'ALLOCATION'))
        .rejects.toThrow('Insufficient points');
    });
  });
});
