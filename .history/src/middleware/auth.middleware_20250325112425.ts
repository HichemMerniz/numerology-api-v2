import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/user-types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      details: 'Authentication token is required'
    });
    return;
  }

  try {
    const user = jwt.verify(token, "sdshjdhsjdhskjag#@#"!) as JWTPayload;
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      error: 'Forbidden',
      details: 'Invalid or expired token'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        details: 'Authentication is required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        details: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}; 