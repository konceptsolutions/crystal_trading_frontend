import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const adjustmentSchema = z.object({
  adjustmentNo: z.string().optional(),
  total: z.number().default(0),
  date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    partId: z.string().optional(),
    partNo: z.string().min(1),
    description: z.string().optional(),
    previousQuantity: z.number().int().default(0),
    adjustedQuantity: z.number().int(),
    reason: z.string().optional(),
  })).min(1, 'Adjustment must have at least one item'),
});

// All routes require authentication
router.use(verifyToken);

// Get all inventory adjustments
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [adjustments, total] = await Promise.all([
      prisma.inventoryAdjustment.findMany({
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.inventoryAdjustment.count(),
    ]);

    res.json({
      adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get inventory adjustments error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch inventory adjustments',
    });
  }
});

// Get single inventory adjustment
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const adjustment = await prisma.inventoryAdjustment.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!adjustment) {
      return res.status(404).json({ error: 'Inventory adjustment not found' });
    }

    res.json({ adjustment });
  } catch (error: any) {
    console.error('Get inventory adjustment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory adjustment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = adjustmentSchema.parse(req.body);

    // Calculate new quantities and update stock
    const itemsWithNewQuantity = data.items.map(item => ({
      ...item,
      newQuantity: item.previousQuantity + item.adjustedQuantity,
    }));

    // Calculate total
    const total = itemsWithNewQuantity.reduce((sum, item) => {
      // You might want to calculate based on part cost or other logic
      return sum + Math.abs(item.adjustedQuantity);
    }, 0);

    // Parse date
    const date = data.date ? new Date(data.date) : new Date();

    // Create adjustment with items in a transaction
    const adjustment = await prisma.$transaction(async (tx) => {
      // Create the adjustment
      const newAdjustment = await tx.inventoryAdjustment.create({
        data: {
          adjustmentNo: data.adjustmentNo || undefined,
          total,
          date,
          notes: data.notes || null,
          createdBy: req.user?.id || null,
          items: {
            create: itemsWithNewQuantity.map(item => ({
              partId: item.partId || null,
              partNo: item.partNo,
              description: item.description || null,
              previousQuantity: item.previousQuantity,
              adjustedQuantity: item.adjustedQuantity,
              newQuantity: item.newQuantity,
              reason: item.reason || null,
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

      // Update stock for each item
      for (const item of itemsWithNewQuantity) {
        if (item.partId) {
          // Update or create stock entry
          const existingStock = await tx.stock.findUnique({
            where: { partId: item.partId },
          });

          if (existingStock) {
            await tx.stock.update({
              where: { partId: item.partId },
              data: {
                quantity: item.newQuantity,
              },
            });
          } else {
            await tx.stock.create({
              data: {
                partId: item.partId,
                quantity: item.newQuantity,
              },
            });
          }
        }
      }

      return newAdjustment;
    });

    res.status(201).json({ adjustment });
  } catch (error: any) {
    console.error('Create inventory adjustment error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to create inventory adjustment',
    });
  }
});

// Update inventory adjustment
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.inventoryAdjustment.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory adjustment not found' });
    }

    const data = adjustmentSchema.parse(req.body);

    // Calculate new quantities
    const itemsWithNewQuantity = data.items.map(item => ({
      ...item,
      newQuantity: item.previousQuantity + item.adjustedQuantity,
    }));

    const total = itemsWithNewQuantity.reduce((sum, item) => {
      return sum + Math.abs(item.adjustedQuantity);
    }, 0);

    const date = data.date ? new Date(data.date) : existing.date;

    // Update adjustment in transaction
    const adjustment = await prisma.$transaction(async (tx) => {
      // Revert previous stock changes
      for (const oldItem of existing.items) {
        if (oldItem.partId) {
          const stock = await tx.stock.findUnique({
            where: { partId: oldItem.partId },
          });
          if (stock) {
            await tx.stock.update({
              where: { partId: oldItem.partId },
              data: {
                quantity: stock.quantity - oldItem.adjustedQuantity,
              },
            });
          }
        }
      }

      // Delete old items
      await tx.inventoryAdjustmentItem.deleteMany({
        where: { adjustmentId: req.params.id },
      });

      // Create new adjustment with updated items
      const updated = await tx.inventoryAdjustment.update({
        where: { id: req.params.id },
        data: {
          adjustmentNo: data.adjustmentNo || undefined,
          total,
          date,
          notes: data.notes || null,
          items: {
            create: itemsWithNewQuantity.map(item => ({
              partId: item.partId || null,
              partNo: item.partNo,
              description: item.description || null,
              previousQuantity: item.previousQuantity,
              adjustedQuantity: item.adjustedQuantity,
              newQuantity: item.newQuantity,
              reason: item.reason || null,
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

      // Apply new stock changes
      for (const item of itemsWithNewQuantity) {
        if (item.partId) {
          const stock = await tx.stock.findUnique({
            where: { partId: item.partId },
          });
          if (stock) {
            await tx.stock.update({
              where: { partId: item.partId },
              data: {
                quantity: item.newQuantity,
              },
            });
          } else {
            await tx.stock.create({
              data: {
                partId: item.partId,
                quantity: item.newQuantity,
              },
            });
          }
        }
      }

      return updated;
    });

    res.json({ adjustment });
  } catch (error: any) {
    console.error('Update inventory adjustment error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update inventory adjustment',
    });
  }
});

// Delete inventory adjustment
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.inventoryAdjustment.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory adjustment not found' });
    }

    // Revert stock changes in transaction
    await prisma.$transaction(async (tx) => {
      // Revert stock changes
      for (const item of existing.items) {
        if (item.partId) {
          const stock = await tx.stock.findUnique({
            where: { partId: item.partId },
          });
          if (stock) {
            await tx.stock.update({
              where: { partId: item.partId },
              data: {
                quantity: stock.quantity - item.adjustedQuantity,
              },
            });
          }
        }
      }

      // Delete adjustment (items will be deleted via cascade)
      await tx.inventoryAdjustment.delete({
        where: { id: req.params.id },
      });
    });

    res.json({ message: 'Inventory adjustment deleted successfully' });
  } catch (error: any) {
    console.error('Delete inventory adjustment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to delete inventory adjustment',
    });
  }
});

export default router;

