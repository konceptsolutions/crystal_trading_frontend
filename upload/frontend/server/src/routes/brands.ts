import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all brands
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const brands = await prisma.brand.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ brands });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single brand
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ brand });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create brand
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = brandSchema.parse(req.body);
    const name = data.name.trim();

    const existing = await prisma.brand.findFirst({
      where: { name },
    });
    if (existing) {
      return res.status(400).json({ error: 'Brand with this name already exists' });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        status: data.status || 'A',
      },
    });

    res.status(201).json({ brand });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update brand
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = brandSchema.partial().parse(req.body);

    const existing = await prisma.brand.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    if (data.name) {
      const name = data.name.trim();
      const duplicate = await prisma.brand.findFirst({
        where: {
          name,
          id: { not: req.params.id },
        },
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Brand with this name already exists' });
      }
    }

    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    res.json({ brand });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete brand
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Check if brand is used in parts
    const partsCount = await prisma.part.count({
      where: { brand: brand.name },
    });

    if (partsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete brand. It is used by ${partsCount} part(s).`,
      });
    }

    await prisma.brand.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


