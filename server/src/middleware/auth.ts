import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getOne } from '../repositories/db';

export interface UserPayload {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication credentials required',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string; email: string };
    
    // Verify user exists and is active in database
    const user = await getOne<UserPayload & { status: string }>(
      'SELECT id, email, role, full_name, status FROM profiles WHERE id = ?',
      [decoded.id]
    );

    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Account is invalid or inactive',
        code: 'ACCOUNT_INACTIVE',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      code: 'INVALID_TOKEN',
    });
  }
}

export function requireRole(allowedRoles: Array<'student' | 'teacher' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
