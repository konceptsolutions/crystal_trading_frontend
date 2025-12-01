// Vercel serverless function handler
import express from 'express';
import app from '../src/server';

// Add error handling middleware for serverless (must be after all routes)
const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Serverless function error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

app.use(errorHandler);

// Export the Express app as the default handler
export default app;


