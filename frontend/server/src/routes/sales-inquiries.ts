import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const salesInquirySchema = z.object({
  inquiryNo: z.string().min(1, 'Inquiry number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  inquiryDate: z.string().optional(),
  status: z.enum(['new', 'contacted', 'quoted', 'converted', 'lost']).optional(),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

router.use(verifyToken);

// Get next inquiry number
router.get('/next-number', async (req: AuthRequest, res) => {
  try {
    const lastInquiry = await prisma.salesInquiry.findFirst({
      orderBy: { inquiryNo: 'desc' },
      select: { inquiryNo: true },
    });

    let nextNumber = 'INQ-001';
    if (lastInquiry) {
      const match = lastInquiry.inquiryNo.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        nextNumber = `INQ-${String(num + 1).padStart(3, '0')}`;
      }
    }

    res.json({ nextNumber });
  } catch (error: any) {
    console.error('Get next inquiry number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sales inquiries
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const where: any = {};
    if (search) {
      where.OR = [
        { inquiryNo: { contains: search } },
        { customerName: { contains: search } },
        { subject: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [inquiries, total] = await Promise.all([
      prisma.salesInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salesInquiry.count({ where }),
    ]);

    res.json({ inquiries, total });
  } catch (error: any) {
    console.error('Get sales inquiries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sales inquiry
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const inquiry = await prisma.salesInquiry.findUnique({
      where: { id: req.params.id },
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Sales inquiry not found' });
    }

    res.json({ inquiry });
  } catch (error: any) {
    console.error('Get sales inquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sales inquiry
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = salesInquirySchema.parse(req.body);

    const existing = await prisma.salesInquiry.findUnique({
      where: { inquiryNo: data.inquiryNo },
    });

    if (existing) {
      return res.status(400).json({ error: 'Inquiry number already exists' });
    }

    const inquiryDate = data.inquiryDate ? new Date(data.inquiryDate) : new Date();
    const followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;

    const inquiry = await prisma.salesInquiry.create({
      data: {
        inquiryNo: data.inquiryNo,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        customerAddress: data.customerAddress || null,
        inquiryDate,
        followUpDate,
        status: data.status || 'new',
        subject: data.subject,
        description: data.description || null,
        notes: data.notes || null,
        createdBy: req.user?.id,
      },
    });

    res.status(201).json({ inquiry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create sales inquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sales inquiry
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = salesInquirySchema.partial().parse(req.body);

    const existing = await prisma.salesInquiry.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sales inquiry not found' });
    }

    if (data.inquiryNo && data.inquiryNo !== existing.inquiryNo) {
      const duplicate = await prisma.salesInquiry.findUnique({
        where: { inquiryNo: data.inquiryNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Inquiry number already exists' });
      }
    }

    const inquiryDate = data.inquiryDate ? new Date(data.inquiryDate) : existing.inquiryDate;
    const followUpDate = data.followUpDate ? new Date(data.followUpDate) : (data.followUpDate === null ? null : existing.followUpDate);

    const inquiry = await prisma.salesInquiry.update({
      where: { id: req.params.id },
      data: {
        ...data,
        inquiryDate,
        followUpDate,
      },
    });

    res.json({ inquiry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update sales inquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sales inquiry
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const inquiry = await prisma.salesInquiry.findUnique({
      where: { id: req.params.id },
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Sales inquiry not found' });
    }

    await prisma.salesInquiry.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sales inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete sales inquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

