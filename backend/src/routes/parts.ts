import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

import * as XLSX from 'xlsx';

const router = express.Router();

const partModelInputSchema = z.object({
  modelNo: z.string().min(1),
  qtyUsed: z.number().int().min(1).optional(),
  tab: z.enum(['P1', 'P2']).optional(),
});

const partSchema = z.object({
  partNo: z.string().min(1),
  masterPartNo: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  mainCategory: z.string().optional(),
  subCategory: z.string().optional(),
  application: z.string().optional(),
  hsCode: z.string().optional(),
  uom: z.string().optional(),
  weight: z.number().optional(),
  reOrderLevel: z.number().optional(),
  cost: z.number().optional(),
  priceA: z.number().optional(),
  priceB: z.number().optional(),
  priceM: z.number().optional(),
  rackNo: z.string().optional(),
  origin: z.string().optional(),
  grade: z.string().optional(),
  status: z.string().optional(),
  smc: z.string().optional(),
  size: z.string().optional(),
  remarks: z.string().optional(),
  imageUrl1: z.string().optional(),
  imageUrl2: z.string().optional(),
});

// All routes require authentication
router.use(verifyToken);

// Get all parts with pagination and filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const masterPartNo = req.query.masterPartNo as string;
    const partNo = req.query.partNo as string;
    const brand = req.query.brand as string;
    const description = req.query.description as string;
    const mainCategory = req.query.mainCategory as string;
    const subCategory = req.query.subCategory as string;
    const application = req.query.application as string;
    const status = req.query.status as string;
    const origin = req.query.origin as string;
    const grade = req.query.grade as string;

    const where: any = {};

    // Individual filters take priority over general search
    if (masterPartNo) {
      where.masterPartNo = { contains: masterPartNo, mode: 'insensitive' };
    }
    if (partNo) {
      where.partNo = { contains: partNo, mode: 'insensitive' };
    }
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }
    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }
    if (mainCategory) {
      where.mainCategory = { contains: mainCategory, mode: 'insensitive' };
    }
    if (subCategory) {
      where.subCategory = { contains: subCategory, mode: 'insensitive' };
    }
    if (application) {
      where.application = { contains: application, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }

    // General search only if no individual filters are set
    if (search && !masterPartNo && !partNo && !description) {
      where.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { masterPartNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.part.count({ where }),
    ]);

    res.json({
      parts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single part with models
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const part = await prisma.part.findUnique({
      where: { id: req.params.id },
      include: {
        models: {
          orderBy: {
            modelNo: 'asc',
          },
        },
        stock: true,
      },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.json({ part });
  } catch (error) {
    console.error('Get part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get part by partNo
router.get('/partno/:partNo', async (req: AuthRequest, res) => {
  try {
    const part = await prisma.part.findUnique({
      where: { partNo: req.params.partNo },
      include: {
        models: {
          orderBy: {
            modelNo: 'asc',
          },
        },
        stock: true,
      },
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.json({ part });
  } catch (error) {
    console.error('Get part by partNo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new part
router.post('/', async (req: AuthRequest, res) => {
  try {
    console.log('Create part: incoming body keys:', Object.keys(req.body || {}));
    console.log('Create part: incoming models type:', {
      hasModels: req.body?.models !== undefined,
      isArray: Array.isArray(req.body?.models),
      length: Array.isArray(req.body?.models) ? req.body.models.length : undefined,
      sample: Array.isArray(req.body?.models) ? req.body.models.slice(0, 2) : undefined,
    });

    const { models, ...partBody } = (req.body || {}) as any;
    const data = partSchema.parse(partBody);

    // Check if partNo already exists
    const existingPart = await prisma.part.findUnique({
      where: { partNo: data.partNo },
    });

    if (existingPart) {
      return res.status(400).json({ error: 'Part number already exists' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const part = await tx.part.create({ data });

      // Stock (ensure exists)
      await tx.stock.upsert({
        where: { partId: part.id },
        update: {},
        create: { partId: part.id, quantity: 0 },
      });

      // Models (optional)
      if (models !== undefined) {
        const parsedModels = z.array(partModelInputSchema).safeParse(models);
        if (!parsedModels.success) {
          throw new z.ZodError(parsedModels.error.issues);
        }

        const validModels = (parsedModels.data || [])
          .map((m: any) => ({
            modelNo: typeof m?.modelNo === 'string' ? m.modelNo.trim() : '',
            qtyUsed: typeof m?.qtyUsed === 'number' ? m.qtyUsed : 1,
            tab: (m?.tab === 'P2' ? 'P2' : 'P1') as 'P1' | 'P2',
          }))
          .filter((m: any) => m.modelNo.length > 0);

        console.log('Create part: validModels:', validModels);

        if (validModels.length > 0) {
          const createdModels = await tx.partModel.createMany({
            data: validModels.map((m: any) => ({
              partId: part.id,
              modelNo: m.modelNo,
              qtyUsed: m.qtyUsed,
              tab: m.tab,
            })),
          });
          console.log('Create part: created models count:', createdModels.count);
        }
      }

      return await tx.part.findUnique({
        where: { id: part.id },
        include: { models: true, stock: true },
      });
    });

    res.status(201).json({ part: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    console.error('Create part error:', error);
    
    // Check for unique constraint violation
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Part number already exists' });
    }
    
    res.status(500).json({ 
      error: (error as Error).message || 'Internal server error' 
    });
  }
});

// Update part
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { models, ...partBody } = (req.body || {}) as any;
    const data = partSchema.partial().parse(partBody);

    // If partNo is being updated, check if it already exists
    if (data.partNo) {
      const existingPart = await prisma.part.findUnique({
        where: { partNo: data.partNo },
      });

      if (existingPart && existingPart.id !== req.params.id) {
        return res.status(400).json({ error: 'Part number already exists' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: req.params.id },
        data,
      });

      // If models were provided, replace the whole set for this part
      if (models !== undefined) {
        const parsedModels = z.array(partModelInputSchema).safeParse(models);
        if (!parsedModels.success) {
          throw new z.ZodError(parsedModels.error.issues);
        }

        const validModels = (parsedModels.data || [])
          .map((m: any) => ({
            modelNo: typeof m?.modelNo === 'string' ? m.modelNo.trim() : '',
            qtyUsed: typeof m?.qtyUsed === 'number' ? m.qtyUsed : 1,
            tab: (m?.tab === 'P2' ? 'P2' : 'P1') as 'P1' | 'P2',
          }))
          .filter((m: any) => m.modelNo.length > 0);

        await tx.partModel.deleteMany({ where: { partId: req.params.id } });

        if (validModels.length > 0) {
          await tx.partModel.createMany({
            data: validModels.map((m: any) => ({
              partId: req.params.id,
              modelNo: m.modelNo,
              qtyUsed: m.qtyUsed,
              tab: m.tab,
            })),
          });
        }
      }

      return await tx.part.findUnique({
        where: { id: req.params.id },
        include: { models: true, stock: true },
      });
    });

    res.json({ part: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Update part error:', error);
    res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
});

// Delete part
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.part.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Delete part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search parts
router.get('/search/:query', async (req: AuthRequest, res) => {
  try {
    const query = req.params.query;

    const parts = await prisma.part.findMany({
      where: {
        OR: [
          { partNo: { contains: query } },
          { masterPartNo: { contains: query } },
          { description: { contains: query } },
          { brand: { contains: query } },
        ],
      },
      include: {
        stock: true,
      },
      take: 20,
    });

    res.json({ parts });
  } catch (error) {
    console.error('Search parts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// XLSX Import endpoint
router.post('/import-xlsx', async (req: AuthRequest, res) => {
  try {
    console.log('XLSX import request received');
    const { fileData, fileName } = req.body;

    if (!fileData) {
      console.error('No file data provided');
      return res.status(400).json({ error: 'File data is required' });
    }

    console.log('File data received, length:', typeof fileData === 'string' ? fileData.length : 'not a string');

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    try {
      if (typeof fileData === 'string') {
        // Remove data URL prefix if present (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
        const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        fileBuffer = Buffer.from(base64Data, 'base64');
        
        if (fileBuffer.length === 0) {
          return res.status(400).json({ error: 'Invalid file data: empty buffer after decoding' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid file data format: expected string' });
      }
    } catch (error: any) {
      console.error('Error decoding base64:', error);
      return res.status(400).json({ error: `Failed to decode file data: ${error.message}` });
    }

    // Parse XLSX file
    let workbook: XLSX.WorkBook;
    try {
      console.log('Attempting to parse XLSX file, buffer size:', fileBuffer.length);
      
      // Check if XLSX is available
      if (!XLSX || !XLSX.read) {
        console.error('XLSX library not available');
        return res.status(500).json({ error: 'XLSX library is not available. Please ensure xlsx package is installed and backend is rebuilt.' });
      }
      
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      console.log('XLSX file parsed successfully, sheets:', workbook.SheetNames?.length || 0);
    } catch (error: any) {
      console.error('Error parsing XLSX file:', error);
      console.error('Error stack:', error.stack);
      return res.status(400).json({ error: `Failed to parse Excel file: ${error.message}. Please ensure the file is a valid .xlsx or .xls file.` });
    }
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: 'Excel file has no sheets' });
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // First, get raw data to find header row
    let rawData: any[][];
    try {
      rawData = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,
        raw: false,
        header: 1, // Get as array of arrays
      }) as any[][];
    } catch (error: any) {
      console.error('Error converting sheet to JSON:', error);
      return res.status(400).json({ error: `Failed to read sheet data: ${error.message}` });
    }

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or has no data rows' });
    }

    // Find header row by looking for "Part No" column
    let headerRowIndex = -1;
    let headerRow: any[] = [];
    for (let i = 0; i < Math.min(30, rawData.length); i++) {
      const row = rawData[i];
      if (row && Array.isArray(row)) {
        // Check if this row contains "Part No" as a header
        const rowStr = row.map(c => String(c || '').toLowerCase().trim()).join('|');
        // Look for "part no" as a standalone header (not part of another word)
        if (rowStr.includes('part no') || rowStr.includes('partno')) {
          // Verify this is actually a header row by checking if it has multiple column headers
          const nonEmptyCells = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
          if (nonEmptyCells.length >= 3) { // Header row should have at least 3 columns
            headerRowIndex = i;
            headerRow = row;
            break;
          }
        }
      }
    }

    // If header row found, use it; otherwise assume first row
    let records: any[];
    if (headerRowIndex >= 0) {
      console.log(`Found header row at index ${headerRowIndex}`);
      // Convert header row to column mapping
      const columnMap: { [key: string]: number } = {};
      headerRow.forEach((header, index) => {
        if (header && String(header).trim()) {
          const headerStr = String(header).trim();
          columnMap[headerStr.toLowerCase()] = index;
          // Also map common variations
          if (headerStr.toLowerCase().includes('part no')) {
            columnMap['part no'] = index;
            columnMap['partno'] = index;
          }
          if (headerStr.toLowerCase().includes('master part')) {
            columnMap['master part no'] = index;
            columnMap['masterpartno'] = index;
          }
          if (headerStr.toLowerCase().includes('stock')) {
            columnMap['stock'] = index;
            columnMap['quantity'] = index;
            columnMap['qty'] = index;
          }
          if (headerStr.toLowerCase().includes('cost') && !headerStr.toLowerCase().includes('value')) {
            columnMap['cost'] = index;
          }
          if (headerStr.toLowerCase().includes('price')) {
            columnMap['price'] = index;
          }
          if (headerStr.toLowerCase().includes('loc') || headerStr.toLowerCase().includes('location')) {
            columnMap['loc'] = index;
            columnMap['location'] = index;
          }
          if (headerStr.toLowerCase().includes('brand')) {
            columnMap['brand'] = index;
          }
          if (headerStr.toLowerCase().includes('description') || headerStr.toLowerCase().includes('desc')) {
            columnMap['description'] = index;
            columnMap['desc'] = index;
          }
        }
      });

      // Convert data rows (starting after header row) to objects
      records = [];
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !Array.isArray(row)) continue;
        
        // Skip empty rows - check if row has meaningful data
        const hasData = row.some((cell, idx) => {
          if (cell === null || cell === undefined) return false;
          const cellStr = String(cell).trim();
          // Skip if cell is empty or just whitespace
          if (cellStr === '') return false;
          // For the first column (Part No), it should have a value for a valid row
          if (idx === 0 && columnMap['part no'] === 0 && cellStr !== '') return true;
          // For other columns, any non-empty value indicates data
          return cellStr !== '';
        });
        if (!hasData) continue;

        const record: any = {};
        // First, add values using column map (lowercase keys)
        Object.keys(columnMap).forEach(key => {
          const colIndex = columnMap[key];
          if (colIndex !== undefined && colIndex !== null && colIndex >= 0 && colIndex < row.length) {
            const value = row[colIndex];
            record[key] = value !== null && value !== undefined ? String(value).trim() : value;
          }
        });
        // Also add by original header names (preserving original case)
        headerRow.forEach((header, index) => {
          if (header && String(header).trim() && index < row.length) {
            const headerName = String(header).trim();
            const value = row[index];
            record[headerName] = value !== null && value !== undefined ? String(value).trim() : value;
            // Also add lowercase version if not already present
            const headerLower = headerName.toLowerCase();
            if (!record[headerLower] && value !== null && value !== undefined) {
              record[headerLower] = String(value).trim();
            }
          }
        });
        records.push(record);
      }
    } else {
      // Fallback: use standard XLSX conversion (assumes headers in first row)
      console.log('Header row not found, using first row as headers');
      try {
        records = XLSX.utils.sheet_to_json(worksheet, {
          defval: null,
          raw: false,
        });
      } catch (error: any) {
        console.error('Error converting sheet to JSON:', error);
        return res.status(400).json({ error: `Failed to read sheet data: ${error.message}` });
      }
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or has no data rows' });
    }

    console.log(`Processing ${records.length} records`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; partNo?: string; error: string }>,
    };

    // Helper function to find column value (case-insensitive)
    const getColumnValue = (row: any, possibleNames: string[]): string | null => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      
      // First try exact match
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return String(row[name]);
        }
      }
      
      // Try case-insensitive match
      const rowKeys = Object.keys(row);
      for (const name of possibleNames) {
        const foundKey = rowKeys.find(key => key.toLowerCase().trim() === name.toLowerCase().trim());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
          return String(row[foundKey]);
        }
      }
      
      // Try partial match (e.g., "Part No" might be stored as "Part No " with trailing space)
      for (const name of possibleNames) {
        const nameLower = name.toLowerCase().trim();
        for (const key of rowKeys) {
          if (key.toLowerCase().trim() === nameLower) {
            const value = row[key];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              return String(value).trim();
            }
          }
        }
      }
      
      return null;
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Map Excel columns to database fields
        // Expected columns: Part No, Master Part No, Brand, Description, Loc, Stock, Cost, Price, Cost Value
        const partNo = getColumnValue(row, ['Part No', 'part no', 'PartNo', 'partno', 'Part Number', 'part number']) || '';
        const masterPartNo = getColumnValue(row, ['Master Part No', 'master part no', 'MasterPartNo', 'masterpartno', 'Master Part Number', 'master part number']);
        const brand = getColumnValue(row, ['Brand', 'brand']);
        const description = getColumnValue(row, ['Description', 'description', 'Desc', 'desc']);
        const location = getColumnValue(row, ['Loc', 'loc', 'Location', 'location']);
        const stockQty = getColumnValue(row, ['Stock', 'stock', 'Quantity', 'quantity', 'Qty', 'qty']) || '0';
        const cost = getColumnValue(row, ['Cost', 'cost']);
        const price = getColumnValue(row, ['Price', 'price']);
        // Cost Value is calculated, so we can ignore it or use it for validation

        // Check if row is completely empty - skip silently
        const hasAnyData = partNo || masterPartNo || brand || description || location || 
                          (stockQty && stockQty !== '0') || cost || price;
        
        if (!hasAnyData) {
          // Completely empty row, skip it
          continue;
        }

        // Row has some data but missing Part No - report error
        if (!partNo || partNo.trim() === '') {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Part No is required',
          });
          continue;
        }

        // Parse numeric values with better error handling
        let stockQuantity = 0;
        try {
          const stockStr = stockQty?.toString().replace(/,/g, '').trim() || '0';
          stockQuantity = parseInt(stockStr, 10);
          if (isNaN(stockQuantity)) {
            stockQuantity = 0;
          }
        } catch (e) {
          stockQuantity = 0;
        }

        let costValue: number | null = null;
        if (cost) {
          try {
            const costStr = cost.toString().replace(/,/g, '').trim();
            const parsed = parseFloat(costStr);
            if (!isNaN(parsed)) {
              costValue = parsed;
            }
          } catch (e) {
            // Keep as null if parsing fails
          }
        }

        let priceValue: number | null = null;
        if (price) {
          try {
            const priceStr = price.toString().replace(/,/g, '').trim();
            const parsed = parseFloat(priceStr);
            if (!isNaN(parsed)) {
              priceValue = parsed;
            }
          } catch (e) {
            // Keep as null if parsing fails
          }
        }

        // Check if part already exists
        const existingPart = await prisma.part.findUnique({
          where: { partNo: partNo.trim() },
        });

        if (existingPart) {
          // Update existing part
          await prisma.$transaction(async (tx) => {
            await tx.part.update({
              where: { id: existingPart.id },
              data: {
                masterPartNo: masterPartNo?.trim() || existingPart.masterPartNo,
                brand: brand?.trim() || existingPart.brand,
                description: description?.trim() || existingPart.description,
                cost: costValue !== null ? costValue : existingPart.cost,
                priceA: priceValue !== null ? priceValue : existingPart.priceA,
              },
            });

            // Update stock
            await tx.stock.upsert({
              where: { partId: existingPart.id },
              update: {
                quantity: stockQuantity,
                location: location?.trim() || undefined,
              },
              create: {
                partId: existingPart.id,
                quantity: stockQuantity,
                location: location?.trim() || undefined,
              },
            });
          });
          results.success++;
        } else {
          // Create new part
          await prisma.$transaction(async (tx) => {
            const part = await tx.part.create({
              data: {
                partNo: partNo.trim(),
                masterPartNo: masterPartNo?.trim() || null,
                brand: brand?.trim() || null,
                description: description?.trim() || null,
                cost: costValue,
                priceA: priceValue,
                status: 'A',
              },
            });

            // Create stock record
            await tx.stock.create({
              data: {
                partId: part.id,
                quantity: stockQuantity,
                location: location?.trim() || null,
              },
            });
          });
          results.success++;
        }
      } catch (error: any) {
        results.failed++;
        const partNoValue = getColumnValue(row, ['Part No', 'part no', 'PartNo', 'partno', 'Part Number', 'part number']) || 'Unknown';
        results.errors.push({
          row: rowNumber,
          partNo: partNoValue.toString(),
          error: error.message || 'Unknown error',
        });
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    res.json({
      message: `Import completed: ${results.success} successful, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error('XLSX import error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to import XLSX file';
    let errorDetails = error.message || 'Unknown error occurred';
    
    if (error.message?.includes('Cannot find module')) {
      errorDetails = 'XLSX library not found. Please ensure xlsx package is installed and backend is rebuilt.';
    } else if (error.message?.includes('Unexpected token')) {
      errorDetails = 'Invalid file format. Please ensure the file is a valid Excel (.xlsx or .xls) file.';
    }
    
    res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;

