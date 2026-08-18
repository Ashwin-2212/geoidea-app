import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'geo_idea_app_super_secret_jwt_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'geo_idea_app_refresh_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Authorization token missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role?: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role?: string };
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token for optional auth endpoints
    }
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userRole = req.user.role || 'citizen';
    if (allowedRoles.includes(userRole) || userRole === 'admin') {
      return next();
    }
    return res.status(403).json({ error: `Access forbidden. Requires one of roles: ${allowedRoles.join(', ')}.` });
  };
}

export function generateToken(payload: { id: string; email: string; name: string; role?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function generateRefreshToken(payload: { id: string; email: string; name: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyRefreshToken(token: string): { id: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

