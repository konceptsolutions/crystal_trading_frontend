import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod validation schemas
export const createCoaAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  code: z.string().min(1, 'Account code is required'),
  coaGroupId: z.number().int().positive(),
  coaSubGroupId: z.number().int().positive(),
  personId: z.string().optional(),
  description: z.string().optional(),
});

export const updateCoaAccountSchema = createCoaAccountSchema.extend({
  accountId: z.number().int().positive(),
});

export class CoaAccountService {
  /**
   * Get account balance from voucher transactions
   */
  static async getAccountBalance(
    accountId: number,
    userId: string,
    date?: Date
  ): Promise<number> {
    const whereClause: any = {
      coaAccountId: accountId,
      userId,
      isApproved: true,
      deletedAt: null,
      voucher: {
        isPostDated: 0,
        deletedAt: null,
      },
    };

    if (date) {
      whereClause.date = {
        lte: date,
      };
    }

    const result = await prisma.voucherTransaction.aggregate({
      where: whereClause,
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const debit = result._sum.debit || 0;
    const credit = result._sum.credit || 0;
    return debit - credit;
  }

  /**
   * List all COA accounts with filters
   */
  static async getAccounts(filters: {
    userId: string;
    isActive?: boolean;
    coaGroupId?: number;
    coaSubGroupId?: number;
  }) {
    const where: any = {
      OR: [
        { userId: filters.userId },
        { userId: null }, // Global accounts
      ],
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.coaGroupId) {
      where.coaGroupId = filters.coaGroupId;
    }
    if (filters.coaSubGroupId) {
      where.coaSubGroupId = filters.coaSubGroupId;
    }

    return await prisma.coaAccount.findMany({
      where,
      include: {
        coaGroup: true,
        coaSubGroup: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Create new account
   */
  static async createAccount(data: z.infer<typeof createCoaAccountSchema>, userId: string) {
    // Validate code uniqueness
    const existing = await prisma.coaAccount.findFirst({
      where: {
        code: data.code,
        userId,
      },
    });

    if (existing) {
      throw new Error('Account code already exists');
    }

    return await prisma.coaAccount.create({
      data: {
        ...data,
        userId,
      },
      include: {
        coaGroup: true,
        coaSubGroup: true,
      },
    });
  }

  /**
   * Update existing account
   */
  static async updateAccount(
    accountId: number,
    data: Partial<z.infer<typeof createCoaAccountSchema>>,
    userId: string
  ) {
    const account = await prisma.coaAccount.findFirst({
      where: {
        id: accountId,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.isDefault) {
      throw new Error('Cannot update default account');
    }

    return await prisma.coaAccount.update({
      where: { id: accountId },
      data,
      include: {
        coaGroup: true,
        coaSubGroup: true,
      },
    });
  }

  /**
   * Get cash accounts
   */
  static async getCashAccounts(userId: string, isActive?: boolean) {
    const where: any = {
      OR: [{ userId }, { userId: null }],
      coaSubGroup: {
        type: 'cash',
        isActive: true,
      },
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await prisma.coaAccount.findMany({
      where,
      include: {
        coaSubGroup: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Get bank accounts
   */
  static async getBankAccounts(userId: string) {
    return await prisma.coaAccount.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        coaSubGroup: {
          type: 'bank',
          isActive: true,
        },
        isActive: true,
      },
      include: {
        coaSubGroup: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Get accounts excluding cash and bank
   */
  static async getAccountsExceptCash(userId: string) {
    return await prisma.coaAccount.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        coaSubGroup: {
          type: { notIn: ['cash', 'bank'] },
          isActive: true,
        },
        isActive: true,
      },
      include: {
        coaSubGroup: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Get account ledger
   */
  static async getAccountLedger(
    accountId: number,
    userId: string,
    from?: Date,
    to?: Date
  ) {
    const where: any = {
      coaAccountId: accountId,
      userId,
      isApproved: true,
      voucher: {
        isPostDated: 0,
      },
    };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    const transactions = await prisma.voucherTransaction.findMany({
      where,
      include: {
        voucher: {
          select: {
            id: true,
            voucherNo: true,
            type: true,
          },
        },
        coaAccount: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate opening balance (before from date)
    let openingBalance = 0;
    if (from) {
      openingBalance = await this.getAccountBalance(accountId, userId, from);
    }

    // Calculate closing balance
    const closingBalance = await this.getAccountBalance(
      accountId,
      userId,
      to || new Date()
    );

    return {
      openingBalance,
      closingBalance,
      transactions,
    };
  }

  /**
   * Toggle account active status
   */
  static async toggleAccountStatus(accountId: number, userId: string) {
    const account = await prisma.coaAccount.findFirst({
      where: {
        id: accountId,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.isDefault) {
      throw new Error('Cannot deactivate default account');
    }

    return await prisma.coaAccount.update({
      where: { id: accountId },
      data: {
        isActive: !account.isActive,
      },
    });
  }

  /**
   * Get COA Groups
   */
  static async getCoaGroups(userId?: string) {
    const where: any = {
      isActive: true,
    };

    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    return await prisma.coaGroup.findMany({
      where,
      include: {
        subGroups: {
          where: { isActive: true },
          include: {
            accounts: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Get COA Sub-Groups
   */
  static async getCoaSubGroups(coaGroupId: number, userId?: string) {
    const where: any = {
      coaGroupId,
      isActive: true,
    };

    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }

    return await prisma.coaSubGroup.findMany({
      where,
      include: {
        coaGroup: true,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Create COA Group
   */
  static async createCoaGroup(data: { name: string; code: string; parent: string }, userId?: string) {
    return await prisma.coaGroup.create({
      data: {
        name: data.name,
        code: data.code,
        parent: data.parent,
        userId: userId || null,
        isActive: true,
      },
    });
  }

  /**
   * Create COA Sub-Group
   */
  static async createCoaSubGroup(
    data: { name: string; code: string; coaGroupId: number; type?: string },
    userId?: string
  ) {
    return await prisma.coaSubGroup.create({
      data: {
        name: data.name,
        code: data.code,
        coaGroupId: data.coaGroupId,
        type: data.type || null,
        userId: userId || null,
        isActive: true,
      },
      include: {
        coaGroup: true,
      },
    });
  }
}

