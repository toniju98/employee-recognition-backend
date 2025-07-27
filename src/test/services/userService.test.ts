import { UserService } from "../../services/userService";
import { UserRepository } from "../../repositories/userRepository";
import mongoose from "mongoose";
import { IUser } from "../../models/userModel";

jest.mock('../../repositories/userRepository');

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockKeycloakUser = {
    sub: "123",
    email: "test@example.com",
    given_name: "John",
    family_name: "Doe",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepository = {
      findByKeycloakId: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;

    userService = new UserService();
    // @ts-ignore
    userService['userRepository'] = mockUserRepository;
  });

  it("should create a new user when user does not exist", async () => {
    const expectedUser = {
      _id: new mongoose.Types.ObjectId(),
      keycloakId: mockKeycloakUser.sub,
      email: mockKeycloakUser.email,
      firstName: mockKeycloakUser.given_name,
      lastName: mockKeycloakUser.family_name,
      role: "user",
      availablePoints: {
        allocation: 0,
        personal: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as IUser;
    
    mockUserRepository.findOneAndUpdate.mockResolvedValue(expectedUser);
    const user = await userService.createOrUpdateUser(mockKeycloakUser);

    expect(user.availablePoints).toEqual({ allocation: 0, personal: 0 });
  }, 10000);

  it("should update existing user when user exists", async () => {
    const updatedUser = {
      keycloakId: mockKeycloakUser.sub,
      email: mockKeycloakUser.email,
      firstName: "Jane",
      lastName: "Smith",
      role: "user",
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as IUser;
    
    mockUserRepository.findOneAndUpdate.mockResolvedValue(updatedUser);
    const result = await userService.createOrUpdateUser({
      ...mockKeycloakUser,
      given_name: "Jane",
      family_name: "Smith",
    });

    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
  }, 10000);
});
