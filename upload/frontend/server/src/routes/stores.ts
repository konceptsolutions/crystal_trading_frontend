import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  storeTypeId: z.string().min(1, 'Store type is required'),
  description: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all stores
router.get('/', async (req: AuthRequest, res) => {
  try {
    const status = (req.query.status as string) || '';
    const search = (req.query.search as string) || '';

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [{ name: { contains: search } }, { description: { contains: search } }, { storeType: { name: { contains: search } } }];
    }

    const stores = await prisma.store.findMany({
      where,
      include: { storeType: true, _count: { select: { racks: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ stores });
  } catch (error: any) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to fetch stores' });
  }
});

// Create store
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = storeSchema.parse(req.body);

    const type = await prisma.storeType.findUnique({ where: { id: data.storeTypeId } });
    if (!type) return res.status(404).json({ error: 'Store type not found' });

    const store = await prisma.store.create({
      data: {
        name: data.name.trim(),
        storeTypeId: data.storeTypeId,
        description: data.description?.trim() || null,
        status: data.status || 'A',
      },
      include: { storeType: true },
    });

    res.status(201).json({ store });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to create store' });
  }
});

// Update store
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = storeSchema.partial().parse(req.body);

    const existing = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Store not found' });

    if (data.storeTypeId) {
      const type = await prisma.storeType.findUnique({ where: { id: data.storeTypeId } });
      if (!type) return res.status(404).json({ error: 'Store type not found' });
    }

    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: {
        ...data,
        name: data.name !== undefined ? data.name.trim() : undefined,
        description: data.description !== undefined ? (data.description.trim() || null) : undefined,
      },
      include: { storeType: true, _count: { select: { racks: true } } },
    });

    res.json({ store });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to update store' });
  }
});

// Delete store (only if no racks)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { racks: true } } },
    });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    if ((store as any)._count?.racks > 0) {
      return res.status(400).json({ error: 'Cannot delete store with racks. Please delete racks first.' });
    }

    await prisma.store.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to delete store' });
  }
});

export default router;


