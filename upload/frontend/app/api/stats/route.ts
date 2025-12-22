import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Generate sparkline data (last 14 days)
    const sparklineData = await generateSparklineData();

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate sparkline data for the last 14 days
async function generateSparklineData() {
  const days = 14;
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

  // Get initial counts to ensure we have baseline data
  const [initialParts, initialCategories, initialKits, initialSuppliers] = await Promise.all([
    prisma.part.count({ where: { status: 'A' } }),
    prisma.category.count({ where: { status: 'A' } }),
    prisma.kit.count({ where: { status: 'A' } }),
    prisma.supplier.count({ where: { status: 'A' } }),
  ]);

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

    // Ensure we always have at least the current count (prevents going backwards)
    sparklineData.parts.push(Math.max(partsCount, initialParts));
    sparklineData.categories.push(Math.max(categoriesCount, initialCategories));
    sparklineData.kits.push(Math.max(kitsCount, initialKits));
    sparklineData.suppliers.push(Math.max(suppliersCount, initialSuppliers));
  }

  // Ensure the data is always increasing or stable (monotonic) for better visualization
  const makeMonotonic = (arr: number[]): number[] => {
    const result = [...arr];
    for (let i = 1; i < result.length; i++) {
      if (result[i] < result[i - 1]) {
        result[i] = result[i - 1];
      }
    }
    return result;
  };

  return {
    parts: makeMonotonic(sparklineData.parts),
    categories: makeMonotonic(sparklineData.categories),
    kits: makeMonotonic(sparklineData.kits),
    suppliers: makeMonotonic(sparklineData.suppliers),
  };
}

