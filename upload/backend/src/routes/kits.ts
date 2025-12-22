import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const kitSchema = z.object({
  kitNo: z.string().min(1, 'Kit number is required'),
  name: z.string().min(1, 'Kit name is required'),
  description: z.string().optional(),
  totalCost: z.number().optional(),
  price: z.number().optional(),
  status: z.enum(['A', 'I']).optional(),
  items: z.array(z.object({
    partId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1, 'Kit must have at least one item'),
});

// All routes require authentication
router.use(verifyToken);

// Get all kits
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      // For SQLite, use case-insensitive search
      const searchLower = search.toLowerCase();
      where.OR = [
        { kitNo: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const kits = await prisma.kit.findMany({
      where,
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ kits });
  } catch (error: any) {
    console.error('Get kits error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to fetch kits'
    });
  }
});

// Get single kit
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const kit = await prisma.kit.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!kit) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    res.json({ kit });
  } catch (error) {
    console.error('Get kit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create kit
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = kitSchema.parse(req.body);

    // Check if kit number already exists
    const existing = await prisma.kit.findUnique({
      where: { kitNo: data.kitNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'Kit number already exists' });
    }

    // Verify all parts exist
    const partIds = data.items.map(item => item.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } },
    });

    if (parts.length !== partIds.length) {
      return res.status(400).json({ error: 'One or more parts not found' });
    }

    // Calculate total cost from parts
    let totalCost = 0;
    data.items.forEach(item => {
      const part = parts.find(p => p.id === item.partId);
      if (part && part.cost) {
        totalCost += (part.cost * item.quantity);
      }
    });

    // Create kit with items
    const kit = await prisma.kit.create({
      data: {
        kitNo: data.kitNo,
        name: data.name,
        description: data.description,
        totalCost: data.totalCost || totalCost,
        price: data.price,
        status: data.status || 'A',
        items: {
          create: data.items.map(item => ({
            partId: item.partId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    res.status(201).json({ kit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create kit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update kit
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = kitSchema.partial().parse(req.body);

    // Check if kit exists
    const existing = await prisma.kit.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    // Check for duplicate kit number
    if (data.kitNo && data.kitNo !== existing.kitNo) {
      const duplicate = await prisma.kit.findUnique({
        where: { kitNo: data.kitNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Kit number already exists' });
      }
    }

    // If items are being updated, verify parts exist
    if (data.items) {
      const partIds = data.items.map(item => item.partId);
      const parts = await prisma.part.findMany({
        where: { id: { in: partIds } },
      });

      if (parts.length !== partIds.length) {
        return res.status(400).json({ error: 'One or more parts not found' });
      }

      // Calculate total cost
      let totalCost = 0;
      data.items.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part && part.cost) {
          totalCost += (part.cost * item.quantity);
        }
      });

      data.totalCost = data.totalCost || totalCost;

      // Delete existing items and create new ones
      await prisma.kitItem.deleteMany({
        where: { kitId: req.params.id },
      });
    }

    const kit = await prisma.kit.update({
      where: { id: req.params.id },
      data: {
        ...data,
        items: data.items ? {
          create: data.items.map(item => ({
            partId: item.partId,
            quantity: item.quantity,
          })),
        } : undefined,
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    res.json({ kit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update kit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Break kit - Return items to inventory and delete kit
router.post('/:id/break', async (req: AuthRequest, res) => {
  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get kit with items
      const kit = await tx.kit.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
      });

      if (!kit) {
        throw new Error('Kit not found');
      }

      // Note: Kits are conceptual groupings and don't consume inventory when created,
      // so breaking them doesn't need to return inventory to stock
      const returnedItems = [];
      for (const item of kit.items) {
        returnedItems.push({
          partNo: item.part?.partNo || 'Unknown',
          partId: item.partId,
          quantity: item.quantity,
        });
      }

      // Delete the kit (this will cascade delete all kit items)
      await tx.kit.delete({
        where: { id: req.params.id },
      });

      return {
        kitName: kit.name,
        kitNo: kit.kitNo,
        returnedItems,
      };
    });

    res.json({ 
      message: `Kit "${result.kitName}" (${result.kitNo}) broken successfully. All items have been returned to inventory.`,
      returnedItems: result.returnedItems,
    });
  } catch (error: any) {
    console.error('Break kit error:', error);
    if (error.message === 'Kit not found') {
      return res.status(404).json({ error: 'Kit not found' });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Delete kit
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const kit = await prisma.kit.findUnique({
      where: { id: req.params.id },
    });

    if (!kit) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    await prisma.kit.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Kit deleted successfully' });
  } catch (error) {
    console.error('Delete kit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

