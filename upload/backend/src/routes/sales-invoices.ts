import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const salesInvoiceSchema = z.object({
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  quotationId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  subTotal: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  totalAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  balanceAmount: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    partId: z.string().optional(),
    partNo: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    uom: z.string().optional(),
  })).min(1, 'Invoice must have at least one item'),
});

// All routes require authentication
router.use(verifyToken);

// Get all sales invoices
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    res.json({ invoices, total });
  } catch (error: any) {
    console.error('Get sales invoices error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch sales invoices',
    });
  }
});

// Get next invoice number
router.get('/next-number', async (req: AuthRequest, res) => {
  try {
    const lastInvoice = await prisma.salesInvoice.findFirst({
      orderBy: {
        invoiceNo: 'desc',
      },
      select: {
        invoiceNo: true,
      },
    });

    let nextNumber = '01';
    if (lastInvoice) {
      // Extract number from invoiceNo (assuming format like "INV-01" or "01")
      const match = lastInvoice.invoiceNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        nextNumber = String(num + 1).padStart(2, '0');
      }
    }

    res.json({ nextNumber });
  } catch (error: any) {
    console.error('Get next invoice number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sales invoice
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Sales invoice not found' });
    }

    res.json({ invoice });
  } catch (error: any) {
    console.error('Get sales invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sales invoice
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = salesInvoiceSchema.parse(req.body);

    // Check if invoice number already exists
    const existing = await prisma.salesInvoice.findUnique({
      where: { invoiceNo: data.invoiceNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    // Calculate totals
    const subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const totalAmount = subTotal - discount + tax;
    const paidAmount = data.paidAmount || 0;
    const balanceAmount = totalAmount - paidAmount;

    const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
    const dueDate = new Date(data.dueDate);

    const invoice = await prisma.salesInvoice.create({
      data: {
        invoiceNo: data.invoiceNo,
        quotationId: data.quotationId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        customerAddress: data.customerAddress || null,
        invoiceDate,
        dueDate,
        status: data.status || 'draft',
        subTotal,
        tax,
        discount,
        totalAmount,
        paidAmount,
        balanceAmount,
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
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    res.status(201).json({ invoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create sales invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sales invoice
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = salesInvoiceSchema.partial().parse(req.body);

    const existing = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sales invoice not found' });
    }

    // Check for duplicate invoice number
    if (data.invoiceNo && data.invoiceNo !== existing.invoiceNo) {
      const duplicate = await prisma.salesInvoice.findUnique({
        where: { invoiceNo: data.invoiceNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Invoice number already exists' });
      }
    }

    // Calculate totals if items are provided
    let subTotal = existing.subTotal;
    let totalAmount = existing.totalAmount;
    let balanceAmount = existing.balanceAmount;

    if (data.items) {
      subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = data.discount !== undefined ? data.discount : existing.discount;
      const tax = data.tax !== undefined ? data.tax : existing.tax;
      totalAmount = subTotal - discount + tax;
      const paidAmount = data.paidAmount !== undefined ? data.paidAmount : existing.paidAmount;
      balanceAmount = totalAmount - paidAmount;
    } else if (data.discount !== undefined || data.tax !== undefined) {
      const discount = data.discount !== undefined ? data.discount : existing.discount;
      const tax = data.tax !== undefined ? data.tax : existing.tax;
      totalAmount = existing.subTotal - discount + tax;
      const paidAmount = data.paidAmount !== undefined ? data.paidAmount : existing.paidAmount;
      balanceAmount = totalAmount - paidAmount;
    } else if (data.paidAmount !== undefined) {
      balanceAmount = existing.totalAmount - data.paidAmount;
    }

    const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : existing.invoiceDate;
    const dueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate;

    // Delete existing items if new items are provided
    if (data.items) {
      await prisma.salesInvoiceItem.deleteMany({
        where: { salesInvoiceId: req.params.id },
      });
    }

    const invoice = await prisma.salesInvoice.update({
      where: { id: req.params.id },
      data: {
        ...data,
        subTotal: data.items ? subTotal : undefined,
        totalAmount: data.items || data.discount !== undefined || data.tax !== undefined ? totalAmount : undefined,
        balanceAmount: data.items || data.discount !== undefined || data.tax !== undefined || data.paidAmount !== undefined ? balanceAmount : undefined,
        invoiceDate,
        dueDate,
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
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    res.json({ invoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update sales invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sales invoice
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Sales invoice not found' });
    }

    await prisma.salesInvoice.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sales invoice deleted successfully' });
  } catch (error) {
    console.error('Delete sales invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

