import next from 'next';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { networkInterfaces } from 'os';

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Ensure DATABASE_URL is set correctly for SQLite
if (!process.env.DATABASE_URL) {
  // If DATABASE_URL is not set, use the shared backend database
  const backendDbPath = path.resolve(process.cwd(), '..', 'backend', 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${backendDbPath.replace(/\\/g, '/')}`;
  console.log(`[Server] DATABASE_URL not set, using: ${process.env.DATABASE_URL.replace(/file:.*\//, 'file:.../')}`);
}

if (process.env.DATABASE_URL) {
  // Remove quotes and normalize (handle line breaks)
  let dbUrl = process.env.DATABASE_URL.replace(/^["']|["']$/g, '').replace(/\r?\n/g, '').trim();
  
  if (!dbUrl.startsWith('file:')) {
    if (dbUrl.startsWith('./')) {
      const absolutePath = path.resolve(process.cwd(), dbUrl).replace(/\\/g, '/');
      dbUrl = `file:${absolutePath}`;
    } else {
      const absolutePath = path.resolve(process.cwd(), dbUrl).replace(/\\/g, '/');
      dbUrl = `file:${absolutePath}`;
    }
  } else if (dbUrl.startsWith('file:./') || dbUrl.startsWith('file:../')) {
    // Handle relative paths in file: URLs
    const dbPath = dbUrl.replace(/^file:/, '');
    const absolutePath = path.resolve(process.cwd(), dbPath).replace(/\\/g, '/');
    dbUrl = `file:${absolutePath}`;
  }
  
  process.env.DATABASE_URL = dbUrl;
} else {
  // Set default if not provided
  const defaultPath = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${defaultPath}`;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = parseInt(process.env.PORT || '3000', 10);

// Function to get local IP address
function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netInterfaces = nets[name];
    if (netInterfaces) {
      for (const net of netInterfaces) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

// Import Express routes
import authRoutes from './server/src/routes/auth';
import partsRoutes from './server/src/routes/parts';
import modelsRoutes from './server/src/routes/models';
import categoriesRoutes from './server/src/routes/categories';
import kitsRoutes from './server/src/routes/kits';
import purchaseOrdersRoutes from './server/src/routes/purchase-orders';
import suppliersRoutes from './server/src/routes/suppliers';
import salesInvoicesRoutes from './server/src/routes/sales-invoices';
import salesInquiriesRoutes from './server/src/routes/sales-inquiries';
import salesQuotationsRoutes from './server/src/routes/sales-quotations';
import deliveryChallansRoutes from './server/src/routes/delivery-challans';
import salesReturnsRoutes from './server/src/routes/sales-returns';
import accountsRoutes from './server/src/routes/accounts';
import vehiclesRoutes from './server/src/routes/vehicles';
import vehicleModelsRoutes from './server/src/routes/vehicle-models';
import racksRoutes from './server/src/routes/racks';
import brandsRoutes from './server/src/routes/brands';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();

  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set in environment variables');
    process.exit(1);
  }
  console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/file:.*\//, 'file:.../'));

  // Initialize Prisma client early to catch any connection errors
  // In Vercel/production, we handle this more gracefully
  try {
    const { prisma } = await import('./lib/utils/prisma');
    // Test connection (skip in Vercel as it's serverless)
    if (!process.env.VERCEL) {
      await prisma.$connect();
      console.log('✓ Database connection established');
    } else {
      console.log('✓ Prisma client initialized (serverless mode)');
    }
  } catch (error: any) {
    console.error('✗ Database connection failed:', error);
    if (process.env.VERCEL) {
      console.error('⚠ Vercel deployment detected. SQLite file databases are not supported.');
      console.error('⚠ Please configure a cloud database (PostgreSQL, MySQL, or Turso) in Vercel environment variables.');
      console.error('⚠ The app will continue but database operations may fail.');
    } else {
      console.error('Please check your DATABASE_URL in .env or .env.local');
      process.exit(1);
    }
  }

  // Middleware
  server.use(cors());
  server.use(express.json({ limit: '50mb' }));
  server.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  console.log('Registering API routes...');
  server.use('/api/auth', authRoutes);
  server.use('/api/parts', partsRoutes);
  server.use('/api/models', modelsRoutes);
  server.use('/api/categories', categoriesRoutes);
  server.use('/api/brands', brandsRoutes);
  server.use('/api/kits', kitsRoutes);
  server.use('/api/purchase-orders', purchaseOrdersRoutes);
  server.use('/api/suppliers', suppliersRoutes);
  server.use('/api/sales-invoices', salesInvoicesRoutes);
      server.use('/api/sales-inquiries', salesInquiriesRoutes);
      server.use('/api/sales-quotations', salesQuotationsRoutes);
      server.use('/api/delivery-challans', deliveryChallansRoutes);
      server.use('/api/sales-returns', salesReturnsRoutes);
  server.use('/api/accounts', accountsRoutes);
  server.use('/api/vehicles', vehiclesRoutes);
  server.use('/api/vehicle-models', vehicleModelsRoutes);
  server.use('/api/racks', racksRoutes);
  console.log('✓ All API routes registered');

  // Health check
  server.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Inventory API is running' });
  });

  // Test accounts route
  server.get('/api/accounts/test', (req, res) => {
    res.json({ status: 'ok', message: 'Accounts route is working' });
  });

  // All other requests go to Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err?: Error) => {
    if (err) {
      if ((err as any).code === 'EADDRINUSE') {
        console.error(`\n✗ Port ${port} is already in use.`);
        console.error('Please stop the existing server or use a different port.');
        console.error('\nTo stop all Node processes:');
        console.error('  Stop-Process -Name node -Force');
        console.error('\nOr change the PORT in your .env file.\n');
        process.exit(1);
      }
      throw err;
    }
    const localIP = getLocalIP();
    console.log(`\n🚀 Server is running on:`);
    console.log(`   Local:    http://localhost:${port}`);
    console.log(`   Network:  http://${localIP}:${port}`);
    console.log(`\n📡 API available at:`);
    console.log(`   Local:    http://localhost:${port}/api`);
    console.log(`   Network:  http://${localIP}:${port}/api`);
    console.log(`\n🌍 Access from other devices using: http://${localIP}:${port}`);
  });
});

