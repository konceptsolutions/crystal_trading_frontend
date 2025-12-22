import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Voucher type schemas
export const createVoucherSchema = z.object({
  type: z.number().int().min(1).max(7),
  date: z.string(),
  totalAmount: z.number().positive(),
  name: z.string().optional(),
  account: z.object({ id: z.number() }).optional(),
  list: z.array(z.object({
    account: z.object({ id: z.number() }),
    dr: z.number().min(0),
    cr: z.number().min(0),
    description: z.string().optional(),
  })),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
});

export class VoucherService {
  /**
   * Generate voucher number based on type
   */
  static async generateVoucherNo(type: number): Promise<number> {
      const lastVoucher = await prisma.voucher.findFirst({
        where: { type },
        orderBy: { voucherNo: 'desc' },
      });

    return lastVoucher ? lastVoucher.voucherNo + 1 : 1;
  }

  /**
   * Get account balance
   */
  static async getAccountBalance(accountId: number, userId: string, date?: Date): Promise<number> {
    const where: any = {
      coaAccountId: accountId,
      userId,
      isApproved: true,
      voucher: {
        isPostDated: 0,
      },
    };

    if (date) {
      where.date = { lte: date };
    }

    const result = await prisma.voucherTransaction.aggregate({
      where,
      _sum: {
        debit: true,
        credit: true,
      },
    });

    return (result._sum.debit || 0) - (result._sum.credit || 0);
  }

  /**
   * Create voucher with transactions
   */
  static async createVoucher(data: z.infer<typeof createVoucherSchema>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // Generate voucher number
      const voucherNo = await this.generateVoucherNo(data.type);

      // Parse dates
      const voucherDate = new Date(data.date);
      const chequeDate = data.chequeDate ? new Date(data.chequeDate) : null;

      // Create voucher
      const voucher = await tx.voucher.create({
        data: {
          voucherNo,
          type: data.type,
          date: voucherDate,
          name: data.name,
          totalAmount: data.totalAmount,
          isApproved: false,
          isPostDated: data.chequeNo ? 1 : 0,
          chequeNo: data.chequeNo,
          chequeDate: chequeDate,
          isAuto: false,
          userId,
          generatedAt: new Date(),
        },
      });

      // Create transactions
      const transactions = [];
      for (const item of data.list) {
        const prevBalance = await this.getAccountBalance(item.account.id, userId, voucherDate);
        const newBalance = prevBalance + item.dr - item.cr;

        const transaction = await tx.voucherTransaction.create({
          data: {
            voucherId: voucher.id,
            coaAccountId: item.account.id,
            debit: item.dr,
            credit: item.cr,
            balance: newBalance,
            description: item.description,
            date: voucherDate,
            userId,
            isApproved: false,
          },
        });

        transactions.push(transaction);
      }

      // For Receipt/Payment/Contra vouchers, create opposite entry
      if ([1, 2, 5].includes(data.type) && data.account) {
        const prevBalance = await this.getAccountBalance(data.account.id, userId, voucherDate);
        const amount = data.totalAmount;

        if (data.type === 1) {
          // Receipt: Credit cash/bank
          await tx.voucherTransaction.create({
            data: {
              voucherId: voucher.id,
              coaAccountId: data.account.id,
              debit: 0,
              credit: amount,
              balance: prevBalance - amount,
              description: `Receipt Voucher ${voucherNo}`,
              date: voucherDate,
              userId,
              isApproved: false,
            },
          });
        } else if (data.type === 2) {
          // Payment: Debit cash/bank
          await tx.voucherTransaction.create({
            data: {
              voucherId: voucher.id,
              coaAccountId: data.account.id,
              debit: amount,
              credit: 0,
              balance: prevBalance + amount,
              description: `Payment Voucher ${voucherNo}`,
              date: voucherDate,
              userId,
              isApproved: false,
            },
          });
        } else if (data.type === 5) {
          // Contra: Transfer between cash/bank
          // This requires two accounts - handled in list
        }
      }

      return { voucher, transactions };
    });
  }

  /**
   * Get vouchers with filters
   */
  static async getVouchers(filters: {
    userId: string;
    voucherNo?: string;
    type?: number;
    from?: Date;
    to?: Date;
    isApproved?: boolean;
    isPostDated?: number;
    coaAccountId?: number;
  }) {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.voucherNo) {
      where.voucherNo = parseInt(filters.voucherNo);
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) where.date.gte = filters.from;
      if (filters.to) where.date.lte = filters.to;
    }
    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }
    if (filters.isPostDated !== undefined) {
      where.isPostDated = filters.isPostDated;
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        transactions: {
          include: {
            coaAccount: true,
          },
        },
        purchaseOrder: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Filter by account if specified
    if (filters.coaAccountId) {
      return vouchers.filter(v => 
        v.transactions.some(t => t.coaAccountId === filters.coaAccountId)
      );
    }

    return vouchers;
  }

  /**
   * Get single voucher
   */
  static async getVoucherById(voucherId: number, userId: string) {
    return await prisma.voucher.findFirst({
      where: {
        id: voucherId,
        userId,
      },
      include: {
        transactions: {
          include: {
            coaAccount: {
              include: {
                coaGroup: true,
                coaSubGroup: true,
              },
            },
          },
        },
        purchaseOrder: true,
      },
    });
  }

  /**
   * Approve/Unapprove voucher
   */
  static async toggleApproval(voucherId: number, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: {
          id: voucherId,
          userId,
          deletedAt: null,
        },
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      const newApprovalStatus = !voucher.isApproved;

      // Update voucher
      const updatedVoucher = await tx.voucher.update({
        where: { id: voucherId },
        data: { isApproved: newApprovalStatus },
      });

      // Update all transactions
      await tx.voucherTransaction.updateMany({
        where: { voucherId },
        data: { isApproved: newApprovalStatus },
      });

      return updatedVoucher;
    });
  }

  /**
   * Clear post-dated voucher
   */
  static async clearPostDated(voucherId: number, userId: string, date: Date) {
    return await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: {
          id: voucherId,
          userId,
          deletedAt: null,
        },
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      // Update voucher
      const updatedVoucher = await tx.voucher.update({
        where: { id: voucherId },
        data: {
          isPostDated: 0,
          clearedDate: date,
        },
      });

      // Update transaction dates
      await tx.voucherTransaction.updateMany({
        where: { voucherId },
        data: { date },
      });

      return updatedVoucher;
    });
  }

  /**
   * Delete voucher (soft delete)
   */
  static async deleteVoucher(voucherId: number, userId: string) {
    const voucher = await prisma.voucher.findFirst({
      where: {
        id: voucherId,
        userId,
      },
    });

    if (!voucher) {
      throw new Error('Voucher not found');
    }

    if (voucher.isAuto) {
      throw new Error('Cannot delete auto-generated voucher');
    }

    return await prisma.$transaction(async (tx) => {
      // Delete voucher (soft delete using deletedAt)
      await tx.voucher.update({
        where: { id: voucherId },
        data: { deletedAt: new Date() },
      });

      // Delete transactions (soft delete)
      await tx.voucherTransaction.updateMany({
        where: { voucherId },
        data: { deletedAt: new Date() },
      });

      return { message: 'Voucher deleted successfully' };
    });
  }
}

