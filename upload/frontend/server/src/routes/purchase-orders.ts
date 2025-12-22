import express from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const purchaseOrderSchema = z.object({
  // Optional - will be auto-generated if not provided
  poNo: z.string().optional(),
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
  // Allow client-selected receive date (ISO string)
  receivedAt: z.string().optional(),
  // Receive data can be an object or string (JSON)
  receiveData: z.union([z.record(z.any()), z.string()]).optional(),
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
        status: data.status || 'draft',
        paymentMethod: data.paymentMethod || null,
        subTotal,
        tax,
        discount,
        totalAmount,
        notes: data.notes || null,
        createdBy: req.user?.id,
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
    const data = purchaseOrderSchema.partial().parse(req.body);

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Check for duplicate PO number
    if (data.poNo && data.poNo !== existing.poNo) {
      const duplicate = await prisma.purchaseOrder.findUnique({
        where: { poNo: data.poNo },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'PO number already exists' });
      }
    }

    // Calculate totals if items are provided
    let subTotal = existing.subTotal;
    let totalAmount = existing.totalAmount;

    if (data.items) {
      subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = data.discount !== undefined ? data.discount : existing.discount;
      const tax = data.tax !== undefined ? data.tax : existing.tax;
      totalAmount = subTotal - discount + tax;
    } else if (data.discount !== undefined || data.tax !== undefined) {
      const discount = data.discount !== undefined ? data.discount : existing.discount;
      const tax = data.tax !== undefined ? data.tax : existing.tax;
      totalAmount = existing.subTotal - discount + tax;
    }

    // Parse dates
    const orderDate = data.orderDate ? new Date(data.orderDate) : existing.orderDate;
    const expectedDate = data.expectedDate ? new Date(data.expectedDate) : existing.expectedDate;

    // Verify supplier exists if supplierId is provided
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
    }

    // Handle status changes
    let approvedBy = existing.approvedBy;
    let approvedAt = existing.approvedAt;
    let receivedAt = existing.receivedAt;

    if (data.status === 'approved' && existing.status !== 'approved') {
      approvedBy = req.user?.id ?? null;
      approvedAt = new Date();
    }

    if (data.status === 'received' && existing.status !== 'received') {
      receivedAt = data.receivedAt ? new Date(data.receivedAt) : new Date();
    } else if (data.receivedAt) {
      // Allow updating receive date explicitly (even if status was already received)
      receivedAt = new Date(data.receivedAt);
    }

    // Delete existing items if new items are provided
    if (data.items) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: req.params.id },
      });
    }

    // Parse receiveData if provided (contains items with receivedQty, rack/shelf info, etc.)
    let receiveDataValue: any = undefined;
    if (data.receiveData) {
      receiveDataValue = typeof data.receiveData === 'string'
        ? JSON.parse(data.receiveData)
        : data.receiveData;
    }

    // Update purchase order and handle stock updates in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Prepare notes with receiveData if provided
      let notes = data.notes !== undefined ? data.notes : existing.notes;
      if (receiveDataValue) {
        const baseNotes = notes || '';
        const receiveDataStr = JSON.stringify(receiveDataValue);
        notes = baseNotes ? `${baseNotes}\n\nRECEIVE_DATA:${receiveDataStr}` : `RECEIVE_DATA:${receiveDataStr}`;
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id: req.params.id },
        data: {
          ...data,
          notes: notes,
          supplierId: data.type === 'purchase' ? (data.supplierId || null) : null,
          subTotal: data.items ? subTotal : undefined,
          totalAmount: data.items || data.discount !== undefined || data.tax !== undefined ? totalAmount : undefined,
          orderDate,
          expectedDate,
          approvedBy,
          approvedAt,
          receivedAt,
          items: data.items ? {
            create: data.items.map(item => ({
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
      if (data.status === 'received' && existing.status !== 'received' && receiveDataValue) {
        try {
          const receiveData = typeof receiveDataValue === 'string' 
            ? JSON.parse(receiveDataValue) 
            : receiveDataValue;

          if (receiveData.items && Array.isArray(receiveData.items)) {
            for (const item of receiveData.items) {
              const receivedQty = item.receivedQty || item.quantity || 0;
              
              // Only update stock if receivedQty > 0
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
                  // Get or create stock entry
                  const existingStock = await tx.stock.findUnique({
                    where: { partId: part.id },
                  });

                  const stockUpdateData: any = {
                    quantity: (existingStock?.quantity || 0) + receivedQty,
                    store: receiveData.storeName || receiveData.storeId || null,
                    racks: item.rackNo || null,
                    shelf: item.shelfNo || null,
                  };

                  if (existingStock) {
                    await tx.stock.update({
                      where: { partId: part.id },
                      data: stockUpdateData,
                    });
                  } else {
                    await tx.stock.create({
                      data: {
                        partId: part.id,
                        ...stockUpdateData,
                      },
                    });
                  }
                }
              }
            }
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

// Delete purchase order
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
    // Extract receiveData from notes if present
    let receiveData: any = null;
    if (wasReceived && purchaseOrder.notes) {
      const receiveDataMatch = purchaseOrder.notes.match(/RECEIVE_DATA:([\s\S]+?)(?:\n\n|$)/);
      if (receiveDataMatch) {
        try {
          receiveData = JSON.parse(receiveDataMatch[1]);
        } catch (e) {
          console.error('Error parsing receiveData from notes:', e);
        }
      }
    }

    if (wasReceived && receiveData) {
      try {

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

