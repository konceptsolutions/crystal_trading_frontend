import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['main', 'sub']),
  parentId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all categories
router.get('/', async (req: AuthRequest, res) => {
  try {
    const type = req.query.type as string;
    const parentId = req.query.parentId as string;
    const status = req.query.status as string;

    const where: any = {};
    if (type) where.type = type;
    if (parentId) where.parentId = parentId;
    if (status) where.status = status;

    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: true,
        subcategories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        subcategories: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = categorySchema.parse(req.body);

    // If it's a subcategory, verify parent exists
    if (data.type === 'sub' && data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return res.status(404).json({ error: 'Parent category not found' });
      }

      if (parent.type !== 'main') {
        return res.status(400).json({ error: 'Parent must be a main category' });
      }
    }

    // Check if category name already exists for the same type/parent
    const existing = await prisma.category.findFirst({
      where: {
        name: data.name,
        type: data.type,
        parentId: data.parentId || null,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        parentId: data.type === 'sub' ? data.parentId : null,
        description: data.description,
        status: data.status || 'A',
      },
      include: {
        parent: true,
        subcategories: true,
      },
    });

    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If changing to subcategory, verify parent exists
    if (data.type === 'sub' && data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return res.status(404).json({ error: 'Parent category not found' });
      }

      if (parent.type !== 'main') {
        return res.status(400).json({ error: 'Parent must be a main category' });
      }
    }

    // Check for duplicate name
    if (data.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name: data.name,
          type: data.type || existing.type,
          parentId: data.parentId !== undefined ? data.parentId : existing.parentId,
          id: { not: req.params.id },
        },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...data,
        parentId: data.type === 'sub' ? data.parentId : data.parentId || null,
      },
      include: {
        parent: true,
        subcategories: true,
      },
    });

    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        subcategories: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has subcategories
    if (category.subcategories.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with subcategories. Please delete subcategories first.' 
      });
    }

    // Check if category is used in parts
    const partsCount = await prisma.part.count({
      where: {
        OR: [
          { mainCategory: category.name },
          { subCategory: category.name },
        ],
      },
    });

    if (partsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It is used by ${partsCount} part(s).` 
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

