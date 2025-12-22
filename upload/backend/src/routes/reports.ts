import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

router.post('/daily-closing', ReportsController.getDailyClosing);
router.get('/balance-sheet', ReportsController.getBalanceSheet);
router.get('/trial-balance', ReportsController.getTrialBalance);
router.get('/general-journal', ReportsController.getGeneralJournal);

export default router;

