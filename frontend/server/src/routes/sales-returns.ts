import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const salesReturnSchema = z.object({
  returnNo: z.string().min(1, 'Return number is required'),
  invoiceId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  returnDate: z.string().optional(),
  status: z.enum(['draft', 'approved', 'processed', 'rejected']).optional(),
  totalAmount: z.number().optional(),
  refundAmount: z.number().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    partId: z.string().optional(),
    partNo: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    returnReason: z.string().min(1, 'Return reason is required'),
    uom: z.string().optional(),
  })).min(1, 'Return must have at least one item'),
});

router.use(verifyToken);

// Get next return number
router.get('/next-number', async (req: AuthRequest, res) => {
  try {
    const lastReturn = await prisma.salesReturn.findFirst({
      orderBy: { returnNo: 'desc' },
      select: { returnNo: true },
    });

    let nextNumber = 'SR-001';
    if (lastReturn) {
      const match = lastReturn.returnNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        nextNumber = `SR-${String(num + 1).padStart(3, '0')}`;
      }
    }

    res.json({ nextNumber });
  } catch (error: any) {
    console.error('Get next return number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sales returns
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const where: any = {};
    if (search) {
      where.OR = [
        { returnNo: { contains: search } },
        { customerName: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [returns, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        include: { items: { include: { part: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salesReturn.count({ where }),
    ]);

    res.json({ returns, total });
  } catch (error: any) {
    console.error('Get sales returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sales return
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const returnItem = await prisma.salesReturn.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { part: true } } },
    });

    if (!returnItem) {
      return res.status(404).json({ error: 'Sales return not found' });
    }

    res.json({ return: returnItem });
  } catch (error: any) {
    console.error('Get sales return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sales return
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = salesReturnSchema.parse(req.body);

    const existing = await prisma.salesReturn.findUnique({
      where: { returnNo: data.returnNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'Return number already exists' });
    }

    const returnDate = data.returnDate ? new Date(data.returnDate) : new Date();
    const totalAmount = data.totalAmount || 0;
    const refundAmount = data.refundAmount || totalAmount;

    const returnItem = await prisma.salesReturn.create({
      data: {
        returnNo: data.returnNo,
        invoiceId: data.invoiceId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        returnDate,
        status: data.status || 'draft',
        totalAmount,
        refundAmount,
        reason: data.reason || null,
        notes: data.notes || null,
        createdBy: req.user?.id,
        items: {
          create: data.items.map(item => ({
            partId: item.partId || null,
            partNo: item.partNo,
            description: item.description || null,
            quantity: item.quantity,
            returnReason: item.returnReason,
            uom: item.uom || null,
          })),
        },
      },
      include: { items: { include: { part: true } } },
    });

    res.status(201).json({ return: returnItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create sales return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sales return
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = salesReturnSchema.partial().parse(req.body);

    const existing = await prisma.salesReturn.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sales return not found' });
    }

    if (data.returnNo && data.returnNo !== existing.returnNo) {
      const duplicate = await prisma.salesReturn.findUnique({
        where: { returnNo: data.returnNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Return number already exists' });
      }
    }

    const returnDate = data.returnDate ? new Date(data.returnDate) : existing.returnDate;
    const totalAmount = data.totalAmount !== undefined ? data.totalAmount : existing.totalAmount;
    const refundAmount = data.refundAmount !== undefined ? data.refundAmount : existing.refundAmount;

    if (data.items) {
      await prisma.salesReturnItem.deleteMany({
        where: { salesReturnId: req.params.id },
      });
    }

    const returnItem = await prisma.salesReturn.update({
      where: { id: req.params.id },
      data: {
        ...data,
        returnDate,
        totalAmount,
        refundAmount,
        items: data.items ? {
          create: data.items.map(item => ({
            partId: item.partId || null,
            partNo: item.partNo,
            description: item.description || null,
            quantity: item.quantity,
            returnReason: item.returnReason,
            uom: item.uom || null,
          })),
        } : undefined,
      },
      include: { items: { include: { part: true } } },
    });

    res.json({ return: returnItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update sales return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sales return
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const returnItem = await prisma.salesReturn.findUnique({
      where: { id: req.params.id },
    });

    if (!returnItem) {
      return res.status(404).json({ error: 'Sales return not found' });
    }

    await prisma.salesReturn.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sales return deleted successfully' });
  } catch (error) {
    console.error('Delete sales return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

