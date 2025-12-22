import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  cnic: z.string().optional(),
  status: z.enum(['A', 'I']).optional(),
  openingBalance: z.number().optional().default(0),
  creditBalance: z.number().optional().default(0),
  creditLimit: z.number().optional().default(0),
});

// All routes require authentication
router.use(verifyToken);

// Get all customers
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const searchBy = req.query.searchBy as string || 'name';

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status === 'Active' ? 'A' : 'I';
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      if (searchBy === 'name') {
        where.name = { contains: search };
      } else if (searchBy === 'phone') {
        where.phone = { contains: search };
      } else if (searchBy === 'email') {
        where.email = { contains: search };
      } else {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { cnic: { contains: search } },
        ];
      }
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { salesInvoices: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ customers });
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch customers',
    });
  }
});

// Get single customer
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { salesInvoices: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error: any) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create customer
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = customerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        cnic: data.cnic || null,
        status: data.status || 'A',
        openingBalance: data.openingBalance || 0,
        creditBalance: data.creditBalance || 0,
        creditLimit: data.creditLimit || 0,
      },
    });

    res.status(201).json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = customerSchema.partial().parse(req.body);

    const existing = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...data,
        email: data.email !== undefined ? (data.email || null) : undefined,
        phone: data.phone !== undefined ? (data.phone || null) : undefined,
        address: data.address !== undefined ? (data.address || null) : undefined,
        cnic: data.cnic !== undefined ? (data.cnic || null) : undefined,
        status: data.status !== undefined ? data.status : undefined,
        openingBalance: data.openingBalance !== undefined ? data.openingBalance : undefined,
        creditBalance: data.creditBalance !== undefined ? data.creditBalance : undefined,
        creditLimit: data.creditLimit !== undefined ? data.creditLimit : undefined,
      },
    });

    res.json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete customer
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { salesInvoices: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has sales invoices
    if (customer._count.salesInvoices > 0) {
      return res.status(400).json({
        error: `Cannot delete customer. It is used by ${customer._count.salesInvoices} sales invoice(s).`,
      });
    }

    await prisma.customer.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

