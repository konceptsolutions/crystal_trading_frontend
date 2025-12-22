import express from 'express';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get inventory stock with filters and pagination
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category as string;
    const subCategory = req.query.subCategory as string;
    const item = req.query.item as string;
    const search = req.query.search as string;

    const where: any = {
      stock: {
        isNot: null,
        quantity: {
          gt: 0, // Only show items with stock quantity > 0 (processed/received items)
        },
      },
    };

    // Filter by category
    if (category) {
      where.mainCategory = { contains: category };
    }

    // Filter by subcategory
    if (subCategory) {
      where.subCategory = { contains: subCategory };
    }

    // Filter by item (part number or description)
    if (item) {
      where.OR = [
        { partNo: { contains: item } },
        { description: { contains: item } },
      ];
    }

    // Search filter
    if (search) {
      where.OR = [
        { partNo: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
        { masterPartNo: { contains: search } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: true,
          models: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.part.count({
        where,
      }),
    ]);

    // Format the data for the frontend
    const stockData = parts.map((part) => ({
      id: part.id,
      partNo: part.partNo || '',
      masterPartNo: part.masterPartNo || '',
      name: part.description || '',
      brand: part.brand || '',
      model: part.models?.[0]?.modelNo || '',
      uom: part.uom || '',
      qty: part.stock?.quantity || 0,
      store: part.stock?.store || '',
      racks: part.stock?.racks || '',
      shelf: part.stock?.shelf || '',
      mainCategory: part.mainCategory || '',
      subCategory: part.subCategory || '',
    }));

    res.json({
      data: stockData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get inventory stock error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch inventory stock',
    });
  }
});

// Get unique categories for filter dropdown
router.get('/categories', async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.part.findMany({
      where: {
        mainCategory: { not: null },
      },
      select: {
        mainCategory: true,
      },
      distinct: ['mainCategory'],
    });

    const categoryList = categories
      .map((c) => c.mainCategory)
      .filter((c): c is string => c !== null);

    res.json({ categories: categoryList });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unique subcategories for filter dropdown
router.get('/subcategories', async (req: AuthRequest, res) => {
  try {
    const category = req.query.category as string;
    const where: any = {
      subCategory: { not: null },
    };

    if (category) {
      where.mainCategory = category;
    }

    const subcategories = await prisma.part.findMany({
      where,
      select: {
        subCategory: true,
      },
      distinct: ['subCategory'],
    });

    const subcategoryList = subcategories
      .map((s) => s.subCategory)
      .filter((s): s is string => s !== null);

    res.json({ subcategories: subcategoryList });
  } catch (error: any) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unique items (parts) for filter dropdown
router.get('/items', async (req: AuthRequest, res) => {
  try {
    const category = req.query.category as string;
    const subCategory = req.query.subCategory as string;
    const search = req.query.search as string;

    const where: any = {};

    if (category) {
      where.mainCategory = category;
    }

    if (subCategory) {
      where.subCategory = subCategory;
    }

    if (search) {
      where.OR = [
        { partNo: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const items = await prisma.part.findMany({
      where,
      select: {
        id: true,
        partNo: true,
        description: true,
      },
      take: 50,
      orderBy: {
        partNo: 'asc',
      },
    });

    res.json({ items });
  } catch (error: any) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

