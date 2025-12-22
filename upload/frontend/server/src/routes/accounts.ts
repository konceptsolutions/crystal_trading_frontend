import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const mainGroupSchema = z.object({
  code: z.number().int().positive(),
  name: z.string().min(1),
});

const subGroupSchema = z.object({
  mainGroupId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
});

const accountSchema = z.object({
  subGroupId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

// All routes require authentication
router.use(verifyToken);

// ========== MAIN GROUPS ==========

// Get all main groups
router.get('/main-groups', async (req: AuthRequest, res) => {
  try {
    const mainGroups = await prisma.mainGroup.findMany({
      include: {
        subgroups: {
          include: {
            _count: {
              select: { accounts: true },
            },
          },
        },
        _count: {
          select: { subgroups: true },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    res.json({ mainGroups });
  } catch (error: any) {
    console.error('Get main groups error:', error);
    const errorMessage = error.message || 'Internal server error';
    const errorCode = error.code;
    
    // Handle specific Prisma errors
    if (errorCode === 'P2021') {
      return res.status(500).json({ 
        error: 'Database table does not exist',
        message: 'The MainGroup table is missing. Please run: npx prisma db push',
        code: errorCode
      });
    }
    
    if (errorCode === 'P1001') {
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Cannot connect to the database. Please check your DATABASE_URL.',
        code: errorCode
      });
    }
    
    res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
});

// Get single main group
router.get('/main-groups/:id', async (req: AuthRequest, res) => {
  try {
    const mainGroup = await prisma.mainGroup.findUnique({
      where: { id: req.params.id },
      include: {
        subgroups: {
          include: {
            _count: {
              select: { accounts: true },
            },
          },
        },
      },
    });

    if (!mainGroup) {
      return res.status(404).json({ error: 'Main group not found' });
    }

    res.json({ mainGroup });
  } catch (error) {
    console.error('Get main group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create main group
router.post('/main-groups', async (req: AuthRequest, res) => {
  try {
    const data = mainGroupSchema.parse(req.body);

    // Check if code already exists
    const existing = await prisma.mainGroup.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return res.status(400).json({ error: 'Main group code already exists' });
    }

    const mainGroup = await prisma.mainGroup.create({
      data,
    });

    res.status(201).json({ mainGroup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Main group code already exists' });
    }
    console.error('Create main group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update main group
router.put('/main-groups/:id', async (req: AuthRequest, res) => {
  try {
    const data = mainGroupSchema.partial().parse(req.body);

    // If code is being updated, check if it already exists
    if (data.code !== undefined) {
      const existing = await prisma.mainGroup.findUnique({
        where: { code: data.code },
      });

      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ error: 'Main group code already exists' });
      }
    }

    const mainGroup = await prisma.mainGroup.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ mainGroup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Main group not found' });
    }
    console.error('Update main group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete main group
router.delete('/main-groups/:id', async (req: AuthRequest, res) => {
  try {
    // Check if main group has subgroups
    const mainGroup = await prisma.mainGroup.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { subgroups: true },
        },
      },
    });

    if (!mainGroup) {
      return res.status(404).json({ error: 'Main group not found' });
    }

    if (mainGroup._count.subgroups > 0) {
      return res.status(400).json({
        error: 'Cannot delete main group with existing subgroups',
      });
    }

    await prisma.mainGroup.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Main group deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Main group not found' });
    }
    console.error('Delete main group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== SUB GROUPS ==========

// Get all subgroups with filters
router.get('/subgroups', async (req: AuthRequest, res) => {
  try {
    const mainGroupId = req.query.mainGroupId as string;
    const status = req.query.status as string;

    const where: any = {};
    if (mainGroupId) {
      where.mainGroupId = mainGroupId;
    }

    const subgroups = await prisma.subGroup.findMany({
      where,
      include: {
        mainGroup: true,
        _count: {
          select: { accounts: true },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Filter by status if provided (filter accounts, not subgroups)
    let filteredSubgroups = subgroups;
    if (status) {
      filteredSubgroups = await Promise.all(
        subgroups.map(async (sg) => {
          const accounts = await prisma.account.findMany({
            where: {
              subGroupId: sg.id,
              status: status,
            },
          });
          return { ...sg, accountsCount: accounts.length };
        })
      );
    }

    res.json({ subgroups: filteredSubgroups });
  } catch (error) {
    console.error('Get subgroups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single subgroup
router.get('/subgroups/:id', async (req: AuthRequest, res) => {
  try {
    const subGroup = await prisma.subGroup.findUnique({
      where: { id: req.params.id },
      include: {
        mainGroup: true,
        accounts: true,
      },
    });

    if (!subGroup) {
      return res.status(404).json({ error: 'Subgroup not found' });
    }

    res.json({ subGroup });
  } catch (error) {
    console.error('Get subgroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create subgroup
router.post('/subgroups', async (req: AuthRequest, res) => {
  try {
    const data = subGroupSchema.parse(req.body);

    // Check if code already exists for this main group
    const existing = await prisma.subGroup.findFirst({
      where: {
        code: data.code,
        mainGroupId: data.mainGroupId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Subgroup code already exists for this main group' });
    }

    const subGroup = await prisma.subGroup.create({
      data,
      include: {
        mainGroup: true,
      },
    });

    res.status(201).json({ subGroup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }
    console.error('Create subgroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subgroup
router.put('/subgroups/:id', async (req: AuthRequest, res) => {
  try {
    const data = subGroupSchema.partial().parse(req.body);

    // If code is being updated, check if it already exists
    if (data.code !== undefined && data.mainGroupId !== undefined) {
      const existing = await prisma.subGroup.findFirst({
        where: {
          code: data.code,
          mainGroupId: data.mainGroupId,
        },
      });

      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ error: 'Subgroup code already exists for this main group' });
      }
    }

    const subGroup = await prisma.subGroup.update({
      where: { id: req.params.id },
      data,
      include: {
        mainGroup: true,
      },
    });

    res.json({ subGroup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Subgroup not found' });
    }
    console.error('Update subgroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete subgroup
router.delete('/subgroups/:id', async (req: AuthRequest, res) => {
  try {
    // Check if subgroup has accounts
    const subGroup = await prisma.subGroup.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    if (!subGroup) {
      return res.status(404).json({ error: 'Subgroup not found' });
    }

    if (subGroup._count.accounts > 0) {
      return res.status(400).json({
        error: 'Cannot delete subgroup with existing accounts',
      });
    }

    await prisma.subGroup.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Subgroup deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Subgroup not found' });
    }
    console.error('Delete subgroup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ACCOUNTS ==========

// Get all accounts with filters and pagination
router.get('/accounts', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const mainGroupId = req.query.mainGroupId as string;
    const subGroupId = req.query.subGroupId as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};

    if (subGroupId) {
      where.subGroupId = subGroupId;
    } else if (mainGroupId) {
      // Get all subgroups for this main group
      const subgroups = await prisma.subGroup.findMany({
        where: { mainGroupId },
        select: { id: true },
      });
      where.subGroupId = {
        in: subgroups.map(sg => sg.id),
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          subGroup: {
            include: {
              mainGroup: true,
            },
          },
        },
        orderBy: {
          code: 'asc',
        },
      }),
      prisma.account.count({ where }),
    ]);

    res.json({
      accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single account
router.get('/accounts/:id', async (req: AuthRequest, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        subGroup: {
          include: {
            mainGroup: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create account
router.post('/accounts', async (req: AuthRequest, res) => {
  try {
    const data = accountSchema.parse(req.body);

    // Check if code already exists for this subgroup
    const existing = await prisma.account.findFirst({
      where: {
        code: data.code,
        subGroupId: data.subGroupId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Account code already exists for this subgroup' });
    }

    const account = await prisma.account.create({
      data,
      include: {
        subGroup: {
          include: {
            mainGroup: true,
          },
        },
      },
    });

    res.status(201).json({ account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
    }
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update account
router.put('/accounts/:id', async (req: AuthRequest, res) => {
  try {
    const data = accountSchema.partial().parse(req.body);

    // If code is being updated, check if it already exists
    if (data.code !== undefined && data.subGroupId !== undefined) {
      const existing = await prisma.account.findFirst({
        where: {
          code: data.code,
          subGroupId: data.subGroupId,
        },
      });

      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ error: 'Account code already exists for this subgroup' });
      }
    }

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data,
      include: {
        subGroup: {
          include: {
            mainGroup: true,
          },
        },
      },
    });

    res.json({ account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
router.delete('/accounts/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.account.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

