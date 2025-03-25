import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

class UserDAO {
  private filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, '../models/users.json');
  }

  private async readUsers(): Promise<{ users: User[] }> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return empty users array
      return { users: [] };
    }
  }

  private async writeUsers(data: { users: User[] }): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async findByEmail(email: string): Promise<User | null> {
    const { users } = await this.readUsers();
    return users.find(user => user.email === email) || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { users } = await this.readUsers();
    
    const newUser: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.writeUsers({ users });
    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    const { users } = await this.readUsers();
    return users.find(user => user.id === id) || null;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const { users } = await this.readUsers();
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };

    await this.writeUsers({ users });
    return users[index];
  }

  async getAllUsers(): Promise<User[]> {
    const { users } = await this.readUsers();
    return users;
  }
}

export default new UserDAO(); 