'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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

interface LedgerEntry {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: string;
  particulars: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  narration: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function GeneralLedger() {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);

  // Demo data
  useEffect(() => {
    const demoAccounts: Account[] = [
      { id: '1', code: '101001', name: 'Cash in Hand', type: 'Asset' },
      { id: '2', code: '101002', name: 'Bank Account - HBL', type: 'Asset' },
      { id: '3', code: '201001', name: 'Accounts Payable', type: 'Liability' },
      { id: '4', code: '201002', name: 'Accounts Receivable', type: 'Asset' },
      { id: '5', code: '301001', name: 'Sales Revenue', type: 'Income' },
      { id: '6', code: '401001', name: 'Purchase Expense', type: 'Expense' },
      { id: '7', code: '401002', name: 'Salary Expense', type: 'Expense' },
      { id: '8', code: '401003', name: 'Rent Expense', type: 'Expense' },
    ];
    setAccounts(demoAccounts);

    // Demo ledger entries
    const demoEntries: LedgerEntry[] = [
      {
        id: '1',
        date: '2025-12-01',
        voucherNo: 'JV-001',
        voucherType: 'Journal',
        particulars: 'Opening Balance',
        accountName: 'Cash in Hand',
        debit: 50000,
        credit: 0,
        balance: 50000,
        narration: 'Opening balance for December 2025',
      },
      {
        id: '2',
        date: '2025-12-02',
        voucherNo: 'SV-001',
        voucherType: 'Sales',
        particulars: 'Sales Invoice #001',
        accountName: 'Cash in Hand',
        debit: 15000,
        credit: 0,
        balance: 65000,
        narration: 'Cash sales to customer',
      },
      {
        id: '3',
        date: '2025-12-03',
        voucherNo: 'PV-001',
        voucherType: 'Payment',
        particulars: 'Supplier Payment',
        accountName: 'Cash in Hand',
        debit: 0,
        credit: 8000,
        balance: 57000,
        narration: 'Payment to XYZ Supplier',
      },
      {
        id: '4',
        date: '2025-12-05',
        voucherNo: 'RV-001',
        voucherType: 'Receipt',
        particulars: 'Customer Payment Received',
        accountName: 'Cash in Hand',
        debit: 25000,
        credit: 0,
        balance: 82000,
        narration: 'Received from ABC Customer',
      },
      {
        id: '5',
        date: '2025-12-07',
        voucherNo: 'PV-002',
        voucherType: 'Payment',
        particulars: 'Rent Payment',
        accountName: 'Cash in Hand',
        debit: 0,
        credit: 12000,
        balance: 70000,
        narration: 'Monthly rent for December',
      },
      {
        id: '6',
        date: '2025-12-10',
        voucherNo: 'SV-002',
        voucherType: 'Sales',
        particulars: 'Sales Invoice #002',
        accountName: 'Cash in Hand',
        debit: 35000,
        credit: 0,
        balance: 105000,
        narration: 'Parts sales - Engine components',
      },
    ];
    setEntries(demoEntries);
    
    // Calculate totals
    const debitTotal = demoEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const creditTotal = demoEntries.reduce((sum, entry) => sum + entry.credit, 0);
    setTotalDebit(debitTotal);
    setTotalCredit(creditTotal);
    setOpeningBalance(50000);
    setClosingBalance(demoEntries[demoEntries.length - 1]?.balance || 0);
  }, [selectedAccount, dateFrom, dateTo]);

  const filteredEntries = entries.filter(entry => 
    entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.narration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVoucherTypeColor = (type: string) => {
    switch (type) {
      case 'Journal': return 'bg-blue-100 text-blue-700';
      case 'Sales': return 'bg-green-100 text-green-700';
      case 'Purchase': return 'bg-purple-100 text-purple-700';
      case 'Payment': return 'bg-red-100 text-red-700';
      case 'Receipt': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">General Ledger</h2>
            <p className="text-sm text-gray-500">View detailed account transactions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="account-select" className="text-sm font-medium mb-2 block">Select Account</Label>
              <Select
                id="account-select"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
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
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search entries..."
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Opening Balance</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(openingBalance)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Debit</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalDebit)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Credit</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalCredit)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Closing Balance</p>
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(closingBalance)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
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
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Debit</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Credit</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-600">No ledger entries found</p>
                        <p className="text-sm text-gray-400">Select an account and date range to view entries</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="px-4 py-3 font-medium whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600 hover:underline cursor-pointer">
                          {entry.voucherNo}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVoucherTypeColor(entry.voucherType)}`}>
                          {entry.voucherType}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{entry.particulars}</p>
                          <p className="text-xs text-gray-500">{entry.narration}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {entry.debit > 0 ? (
                          <span className="font-semibold text-green-600">{formatCurrency(entry.debit)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {entry.credit > 0 ? (
                          <span className="font-semibold text-red-600">{formatCurrency(entry.credit)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className={`font-bold ${entry.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          {formatCurrency(entry.balance)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filteredEntries.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(closingBalance)}</td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredEntries.length}</span> entries
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="bg-primary-50 text-primary-600 border-primary-200">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}

