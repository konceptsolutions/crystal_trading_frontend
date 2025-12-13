import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface JwtPayload {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:19',message:'verifyToken entry',data:{hasAuthHeader:!!req.headers.authorization,method:req.method,path:req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const authHeader = req.headers.authorization;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:25',message:'auth header check',data:{hasAuthHeader:!!authHeader,authHeaderPrefix:authHeader?.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!authHeader) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:29',message:'no auth header',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return res.status(401).json({ error: 'No token provided' });
    }

    const parts = authHeader.split(' ');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:35',message:'token extraction',data:{partsLength:parts.length,hasBearer:parts[0]==='Bearer'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:39',message:'malformed auth header',data:{partsLength:parts.length,firstPart:parts[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    const token = parts[1];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:45',message:'before jwt verify',data:{tokenLength:token.length,hasJwtSecret:!!process.env.JWT_SECRET},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!token) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:49',message:'empty token',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.warn('WARNING: Using fallback JWT_SECRET in production. This is insecure!');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:58',message:'jwt verify success',data:{hasUserId:!!decoded.userId,hasEmail:!!decoded.email,hasName:!!decoded.name,hasRole:!!decoded.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Validate required fields
    if (!decoded.userId || !decoded.email || !decoded.name || !decoded.role) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:63',message:'missing required fields',data:{hasUserId:!!decoded.userId,hasEmail:!!decoded.email,hasName:!!decoded.name,hasRole:!!decoded.role,decodedKeys:Object.keys(decoded)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return res.status(401).json({ error: 'Invalid token: missing required fields' });
    }

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:75',message:'token verified successfully',data:{userId:req.userId,userEmail:req.user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    next();
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/40b0149f-0859-4125-8aac-03fe6e65af4c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:80',message:'jwt verify error',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const errorMessage = error?.name === 'TokenExpiredError' 
      ? 'Token expired' 
      : error?.name === 'JsonWebTokenError'
      ? 'Invalid token'
      : 'Authentication failed';
    
    return res.status(401).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error?.message })
    });
  }
};

