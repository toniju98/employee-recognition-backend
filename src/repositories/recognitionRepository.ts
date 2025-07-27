import mongoose from 'mongoose';
import { FilterQuery, Types } from 'mongoose';
import Recognition, { IRecognition } from '../models/recognitionModel';

export class RecognitionRepository {
  async createRecognition(data: Partial<IRecognition>): Promise<IRecognition> {
    return await Recognition.create(data);
  }

  async findById(id: string): Promise<IRecognition | null> {
    try {
      return await Recognition.findById(id)
        .populate({
          path: 'sender',
          model: 'User',
          foreignField: 'keycloakId',
          localField: 'sender',
          select: 'firstName lastName profileImage -_id',
          transform: (doc) => ({
            name: `${doc.firstName} ${doc.lastName}`,
            profileImage: doc.profileImage
          })
        })
        .populate({
          path: 'recipient',
          model: 'User',
          foreignField: 'keycloakId',
          localField: 'recipient',
          select: 'firstName lastName -_id',
          transform: (doc) => ({
            name: `${doc.firstName} ${doc.lastName}`
          })
        })
        .populate({
          path: 'kudos',
          model: 'User',
          foreignField: 'keycloakId',
          localField: 'kudos',
          select: 'firstName lastName -_id',
          transform: (doc) => ({
            name: `${doc.firstName} ${doc.lastName}`
          })
        });
    } catch (error) {
      console.error("Error finding recognition by ID:", error);
      throw new Error("Failed to find recognition");
    }
  }

  async findAll(filters?: FilterQuery<IRecognition>) {
    return Recognition.find(filters || {});
  }

  async addKudos(
    recognitionId: string,
    userId: string
  ): Promise<IRecognition | null> {
    return await Recognition.findByIdAndUpdate(
      recognitionId,
      { $addToSet: { kudos: userId } },
      { new: true }
    ).populate("kudos", "firstName lastName");
  }

  async removeKudos(
    recognitionId: string,
    userId: string
  ): Promise<IRecognition | null> {
    return await Recognition.findByIdAndUpdate(
      recognitionId,
      { $pull: { kudos: userId } },
      { new: true }
    ).populate("kudos", "firstName lastName");
  }

  async countByUserAndTimeframe(
    userId: string,
    timeframeDate: Date
  ): Promise<number> {
    return await Recognition.countDocuments({
      userId: userId,
      createdAt: { $gte: timeframeDate },
    });
  }

  async update(
    id: string,
    updateData: Partial<IRecognition>
  ): Promise<IRecognition | null> {
    return await Recognition.findByIdAndUpdate(id, updateData, { new: true });
  }

  async getLeaderboard(organizationId: string, limit: number = 10) {
    return Recognition.aggregate([
      { $match: { organizationId: new Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: "$recipient",
          totalPoints: { $sum: "$points" },
        },
      },
      {
        $sort: { totalPoints: -1 },
      },
      {
        $limit: limit,
      },
    ]);
  }

  async countByRecipient(keycloakId: string): Promise<number> {
    return await Recognition.countDocuments({ recipient: keycloakId });
  }

  async countBySender(keycloakId: string): Promise<number> {
    return await Recognition.countDocuments({ sender: keycloakId });
  }

  async find(filters: {
    organizationId: string;
    sender?: string;
    recipient?: string;
  }): Promise<IRecognition[]> {
    return await Recognition.find(filters)
      .populate({
        path: 'sender',
        model: 'User',
        foreignField: 'keycloakId',
        localField: 'sender',
        select: 'firstName lastName profileImage -_id',
        transform: (doc) => ({
          name: `${doc.firstName} ${doc.lastName}`,
          profileImage: doc.profileImage
        })
      })
      .populate({
        path: 'recipient',
        model: 'User',
        foreignField: 'keycloakId',
        localField: 'recipient',
        select: 'firstName lastName -_id',
        transform: (doc) => ({
          name: `${doc.firstName} ${doc.lastName}`
        })
      })
      .populate({
        path: 'kudos',
        model: 'User',
        foreignField: 'keycloakId',
        localField: 'kudos',
        select: 'firstName lastName -_id',
        transform: (doc) => ({
          name: `${doc.firstName} ${doc.lastName}`
        })
      });
  }

  async findAllWithPopulate(filters?: FilterQuery<IRecognition>) {
    return Recognition.find(filters || {})
      .populate("sender", "firstName lastName profileImage")
      .populate("kudos", "firstName lastName");
  }
}