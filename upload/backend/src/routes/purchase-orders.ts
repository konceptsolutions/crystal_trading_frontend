import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const purchaseOrderSchema = z.object({
  poNo: z.string().optional(), // Optional - will be auto-generated if not provided
  type: z.enum(['purchase', 'direct']),
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierEmail: z.string().email().optional().or(z.literal('')),
  supplierPhone: z.string().optional(),
  supplierAddress: z.string().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'received', 'cancelled']).optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'cheque', 'credit_card', 'other']).optional(),
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

// Get next PO number (for frontend preview)
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.get('/next-po-number/:type', async (req: AuthRequest, res) => {
  try {
    const type = req.params.type as 'purchase' | 'direct';
    if (!['purchase', 'direct'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "purchase" or "direct"' });
    }
    const nextPONumber = await generatePONumber(type);
    res.json({ nextPONumber });
  } catch (error: any) {
    console.error('Get next PO number error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// Helper function to generate PO number
async function generatePONumber(type: 'purchase' | 'direct'): Promise<string> {
  const prefix = type === 'direct' ? 'DPO' : 'PO';
  const year = new Date().getFullYear();
  
  // Get the last PO number for this type and year
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      poNo: {
        startsWith: `${prefix}-${year}-`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastPO) {
    // Extract number from last PO (e.g., "PO-2024-001" -> 1)
    const match = lastPO.poNo.match(/-(\d+)$/);
    if (match && match[1]) {
      const parsedNumber = parseInt(match[1], 10);
      if (!isNaN(parsedNumber) && parsedNumber > 0) {
        nextNumber = parsedNumber + 1;
      } else {
        // If regex matched but number is invalid, try to find the highest number
        console.warn(`Invalid PO number format found: ${lastPO.poNo}. Attempting to find highest number.`);
        const allPOs = await prisma.purchaseOrder.findMany({
          where: {
            poNo: {
              startsWith: `${prefix}-${year}-`,
            },
          },
          select: {
            poNo: true,
          },
        });
        
        let maxNumber = 0;
        for (const po of allPOs) {
          const poMatch = po.poNo.match(/-(\d+)$/);
          if (poMatch && poMatch[1]) {
            const num = parseInt(poMatch[1], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
        nextNumber = maxNumber > 0 ? maxNumber + 1 : 1;
      }
    } else {
      // Regex failed - find the highest number from all POs of this type/year
      console.warn(`Could not extract number from PO: ${lastPO.poNo}. Searching for highest number.`);
      const allPOs = await prisma.purchaseOrder.findMany({
        where: {
          poNo: {
            startsWith: `${prefix}-${year}-`,
          },
        },
        select: {
          poNo: true,
        },
      });
      
      let maxNumber = 0;
      for (const po of allPOs) {
        const poMatch = po.poNo.match(/-(\d+)$/);
        if (poMatch && poMatch[1]) {
          const num = parseInt(poMatch[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
      nextNumber = maxNumber > 0 ? maxNumber + 1 : 1;
    }
  }

  return `${prefix}-${year}-${String(nextNumber).padStart(3, '0')}`;
}

// Create purchase order
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = purchaseOrderSchema.parse(req.body);

    // Auto-generate PO number if not provided
    // Handle null, undefined, or empty string safely
    let poNo = data.poNo;
    if (poNo == null || (typeof poNo === 'string' && poNo.trim() === '')) {
      poNo = await generatePONumber(data.type);
    }

    // Check if PO number already exists
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNo },
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
        poNo: poNo,
        type: data.type,
        supplierId: data.type === 'purchase' ? (data.supplierId || null) : null,
        supplierName: data.supplierName,
        supplierEmail: data.supplierEmail || null,
        supplierPhone: data.supplierPhone || null,
        supplierAddress: data.supplierAddress || null,
        orderDate,
        expectedDate,
        paymentMethod: data.paymentMethod || null,
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
    // Extract receiveData before parsing with schema since it's not a valid schema field
    const { receiveData: receiveDataFromBody, ...bodyWithoutReceiveData } = req.body;

    const data = purchaseOrderSchema.partial().parse(bodyWithoutReceiveData);

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // PO number cannot be changed during update - it's auto-generated and read-only
    // Remove poNo from update data to prevent changes
    const { poNo: _, ...updateData } = data;

    // Make sure receiveData is not in updateData
    delete (updateData as any).receiveData;

    // Calculate totals if items are provided
    let subTotal = existing.subTotal;
    let totalAmount = existing.totalAmount;

    if (updateData.items) {
      subTotal = updateData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = updateData.discount !== undefined ? updateData.discount : existing.discount;
      const tax = updateData.tax !== undefined ? updateData.tax : existing.tax;
      totalAmount = subTotal - discount + tax;
    } else if (updateData.discount !== undefined || updateData.tax !== undefined) {
      const discount = updateData.discount !== undefined ? updateData.discount : existing.discount;
      const tax = updateData.tax !== undefined ? updateData.tax : existing.tax;
      totalAmount = existing.subTotal - discount + tax;
    }

    // Parse dates
    const orderDate = updateData.orderDate ? new Date(updateData.orderDate) : existing.orderDate;
    const expectedDate = updateData.expectedDate ? new Date(updateData.expectedDate) : existing.expectedDate;

    // Verify supplier exists if supplierId is provided
    if (updateData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: updateData.supplierId },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
    }

    // Handle status changes
    let approvedBy = existing.approvedBy;
    let approvedAt = existing.approvedAt;
    let receivedAt = existing.receivedAt;

    if (updateData.status === 'approved' && existing.status !== 'approved') {
      approvedBy = req.user?.id || null;
      approvedAt = new Date();
    }

    if (updateData.status === 'received' && existing.status !== 'received') {
      receivedAt = req.body.receivedAt ? new Date(req.body.receivedAt) : new Date();
    } else if (req.body.receivedAt) {
      // Allow updating receive date explicitly (even if status was already received)
      receivedAt = new Date(req.body.receivedAt);
    }

    // Parse receiveData if provided (contains items with receivedQty, rack/shelf info, etc.)
    let receiveDataValue: any = undefined;
    if (receiveDataFromBody) {
      receiveDataValue = typeof receiveDataFromBody === 'string'
        ? JSON.parse(receiveDataFromBody)
        : receiveDataFromBody;
    }

    // Delete existing items if new items are provided
    if (updateData.items) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: req.params.id },
      });
    }

    // Update purchase order and handle stock updates in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Prepare notes with receiveData if provided
      let notes = updateData.notes;
      if (receiveDataValue) {
        const existingNotes = existing.notes || '';
        const receiveDataStr = JSON.stringify(receiveDataValue);
        notes = existingNotes ? `${existingNotes}\n\nRECEIVE_DATA:${receiveDataStr}` : `RECEIVE_DATA:${receiveDataStr}`;
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id: req.params.id },
        data: {
          ...updateData,
          notes: notes,
          supplierId: updateData.type === 'purchase' ? (updateData.supplierId || null) : null,
          subTotal: updateData.items ? subTotal : undefined,
          totalAmount: updateData.items || updateData.discount !== undefined || updateData.tax !== undefined ? totalAmount : undefined,
          orderDate,
          expectedDate,
          approvedBy,
          approvedAt,
          receivedAt,
          items: updateData.items ? {
            create: updateData.items.map(item => ({
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

      // If status is being changed to 'received', update stock for items with receivedQty
      if (updateData.status === 'received' && existing.status !== 'received' && receiveDataValue) {
        try {
          console.log('DEBUG: Processing receiveData for stock update');
          console.log('DEBUG: receiveData parsed:', JSON.stringify(receiveDataValue, null, 2));

          if (receiveDataValue.items && Array.isArray(receiveDataValue.items)) {
            console.log(`DEBUG: Processing ${receiveDataValue.items.length} items for stock update`);
            for (const item of receiveDataValue.items) {
              const receivedQty = item.receivedQty || item.quantity || 0;
              console.log(`DEBUG: Processing item ${item.partNo || item.partId}, receivedQty: ${receivedQty}`);

              // Only update stock if receivedQty > 0
              if (receivedQty > 0) {
                let part = null;

                // Try to find part by partId first (more reliable)
                if (item.partId) {
                  console.log(`DEBUG: Looking up part by partId: ${item.partId}`);
                  part = await tx.part.findUnique({
                    where: { id: item.partId },
                  });
                  console.log(`DEBUG: Part found by partId:`, part ? part.partNo : 'NOT FOUND');
                }

                // Fallback to partNo if partId not found
                if (!part && item.partNo) {
                  console.log(`DEBUG: Looking up part by partNo: ${item.partNo}`);
                  part = await tx.part.findUnique({
                    where: { partNo: item.partNo },
                  });
                  console.log(`DEBUG: Part found by partNo:`, part ? part.partNo : 'NOT FOUND');
                }

                if (part) {
                  console.log(`DEBUG: Updating stock for part ${part.partNo}`);
                  // Get or create stock entry
                  const existingStock = await tx.stock.findUnique({
                    where: { partId: part.id },
                  });
                  console.log(`DEBUG: Existing stock:`, existingStock);

                  const stockUpdateData: any = {
                    quantity: (existingStock?.quantity || 0) + receivedQty,
                    store: receiveDataValue.storeName || receiveDataValue.storeId || null,
                    racks: item.rackNo || null,
                    shelf: item.shelfNo || null,
                  };

                  console.log(`DEBUG: Stock update data:`, stockUpdateData);

                  if (existingStock) {
                    await tx.stock.update({
                      where: { partId: part.id },
                      data: stockUpdateData,
                    });
                    console.log(`DEBUG: Stock updated successfully`);
                  } else {
                    await tx.stock.create({
                      data: {
                        partId: part.id,
                        ...stockUpdateData,
                      },
                    });
                    console.log(`DEBUG: Stock created successfully`);
                  }
                } else {
                  console.log(`DEBUG: Part not found for item:`, item);
                }
              } else {
                console.log(`DEBUG: Skipping item with receivedQty 0:`, item.partNo || item.partId);
              }
            }
          } else {
            console.log('DEBUG: No items in receiveData');
          }
        } catch (error) {
          console.error('Error updating stock from receiveData:', error);
          // Don't fail the transaction, just log the error
        }
      }

      return updatedPO;
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

// Delete purchase order (Admin only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Only administrators can delete purchase orders.',
      });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
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

    const wasReceived = purchaseOrder.status === 'received';
    let stockReversed = false;

    // Get IP address from request
    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    // If PO was received, reverse stock before deletion
    if (wasReceived && purchaseOrder.notes) {
      try {
        // Extract receiveData from notes
        const notesLines = purchaseOrder.notes.split('\n');
        let receiveDataStr = null;
        for (const line of notesLines) {
          if (line.startsWith('RECEIVE_DATA:')) {
            receiveDataStr = line.substring('RECEIVE_DATA:'.length);
            break;
          }
        }

        if (receiveDataStr) {
          const receiveData = JSON.parse(receiveDataStr);

          if (receiveData.items && Array.isArray(receiveData.items)) {
            await prisma.$transaction(async (tx) => {
              for (const item of receiveData.items) {
                const receivedQty = item.receivedQty || item.quantity || 0;

                // Only reverse stock if receivedQty > 0
                if (receivedQty > 0) {
                  let part = null;

                  // Try to find part by partId first (more reliable)
                  if (item.partId) {
                    part = await tx.part.findUnique({
                      where: { id: item.partId },
                    });
                  }

                  // Fallback to partNo if partId not found
                  if (!part && item.partNo) {
                    part = await tx.part.findUnique({
                      where: { partNo: item.partNo },
                    });
                  }

                  if (part) {
                    const existingStock = await tx.stock.findUnique({
                      where: { partId: part.id },
                    });

                    if (existingStock) {
                      const newQuantity = Math.max(0, existingStock.quantity - receivedQty);
                      await tx.stock.update({
                        where: { partId: part.id },
                        data: {
                          quantity: newQuantity,
                        },
                      });
                    }
                  }
                }
              }
            });
            stockReversed = true;
          }
        } else {
          console.log('No RECEIVE_DATA found in notes for PO:', purchaseOrder.poNo);
        }
      } catch (stockError) {
        console.error('Error reversing stock during PO deletion:', stockError);
        // Continue with deletion even if stock reversal fails, but log it
      }
    }

    // Create deletion log before deleting the PO
    try {
      await prisma.purchaseOrderDeletionLog.create({
        data: {
          purchaseOrderId: purchaseOrder.id,
          poNo: purchaseOrder.poNo,
          type: purchaseOrder.type,
          deletedBy: req.user?.id || 'unknown',
          deletedByName: req.user?.name || 'Unknown',
          deletedByEmail: req.user?.email || 'unknown@unknown.com',
          deletedByRole: req.user?.role || 'unknown',
          ipAddress: ipAddress,
          status: purchaseOrder.status,
          wasReceived: wasReceived,
          stockReversed: stockReversed,
          notes: wasReceived 
            ? (stockReversed 
                ? 'Stock reversed successfully' 
                : 'Stock reversal failed or not needed')
            : 'PO was not received, no stock to reverse',
        },
      });
    } catch (logError) {
      console.error('Error creating deletion log:', logError);
      // Continue with deletion even if logging fails
    }

    // Delete the purchase order
    await prisma.purchaseOrder.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      message: 'Purchase order deleted successfully',
      stockReversed: stockReversed,
    });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

