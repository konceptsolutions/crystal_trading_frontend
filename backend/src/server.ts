import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import partsRoutes from './routes/parts';
import modelsRoutes from './routes/models';
import categoriesRoutes from './routes/categories';
import kitsRoutes from './routes/kits';
import purchaseOrdersRoutes from './routes/purchase-orders';
import suppliersRoutes from './routes/suppliers';
import salesInvoicesRoutes from './routes/sales-invoices';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase body size limit to 50MB for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Inventory API is running' });
});

// Routes - handle both with and without /api prefix for Vercel compatibility
app.use('/api/auth', authRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/kits', kitsRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/sales-invoices', salesInvoicesRoutes);

// Also handle routes without /api prefix (for Vercel routing)
app.use('/auth', authRoutes);
app.use('/parts', partsRoutes);
app.use('/models', modelsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/kits', kitsRoutes);
app.use('/purchase-orders', purchaseOrdersRoutes);
app.use('/suppliers', suppliersRoutes);
app.use('/sales-invoices', salesInvoicesRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { prisma } = await import('./utils/prisma');
    await prisma.$connect();
    res.json({ status: 'ok', message: 'Inventory API is running', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: (error as Error).message });
  }
});

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { prisma } = await import('./utils/prisma');
    await prisma.$connect();
    res.json({ status: 'ok', message: 'Inventory API is running', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: (error as Error).message });
  }
});

// Test database connection on startup (only for local development)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  import('./utils/prisma').then(({ prisma }) => {
    prisma.$connect()
      .then(() => console.log('✓ Database connected successfully'))
      .catch((error) => {
        console.error('✗ Database connection failed:', error);
        console.error('Please check your DATABASE_URL in .env file');
      });
  });
}

// For local development
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}

// Export for Vercel serverless functions
export default app;

