import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const vehicleSchema = z.object({
  name: z.string().min(1, 'Vehicle name is required'),
});

// All routes require authentication
router.use(verifyToken);

// Get all vehicles with pagination
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = {};

    if (search) {
      // SQLite doesn't support case-insensitive mode, so we'll use contains
      where.name = { contains: search };
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vehicle
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create vehicle
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = vehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data,
    });

    res.status(201).json({ vehicle });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vehicle
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = vehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ vehicle });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vehicle
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.vehicle.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

