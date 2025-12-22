import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get all applications from Application table
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const subCategoryId = searchParams.get('subCategoryId');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.name = { contains: search };
    }

    // Try to filter by subCategoryId if provided, but handle case where column doesn't exist
    let applications;
    try {
      if (subCategoryId) {
        where.subCategoryId = subCategoryId;
      }

      applications = await prisma.application.findMany({
        where,
        include: {
          subCategory: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error: any) {
      // If subCategoryId column doesn't exist, retry without it
      if (error.code === 'P2022' && error.meta?.column?.includes('subCategoryId')) {
        console.warn('subCategoryId column not found in database, querying without subCategoryId filter');
        // Remove subCategoryId from where clause
        const { subCategoryId: _, ...whereWithoutSubCategory } = where;
        applications = await prisma.application.findMany({
          where: whereWithoutSubCategory,
          orderBy: {
            name: 'asc',
          },
        });
      } else {
        throw error;
      }
    }

    // Return just the names for backward compatibility
    const applicationNames = applications.map((app: any) => app.name);
    return NextResponse.json({ applications: applicationNames });
  } catch (error: any) {
    console.error('Applications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Add a new application
export async function POST(request: NextRequest) {
  let body: any;
  try {
    // Read body first
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, subCategoryId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Application name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Verify sub-category exists and is a sub-category (type === 'sub') if subCategoryId is provided
    if (subCategoryId) {
      const subCategory = await prisma.category.findUnique({
        where: { id: subCategoryId },
      });

      if (!subCategory) {
        return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
      }

      if (subCategory.type !== 'sub') {
        return NextResponse.json({ error: 'Selected category is not a sub-category' }, { status: 400 });
      }
    }

    // Check if application already exists
    let existing;
    try {
      existing = await prisma.application.findFirst({
        where: {
          name: trimmedName,
          subCategoryId: subCategoryId,
        },
      });
    } catch (error: any) {
      // If subCategoryId column doesn't exist, check by name only
      if (error.code === 'P2022' && error.meta?.column?.includes('subCategoryId')) {
        existing = await prisma.application.findFirst({
          where: {
            name: trimmedName,
          },
        });
      } else {
        throw error;
      }
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Application with this name already exists' },
        { status: 400 }
      );
    }

    // Create the application record
    let application;
    try {
      application = await prisma.application.create({
        data: {
          name: trimmedName,
          subCategoryId: subCategoryId,
          status: 'A',
        },
        include: {
          subCategory: true,
        },
      });
    } catch (error: any) {
      // If subCategoryId column doesn't exist, create without it
      if (error.code === 'P2022' && error.meta?.column?.includes('subCategoryId')) {
        application = await prisma.application.create({
          data: {
            name: trimmedName,
            status: 'A',
          },
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    console.error('Application creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create application', message: error.message },
      { status: 500 }
    );
  }
}
