import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const modelSchema = z.object({
  modelNo: z.string().min(1),
  qtyUsed: z.number().int().min(1),
  tab: z.enum(['P1', 'P2']).default('P1'),
});

// All routes require authentication
router.use(verifyToken);

// Get models for a part
router.get('/part/:partId', async (req: AuthRequest, res) => {
  try {
    const models = await prisma.partModel.findMany({
      where: { partId: req.params.partId },
      orderBy: [
        { tab: 'asc' },
        { modelNo: 'asc' },
      ],
    });

    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add model to part
router.post('/part/:partId', async (req: AuthRequest, res) => {
  try {
    const { modelNo, qtyUsed, tab } = modelSchema.parse(req.body);

    // Verify part exists
    const part = await prisma.part.findUnique({
      where: { id: req.params.partId },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const model = await prisma.partModel.create({
      data: {
        partId: req.params.partId,
        modelNo,
        qtyUsed,
        tab: tab || 'P1',
      },
    });

    res.status(201).json({ model });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update model
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = modelSchema.partial().parse(req.body);

    const model = await prisma.partModel.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ model });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Model not found' });
    }
    console.error('Update model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete model
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.partModel.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Model not found' });
    }
    console.error('Delete model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

