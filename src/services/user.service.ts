import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRegistrationInput, UserLoginInput, UserUpdateInput, PasswordUpdateInput, JWTPayload } from '../types/user-types';

// In-memory user storage (replace with database in production)
const users = new Map<string, User>();

export class UserService {
  async register(input: UserRegistrationInput): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Check if email already exists
    const existingUser = Array.from(users.values()).find(u => u.email === input.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    // Create new user
    const user: User = {
      id: uuidv4(),
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'user', // Default role
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save user
    users.set(user.id, user);

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password and token
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(input: UserLoginInput): Promise<{ user: Omit<User, 'password'>, token: string }> {
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password and token
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async updateUser(userId: string, input: UserUpdateInput): Promise<Omit<User, 'password'>> {
    // Find user
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user
    const updatedUser: User = {
      ...user,
      ...input,
      updatedAt: new Date()
    };

    // Save updated user
    users.set(userId, updatedUser);

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updatePassword(userId: string, input: PasswordUpdateInput): Promise<void> {
    // Find user
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.newPassword, salt);

    // Update password
    user.password = hashedPassword;
    user.updatedAt = new Date();
    users.set(userId, user);
  }

  async getUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h' // Token expires in 24 hours
    });
  }
} 