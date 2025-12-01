import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const purchaseOrderSchema = z.object({
  poNo: z.string().min(1, 'PO number is required'),
  type: z.enum(['purchase', 'direct']),
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierEmail: z.string().email().optional().or(z.literal('')),
  supplierPhone: z.string().optional(),
  supplierAddress: z.string().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'received', 'cancelled']).optional(),
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
  })).min(1, 'Purchase order must have at least one item'),
});

// All routes require authentication
router.use(verifyToken);

// Get all purchase orders
router.get('/', async (req: AuthRequest, res) => {
  try {
    const type = req.query.type as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { poNo: { contains: search } },
        { supplierName: { contains: search } },
        { supplierEmail: { contains: search } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
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
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      purchaseOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch purchase orders',
    });
  }
});

// Get single purchase order
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ purchaseOrder });
  } catch (error: any) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create purchase order
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = purchaseOrderSchema.parse(req.body);

    // Check if PO number already exists
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNo: data.poNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'PO number already exists' });
    }

    // Calculate totals
    const subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const totalAmount = subTotal - discount + tax;

    // Parse dates
    const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();
    const expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;

    // Verify supplier exists if supplierId is provided
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
    }

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNo: data.poNo,
        type: data.type,
        supplierId: data.type === 'purchase' ? (data.supplierId || null) : null,
        supplierName: data.supplierName,
        supplierEmail: data.supplierEmail || null,
        supplierPhone: data.supplierPhone || null,
        supplierAddress: data.supplierAddress || null,
        orderDate,
        expectedDate,
        status: data.status || 'draft',
        subTotal,
        tax,
        discount,
        totalAmount,
        notes: data.notes || null,
        createdBy: req.user?.id || null,
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
        supplier: true,
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    res.status(201).json({ purchaseOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update purchase order
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = purchaseOrderSchema.partial().parse(req.body);

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Check for duplicate PO number
    if (data.poNo && data.poNo !== existing.poNo) {
      const duplicate = await prisma.purchaseOrder.findUnique({
        where: { poNo: data.poNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'PO number already exists' });
      }
    }

    // Calculate totals if items are provided
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

    // Parse dates
    const orderDate = data.orderDate ? new Date(data.orderDate) : existing.orderDate;
    const expectedDate = data.expectedDate ? new Date(data.expectedDate) : existing.expectedDate;

    // Verify supplier exists if supplierId is provided
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
    }

    // Handle status changes
    let approvedBy = existing.approvedBy;
    let approvedAt = existing.approvedAt;
    let receivedAt = existing.receivedAt;

    if (data.status === 'approved' && existing.status !== 'approved') {
      approvedBy = req.user?.id || null;
      approvedAt = new Date();
    }

    if (data.status === 'received' && existing.status !== 'received') {
      receivedAt = new Date();
    }

    // Delete existing items if new items are provided
    if (data.items) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: req.params.id },
      });
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        ...data,
        supplierId: data.type === 'purchase' ? (data.supplierId || null) : null,
        subTotal: data.items ? subTotal : undefined,
        totalAmount: data.items || data.discount !== undefined || data.tax !== undefined ? totalAmount : undefined,
        orderDate,
        expectedDate,
        approvedBy,
        approvedAt,
        receivedAt,
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
        supplier: true,
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    res.json({ purchaseOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete purchase order
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Only allow deletion of draft or cancelled orders
    if (!['draft', 'cancelled'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        error: 'Cannot delete purchase order. Only draft or cancelled orders can be deleted.',
      });
    }

    await prisma.purchaseOrder.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

