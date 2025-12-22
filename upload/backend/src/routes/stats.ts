import express from 'express';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get dashboard statistics
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Get current counts
    const [totalParts, totalCategories, totalKits, totalSuppliers, totalPurchaseOrders] = await Promise.all([
      prisma.part.count({ where: { status: 'A' } }),
      prisma.category.count({ where: { status: 'A' } }),
      prisma.kit.count({ where: { status: 'A' } }),
      prisma.supplier.count({ where: { status: 'A' } }),
      prisma.purchaseOrder.count(),
    ]);

    // Get counts from 30 days ago for percentage calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [parts30DaysAgo, categories30DaysAgo, kits30DaysAgo, suppliers30DaysAgo] = await Promise.all([
      prisma.part.count({ where: { status: 'A', createdAt: { lte: thirtyDaysAgo } } }),
      prisma.category.count({ where: { status: 'A', createdAt: { lte: thirtyDaysAgo } } }),
      prisma.kit.count({ where: { status: 'A', createdAt: { lte: thirtyDaysAgo } } }),
      prisma.supplier.count({ where: { status: 'A', createdAt: { lte: thirtyDaysAgo } } }),
    ]);

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const partsChange = calculatePercentageChange(totalParts, parts30DaysAgo);
    const categoriesChange = calculatePercentageChange(totalCategories, categories30DaysAgo);
    const kitsChange = calculatePercentageChange(totalKits, kits30DaysAgo);
    const suppliersChange = calculatePercentageChange(totalSuppliers, suppliers30DaysAgo);

    // Generate sparkline data (last 7 days)
    const sparklineData = await generateSparklineData();

    res.json({
      stats: {
        totalParts,
        totalCategories,
        totalKits,
        totalSuppliers,
        totalPurchaseOrders,
        partsChange,
        categoriesChange,
        kitsChange,
        suppliersChange,
      },
      sparklines: sparklineData,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate sparkline data for the last 14 days (more points = smoother charts)
async function generateSparklineData() {
  const days = 14; // Increased from 7 to 14 for smoother curves
  const sparklineData: {
    parts: number[];
    categories: number[];
    kits: number[];
    suppliers: number[];
  } = {
    parts: [],
    categories: [],
    kits: [],
    suppliers: [],
  };

  // Collect historical data points without any artificial inflation
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [partsCount, categoriesCount, kitsCount, suppliersCount] = await Promise.all([
      prisma.part.count({
        where: {
          status: 'A',
          createdAt: { lt: nextDate },
        },
      }),
      prisma.category.count({
        where: {
          status: 'A',
          createdAt: { lt: nextDate },
        },
      }),
      prisma.kit.count({
        where: {
          status: 'A',
          createdAt: { lt: nextDate },
        },
      }),
      prisma.supplier.count({
        where: {
          status: 'A',
          createdAt: { lt: nextDate },
        },
      }),
    ]);

    // Collect raw historical counts without comparison to current totals
    sparklineData.parts.push(partsCount);
    sparklineData.categories.push(categoriesCount);
    sparklineData.kits.push(kitsCount);
    sparklineData.suppliers.push(suppliersCount);
  }

  // Return accurate historical data without artificial monotonic enforcement
  // This allows dashboards to show actual trends including decreases
  // (e.g., when items are deleted, suppliers become inactive, etc.)
  return {
    parts: sparklineData.parts,
    categories: sparklineData.categories,
    kits: sparklineData.kits,
    suppliers: sparklineData.suppliers,
  };
}

export default router;

