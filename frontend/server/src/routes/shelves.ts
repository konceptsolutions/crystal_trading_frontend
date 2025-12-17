import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const shelfSchema = z.object({
  shelfNumber: z.string().min(1, 'Shelf number is required'),
  rackId: z.string().min(1, 'Rack is required'),
  description: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get shelves (optionally filter by rackId / storeId / status)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string;
    const rackId = req.query.rackId as string;
    const storeId = req.query.storeId as string;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (rackId) where.rackId = rackId;

    // storeId filter requires joining rack
    const shelves = await prisma.shelf.findMany({
      where: {
        ...where,
        ...(storeId
          ? {
              rack: {
                storeId,
              },
            }
          : {}),
      },
      include: {
        rack: {
          include: {
            store: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ shelves });
  } catch (error: any) {
    console.error('Get shelves error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch shelves',
    });
  }
});

// Create shelf
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = shelfSchema.parse(req.body);

    // Verify rack exists
    const rack = await prisma.rack.findUnique({ where: { id: data.rackId } });
    if (!rack) return res.status(404).json({ error: 'Rack not found' });

    // Check duplicate within rack
    const existing = await prisma.shelf.findFirst({
      where: {
        shelfNumber: data.shelfNumber,
        rackId: data.rackId,
      },
    });
    if (existing) {
      return res.status(400).json({
        error: `Shelf number "${data.shelfNumber}" already exists in this rack`,
      });
    }

    const shelf = await prisma.shelf.create({
      data: {
        shelfNumber: data.shelfNumber.trim(),
        rackId: data.rackId,
        description: data.description?.trim() || null,
        status: data.status || 'A',
      },
      include: {
        rack: {
          include: { store: true },
        },
      },
    });

    res.status(201).json({ shelf });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }
    console.error('Create shelf error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to create shelf',
    });
  }
});

// Update shelf
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = shelfSchema.partial().parse(req.body);

    const existingShelf = await prisma.shelf.findUnique({ where: { id: req.params.id } });
    if (!existingShelf) return res.status(404).json({ error: 'Shelf not found' });

    const nextRackId = data.rackId ?? existingShelf.rackId;
    if (data.rackId) {
      const rack = await prisma.rack.findUnique({ where: { id: data.rackId } });
      if (!rack) return res.status(404).json({ error: 'Rack not found' });
    }

    const nextShelfNumber = data.shelfNumber ?? existingShelf.shelfNumber;
    // If shelfNumber or rackId changes, enforce unique within rack
    if (nextShelfNumber !== existingShelf.shelfNumber || nextRackId !== existingShelf.rackId) {
      const dup = await prisma.shelf.findFirst({
        where: {
          shelfNumber: String(nextShelfNumber).trim(),
          rackId: String(nextRackId),
          NOT: { id: req.params.id },
        },
      });
      if (dup) {
        return res.status(400).json({ error: `Shelf number "${nextShelfNumber}" already exists in this rack` });
      }
    }

    const shelf = await prisma.shelf.update({
      where: { id: req.params.id },
      data: {
        ...data,
        shelfNumber: data.shelfNumber !== undefined ? data.shelfNumber.trim() : undefined,
        description: data.description !== undefined ? (data.description.trim() || null) : undefined,
      },
      include: {
        rack: { include: { store: true } },
      },
    });

    res.json({ shelf });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }
    console.error('Update shelf error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to update shelf' });
  }
});

// Delete shelf
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const shelf = await prisma.shelf.findUnique({ where: { id: req.params.id } });
    if (!shelf) return res.status(404).json({ error: 'Shelf not found' });

    await prisma.shelf.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete shelf error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Failed to delete shelf' });
  }
});

export default router;


