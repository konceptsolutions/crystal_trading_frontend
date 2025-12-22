import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { appendFileSync } from 'fs';
import { join } from 'path';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface JwtPayload {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

function logDebug(data: any) {
  try {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    appendFileSync(logPath, JSON.stringify(data) + '\n', 'utf8');
  } catch (e) {
    // Ignore logging errors
  }
}

export function verifyToken(request: NextRequest): AuthUser | null {
  // #region agent log
  logDebug({ location: 'auth.ts:30', message: 'verifyToken entry', data: { hasAuthHeader: !!request.headers.get('authorization'), method: request.method, url: request.url }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
  // #endregion
  try {
    // Try both lowercase and capitalized header names (HTTP headers are case-insensitive, but Next.js might be strict)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    // #region agent log
    logDebug({ location: 'auth.ts:35', message: 'auth header check', data: { hasAuthHeader: !!authHeader, authHeaderPrefix: authHeader?.substring(0, 10) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' });
    // #endregion

    if (!authHeader) {
      // #region agent log
      logDebug({ location: 'auth.ts:40', message: 'no auth header', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' });
      // #endregion
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] No authorization header found');
      }
      return null;
    }

    const parts = authHeader.split(' ');
    // #region agent log
    logDebug({ location: 'auth.ts:46', message: 'token extraction', data: { partsLength: parts.length, hasBearer: parts[0] === 'Bearer' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // #region agent log
      logDebug({ location: 'auth.ts:50', message: 'malformed auth header', data: { partsLength: parts.length, firstPart: parts[0] }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
      // #endregion
      return null;
    }

    const token = parts[1];
    // #region agent log
    logDebug({ location: 'auth.ts:56', message: 'before jwt verify', data: { tokenLength: token.length, hasJwtSecret: !!process.env.JWT_SECRET }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
    // #endregion

    if (!token) {
      // #region agent log
      logDebug({ location: 'auth.ts:60', message: 'empty token', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' });
      // #endregion
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.warn('WARNING: Using fallback JWT_SECRET in production. This is insecure!');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    // #region agent log
    logDebug({ location: 'auth.ts:70', message: 'jwt verify success', data: { hasUserId: !!decoded.userId, hasEmail: !!decoded.email, hasName: !!decoded.name, hasRole: !!decoded.role }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
    // #endregion

    // Validate required fields
    if (!decoded.userId || !decoded.email || !decoded.name || !decoded.role) {
      // #region agent log
      logDebug({ location: 'auth.ts:75', message: 'missing required fields', data: { hasUserId: !!decoded.userId, hasEmail: !!decoded.email, hasName: !!decoded.name, hasRole: !!decoded.role, decodedKeys: Object.keys(decoded) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' });
      // #endregion
      return null;
    }

    const user: AuthUser = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    // #region agent log
    logDebug({ location: 'auth.ts:85', message: 'token verified successfully', data: { userId: user.userId, userEmail: user.email }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
    // #endregion

    return user;
  } catch (error: any) {
    // #region agent log
    logDebug({ location: 'auth.ts:90', message: 'jwt verify error', data: { errorName: error?.name, errorMessage: error?.message, errorStack: error?.stack?.substring(0, 200) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
    // #endregion
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
