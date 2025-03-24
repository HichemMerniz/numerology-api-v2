import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import calculationRoutes from './controllers/calculation.controller';
import userRoutes from './controllers/user.controller';

// Load environment variables
dotenv.config();

// Validate required environment variables
// if (!process.env.JWT_SECRET) {
//   throw new Error('JWT_SECRET environment variable is required');
// }

// Create Express application
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Numerology API',
    version: '2.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        updatePassword: 'PUT /api/auth/password',
        users: 'GET /api/auth/users (Admin only)'
      },
      numerology: {
        calculate: 'POST /api/calculate',
        getResult: 'GET /api/result/:id'
      }
    }
  });
});

// API Routes
app.use('/api/auth', userRoutes);
app.use('/api', calculationRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    details: 'The requested resource was not found'
  });
});

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

export default app; 