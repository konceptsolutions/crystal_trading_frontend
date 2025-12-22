import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

// Voucher routes
router.get('/', VoucherController.index);
router.post('/', VoucherController.store);
router.get('/:id', VoucherController.show);
router.post('/:id/approve', VoucherController.toggleApproval);
router.post('/:id/clear-post-dated', VoucherController.clearPostDated);
router.delete('/:id', VoucherController.delete);

export default router;

