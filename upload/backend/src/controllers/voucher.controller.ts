import { Request, Response } from 'express';
import { VoucherService, createVoucherSchema } from '../services/voucher.service';

export class VoucherController {
  /**
   * GET /api/vouchers
   * List vouchers with filters
   */
  static async index(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const {
        voucherNo,
        type,
        from,
        to,
        isApproved,
        isPostDated,
        coaAccountId,
      } = req.query;

      const vouchers = await VoucherService.getVouchers({
        userId,
        voucherNo: voucherNo as string,
        type: type ? parseInt(type as string) : undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        isApproved: isApproved === 'true' ? true : isApproved === 'false' ? false : undefined,
        isPostDated: isPostDated ? parseInt(isPostDated as string) : undefined,
        coaAccountId: coaAccountId ? parseInt(coaAccountId as string) : undefined,
      });

      return res.json({ vouchers });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch vouchers',
      });
    }
  }

  /**
   * POST /api/vouchers
   * Create new voucher
   */
  static async store(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validatedData = createVoucherSchema.parse(req.body);
      const result = await VoucherService.createVoucher(validatedData, userId);

      return res.json({
        status: 'ok',
        message: 'Voucher created successfully',
        voucher: result.voucher,
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
        message: error.message || 'Failed to create voucher',
      });
    }
  }

  /**
   * GET /api/vouchers/:id
   * Get single voucher
   */
  static async show(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const voucherId = parseInt(req.params.id);
      const voucher = await VoucherService.getVoucherById(voucherId, userId);

      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      return res.json({ voucher });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch voucher',
      });
    }
  }

  /**
   * POST /api/vouchers/:id/approve
   * Toggle voucher approval
   */
  static async toggleApproval(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const voucherId = parseInt(req.params.id);
      const voucher = await VoucherService.toggleApproval(voucherId, userId);

      const message = voucher.isApproved ? 'Voucher approved successfully' : 'Voucher unapproved successfully';

      return res.json({
        status: 'ok',
        message,
        voucher,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to toggle approval',
      });
    }
  }

  /**
   * POST /api/vouchers/:id/clear-post-dated
   * Clear post-dated voucher
   */
  static async clearPostDated(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const voucherId = parseInt(req.params.id);
      const { date } = req.body;

      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }

      const voucher = await VoucherService.clearPostDated(voucherId, userId, new Date(date));

      return res.json({
        status: 'ok',
        message: 'Post-dated voucher cleared successfully',
        voucher,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to clear post-dated voucher',
      });
    }
  }

  /**
   * DELETE /api/vouchers/:id
   * Delete voucher
   */
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const voucherId = parseInt(req.params.id);
      await VoucherService.deleteVoucher(voucherId, userId);

      return res.json({
        status: 'ok',
        message: 'Voucher deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete voucher',
      });
    }
  }
}

