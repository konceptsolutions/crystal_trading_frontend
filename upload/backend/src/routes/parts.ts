import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const partModelInputSchema = z.object({
  modelNo: z.string().min(1),
  qtyUsed: z.number().int().min(1).optional(),
  tab: z.enum(['P1', 'P2']).optional(),
});

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
    const masterPartNo = req.query.masterPartNo as string;
    const partNo = req.query.partNo as string;
    const brand = req.query.brand as string;
    const description = req.query.description as string;
    const mainCategory = req.query.mainCategory as string;
    const subCategory = req.query.subCategory as string;
    const application = req.query.application as string;
    const status = req.query.status as string;
    const origin = req.query.origin as string;
    const grade = req.query.grade as string;

    const where: any = {};

    // Individual filters take priority over general search
    if (masterPartNo) {
      where.masterPartNo = { contains: masterPartNo, mode: 'insensitive' };
    }
    if (partNo) {
      where.partNo = { contains: partNo, mode: 'insensitive' };
    }
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }
    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }
    if (mainCategory) {
      where.mainCategory = { contains: mainCategory, mode: 'insensitive' };
    }
    if (subCategory) {
      where.subCategory = { contains: subCategory, mode: 'insensitive' };
    }
    if (application) {
      where.application = { contains: application, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }

    // General search only if no individual filters are set
    if (search && !masterPartNo && !partNo && !description) {
      where.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { masterPartNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
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
    console.log('Create part: incoming body keys:', Object.keys(req.body || {}));
    console.log('Create part: incoming models type:', {
      hasModels: req.body?.models !== undefined,
      isArray: Array.isArray(req.body?.models),
      length: Array.isArray(req.body?.models) ? req.body.models.length : undefined,
      sample: Array.isArray(req.body?.models) ? req.body.models.slice(0, 2) : undefined,
    });

    const { models, ...partBody } = (req.body || {}) as any;
    const data = partSchema.parse(partBody);

    // Check if partNo already exists
    const existingPart = await prisma.part.findUnique({
      where: { partNo: data.partNo },
    });

    if (existingPart) {
      return res.status(400).json({ error: 'Part number already exists' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const part = await tx.part.create({ data });

      // Stock (ensure exists)
      await tx.stock.upsert({
        where: { partId: part.id },
        update: {},
        create: { partId: part.id, quantity: 0 },
      });

      // Models (optional)
      if (models !== undefined) {
        const parsedModels = z.array(partModelInputSchema).safeParse(models);
        if (!parsedModels.success) {
          throw new z.ZodError(parsedModels.error.issues);
        }

        const validModels = (parsedModels.data || [])
          .map((m: any) => ({
            modelNo: typeof m?.modelNo === 'string' ? m.modelNo.trim() : '',
            qtyUsed: typeof m?.qtyUsed === 'number' ? m.qtyUsed : 1,
            tab: (m?.tab === 'P2' ? 'P2' : 'P1') as 'P1' | 'P2',
          }))
          .filter((m: any) => m.modelNo.length > 0);

        console.log('Create part: validModels:', validModels);

        if (validModels.length > 0) {
          const createdModels = await tx.partModel.createMany({
            data: validModels.map((m: any) => ({
              partId: part.id,
              modelNo: m.modelNo,
              qtyUsed: m.qtyUsed,
              tab: m.tab,
            })),
          });
          console.log('Create part: created models count:', createdModels.count);
        }
      }

      return await tx.part.findUnique({
        where: { id: part.id },
        include: { models: true, stock: true },
      });
    });

    res.status(201).json({ part: created });
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
    const { models, ...partBody } = (req.body || {}) as any;
    const data = partSchema.partial().parse(partBody);

    // If partNo is being updated, check if it already exists
    if (data.partNo) {
      const existingPart = await prisma.part.findUnique({
        where: { partNo: data.partNo },
      });

      if (existingPart && existingPart.id !== req.params.id) {
        return res.status(400).json({ error: 'Part number already exists' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: req.params.id },
        data,
      });

      // If models were provided, replace the whole set for this part
      if (models !== undefined) {
        const parsedModels = z.array(partModelInputSchema).safeParse(models);
        if (!parsedModels.success) {
          throw new z.ZodError(parsedModels.error.issues);
        }

        const validModels = (parsedModels.data || [])
          .map((m: any) => ({
            modelNo: typeof m?.modelNo === 'string' ? m.modelNo.trim() : '',
            qtyUsed: typeof m?.qtyUsed === 'number' ? m.qtyUsed : 1,
            tab: (m?.tab === 'P2' ? 'P2' : 'P1') as 'P1' | 'P2',
          }))
          .filter((m: any) => m.modelNo.length > 0);

        await tx.partModel.deleteMany({ where: { partId: req.params.id } });

        if (validModels.length > 0) {
          await tx.partModel.createMany({
            data: validModels.map((m: any) => ({
              partId: req.params.id,
              modelNo: m.modelNo,
              qtyUsed: m.qtyUsed,
              tab: m.tab,
            })),
          });
        }
      }

      return await tx.part.findUnique({
        where: { id: req.params.id },
        include: { models: true, stock: true },
      });
    });

    res.json({ part: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Update part error:', error);
    res.status(500).json({ error: (error as Error).message || 'Internal server error' });
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

