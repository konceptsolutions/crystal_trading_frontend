import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const rackSchema = z.object({
  rackNumber: z.string().min(1, 'Rack number is required'),
  storeId: z.string().min(1, 'Store is required'),
  description: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all racks with pagination and filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const storeId = req.query.storeId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Store filter
    if (storeId) {
      where.storeId = storeId;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { rackNumber: { contains: search } },
        { description: { contains: search } },
        { store: { name: { contains: search } } },
      ];
    }

    const [racks, total] = await Promise.all([
      prisma.rack.findMany({
        where,
        include: {
          store: {
            include: {
              storeType: true,
            },
          },
          _count: {
            select: { shelves: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.rack.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      racks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Get racks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch racks',
    });
  }
});

// Get single rack
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const rack = await prisma.rack.findUnique({
      where: { id: req.params.id },
      include: {
        store: {
          include: {
            storeType: true,
          },
        },
        shelves: true,
        _count: {
          select: { shelves: true },
        },
      },
    });

    if (!rack) {
      return res.status(404).json({ error: 'Rack not found' });
    }

    res.json({ rack });
  } catch (error: any) {
    console.error('Get rack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create rack
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = rackSchema.parse(req.body);

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: data.storeId },
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if rack number already exists in this store
    const existing = await prisma.rack.findFirst({
      where: {
        rackNumber: data.rackNumber,
        storeId: data.storeId,
      },
    });

    if (existing) {
      return res.status(400).json({ 
        error: `Rack number "${data.rackNumber}" already exists in this store` 
      });
    }

    const rack = await prisma.rack.create({
      data: {
        rackNumber: data.rackNumber.trim(),
        storeId: data.storeId,
        description: data.description?.trim() || null,
        status: data.status || 'A',
      },
      include: {
        store: {
          include: {
            storeType: true,
          },
        },
      },
    });

    res.status(201).json({ rack });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
      });
    }
    console.error('Create rack error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to create rack',
    });
  }
});

// Update rack
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = rackSchema.partial().parse(req.body);

    const existing = await prisma.rack.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rack not found' });
    }

    // If storeId or rackNumber is being changed, check for duplicates
    if (data.storeId || data.rackNumber) {
      const newStoreId = data.storeId || existing.storeId;
      const newRackNumber = data.rackNumber || existing.rackNumber;

      const duplicate = await prisma.rack.findFirst({
        where: {
          rackNumber: newRackNumber,
          storeId: newStoreId,
          id: { not: req.params.id },
        },
      });

      if (duplicate) {
        return res.status(400).json({ 
          error: `Rack number "${newRackNumber}" already exists in this store` 
        });
      }
    }

    // Verify store exists if storeId is being updated
    if (data.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: data.storeId },
      });

      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
    }

    const rack = await prisma.rack.update({
      where: { id: req.params.id },
      data: {
        ...data,
        description: data.description !== undefined ? (data.description || null) : undefined,
      },
      include: {
        store: {
          include: {
            storeType: true,
          },
        },
      },
    });

    res.json({ rack });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update rack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rack
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const rack = await prisma.rack.findUnique({
      where: { id: req.params.id },
    });

    if (!rack) {
      return res.status(404).json({ error: 'Rack not found' });
    }

    // Delete the rack - shelves will cascade delete automatically
    await prisma.rack.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Rack deleted successfully' });
  } catch (error: any) {
    console.error('Delete rack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
