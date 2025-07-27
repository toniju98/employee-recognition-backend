import { RoleController } from '../../controllers/roleController';
import { Request, Response } from 'express';
import { UserRole } from '../../models/userModel';
import { RoleService } from '../../services/roleService';

jest.mock('../../services/roleService');

describe('RoleController', () => {
  let roleController: RoleController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    roleController = new RoleController();
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      mockRequest = {
        body: {
          userId: '123',
          role: UserRole.MANAGER
        },
        headers: {
          'user-id': 'admin-id'
        }
      };

      await roleController.assignRole(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Role assigned successfully'
      });
    });

    it('should handle unauthorized role assignment', async () => {
      mockRequest = {
        body: {
          userId: '123',
          role: UserRole.ADMIN
        },
        headers: {
          'user-id': 'non-admin-id'
        }
      };

      jest.spyOn(RoleService.prototype, 'assignRole')
        .mockRejectedValueOnce(new Error('Unauthorized'));

      await roleController.assignRole(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized to assign roles'
      });
    });
  });
});
