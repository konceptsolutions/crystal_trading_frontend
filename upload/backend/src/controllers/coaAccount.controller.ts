import { Request, Response } from 'express';
import { CoaAccountService, createCoaAccountSchema } from '../services/coaAccount.service';

export class CoaAccountController {
  /**
   * GET /api/accounts/coa-accounts
   * List all COA accounts with filters
   */
  static async index(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { isActive, coaGroupId, coaSubGroupId } = req.query;

      const accounts = await CoaAccountService.getAccounts({
        userId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        coaGroupId: coaGroupId ? parseInt(coaGroupId as string) : undefined,
        coaSubGroupId: coaSubGroupId ? parseInt(coaSubGroupId as string) : undefined,
      });

      return res.json({ coaAccounts: accounts });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch accounts',
      });
    }
  }

  /**
   * POST /api/accounts/coa-accounts
   * Create new account
   */
  static async store(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validatedData = createCoaAccountSchema.parse(req.body);
      const account = await CoaAccountService.createAccount(validatedData, userId);

      return res.json({
        status: 'ok',
        message: 'Account created successfully',
        account,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0]?.message || 'Validation failed',
        });
      }
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create account',
      });
    }
  }

  /**
   * PUT /api/accounts/coa-accounts/:id
   * Update existing account
   */
  static async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const accountId = parseInt(req.params.id);
      const validatedData = createCoaAccountSchema.partial().parse(req.body);

      const account = await CoaAccountService.updateAccount(accountId, validatedData, userId);

      return res.json({
        status: 'ok',
        message: 'Account updated successfully',
        account,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          message: error.errors[0]?.message || 'Validation failed',
        });
      }
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to update account',
      });
    }
  }

  /**
   * GET /api/accounts/cash-accounts
   * Get cash accounts
   */
  static async getCashAccounts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const accounts = await CoaAccountService.getCashAccounts(userId, isActive);

      return res.json({ coaAccounts: accounts });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch cash accounts',
      });
    }
  }

  /**
   * GET /api/accounts/bank-accounts
   * Get bank accounts
   */
  static async getBankAccounts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const accounts = await CoaAccountService.getBankAccounts(userId);

      return res.json({ coaAccounts: accounts });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch bank accounts',
      });
    }
  }

  /**
   * GET /api/accounts/except-cash
   * Get accounts excluding cash and bank
   */
  static async getAccountsExceptCash(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const accounts = await CoaAccountService.getAccountsExceptCash(userId);

      return res.json({ coaAccounts: accounts });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch accounts',
      });
    }
  }

  /**
   * GET /api/accounts/ledger/:accountId
   * Get account ledger
   */
  static async getAccountLedger(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const accountId = parseInt(req.params.accountId);
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      const ledger = await CoaAccountService.getAccountLedger(accountId, userId, from, to);

      return res.json({ ledger });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch ledger',
      });
    }
  }

  /**
   * PATCH /api/accounts/toggle-status/:id
   * Toggle account active status
   */
  static async toggleStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const accountId = parseInt(req.params.id);
      const account = await CoaAccountService.toggleAccountStatus(accountId, userId);

      const message = account.isActive ? 'Account activated successfully' : 'Account deactivated successfully';

      return res.json({
        status: 'ok',
        message,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to toggle account status',
      });
    }
  }

  /**
   * GET /api/accounts/coa-groups
   * Get COA Groups
   */
  static async getCoaGroups(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const groups = await CoaAccountService.getCoaGroups(userId);

      return res.json({ groups });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch COA groups',
      });
    }
  }

  /**
   * GET /api/accounts/coa-sub-groups
   * Get COA Sub-Groups
   */
  static async getCoaSubGroups(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { groupId } = req.query;

      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required' });
      }

      const subGroups = await CoaAccountService.getCoaSubGroups(parseInt(groupId as string), userId);

      return res.json({ subGroups });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch COA sub-groups',
      });
    }
  }

  /**
   * POST /api/accounts/coa-groups
   * Create COA Group
   */
  static async createCoaGroup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { name, code, parent } = req.body;

      if (!name || !code || !parent) {
        return res.status(400).json({ message: 'Name, code, and parent are required' });
      }

      const group = await CoaAccountService.createCoaGroup({ name, code, parent }, userId);

      return res.json({
        status: 'ok',
        message: 'COA Group created successfully',
        group,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create COA Group',
      });
    }
  }

  /**
   * POST /api/accounts/coa-sub-groups
   * Create COA Sub-Group
   */
  static async createCoaSubGroup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const { name, code, coaGroupId, type } = req.body;

      if (!name || !code || !coaGroupId) {
        return res.status(400).json({ message: 'Name, code, and coaGroupId are required' });
      }

      const subGroup = await CoaAccountService.createCoaSubGroup(
        { name, code, coaGroupId: parseInt(coaGroupId), type },
        userId
      );

      return res.json({
        status: 'ok',
        message: 'COA Sub-Group created successfully',
        subGroup,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create COA Sub-Group',
      });
    }
  }
}

