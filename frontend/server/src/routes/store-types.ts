import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const storeTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

// All routes require authentication
router.use(verifyToken);

// Get store types (auto-seed defaults if empty)
router.get('/', async (_req: AuthRequest, res) => {
  try {
    let storeTypes = await prisma.storeType.findMany({ orderBy: { name: 'asc' } });

    if (storeTypes.length === 0) {
      const defaults = ['Main Store', 'Warehouse', 'Branch Store'];
      for (const name of defaults) {
        await prisma.storeType.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }
      storeTypes = await prisma.storeType.findMany({ orderBy: { name: 'asc' } });
    }

    res.json({ storeTypes });
  } catch (error: any) {
    console.error('Get store types error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to fetch store types' });
  }
});

// Create store type (optional)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = storeTypeSchema.parse(req.body);
    const existing = await prisma.storeType.findFirst({ where: { name: data.name.trim() } });
    if (existing) return res.status(400).json({ error: 'Store type already exists' });

    const storeType = await prisma.storeType.create({ data: { name: data.name.trim() } });
    res.status(201).json({ storeType });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    console.error('Create store type error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to create store type' });
  }
});

export default router;


