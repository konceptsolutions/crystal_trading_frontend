import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const deliveryChallanSchema = z.object({
  challanNo: z.string().min(1, 'Challan number is required'),
  invoiceId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  vehicleNo: z.string().optional(),
  driverName: z.string().optional(),
  status: z.enum(['draft', 'dispatched', 'delivered', 'cancelled']).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    partId: z.string().optional(),
    partNo: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    uom: z.string().optional(),
  })).min(1, 'Challan must have at least one item'),
});

router.use(verifyToken);

// Get next challan number
router.get('/next-number', async (req: AuthRequest, res) => {
  try {
    const lastChallan = await prisma.deliveryChallan.findFirst({
      orderBy: { challanNo: 'desc' },
      select: { challanNo: true },
    });

    let nextNumber = 'DC-001';
    if (lastChallan) {
      const match = lastChallan.challanNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        nextNumber = `DC-${String(num + 1).padStart(3, '0')}`;
      }
    }

    res.json({ nextNumber });
  } catch (error: any) {
    console.error('Get next challan number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all delivery challans
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const where: any = {};
    if (search) {
      where.OR = [
        { challanNo: { contains: search } },
        { customerName: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.deliveryChallan.findMany({
        where,
        include: { items: { include: { part: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deliveryChallan.count({ where }),
    ]);

    res.json({ challans, total });
  } catch (error: any) {
    console.error('Get delivery challans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single delivery challan
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const challan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { part: true } } },
    });

    if (!challan) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    res.json({ challan });
  } catch (error: any) {
    console.error('Get delivery challan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create delivery challan
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = deliveryChallanSchema.parse(req.body);

    const existing = await prisma.deliveryChallan.findUnique({
      where: { challanNo: data.challanNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'Challan number already exists' });
    }

    const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : new Date();

    const challan = await prisma.deliveryChallan.create({
      data: {
        challanNo: data.challanNo,
        invoiceId: data.invoiceId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        customerAddress: data.customerAddress || null,
        deliveryDate,
        deliveryAddress: data.deliveryAddress || null,
        vehicleNo: data.vehicleNo || null,
        driverName: data.driverName || null,
        status: data.status || 'draft',
        notes: data.notes || null,
        createdBy: req.user?.id,
        items: {
          create: data.items.map(item => ({
            partId: item.partId || null,
            partNo: item.partNo,
            description: item.description || null,
            quantity: item.quantity,
            uom: item.uom || null,
          })),
        },
      },
      include: { items: { include: { part: true } } },
    });

    res.status(201).json({ challan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create delivery challan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update delivery challan
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = deliveryChallanSchema.partial().parse(req.body);

    const existing = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    if (data.challanNo && data.challanNo !== existing.challanNo) {
      const duplicate = await prisma.deliveryChallan.findUnique({
        where: { challanNo: data.challanNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Challan number already exists' });
      }
    }

    const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : existing.deliveryDate;

    if (data.items) {
      await prisma.deliveryChallanItem.deleteMany({
        where: { deliveryChallanId: req.params.id },
      });
    }

    const challan = await prisma.deliveryChallan.update({
      where: { id: req.params.id },
      data: {
        ...data,
        deliveryDate,
        items: data.items ? {
          create: data.items.map(item => ({
            partId: item.partId || null,
            partNo: item.partNo,
            description: item.description || null,
            quantity: item.quantity,
            uom: item.uom || null,
          })),
        } : undefined,
      },
      include: { items: { include: { part: true } } },
    });

    res.json({ challan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update delivery challan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete delivery challan
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const challan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
    });

    if (!challan) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    await prisma.deliveryChallan.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Delivery challan deleted successfully' });
  } catch (error) {
    console.error('Delete delivery challan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

