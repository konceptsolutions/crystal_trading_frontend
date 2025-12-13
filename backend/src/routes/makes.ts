import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const makeSchema = z.object({
  name: z.string().min(1, 'Make name is required'),
});

// All routes require authentication
router.use(verifyToken);

// Get all makes with pagination
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.name = { contains: search };
    }

    const [makes, total] = await Promise.all([
      prisma.make.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.make.count({ where }),
    ]);

    res.json({
      makes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get makes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch makes',
    });
  }
});

// Get single make
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const make = await prisma.make.findUnique({
      where: { id: req.params.id },
    });

    if (!make) {
      return res.status(404).json({ error: 'Make not found' });
    }

    res.json({ make });
  } catch (error: any) {
    console.error('Get make error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create make
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = makeSchema.parse(req.body);

    // Check if make name already exists
    const existing = await prisma.make.findFirst({
      where: { name: { equals: data.name } },
    });

    if (existing) {
      return res.status(400).json({ error: 'Make name already exists' });
    }

    const make = await prisma.make.create({
      data: {
        name: data.name,
      },
    });

    res.status(201).json({ make });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create make error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update make
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = makeSchema.partial().parse(req.body);

    const existing = await prisma.make.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Make not found' });
    }

    // Check for duplicate name
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.make.findFirst({
        where: {
          name: { equals: data.name },
          id: { not: req.params.id },
        },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Make name already exists' });
      }
    }

    const make = await prisma.make.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ make });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update make error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete make
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const make = await prisma.make.findUnique({
      where: { id: req.params.id },
    });

    if (!make) {
      return res.status(404).json({ error: 'Make not found' });
    }

    await prisma.make.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Make deleted successfully' });
  } catch (error) {
    console.error('Delete make error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

