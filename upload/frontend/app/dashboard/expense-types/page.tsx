'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type TabType = 'expense-types' | 'post-expense' | 'import-expenses' | 'operational-expenses';

interface ExpenseType {
  id: string;
  code: string;
  name: string;
  category: 'Import' | 'Operational' | 'Administrative' | 'Marketing' | 'Finance';
  description: string;
  status: 'Active' | 'Inactive';
  budgetLimit: number;
  currentMonthSpend: number;
}

interface Expense {
  id: string;
  date: string;
  voucherNo: string;
  expenseType: string;
  expenseTypeId: string;
  category: string;
  amount: number;
  paidTo: string;
  paymentMode: string;
  reference: string;
  description: string;
  status: 'Posted' | 'Pending' | 'Approved';
  attachments: number;
}

export default function ExpenseTypesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('expense-types');
  const [loading, setLoading] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  
  // Dialog states
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Form states
  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    category: 'Operational' as ExpenseType['category'],
    description: '',
    budgetLimit: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    expenseTypeId: '',
    amount: '',
    paidTo: '',
    paymentMode: 'Cash',
    reference: '',
    description: '',
  });

  // Demo data
  useEffect(() => {
    const demoExpenseTypes: ExpenseType[] = [
      { id: '1', code: 'EXP-001', name: 'Customs & Duties', category: 'Import', description: 'Import duties and customs charges', status: 'Active', budgetLimit: 500000, currentMonthSpend: 125000 },
      { id: '2', code: 'EXP-002', name: 'Freight & Shipping', category: 'Import', description: 'International shipping and freight charges', status: 'Active', budgetLimit: 300000, currentMonthSpend: 85000 },
      { id: '3', code: 'EXP-003', name: 'Clearing Agent Fees', category: 'Import', description: 'Custom clearing agent charges', status: 'Active', budgetLimit: 100000, currentMonthSpend: 25000 },
      { id: '4', code: 'EXP-004', name: 'Employee Salaries', category: 'Operational', description: 'Monthly staff salaries', status: 'Active', budgetLimit: 600000, currentMonthSpend: 480000 },
      { id: '5', code: 'EXP-005', name: 'Office Rent', category: 'Operational', description: 'Monthly office and warehouse rent', status: 'Active', budgetLimit: 150000, currentMonthSpend: 120000 },
      { id: '6', code: 'EXP-006', name: 'Utilities', category: 'Operational', description: 'Electricity, water, gas bills', status: 'Active', budgetLimit: 80000, currentMonthSpend: 45000 },
      { id: '7', code: 'EXP-007', name: 'Office Supplies', category: 'Administrative', description: 'Stationery and office materials', status: 'Active', budgetLimit: 30000, currentMonthSpend: 15000 },
      { id: '8', code: 'EXP-008', name: 'Communication', category: 'Administrative', description: 'Phone, internet, mobile bills', status: 'Active', budgetLimit: 25000, currentMonthSpend: 18000 },
      { id: '9', code: 'EXP-009', name: 'Marketing & Advertising', category: 'Marketing', description: 'Promotional and marketing expenses', status: 'Active', budgetLimit: 100000, currentMonthSpend: 35000 },
      { id: '10', code: 'EXP-010', name: 'Bank Charges', category: 'Finance', description: 'Bank fees and charges', status: 'Active', budgetLimit: 20000, currentMonthSpend: 8500 },
      { id: '11', code: 'EXP-011', name: 'Interest Expense', category: 'Finance', description: 'Loan and credit interest payments', status: 'Active', budgetLimit: 75000, currentMonthSpend: 45000 },
      { id: '12', code: 'EXP-012', name: 'Vehicle Maintenance', category: 'Operational', description: 'Delivery vehicle maintenance and fuel', status: 'Active', budgetLimit: 50000, currentMonthSpend: 28000 },
    ];
    setExpenseTypes(demoExpenseTypes);

    const demoExpenses: Expense[] = [
      { id: '1', date: '2025-12-10', voucherNo: 'EV-2025-001', expenseType: 'Customs & Duties', expenseTypeId: '1', category: 'Import', amount: 45000, paidTo: 'FBR', paymentMode: 'Bank Transfer', reference: 'DUT-123456', description: 'Import duty for shipment #SHP-001', status: 'Posted', attachments: 2 },
      { id: '2', date: '2025-12-09', voucherNo: 'EV-2025-002', expenseType: 'Freight & Shipping', expenseTypeId: '2', category: 'Import', amount: 35000, paidTo: 'DHL Express', paymentMode: 'Bank Transfer', reference: 'AWB-789012', description: 'Air freight charges for urgent parts', status: 'Posted', attachments: 1 },
      { id: '3', date: '2025-12-08', voucherNo: 'EV-2025-003', expenseType: 'Employee Salaries', expenseTypeId: '4', category: 'Operational', amount: 480000, paidTo: 'Staff Accounts', paymentMode: 'Bank Transfer', reference: 'SAL-DEC-2025', description: 'December 2025 staff salaries', status: 'Posted', attachments: 1 },
      { id: '4', date: '2025-12-07', voucherNo: 'EV-2025-004', expenseType: 'Utilities', expenseTypeId: '6', category: 'Operational', amount: 28000, paidTo: 'K-Electric', paymentMode: 'Online', reference: 'ELEC-DEC', description: 'Electricity bill December', status: 'Posted', attachments: 1 },
      { id: '5', date: '2025-12-06', voucherNo: 'EV-2025-005', expenseType: 'Office Rent', expenseTypeId: '5', category: 'Operational', amount: 120000, paidTo: 'ABC Properties', paymentMode: 'Cheque', reference: 'CHQ-4567', description: 'December office rent', status: 'Posted', attachments: 1 },
      { id: '6', date: '2025-12-05', voucherNo: 'EV-2025-006', expenseType: 'Marketing & Advertising', expenseTypeId: '9', category: 'Marketing', amount: 35000, paidTo: 'AdMedia Agency', paymentMode: 'Bank Transfer', reference: 'ADV-DEC', description: 'Social media marketing campaign', status: 'Approved', attachments: 3 },
      { id: '7', date: '2025-12-04', voucherNo: 'EV-2025-007', expenseType: 'Vehicle Maintenance', expenseTypeId: '12', category: 'Operational', amount: 18000, paidTo: 'Auto Service Center', paymentMode: 'Cash', reference: '', description: 'Delivery truck servicing', status: 'Posted', attachments: 1 },
      { id: '8', date: '2025-12-03', voucherNo: 'EV-2025-008', expenseType: 'Clearing Agent Fees', expenseTypeId: '3', category: 'Import', amount: 25000, paidTo: 'XYZ Clearing', paymentMode: 'Cash', reference: 'CLR-001', description: 'Customs clearance for shipment', status: 'Posted', attachments: 2 },
    ];
    setExpenses(demoExpenses);
  }, []);

  const filteredExpenseTypes = expenseTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || type.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || type.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expenseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.paidTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const importExpenses = filteredExpenses.filter(e => e.category === 'Import');
  const operationalExpenses = filteredExpenses.filter(e => e.category === 'Operational' || e.category === 'Administrative');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalImport = expenses.filter(e => e.category === 'Import').reduce((sum, e) => sum + e.amount, 0);
  const totalOperational = expenses.filter(e => e.category !== 'Import').reduce((sum, e) => sum + e.amount, 0);

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Import': return 'bg-blue-100 text-blue-700';
      case 'Operational': return 'bg-green-100 text-green-700';
      case 'Administrative': return 'bg-purple-100 text-purple-700';
      case 'Marketing': return 'bg-pink-100 text-pink-700';
      case 'Finance': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Posted': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Approved': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const openTypeDialog = (type?: ExpenseType) => {
    if (type) {
      setSelectedType(type);
      setTypeForm({
        code: type.code,
        name: type.name,
        category: type.category,
        description: type.description,
        budgetLimit: type.budgetLimit.toString(),
        status: type.status,
      });
    } else {
      setSelectedType(null);
      setTypeForm({
        code: '',
        name: '',
        category: 'Operational',
        description: '',
        budgetLimit: '',
        status: 'Active',
      });
    }
    setTypeDialogOpen(true);
  };

  const openExpenseDialog = () => {
    setSelectedExpense(null);
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      expenseTypeId: '',
      amount: '',
      paidTo: '',
      paymentMode: 'Cash',
      reference: '',
      description: '',
    });
    setExpenseDialogOpen(true);
  };

  const tabs = [
    { id: 'expense-types' as TabType, label: 'Expense Types', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )},
    { id: 'post-expense' as TabType, label: 'Post Expense', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: 'import-expenses' as TabType, label: 'Import Expenses', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'operational-expenses' as TabType, label: 'Operational Expenses', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Management</h1>
        <p className="text-gray-600">Manage expense types and post expenses</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-primary-500">This month</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Import Expenses</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalImport)}</p>
              <p className="text-xs text-blue-500">{expenses.filter(e => e.category === 'Import').length} transactions</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Operational Expenses</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalOperational)}</p>
              <p className="text-xs text-green-500">{expenses.filter(e => e.category !== 'Import').length} transactions</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Expense Types</p>
              <p className="text-2xl font-bold text-purple-700">{expenseTypes.length}</p>
              <p className="text-xs text-purple-500">{expenseTypes.filter(t => t.status === 'Active').length} active</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Types Tab */}
      {activeTab === 'expense-types' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Expense Types</h2>
                  <p className="text-sm text-gray-500">Manage expense categories</p>
                </div>
              </div>
              <Button onClick={() => openTypeDialog()} className="bg-purple-600 hover:bg-purple-700 gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense Type
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search expense types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-40"
              >
                <option value="all">All Categories</option>
                <option value="Import">Import</option>
                <option value="Operational">Operational</option>
                <option value="Administrative">Administrative</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </Select>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-32"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Code</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Name</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Category</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Budget</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Spent</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Usage</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenseTypes.map((type) => {
                    const usagePercent = (type.currentMonthSpend / type.budgetLimit) * 100;
                    return (
                      <TableRow key={type.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 font-mono text-sm text-purple-600">{type.code}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{type.name}</p>
                            <p className="text-xs text-gray-500">{type.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(type.category)}`}>
                            {type.category}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium">{formatCurrency(type.budgetLimit)}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium">{formatCurrency(type.currentMonthSpend)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="w-24">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{usagePercent.toFixed(0)}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {type.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openTypeDialog(type)}>
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Expense Tab */}
      {activeTab === 'post-expense' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Post New Expense</h2>
                <p className="text-sm text-gray-500">Record a new expense transaction</p>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expense-date" className="text-sm font-medium mb-2 block">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="expense-type" className="text-sm font-medium mb-2 block">Expense Type</Label>
                  <Select
                    id="expense-type"
                    value={expenseForm.expenseTypeId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseTypeId: e.target.value })}
                    required
                  >
                    <option value="">Select Expense Type</option>
                    {expenseTypes.filter(t => t.status === 'Active').map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.code} - {type.name} ({type.category})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expense-amount" className="text-sm font-medium mb-2 block">Amount</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense-paid-to" className="text-sm font-medium mb-2 block">Paid To</Label>
                  <Input
                    id="expense-paid-to"
                    type="text"
                    placeholder="Payee name"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense-mode" className="text-sm font-medium mb-2 block">Payment Mode</Label>
                  <Select
                    id="expense-mode"
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense-reference" className="text-sm font-medium mb-2 block">Reference Number</Label>
                  <Input
                    id="expense-reference"
                    type="text"
                    placeholder="Receipt/Invoice number"
                    value={expenseForm.reference}
                    onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Attachments</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
                    <svg className="w-6 h-6 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload files</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="expense-description" className="text-sm font-medium mb-2 block">Description</Label>
                <Textarea
                  id="expense-description"
                  placeholder="Enter expense details..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Post Expense
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Import Expenses Tab */}
      {activeTab === 'import-expenses' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Import Expenses</h2>
                  <p className="text-sm text-gray-500">Customs, freight, and shipping expenses</p>
                </div>
              </div>
              <Button onClick={openExpenseDialog} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Import Expense
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Date</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Voucher No.</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Expense Type</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Paid To</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        No import expenses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    importExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-sm text-blue-600">{expense.voucherNo}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <p className="font-medium">{expense.expenseType}</p>
                            <p className="text-xs text-gray-500">{expense.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">{expense.paidTo}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operational Expenses Tab */}
      {activeTab === 'operational-expenses' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Operational Expenses</h2>
                  <p className="text-sm text-gray-500">Day-to-day business expenses</p>
                </div>
              </div>
              <Button onClick={openExpenseDialog} className="bg-green-600 hover:bg-green-700 gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Operational Expense
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Date</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Voucher No.</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Expense Type</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Paid To</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationalExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        No operational expenses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    operationalExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-sm text-green-600">{expense.voucherNo}</TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <p className="font-medium">{expense.expenseType}</p>
                            <p className="text-xs text-gray-500">{expense.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">{expense.paidTo}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedType ? 'Edit Expense Type' : 'Add Expense Type'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type-code" className="text-sm font-medium mb-2 block">Code</Label>
                <Input
                  id="type-code"
                  type="text"
                  placeholder="EXP-XXX"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type-category" className="text-sm font-medium mb-2 block">Category</Label>
                <Select
                  id="type-category"
                  value={typeForm.category}
                  onChange={(e) => setTypeForm({ ...typeForm, category: e.target.value as ExpenseType['category'] })}
                  required
                >
                  <option value="Import">Import</option>
                  <option value="Operational">Operational</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="type-name" className="text-sm font-medium mb-2 block">Name</Label>
              <Input
                id="type-name"
                type="text"
                placeholder="Expense type name"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="type-description" className="text-sm font-medium mb-2 block">Description</Label>
              <Textarea
                id="type-description"
                placeholder="Enter description..."
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type-budget" className="text-sm font-medium mb-2 block">Monthly Budget Limit</Label>
                <Input
                  id="type-budget"
                  type="number"
                  placeholder="0.00"
                  value={typeForm.budgetLimit}
                  onChange={(e) => setTypeForm({ ...typeForm, budgetLimit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type-status" className="text-sm font-medium mb-2 block">Status</Label>
                <Select
                  id="type-status"
                  value={typeForm.status}
                  onChange={(e) => setTypeForm({ ...typeForm, status: e.target.value as 'Active' | 'Inactive' })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {selectedType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

