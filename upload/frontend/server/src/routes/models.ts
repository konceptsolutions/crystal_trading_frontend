import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const modelSchema = z.object({
  modelNo: z.string().min(1),
  qtyUsed: z.number().int().min(1),
  tab: z.enum(['P1', 'P2']).default('P1'),
});

// All routes require authentication
router.use(verifyToken);

// Get all models with part information (pagination + search)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      partId = '',
      tab = '',
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { modelNo: { contains: search as string } },
        { part: { partNo: { contains: search as string } } },
        { part: { description: { contains: search as string } } },
      ];
    }

    if (partId) {
      where.partId = partId as string;
    }

    if (tab) {
      where.tab = tab as string;
    }

    const total = await prisma.partModel.count({ where });

    const models = await prisma.partModel.findMany({
      where,
      skip: offset,
      take: limitNum,
      include: {
        part: {
          select: {
            id: true,
            partNo: true,
            description: true,
            brand: true,
            mainCategory: true,
            stock: {
              select: { quantity: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    res.json({
      models,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get models for a part
router.get('/part/:partId', async (req: AuthRequest, res) => {
  try {
    const models = await prisma.partModel.findMany({
      where: { partId: req.params.partId },
      orderBy: [
        { tab: 'asc' },
        { modelNo: 'asc' },
      ],
    });

    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get part usage information (kits, categories, stock)
router.get('/part/:partId/usage', async (req: AuthRequest, res) => {
  try {
    const partId = req.params.partId;

    // Get part with stock
    const part = await prisma.part.findUnique({
      where: { id: partId },
      include: {
        stock: true,
        kitItems: {
          include: {
            kit: {
              select: {
                id: true,
                kitNo: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Get parts with same mainCategory or subCategory
    const relatedParts = await prisma.part.findMany({
      where: {
        AND: [
          { id: { not: partId } },
          {
            OR: [
              { mainCategory: part.mainCategory || undefined },
              { subCategory: part.subCategory || undefined },
            ],
          },
        ],
      },
      include: {
        stock: true,
        models: true,
      },
      take: 10, // Limit to 10 related parts
    });

    res.json({
      stock: part.stock,
      kits: part.kitItems.map(item => ({
        kitId: item.kit.id,
        kitNo: item.kit.kitNo,
        kitName: item.kit.name,
        quantity: item.quantity,
        status: item.kit.status,
      })),
      categories: {
        mainCategory: part.mainCategory,
        subCategory: part.subCategory,
      },
      relatedParts: relatedParts.map(p => ({
        partNo: p.partNo,
        description: p.description,
        mainCategory: p.mainCategory,
        subCategory: p.subCategory,
        stock: p.stock?.quantity || 0,
        modelCount: p.models.length,
      })),
    });
  } catch (error) {
    console.error('Get part usage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add model to part
router.post('/part/:partId', async (req: AuthRequest, res) => {
  try {
    const { modelNo, qtyUsed, tab } = modelSchema.parse(req.body);

    // Verify part exists
    const part = await prisma.part.findUnique({
      where: { id: req.params.partId },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const model = await prisma.partModel.create({
      data: {
        partId: req.params.partId,
        modelNo,
        qtyUsed,
        tab: tab || 'P1',
      },
    });

    res.status(201).json({ model });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update model
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = modelSchema.partial().parse(req.body);

    const model = await prisma.partModel.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ model });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Model not found' });
    }
    console.error('Update model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete model
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.partModel.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Model not found' });
    }
    console.error('Delete model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

