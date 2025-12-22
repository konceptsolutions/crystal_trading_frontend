import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';

export class ReportsController {
  /**
   * POST /api/reports/daily-closing
   * Get Daily Closing Report
   */
  static async getDailyClosing(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { date, coaAccounts } = req.body;

      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }

      const accountIds = coaAccounts?.map((a: any) => a.id) || [];
      const report = await ReportsService.getDailyClosingReport(
        new Date(date),
        accountIds,
        userId
      );

      return res.json({
        status: 'ok',
        ...report,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to generate daily closing report',
      });
    }
  }

  /**
   * GET /api/reports/balance-sheet
   * Get Balance Sheet
   */
  static async getBalanceSheet(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }

      const balanceSheet = await ReportsService.getBalanceSheet(new Date(date as string), userId);

      return res.json({
        status: 'ok',
        data: balanceSheet,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to generate balance sheet',
      });
    }
  }

  /**
   * GET /api/reports/trial-balance
   * Get Trial Balance
   */
  static async getTrialBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({ message: 'From and To dates are required' });
      }

      const trialBalance = await ReportsService.getTrialBalance(
        new Date(from as string),
        new Date(to as string),
        userId
      );

      return res.json({
        status: 'ok',
        data: trialBalance,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to generate trial balance',
      });
    }
  }

  /**
   * GET /api/reports/general-journal
   * Get General Journal
   */
  static async getGeneralJournal(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { from, to } = req.query;

      const journal = await ReportsService.getGeneralJournal(
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
        userId
      );

      return res.json({
        status: 'ok',
        data: journal,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to generate general journal',
      });
    }
  }
}

