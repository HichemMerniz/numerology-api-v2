"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class UserDAO {
    constructor() {
        this.filePath = path_1.default.join(__dirname, '../models/users.json');
    }
    async readUsers() {
        try {
            const data = await promises_1.default.readFile(this.filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            // If file doesn't exist, return empty users array
            return { users: [] };
        }
    }
    async writeUsers(data) {
        await promises_1.default.writeFile(this.filePath, JSON.stringify(data, null, 2));
    }
    async findByEmail(email) {
        const { users } = await this.readUsers();
        return users.find(user => user.email === email) || null;
    }
    async create(userData) {
        const { users } = await this.readUsers();
        const newUser = {
            ...userData,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        await this.writeUsers({ users });
        return newUser;
    }
    async findById(id) {
        const { users } = await this.readUsers();
        return users.find(user => user.id === id) || null;
    }
    async getAllUsers() {
        const { users } = await this.readUsers();
        return users;
    }
    async update(id, userData) {
        const { users } = await this.readUsers();
        const index = users.findIndex(user => user.id === id);
        if (index === -1)
            return null;
        users[index] = {
            ...users[index],
            ...userData,
            updatedAt: new Date().toISOString()
        };
        await this.writeUsers({ users });
        return users[index];
    }
}
exports.default = new UserDAO();
