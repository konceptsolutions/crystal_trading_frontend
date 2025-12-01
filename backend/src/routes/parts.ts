import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const partSchema = z.object({
  partNo: z.string().min(1),
  masterPartNo: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  mainCategory: z.string().optional(),
  subCategory: z.string().optional(),
  application: z.string().optional(),
  hsCode: z.string().optional(),
  uom: z.string().optional(),
  weight: z.number().optional(),
  reOrderLevel: z.number().optional(),
  cost: z.number().optional(),
  priceA: z.number().optional(),
  priceB: z.number().optional(),
  priceM: z.number().optional(),
  rackNo: z.string().optional(),
  origin: z.string().optional(),
  grade: z.string().optional(),
  status: z.string().optional(),
  smc: z.string().optional(),
  size: z.string().optional(),
  remarks: z.string().optional(),
  imageUrl1: z.string().optional(),
  imageUrl2: z.string().optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all parts with pagination and filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const brand = req.query.brand as string;
    const mainCategory = req.query.mainCategory as string;
    const status = req.query.status as string;
    const origin = req.query.origin as string;
    const grade = req.query.grade as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { partNo: { contains: search } },
        { masterPartNo: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    // Add filters
    if (brand) {
      where.brand = { contains: brand };
    }
    if (mainCategory) {
      where.mainCategory = { contains: mainCategory };
    }
    if (status) {
      where.status = status;
    }
    if (origin) {
      where.origin = { contains: origin };
    }
    if (grade) {
      where.grade = grade;
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.part.count({ where }),
    ]);

    res.json({
      parts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single part with models
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const part = await prisma.part.findUnique({
      where: { id: req.params.id },
      include: {
        models: {
          orderBy: {
            modelNo: 'asc',
          },
        },
        stock: true,
      },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.json({ part });
  } catch (error) {
    console.error('Get part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get part by partNo
router.get('/partno/:partNo', async (req: AuthRequest, res) => {
  try {
    const part = await prisma.part.findUnique({
      where: { partNo: req.params.partNo },
      include: {
        models: {
          orderBy: {
            modelNo: 'asc',
          },
        },
        stock: true,
      },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.json({ part });
  } catch (error) {
    console.error('Get part by partNo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new part
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = partSchema.parse(req.body);

    // Check if partNo already exists
    const existingPart = await prisma.part.findUnique({
      where: { partNo: data.partNo },
    });

    if (existingPart) {
      return res.status(400).json({ error: 'Part number already exists' });
    }

    // Create part with stock in a transaction
    const part = await prisma.part.create({
      data,
      include: {
        models: true,
        stock: true,
      },
    });

    // Create default stock entry if it doesn't exist
    try {
      await prisma.stock.upsert({
        where: { partId: part.id },
        update: {},
        create: {
          partId: part.id,
          quantity: 0,
        },
      });
    } catch (stockError) {
      // Stock might already exist, continue anyway
      console.log('Stock entry already exists or error creating stock:', stockError);
    }

    // Fetch the complete part with stock
    const partWithStock = await prisma.part.findUnique({
      where: { id: part.id },
      include: {
        models: true,
        stock: true,
      },
    });

    res.status(201).json({ part: partWithStock });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    console.error('Create part error:', error);
    
    // Check for unique constraint violation
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Part number already exists' });
    }
    
    res.status(500).json({ 
      error: (error as Error).message || 'Internal server error' 
    });
  }
});

// Update part
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = partSchema.partial().parse(req.body);

    // If partNo is being updated, check if it already exists
    if (data.partNo) {
      const existingPart = await prisma.part.findUnique({
        where: { partNo: data.partNo },
      });

      if (existingPart && existingPart.id !== req.params.id) {
        return res.status(400).json({ error: 'Part number already exists' });
      }
    }

    const part = await prisma.part.update({
      where: { id: req.params.id },
      data,
      include: {
        models: true,
        stock: true,
      },
    });

    res.json({ part });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Update part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete part
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.part.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Delete part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search parts
router.get('/search/:query', async (req: AuthRequest, res) => {
  try {
    const query = req.params.query;

    const parts = await prisma.part.findMany({
      where: {
        OR: [
          { partNo: { contains: query } },
          { masterPartNo: { contains: query } },
          { description: { contains: query } },
          { brand: { contains: query } },
        ],
      },
      include: {
        stock: true,
      },
      take: 20,
    });

    res.json({ parts });
  } catch (error) {
    console.error('Search parts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

