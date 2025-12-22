import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const rackSchema = z.object({
  rackNumber: z.string().min(1, 'Rack number is required'),
  storeId: z.string().min(1, 'Store is required'),
  description: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
// Wrap verifyToken to handle errors properly
router.use((req, res, next) => {
  try {
    verifyToken(req as AuthRequest, res, next);
  } catch (error: any) {
    console.error('[Racks Route] Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: error?.message || 'Failed to verify authentication',
    });
  }
});

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
  // Ensure we always send a response
  try {
    console.log('[Backend Racks POST] ========== REQUEST RECEIVED ==========');
    console.log('[Backend Racks POST] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Backend Racks POST] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[Backend Racks POST] User:', req.user ? req.user.email : 'No user');
    
    // Validate request body
    let data;
    try {
      data = rackSchema.parse(req.body);
      console.log('[Backend Racks POST] Validation passed');
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('[Backend Racks POST] Validation error:', validationError.errors);
        return res.status(400).json({ 
          error: 'Validation failed',
          message: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          details: validationError.errors,
        });
      }
      throw validationError;
    }

    // Verify store exists
    console.log('[Backend Racks POST] Checking store:', data.storeId);
    const store = await prisma.store.findUnique({
      where: { id: data.storeId },
    });

    if (!store) {
      console.error('[Backend Racks POST] Store not found:', data.storeId);
      return res.status(404).json({ 
        error: 'Store not found',
        message: `Store with ID "${data.storeId}" does not exist`,
      });
    }
    console.log('[Backend Racks POST] Store found:', store.name);

    // Check if rack number already exists in this store
    const existing = await prisma.rack.findFirst({
      where: {
        rackNumber: data.rackNumber,
        storeId: data.storeId,
      },
    });

    if (existing) {
      console.error('[Backend Racks POST] Duplicate rack found');
      return res.status(400).json({ 
        error: `Rack number "${data.rackNumber}" already exists in this store`,
        message: `A rack with number "${data.rackNumber}" already exists in store "${store.name}"`,
      });
    }

    console.log('[Backend Racks POST] Creating rack...');
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

    console.log('[Backend Racks POST] Rack created successfully:', rack.id);
    res.status(201).json({ rack });
  } catch (error: any) {
    console.error('[Backend Racks POST] ========== ERROR ==========');
    console.error('[Backend Racks POST] Error type:', error?.constructor?.name);
    console.error('[Backend Racks POST] Error message:', error?.message);
    console.error('[Backend Racks POST] Error code:', error?.code);
    console.error('[Backend Racks POST] Error stack:', error?.stack);
    console.error('[Backend Racks POST] ===========================');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        details: error.errors,
      });
    }
    
    // Handle Prisma errors
    if (error?.code === 'P2002') {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'A rack with this number already exists in this store',
        code: error.code,
      });
    }
    
    if (error?.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid reference',
        message: 'The specified store does not exist',
        code: error.code,
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Failed to create rack',
      code: error?.code,
      ...(process.env.NODE_ENV === 'development' ? {
        stack: error?.stack,
        type: error?.constructor?.name,
      } : {}),
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

      const duplicate = await prisma.rack.findUnique({
        where: {
          rackNumber_storeId: {
            rackNumber: newRackNumber,
            storeId: newStoreId,
          },
        },
      });

      if (duplicate && duplicate.id !== req.params.id) {
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
  } catch (error) {
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
      include: {
        _count: {
          select: { shelves: true },
        },
      },
    });

    if (!rack) {
      return res.status(404).json({ error: 'Rack not found' });
    }

    // Use transaction to delete everything in order
    await prisma.$transaction(async (tx) => {
      // First, delete all item inventories that reference this rack
      await tx.itemInventory.deleteMany({
        where: { rackId: req.params.id },
      });

      // Then delete the rack - shelves will cascade delete automatically
      await tx.rack.delete({
        where: { id: req.params.id },
      });
    });

    res.json({ message: 'Rack deleted successfully' });
  } catch (error: any) {
    console.error('Delete rack error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

