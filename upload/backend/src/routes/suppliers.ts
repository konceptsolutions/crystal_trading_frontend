import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const supplierSchema = z.object({
  code: z.string().min(1, 'Supplier code is required'),
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  contactPerson: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all suppliers with pagination and filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const searchField = req.query.searchField as string; // Field to search in
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Search functionality
    if (search) {
      if (searchField && searchField !== 'all') {
        // Search in specific field
        switch (searchField) {
          case 'name':
            where.name = { contains: search };
            break;
          case 'code':
            where.code = { contains: search };
            break;
          case 'email':
            where.email = { contains: search };
            break;
          case 'phone':
            where.phone = { contains: search };
            break;
          case 'address':
            where.address = { contains: search };
            break;
          case 'contactPerson':
            where.contactPerson = { contains: search };
            break;
          default:
            where.name = { contains: search };
        }
      } else {
        // Search in all fields
        where.OR = [
          { code: { contains: search } },
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { contactPerson: { contains: search } },
          { city: { contains: search } },
          { state: { contains: search } },
        ];
      }
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch suppliers',
    });
  }
});

// Get single supplier
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ supplier });
  } catch (error: any) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create supplier
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = supplierSchema.parse(req.body);

    // Check if supplier code already exists
    const existing = await prisma.supplier.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return res.status(400).json({ error: 'Supplier code already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        code: data.code,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        zipCode: data.zipCode || null,
        contactPerson: data.contactPerson || null,
        taxId: data.taxId || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        status: data.status || 'A',
      },
    });

    res.status(201).json({ supplier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = supplierSchema.partial().parse(req.body);

    const existing = await prisma.supplier.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check for duplicate code
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.supplier.findUnique({
        where: { code: data.code },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Supplier code already exists' });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...data,
        email: data.email !== undefined ? (data.email || null) : undefined,
        phone: data.phone !== undefined ? (data.phone || null) : undefined,
        address: data.address !== undefined ? (data.address || null) : undefined,
        city: data.city !== undefined ? (data.city || null) : undefined,
        state: data.state !== undefined ? (data.state || null) : undefined,
        country: data.country !== undefined ? (data.country || null) : undefined,
        zipCode: data.zipCode !== undefined ? (data.zipCode || null) : undefined,
        contactPerson: data.contactPerson !== undefined ? (data.contactPerson || null) : undefined,
        taxId: data.taxId !== undefined ? (data.taxId || null) : undefined,
        paymentTerms: data.paymentTerms !== undefined ? (data.paymentTerms || null) : undefined,
        notes: data.notes !== undefined ? (data.notes || null) : undefined,
      },
    });

    res.json({ supplier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete supplier
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier has purchase orders
    if (supplier._count.purchaseOrders > 0) {
      return res.status(400).json({
        error: `Cannot delete supplier. It is used by ${supplier._count.purchaseOrders} purchase order(s).`,
      });
    }

    await prisma.supplier.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

