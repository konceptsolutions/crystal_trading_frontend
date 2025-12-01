import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as AuthUser;

    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = verifyToken(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

