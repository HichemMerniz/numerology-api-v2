import { Router, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { UserRegistrationInput, UserLoginInput, UserUpdateInput, PasswordUpdateInput } from '../types/user-types';

const router = Router();
const userService = new UserService();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const input: UserRegistrationInput = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    };

    const result = await userService.register(input);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already registered') {
      res.status(400).json({
        error: 'Registration failed',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Registration failed',
        details: 'An unexpected error occurred'
      });
    }
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const input: UserLoginInput = {
      email: req.body.email,
      password: req.body.password
    };

    const result = await userService.login(input);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      details: 'Invalid email or password'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUser(req.user!.userId);
    res.json(user);
  } catch (error) {
    res.status(404).json({
      error: 'User not found',
      details: 'User profile could not be retrieved'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const input: UserUpdateInput = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    };

    const updatedUser = await userService.updateUser(req.user!.userId, input);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({
      error: 'Update failed',
      details: error instanceof Error ? error.message : 'Failed to update profile'
    });
  }
});

// Update password
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const input: PasswordUpdateInput = {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    };

    await userService.updatePassword(req.user!.userId, input);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({
      error: 'Password update failed',
      details: error instanceof Error ? error.message : 'Failed to update password'
    });
  }
});

// Admin only: Get all users
router.get('/users', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    // This would typically be a database query
    res.json({ message: 'Admin access granted - User list functionality to be implemented' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve users',
      details: 'An unexpected error occurred'
    });
  }
});

export default router; 