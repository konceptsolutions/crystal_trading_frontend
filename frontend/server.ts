import next from 'next';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Import Express routes
import authRoutes from './server/src/routes/auth';
import partsRoutes from './server/src/routes/parts';
import modelsRoutes from './server/src/routes/models';
import categoriesRoutes from './server/src/routes/categories';
import kitsRoutes from './server/src/routes/kits';
import purchaseOrdersRoutes from './server/src/routes/purchase-orders';
import suppliersRoutes from './server/src/routes/suppliers';
import salesInvoicesRoutes from './server/src/routes/sales-invoices';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Middleware
  server.use(cors());
  server.use(express.json({ limit: '50mb' }));
  server.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  server.use('/api/auth', authRoutes);
  server.use('/api/parts', partsRoutes);
  server.use('/api/models', modelsRoutes);
  server.use('/api/categories', categoriesRoutes);
  server.use('/api/kits', kitsRoutes);
  server.use('/api/purchase-orders', purchaseOrdersRoutes);
  server.use('/api/suppliers', suppliersRoutes);
  server.use('/api/sales-invoices', salesInvoicesRoutes);

  // Health check
  server.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Inventory API is running' });
  });

  // All other requests go to Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> API available at http://${hostname}:${port}/api`);
  });
});

