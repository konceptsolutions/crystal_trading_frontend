import { PrismaClient } from '@prisma/client';
import { VoucherService } from './voucher.service';

const prisma = new PrismaClient();

export class ReportsService {
  /**
   * Get Daily Closing Report
   */
  static async getDailyClosingReport(date: Date, accountIds: number[], userId: string) {
    // Get accounts if not provided
    let accounts = [];
    if (accountIds.length === 0) {
      const cashAccounts = await prisma.coaAccount.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
          coaSubGroup: {
            type: { in: ['cash', 'bank'] },
            isActive: true,
          },
          isActive: true,
        },
        include: {
          coaSubGroup: true,
        },
      });
      accounts = cashAccounts;
      accountIds = cashAccounts.map(a => a.id);
    } else {
      accounts = await prisma.coaAccount.findMany({
        where: {
          id: { in: accountIds },
          OR: [{ userId }, { userId: null }],
        },
        include: {
          coaSubGroup: true,
        },
      });
    }

    const openingBalances: any[] = [];
    const debitTransactions: any[] = [];
    const creditTransactions: any[] = [];

    for (const account of accounts) {
      // Opening balance (before the date)
      const openingBalance = await VoucherService.getAccountBalance(
        account.id,
        userId,
        new Date(date.getTime() - 24 * 60 * 60 * 1000)
      );
      openingBalances.push({
        account_id: account.id,
        account_name: account.name,
        opening_bal: openingBalance,
      });

      // Debit transactions (receipts) for the date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const debits = await prisma.voucherTransaction.findMany({
        where: {
          coaAccountId: account.id,
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          debit: { gt: 0 },
          isApproved: true,
          voucher: {
            isPostDated: 0,
          },
        },
        include: {
          voucher: {
            select: {
              id: true,
              voucherNo: true,
              type: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Credit transactions (payments) for the date
      const credits = await prisma.voucherTransaction.findMany({
        where: {
          coaAccountId: account.id,
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          credit: { gt: 0 },
          isApproved: true,
          voucher: {
            isPostDated: 0,
          },
        },
        include: {
          voucher: {
            select: {
              id: true,
              voucherNo: true,
              type: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Group by voucher
      const debitGroups = new Map();
      debits.forEach(t => {
        const key = t.voucher.id;
        if (!debitGroups.has(key)) {
          debitGroups.set(key, {
            transactions: [],
            descriptionArray: {
              account: account.name,
              description: t.description || t.voucher.name || '',
              voucher_no: `V${t.voucher.voucherNo}`,
            },
          });
        }
        debitGroups.get(key).transactions.push({ amount: t.debit });
      });
      debitTransactions.push(...Array.from(debitGroups.values()));

      const creditGroups = new Map();
      credits.forEach(t => {
        const key = t.voucher.id;
        if (!creditGroups.has(key)) {
          creditGroups.set(key, {
            transactions: [],
            descriptionArray: {
              account: account.name,
              description: t.description || t.voucher.name || '',
              voucher_no: `V${t.voucher.voucherNo}`,
            },
          });
        }
        creditGroups.get(key).transactions.push({ amount: t.credit });
      });
      creditTransactions.push(...Array.from(creditGroups.values()));
    }

    return {
      coaAccounts: accounts,
      openingBalances,
      debitTransactions,
      creditTransactions,
    };
  }

  /**
   * Get Balance Sheet
   */
  static async getBalanceSheet(date: Date, userId: string) {
    const groups = await prisma.coaGroup.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isActive: true,
        parent: { in: ['Assets', 'Liabilities', 'Capital', 'Revenues', 'Expenses', 'Cost'] },
      },
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
    });

    const assets: any[] = [];
    const liabilities: any[] = [];
    const capital: any[] = [];
    let revenue = 0;
    let expense = 0;
    let cost = 0;

    for (const group of groups) {
      for (const subGroup of group.subGroups) {
        for (const account of subGroup.accounts) {
          const balance = await VoucherService.getAccountBalance(account.id, userId, date);

          const accountData = {
            id: account.id,
            name: account.name,
            code: account.code,
            balance,
            subGroup: subGroup.name,
            group: group.name,
          };

          if (group.parent === 'Assets') {
            assets.push(accountData);
          } else if (group.parent === 'Liabilities') {
            liabilities.push(accountData);
          } else if (group.parent === 'Capital') {
            capital.push(accountData);
          } else if (group.parent === 'Revenues') {
            revenue += balance;
          } else if (group.parent === 'Expenses') {
            expense += balance;
          } else if (group.parent === 'Cost') {
            cost += balance;
          }
        }
      }
    }

    const netProfit = revenue - expense - cost;

    return {
      assets,
      liabilities,
      capital,
      revenue,
      expense,
      cost,
      revExp: netProfit,
    };
  }

  /**
   * Get Trial Balance
   */
  static async getTrialBalance(from: Date, to: Date, userId: string) {
    const accounts = await prisma.coaAccount.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isActive: true,
      },
      include: {
        coaGroup: true,
        coaSubGroup: true,
      },
    });

    const result: any = {
      assets: [],
      liabilities: [],
      capital: [],
      revenues: [],
      expenses: [],
      cost: [],
    };

    for (const account of accounts) {
      const transactions = await prisma.voucherTransaction.findMany({
        where: {
          coaAccountId: account.id,
          userId,
          date: {
            gte: from,
            lte: to,
          },
          isApproved: true,
          deletedAt: null,
          voucher: {
            isPostDated: 0,
            deletedAt: null,
          },
        },
      });

      const debitTotal = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
      const creditTotal = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
      const balance = debitTotal - creditTotal;

      const accountData = {
        id: account.id,
        name: account.name,
        code: account.code,
        debit: debitTotal,
        credit: creditTotal,
        balance,
        group: account.coaGroup?.name || '',
        subGroup: account.coaSubGroup?.name || '',
      };

      const parent = account.coaGroup?.parent || '';
      if (parent === 'Assets') result.assets.push(accountData);
      else if (parent === 'Liabilities') result.liabilities.push(accountData);
      else if (parent === 'Capital') result.capital.push(accountData);
      else if (parent === 'Revenues') result.revenues.push(accountData);
      else if (parent === 'Expenses') result.expenses.push(accountData);
      else if (parent === 'Cost') result.cost.push(accountData);
    }

    return result;
  }

  /**
   * Get General Journal
   */
  static async getGeneralJournal(from?: Date, to?: Date, userId?: string) {
    const where: any = {
      isApproved: true,
      deletedAt: null,
      voucher: {
        isPostDated: 0,
        deletedAt: null,
      },
    };

    if (userId) {
      where.userId = userId;
    }

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
            name: true,
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

    return transactions;
  }
}

