import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const vehicleModelSchema = z.object({
  machine: z.string().min(1, 'Machine is required'),
  make: z.string().min(1, 'Make is required'),
  name: z.string().min(1, 'Model name is required'),
});

// All routes require authentication
router.use(verifyToken);

// Get all vehicle models with pagination and filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const machine = req.query.machine as string;
    const make = req.query.make as string;
    const name = req.query.name as string;

    const where: any = {};

    if (machine) where.machine = { contains: machine };
    if (make) where.make = { contains: make };
    if (name) where.name = { contains: name };

    const [models, total] = await Promise.all([
      prisma.vehicleModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.vehicleModel.count({ where }),
    ]);

    res.json({
      models,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vehicle models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create vehicle model
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = vehicleModelSchema.parse(req.body);

    const model = await prisma.vehicleModel.create({
      data,
    });

    res.status(201).json({ model });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create vehicle model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vehicle model
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = vehicleModelSchema.parse(req.body);

    const model = await prisma.vehicleModel.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ model });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle model not found' });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update vehicle model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vehicle model
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.vehicleModel.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vehicle model deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle model not found' });
    }
    console.error('Delete vehicle model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


