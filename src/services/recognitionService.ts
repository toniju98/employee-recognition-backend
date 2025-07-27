import { RecognitionRepository } from '../repositories/recognitionRepository';
import { IRecognition, RecognitionCategory } from '../models/recognitionModel';
import { UserService } from './userService';
import { Types } from 'mongoose';
import { FilterQuery } from 'mongoose';
import { AchievementService } from './achievementService';
import { AchievementType } from '../models/achievementModel';
import { IUser } from '../models/userModel';
import { UserWalletService } from './userWalletService';
import { ConfigurationService } from './configurationService';


export class RecognitionService {
  private recognitionRepository: RecognitionRepository;
  private userService: UserService;
  private achievementService: AchievementService;
  private userWalletService: UserWalletService;
  private configurationService: ConfigurationService;

  constructor() {
    this.recognitionRepository = new RecognitionRepository();
    this.userService = new UserService();
    this.achievementService = new AchievementService();
    this.userWalletService = new UserWalletService();
    this.configurationService = new ConfigurationService();
  }


  async createRecognition(data: {
    sender: string;
    recipient: string;
    message: string;
    category: RecognitionCategory;
    points?: number;
    organizationId: string;
  }): Promise<IRecognition> {
    // Check if users exist
    const sender = await this.userService.getUserByKeycloakId(data.sender);
    if (!sender) {
      throw new Error("Sender not found");
    }

    const recipient = await this.userService.getUserByKeycloakId(data.recipient);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    if (data.sender === data.recipient) {
      throw new Error("Cannot send recognition to yourself");
    }

    // Validate category is active
    const activeCategories = await this.configurationService.getActiveCategories(data.organizationId);
    if (!activeCategories.includes(data.category)) {
      throw new Error("Recognition category is not active");
    }

    // Get category settings
    const categorySettings = await this.configurationService.getCategorySettings(data.organizationId,data.category);
    
    // Use default points if none provided
    const points = data.points || categorySettings.defaultPoints;

    // Validate points against sender's allocation
    const isValidPoints = await this.configurationService.validateRecognitionPoints(
      data.organizationId,
      data.sender,
      points
    );

    if (!isValidPoints) {
      throw new Error("Points exceed maximum allowed or insufficient allocation points");
    }

    const recognition = await this.recognitionRepository.createRecognition({
      sender: data.sender,
      recipient: data.recipient,
      message: data.message,
      category: data.category,
      points,
      kudos: [],
      organizationId: data.organizationId
    });

    if (points > 0) {
      await this.userWalletService.deductPoints(data.sender, points, 'ALLOCATION');
      await this.userWalletService.awardPoints(data.recipient, points, 'RECOGNITION');
    }

    return recognition;
  }

  async getRecognition(id: string): Promise<IRecognition | null> {
    return await this.recognitionRepository.findById(id);
  }

  async getAllRecognitions(filters?: FilterQuery<IRecognition>): Promise<IRecognition[]> {
    return await this.recognitionRepository.findAll(filters);
  }

  async toggleKudos(recognitionId: string, userId: string, organization_id:string): Promise<IRecognition | null> {
    const recognition = await this.recognitionRepository.findById(recognitionId);
    if (!recognition) return null;

    const hasKudos = recognition.kudos.some(id => id.toString() === userId);
    
    if (hasKudos) {
      return await this.recognitionRepository.removeKudos(recognitionId, userId);
    } else {
      return await this.recognitionRepository.addKudos(recognitionId, userId);
    }
  }

  /*async getFeed(page: number = 1, limit: number = 20): Promise<IRecognition[]> {
    const skip = (page - 1) * limit;
    
    return (await this.recognitionRepository.findAll({
      isPublic: true,
      $or: [
        { pinnedUntil: { $gt: new Date() } },
        { pinnedUntil: null }
      ]
    })
    .sort({ pinnedUntil: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender recipient kudos')) as IRecognition[];
  }*/

  async pinRecognition(recognitionId: string, duration: number): Promise<IRecognition | null> {
    const pinnedUntil = new Date();
    pinnedUntil.setDate(pinnedUntil.getDate() + duration);
    
    const recognition = await this.recognitionRepository.update(recognitionId, { pinnedUntil });
    return recognition;
  }

  async getLeaderboard(organizationId: string, limit?: number): Promise<Array<{ user: IUser, totalPoints: number }>> {
    const leaderboardData = await this.recognitionRepository.getLeaderboard(organizationId, limit);
    
    // Fetch user details for each leaderboard entry
    const leaderboardWithUsers = await Promise.all(
      leaderboardData.map(async (entry) => {
        const user = await this.userService?.getUserByKeycloakId(entry._id.toString());
        return {
          user: user!,
          totalPoints: entry.totalPoints
        };
      })
    );

    return leaderboardWithUsers;
  }

  async getRecognitionsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return this.recognitionRepository.findAll({
      organizationId,
      createdAt: { $gte: startDate, $lt: endDate }
    });
  }

  async getRecognitionsByUsers(userIds: string[]) {
    // Fetch recognitions where users are either givers or receivers
    return this.recognitionRepository.findAll({
      $or: [
        { giverId: { $in: userIds } },
        { receiverId: { $in: userIds } }
      ]
    });
  }

  async getOrganizationRecognitions(filters: {
    organizationId: string;
    sender?: string;
    recipient?: string;
  }): Promise<IRecognition[]> {
    return await this.recognitionRepository.find(filters);
  }

  async getReceivedRecognitions(userId: string): Promise<IRecognition[]> {
    return await this.recognitionRepository.findAllWithPopulate({
      recipient: userId,
    });
  }

  async getUserRecognitionStats(userId: string) {
    const [received, given] = await Promise.all([
      this.recognitionRepository.countByRecipient(userId),
      this.recognitionRepository.countBySender(userId)
    ]);
    
    return {
      received,
      given
    };
  }
} 