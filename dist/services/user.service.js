"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userDAO_1 = __importDefault(require("../data-access/userDAO"));
class UserService {
    async register(input) {
        // Check if email already exists
        const existingUser = await userDAO_1.default.findByEmail(input.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(input.password, salt);
        // Create new user
        const user = await userDAO_1.default.create({
            email: input.email,
            password: hashedPassword,
            firstName: input.firstName,
            lastName: input.lastName,
            role: 'user' // Default role
        });
        // Generate JWT token
        const token = this.generateToken(user);
        // Return user without password and token
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async login(input) {
        // Find user by email
        const user = await userDAO_1.default.findByEmail(input.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(input.password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        // Generate JWT token
        const token = this.generateToken(user);
        // Return user without password and token
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async updateUser(userId, input) {
        // Find and update user
        const updatedUser = await userDAO_1.default.update(userId, input);
        if (!updatedUser) {
            throw new Error('User not found');
        }
        // Return user without password
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async updatePassword(userId, input) {
        // Find user
        const user = await userDAO_1.default.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Verify current password
        const isValidPassword = await bcryptjs_1.default.compare(input.currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(input.newPassword, salt);
        // Update password
        await userDAO_1.default.update(userId, {
            password: hashedPassword
        });
    }
    async getUser(userId) {
        const user = await userDAO_1.default.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async getAllUsers() {
        const users = await userDAO_1.default.getAllUsers();
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        return jsonwebtoken_1.default.sign(payload, "sdshjdhsjdhskjag#@#", {
            expiresIn: '24h' // Token expires in 24 hours
        });
    }
}
exports.UserService = UserService;
