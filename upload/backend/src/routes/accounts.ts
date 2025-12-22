import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

// ============================================
// MAIN GROUPS
// ============================================

// Get all main groups
router.get('/main-groups', async (req: Request, res: Response) => {
  try {
    const mainGroups = await prisma.mainGroup.findMany({
      include: {
        subGroups: {
          include: {
            accounts: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    res.json(mainGroups);
  } catch (error) {
    console.error('Error fetching main groups:', error);
    res.status(500).json({ error: 'Failed to fetch main groups' });
  }
});

// Create main group
router.post('/main-groups', async (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    const mainGroup = await prisma.mainGroup.create({
      data: { code: parseInt(code), name }
    });
    
    res.status(201).json(mainGroup);
  } catch (error: any) {
    console.error('Error creating main group:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A main group with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create main group' });
  }
});

// Update main group
router.put('/main-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;

    const mainGroup = await prisma.mainGroup.update({
      where: { id },
      data: { code: parseInt(code), name }
    });
    
    res.json(mainGroup);
  } catch (error: any) {
    console.error('Error updating main group:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Main group not found' });
    }
    res.status(500).json({ error: 'Failed to update main group' });
  }
});

// Delete main group
router.delete('/main-groups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.mainGroup.delete({ where: { id } });
    
    res.json({ message: 'Main group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting main group:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Main group not found' });
    }
    res.status(500).json({ error: 'Failed to delete main group' });
  }
});

// ============================================
// SUBGROUPS
// ============================================

// Get all subgroups
router.get('/subgroups', async (req: Request, res: Response) => {
  try {
    const { mainGroupId } = req.query;
    
    const where: any = {};
    if (mainGroupId) {
      where.mainGroupId = mainGroupId as string;
    }
    
    const subGroups = await prisma.subGroup.findMany({
      where,
      include: {
        mainGroup: true,
        accounts: true
      },
      orderBy: { code: 'asc' }
    });
    res.json(subGroups);
  } catch (error) {
    console.error('Error fetching subgroups:', error);
    res.status(500).json({ error: 'Failed to fetch subgroups' });
  }
});

// Create subgroup
router.post('/subgroups', async (req: Request, res: Response) => {
  try {
    const { mainGroupId, code, name, status } = req.body;
    
    if (!mainGroupId || !code || !name) {
      return res.status(400).json({ error: 'Main group ID, code, and name are required' });
    }

    const subGroup = await prisma.subGroup.create({
      data: { 
        mainGroupId, 
        code, 
        name, 
        status: status || 'Active' 
      },
      include: { mainGroup: true }
    });
    
    res.status(201).json(subGroup);
  } catch (error: any) {
    console.error('Error creating subgroup:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A subgroup with this code already exists in this main group' });
    }
    res.status(500).json({ error: 'Failed to create subgroup' });
  }
});

// Update subgroup
router.put('/subgroups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mainGroupId, code, name, status } = req.body;

    const subGroup = await prisma.subGroup.update({
      where: { id },
      data: { mainGroupId, code, name, status },
      include: { mainGroup: true }
    });
    
    res.json(subGroup);
  } catch (error: any) {
    console.error('Error updating subgroup:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subgroup not found' });
    }
    res.status(500).json({ error: 'Failed to update subgroup' });
  }
});

// Delete subgroup
router.delete('/subgroups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.subGroup.delete({ where: { id } });
    
    res.json({ message: 'Subgroup deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting subgroup:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Subgroup not found' });
    }
    res.status(500).json({ error: 'Failed to delete subgroup' });
  }
});

// ============================================
// ACCOUNTS
// ============================================

// Get all accounts
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const { subGroupId, status } = req.query;
    
    const where: any = {};
    if (subGroupId) {
      where.subGroupId = subGroupId as string;
    }
    if (status) {
      where.status = status as string;
    }
    
    const accounts = await prisma.account.findMany({
      where,
      include: {
        subGroup: {
          include: {
            mainGroup: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create account
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const { subGroupId, code, name, status } = req.body;
    
    if (!subGroupId || !code || !name) {
      return res.status(400).json({ error: 'Subgroup ID, code, and name are required' });
    }

    const account = await prisma.account.create({
      data: { 
        subGroupId, 
        code, 
        name, 
        status: status || 'Active' 
      },
      include: {
        subGroup: {
          include: { mainGroup: true }
        }
      }
    });
    
    res.status(201).json(account);
  } catch (error: any) {
    console.error('Error creating account:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An account with this code already exists' });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
router.put('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subGroupId, code, name, status } = req.body;

    const account = await prisma.account.update({
      where: { id },
      data: { subGroupId, code, name, status },
      include: {
        subGroup: {
          include: { mainGroup: true }
        }
      }
    });
    
    res.json(account);
  } catch (error: any) {
    console.error('Error updating account:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete account
router.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.account.delete({ where: { id } });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Bulk delete accounts
router.post('/accounts/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Account IDs are required' });
    }

    await prisma.account.deleteMany({
      where: { id: { in: ids } }
    });
    
    res.json({ message: `${ids.length} accounts deleted successfully` });
  } catch (error) {
    console.error('Error bulk deleting accounts:', error);
    res.status(500).json({ error: 'Failed to delete accounts' });
  }
});

// ============================================
// COA (Chart of Accounts) Routes
// ============================================
import { CoaAccountController } from '../controllers/coaAccount.controller';

// COA Groups
router.get('/coa-groups', CoaAccountController.getCoaGroups);
router.post('/coa-groups', CoaAccountController.createCoaGroup);
router.get('/coa-sub-groups', CoaAccountController.getCoaSubGroups);
router.post('/coa-sub-groups', CoaAccountController.createCoaSubGroup);

// COA Accounts
router.get('/coa-accounts', CoaAccountController.index);
router.post('/coa-accounts', CoaAccountController.store);
router.put('/coa-accounts/:id', CoaAccountController.update);
router.patch('/coa-accounts/toggle-status/:id', CoaAccountController.toggleStatus);
router.get('/cash-accounts', CoaAccountController.getCashAccounts);
router.get('/bank-accounts', CoaAccountController.getBankAccounts);
router.get('/except-cash', CoaAccountController.getAccountsExceptCash);
router.get('/ledger/:accountId', CoaAccountController.getAccountLedger);

export default router;

