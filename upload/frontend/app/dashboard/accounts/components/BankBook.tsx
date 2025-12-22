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

interface BankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  accountType: string;
  balance: number;
  status: 'Active' | 'Inactive';
}

interface BankTransaction {
  id: string;
  date: string;
  voucherNo: string;
  transactionType: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Cheque';
  particulars: string;
  bankAccount: string;
  bankAccountId: string;
  chequeNo: string;
  debit: number;
  credit: number;
  balance: number;
  narration: string;
  status: 'Cleared' | 'Pending' | 'Bounced';
}

export default function BankBook() {
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [bankDialogOpen, setBankDialogOpen] = useState(false);

  const [totalBalance, setTotalBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);

  // Form state
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bankAccountId: '',
    amount: '',
    chequeNo: '',
    narration: '',
    reference: '',
  });

  // Demo data
  useEffect(() => {
    const demoBankAccounts: BankAccount[] = [
      { id: '1', bankName: 'HBL - Main Account', accountNo: '1234-5678-9012', accountType: 'Current', balance: 850000, status: 'Active' },
      { id: '2', bankName: 'MCB - Business Account', accountNo: '9876-5432-1098', accountType: 'Current', balance: 425000, status: 'Active' },
      { id: '3', bankName: 'UBL - Savings Account', accountNo: '5555-4444-3333', accountType: 'Savings', balance: 150000, status: 'Active' },
      { id: '4', bankName: 'Allied Bank', accountNo: '7777-8888-9999', accountType: 'Current', balance: 275000, status: 'Active' },
    ];
    setBankAccounts(demoBankAccounts);
    setTotalBalance(demoBankAccounts.reduce((sum, b) => sum + b.balance, 0));

    const demoTransactions: BankTransaction[] = [
      {
        id: '1',
        date: '2025-12-01',
        voucherNo: 'BD-2025-001',
        transactionType: 'Deposit',
        particulars: 'Opening Balance',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: '',
        debit: 500000,
        credit: 0,
        balance: 500000,
        narration: 'Opening balance transfer',
        status: 'Cleared',
      },
      {
        id: '2',
        date: '2025-12-02',
        voucherNo: 'BD-2025-002',
        transactionType: 'Deposit',
        particulars: 'Customer Payment',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: 'CHQ-45678',
        debit: 125000,
        credit: 0,
        balance: 625000,
        narration: 'Cheque deposit from City Motors',
        status: 'Cleared',
      },
      {
        id: '3',
        date: '2025-12-03',
        voucherNo: 'BW-2025-001',
        transactionType: 'Withdrawal',
        particulars: 'Supplier Payment',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: 'CHQ-001234',
        debit: 0,
        credit: 75000,
        balance: 550000,
        narration: 'Payment to ABC Auto Parts',
        status: 'Cleared',
      },
      {
        id: '4',
        date: '2025-12-04',
        voucherNo: 'BT-2025-001',
        transactionType: 'Transfer',
        particulars: 'Inter-Bank Transfer',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: '',
        debit: 0,
        credit: 100000,
        balance: 450000,
        narration: 'Transfer to MCB account',
        status: 'Cleared',
      },
      {
        id: '5',
        date: '2025-12-05',
        voucherNo: 'BD-2025-003',
        transactionType: 'Deposit',
        particulars: 'Sales Proceeds',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: '',
        debit: 200000,
        credit: 0,
        balance: 650000,
        narration: 'Online transfer from Premium Auto Care',
        status: 'Cleared',
      },
      {
        id: '6',
        date: '2025-12-06',
        voucherNo: 'BW-2025-002',
        transactionType: 'Cheque',
        particulars: 'Rent Payment',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: 'CHQ-001235',
        debit: 0,
        credit: 50000,
        balance: 600000,
        narration: 'Office rent for December',
        status: 'Pending',
      },
      {
        id: '7',
        date: '2025-12-07',
        voucherNo: 'BD-2025-004',
        transactionType: 'Deposit',
        particulars: 'Customer Cheque',
        bankAccount: 'HBL - Main Account',
        bankAccountId: '1',
        chequeNo: 'CHQ-78901',
        debit: 85000,
        credit: 0,
        balance: 685000,
        narration: 'Cheque from Star Auto Parts',
        status: 'Pending',
      },
      {
        id: '8',
        date: '2025-12-08',
        voucherNo: 'BD-2025-005',
        transactionType: 'Deposit',
        particulars: 'Interest Credit',
        bankAccount: 'UBL - Savings Account',
        bankAccountId: '3',
        chequeNo: '',
        debit: 2500,
        credit: 0,
        balance: 152500,
        narration: 'Monthly interest credit',
        status: 'Cleared',
      },
    ];
    setTransactions(demoTransactions);

    // Calculate totals
    const deposits = demoTransactions.reduce((sum, t) => sum + t.debit, 0);
    const withdrawals = demoTransactions.reduce((sum, t) => sum + t.credit, 0);
    setTotalDeposits(deposits);
    setTotalWithdrawals(withdrawals);
  }, [selectedBank, dateFrom, dateTo]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesBank = selectedBank === '' || transaction.bankAccountId === selectedBank;
    const matchesType = filterType === 'all' || 
      transaction.transactionType.toLowerCase() === filterType.toLowerCase();
    const matchesSearch = 
      transaction.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.chequeNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBank && matchesType && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit': return 'bg-green-100 text-green-700';
      case 'Withdrawal': return 'bg-red-100 text-red-700';
      case 'Transfer': return 'bg-blue-100 text-blue-700';
      case 'Cheque': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cleared': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Bounced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleNewEntry = (type: 'deposit' | 'withdrawal') => {
    setEntryType(type);
    setEntryForm({
      date: new Date().toISOString().split('T')[0],
      bankAccountId: selectedBank || '',
      amount: '',
      chequeNo: '',
      narration: '',
      reference: '',
    });
    setNewEntryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bank Book</h2>
            <p className="text-sm text-gray-500">Manage all bank transactions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleNewEntry('deposit')} className="bg-green-600 hover:bg-green-700 gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Bank Deposit
          </Button>
          <Button onClick={() => handleNewEntry('withdrawal')} variant="destructive" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Bank Withdrawal
          </Button>
          <Button variant="outline" onClick={() => setBankDialogOpen(true)} className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            Bank Accounts
          </Button>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bankAccounts.map((bank) => (
          <div 
            key={bank.id}
            onClick={() => setSelectedBank(selectedBank === bank.id ? '' : bank.id)}
            className={`rounded-xl p-4 border cursor-pointer transition-all ${
              selectedBank === bank.id 
                ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' 
                : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${bank.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {bank.status}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{bank.bankName}</h3>
            <p className="text-xs text-gray-500 mb-2">{bank.accountNo}</p>
            <p className="text-xl font-bold text-indigo-600">{formatCurrency(bank.balance)}</p>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total Bank Balance</p>
              <p className="text-2xl font-bold text-indigo-700">{formatCurrency(totalBalance)}</p>
              <p className="text-xs text-indigo-500">{bankAccounts.filter(b => b.status === 'Active').length} active accounts</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Deposits</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalDeposits)}</p>
              <p className="text-xs text-green-500">This period</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalWithdrawals)}</p>
              <p className="text-xs text-red-500">This period</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="bank-select" className="text-sm font-medium mb-2 block">Bank Account</Label>
              <Select
                id="bank-select"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full"
              >
                <option value="">All Banks</option>
                {bankAccounts.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from" className="text-sm font-medium mb-2 block">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-sm font-medium mb-2 block">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter-type" className="text-sm font-medium mb-2 block">Transaction Type</Label>
              <Select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer">Transfers</option>
                <option value="cheque">Cheques</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Transactions Table */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Voucher No.</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Particulars</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Cheque No.</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Debit</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Credit</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Balance</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-600">No transactions found</p>
                        <p className="text-sm text-gray-400">Select a bank account or add a new transaction</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="px-4 py-3 font-medium whitespace-nowrap">
                        {new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-sm text-indigo-600 hover:underline cursor-pointer">
                          {transaction.voucherNo}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {transaction.transactionType}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.particulars}</p>
                          <p className="text-xs text-gray-500">{transaction.narration}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-sm">
                        {transaction.chequeNo || '-'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {transaction.debit > 0 ? (
                          <span className="font-semibold text-green-600">{formatCurrency(transaction.debit)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {transaction.credit > 0 ? (
                          <span className="font-semibold text-red-600">{formatCurrency(transaction.credit)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">{formatCurrency(transaction.balance)}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Entry Dialog */}
      <Dialog open={newEntryDialogOpen} onOpenChange={setNewEntryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {entryType === 'deposit' ? 'New Bank Deposit' : 'New Bank Withdrawal'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry-date" className="text-sm font-medium mb-2 block">Date</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="entry-bank" className="text-sm font-medium mb-2 block">Bank Account</Label>
                <Select
                  id="entry-bank"
                  value={entryForm.bankAccountId}
                  onChange={(e) => setEntryForm({ ...entryForm, bankAccountId: e.target.value })}
                  required
                >
                  <option value="">Select Bank</option>
                  {bankAccounts.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bankName}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry-amount" className="text-sm font-medium mb-2 block">Amount</Label>
                <Input
                  id="entry-amount"
                  type="number"
                  placeholder="0.00"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="entry-cheque" className="text-sm font-medium mb-2 block">Cheque No. (if any)</Label>
                <Input
                  id="entry-cheque"
                  type="text"
                  placeholder="Cheque number"
                  value={entryForm.chequeNo}
                  onChange={(e) => setEntryForm({ ...entryForm, chequeNo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="entry-reference" className="text-sm font-medium mb-2 block">Reference</Label>
              <Input
                id="entry-reference"
                type="text"
                placeholder="Transaction reference"
                value={entryForm.reference}
                onChange={(e) => setEntryForm({ ...entryForm, reference: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="entry-narration" className="text-sm font-medium mb-2 block">Narration</Label>
              <Textarea
                id="entry-narration"
                placeholder="Enter transaction details..."
                value={entryForm.narration}
                onChange={(e) => setEntryForm({ ...entryForm, narration: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setNewEntryDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={entryType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {entryType === 'deposit' ? 'Add Deposit' : 'Add Withdrawal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bank Accounts Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Bank Accounts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Bank Account
              </Button>
            </div>
            <div className="space-y-3">
              {bankAccounts.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{bank.bankName}</p>
                      <p className="text-sm text-gray-500">{bank.accountNo} • {bank.accountType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(bank.balance)}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bank.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {bank.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

