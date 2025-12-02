import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const salesQuotationSchema = z.object({
  quotationNo: z.string().min(1, 'Quotation number is required'),
  inquiryId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  quotationDate: z.string().optional(),
  validUntil: z.string().min(1, 'Valid until date is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  subTotal: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  totalAmount: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    partId: z.string().optional(),
    partNo: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    uom: z.string().optional(),
  })).min(1, 'Quotation must have at least one item'),
});

router.use(verifyToken);

// Get next quotation number
router.get('/next-number', async (req: AuthRequest, res) => {
  try {
    const lastQuotation = await prisma.salesQuotation.findFirst({
      orderBy: { quotationNo: 'desc' },
      select: { quotationNo: true },
    });

    let nextNumber = 'SQ-001';
    if (lastQuotation) {
      const match = lastQuotation.quotationNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        nextNumber = `SQ-${String(num + 1).padStart(3, '0')}`;
      }
    }

    res.json({ nextNumber });
  } catch (error: any) {
    console.error('Get next quotation number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sales quotations
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const where: any = {};
    if (search) {
      where.OR = [
        { quotationNo: { contains: search } },
        { customerName: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [quotations, total] = await Promise.all([
      prisma.salesQuotation.findMany({
        where,
        include: { items: { include: { part: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salesQuotation.count({ where }),
    ]);

    res.json({ quotations, total });
  } catch (error: any) {
    console.error('Get sales quotations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sales quotation
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const quotation = await prisma.salesQuotation.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { part: true } } },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Sales quotation not found' });
    }

    res.json({ quotation });
  } catch (error: any) {
    console.error('Get sales quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sales quotation
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = salesQuotationSchema.parse(req.body);

    const existing = await prisma.salesQuotation.findUnique({
      where: { quotationNo: data.quotationNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'Quotation number already exists' });
    }

    const subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const totalAmount = subTotal - discount + tax;

    const quotationDate = data.quotationDate ? new Date(data.quotationDate) : new Date();
    const validUntil = new Date(data.validUntil);

    const quotation = await prisma.salesQuotation.create({
      data: {
        quotationNo: data.quotationNo,
        inquiryId: data.inquiryId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        customerAddress: data.customerAddress || null,
        quotationDate,
        validUntil,
        status: data.status || 'draft',
        subTotal,
        tax,
        discount,
        totalAmount,
        notes: data.notes || null,
        createdBy: req.user?.id,
        items: {
          create: data.items.map(item => ({
            partId: item.partId || null,
            partNo: item.partNo,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            uom: item.uom || null,
          })),
        },
      },
      include: { items: { include: { part: true } } },
    });

    res.status(201).json({ quotation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create sales quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sales quotation
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = salesQuotationSchema.partial().parse(req.body);

    const existing = await prisma.salesQuotation.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sales quotation not found' });
    }

    if (data.quotationNo && data.quotationNo !== existing.quotationNo) {
      const duplicate = await prisma.salesQuotation.findUnique({
        where: { quotationNo: data.quotationNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Quotation number already exists' });
      }
    }

    let subTotal = existing.subTotal;
    let totalAmount = existing.totalAmount;

    if (data.items) {
      subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = data.discount !== undefined ? data.discount : existing.discount;
      const tax = data.tax !== undefined ? data.tax : existing.tax;
      totalAmount = subTotal - discount + tax;
    } else if (data.discount !== undefined || data.tax !== undefined) {
      const discount = data.discount !== undefined ? data.discount : existing.discount;
      const tax = data.tax !== undefined ? data.tax : existing.tax;
      totalAmount = existing.subTotal - discount + tax;
    }

    const quotationDate = data.quotationDate ? new Date(data.quotationDate) : existing.quotationDate;
    const validUntil = data.validUntil ? new Date(data.validUntil) : existing.validUntil;

    if (data.items) {
      await prisma.salesQuotationItem.deleteMany({
        where: { salesQuotationId: req.params.id },
      });
    }

    const quotation = await prisma.salesQuotation.update({
      where: { id: req.params.id },
      data: {
        ...data,
        subTotal: data.items ? subTotal : undefined,
        totalAmount: data.items || data.discount !== undefined || data.tax !== undefined ? totalAmount : undefined,
        quotationDate,
        validUntil,
        items: data.items ? {
          create: data.items.map(item => ({
            partId: item.partId || null,
            partNo: item.partNo,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            uom: item.uom || null,
          })),
        } : undefined,
      },
      include: { items: { include: { part: true } } },
    });

    res.json({ quotation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update sales quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sales quotation
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const quotation = await prisma.salesQuotation.findUnique({
      where: { id: req.params.id },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Sales quotation not found' });
    }

    await prisma.salesQuotation.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sales quotation deleted successfully' });
  } catch (error) {
    console.error('Delete sales quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

