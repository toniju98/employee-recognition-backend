import { Request, Response } from 'express';
import { AnalyticsController } from '../../controllers/analyticsController';
import { AnalyticsService } from '../../services/analyticsService';
import { UserService } from '../../services/userService';
import mongoose from 'mongoose';

jest.mock('../../services/analyticsService');
jest.mock('../../services/userService');

describe('AnalyticsController', () => {
  let analyticsController: AnalyticsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnalyticsService = {
      getEngagementMetrics: jest.fn().mockResolvedValue({
        departmentEngagement: {},
        topPerformers: [],
        participationRate: 0.75
      }),
      getTrends: jest.fn()
    } as any;

    mockUserService = {
      getUserOrganization: jest.fn().mockResolvedValue('test-org-id')
    } as any;

    analyticsController = new AnalyticsController();
    // @ts-ignore
    analyticsController['analyticsService'] = mockAnalyticsService;
    analyticsController['userService'] = mockUserService;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getEngagementMetrics', () => {
    it('should return engagement metrics with default timeframe', async () => {
      mockRequest = {
        query: {},
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      await analyticsController.getEngagementMetrics(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserOrganization).toHaveBeenCalledWith('test-user-id');
      expect(mockAnalyticsService.getEngagementMetrics).toHaveBeenCalledWith('test-org-id', 'monthly');
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should use provided timeframe', async () => {
      mockRequest = {
        query: { timeframe: 'weekly' },
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      await analyticsController.getEngagementMetrics(mockRequest as Request, mockResponse as Response);

      expect(mockAnalyticsService.getEngagementMetrics).toHaveBeenCalledWith('test-org-id', 'weekly');
    });

    it('should handle errors appropriately', async () => {
      mockRequest = {
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: "test-user-id"
              }
            }
          }
        }
      } as any as Partial<Request>;

      mockAnalyticsService.getEngagementMetrics.mockRejectedValue(new Error('Service error'));

      await analyticsController.getEngagementMetrics(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to fetch engagement metrics'
      });
    });
  });
}); 