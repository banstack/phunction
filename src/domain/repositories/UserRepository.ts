import { User } from '../models/User';

export interface UserRepository {
  checkUsernameExists(username: string): Promise<boolean>;
  createUser(userId: string, user: Omit<User, "id">): Promise<User>;
  getUserData(userId: string): Promise<User>;
  updateUser(userId: string, userData: Partial<User>): Promise<void>;
} 