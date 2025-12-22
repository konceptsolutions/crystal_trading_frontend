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

interface CashTransaction {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: 'Receipt' | 'Payment' | 'Journal';
  particulars: string;
  accountHead: string;
  debit: number;
  credit: number;
  balance: number;
  narration: string;
}

export default function CashBook() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<'receipt' | 'payment'>('receipt');
  
  const [openingBalance, setOpeningBalance] = useState(75000);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  // Form state
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    accountHead: '',
    amount: '',
    narration: '',
    reference: '',
  });

  // Demo data
  useEffect(() => {
    const demoTransactions: CashTransaction[] = [
      {
        id: '1',
        date: '2025-12-01',
        voucherNo: 'CR-2025-001',
        voucherType: 'Receipt',
        particulars: 'Opening Balance',
        accountHead: 'Capital Account',
        debit: 75000,
        credit: 0,
        balance: 75000,
        narration: 'Opening cash balance for December 2025',
      },
      {
        id: '2',
        date: '2025-12-02',
        voucherNo: 'CR-2025-002',
        voucherType: 'Receipt',
        particulars: 'Sales Invoice #101',
        accountHead: 'Sales Revenue',
        debit: 35000,
        credit: 0,
        balance: 110000,
        narration: 'Cash sales to Ahmed Auto Workshop',
      },
      {
        id: '3',
        date: '2025-12-03',
        voucherNo: 'CP-2025-001',
        voucherType: 'Payment',
        particulars: 'Supplier Payment',
        accountHead: 'Accounts Payable',
        debit: 0,
        credit: 25000,
        balance: 85000,
        narration: 'Payment to ABC Auto Parts',
      },
      {
        id: '4',
        date: '2025-12-04',
        voucherNo: 'CR-2025-003',
        voucherType: 'Receipt',
        particulars: 'Customer Payment',
        accountHead: 'Accounts Receivable',
        debit: 45000,
        credit: 0,
        balance: 130000,
        narration: 'Received from City Motors against Inv#098',
      },
      {
        id: '5',
        date: '2025-12-05',
        voucherNo: 'CP-2025-002',
        voucherType: 'Payment',
        particulars: 'Salary Payment',
        accountHead: 'Salary Expense',
        debit: 0,
        credit: 65000,
        balance: 65000,
        narration: 'Staff salaries for November 2025',
      },
      {
        id: '6',
        date: '2025-12-06',
        voucherNo: 'CP-2025-003',
        voucherType: 'Payment',
        particulars: 'Office Rent',
        accountHead: 'Rent Expense',
        debit: 0,
        credit: 20000,
        balance: 45000,
        narration: 'Office rent for December 2025',
      },
      {
        id: '7',
        date: '2025-12-07',
        voucherNo: 'CR-2025-004',
        voucherType: 'Receipt',
        particulars: 'Cash Sales',
        accountHead: 'Sales Revenue',
        debit: 28000,
        credit: 0,
        balance: 73000,
        narration: 'Counter cash sales',
      },
      {
        id: '8',
        date: '2025-12-08',
        voucherNo: 'CP-2025-004',
        voucherType: 'Payment',
        particulars: 'Utility Bills',
        accountHead: 'Utilities Expense',
        debit: 0,
        credit: 8500,
        balance: 64500,
        narration: 'Electricity and water bills',
      },
      {
        id: '9',
        date: '2025-12-09',
        voucherNo: 'CR-2025-005',
        voucherType: 'Receipt',
        particulars: 'Customer Payment',
        accountHead: 'Accounts Receivable',
        debit: 55000,
        credit: 0,
        balance: 119500,
        narration: 'Received from Fast Track Service',
      },
      {
        id: '10',
        date: '2025-12-10',
        voucherNo: 'CP-2025-005',
        voucherType: 'Payment',
        particulars: 'Petty Cash Expense',
        accountHead: 'Miscellaneous Expense',
        debit: 0,
        credit: 5000,
        balance: 114500,
        narration: 'Petty cash reimbursement',
      },
    ];
    setTransactions(demoTransactions);

    // Calculate totals
    const receipts = demoTransactions.reduce((sum, t) => sum + t.debit, 0);
    const payments = demoTransactions.reduce((sum, t) => sum + t.credit, 0);
    setTotalReceipts(receipts);
    setTotalPayments(payments);
    setClosingBalance(demoTransactions[demoTransactions.length - 1]?.balance || 0);
  }, [dateFrom, dateTo]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || 
      (filterType === 'receipt' && transaction.voucherType === 'Receipt') ||
      (filterType === 'payment' && transaction.voucherType === 'Payment');
    const matchesSearch = 
      transaction.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.narration.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getVoucherTypeColor = (type: string) => {
    switch (type) {
      case 'Receipt': return 'bg-green-100 text-green-700';
      case 'Payment': return 'bg-red-100 text-red-700';
      case 'Journal': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleNewEntry = (type: 'receipt' | 'payment') => {
    setEntryType(type);
    setEntryForm({
      date: new Date().toISOString().split('T')[0],
      accountHead: '',
      amount: '',
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cash Book</h2>
            <p className="text-sm text-gray-500">Track all cash transactions</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleNewEntry('receipt')} className="bg-green-600 hover:bg-green-700 gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Cash Receipt
          </Button>
          <Button onClick={() => handleNewEntry('payment')} variant="destructive" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Cash Payment
          </Button>
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
        </div>
      </div>

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
              <p className="text-sm text-green-600 font-medium">Total Receipts</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalReceipts)}</p>
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
              <p className="text-sm text-red-600 font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPayments)}</p>
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

      {/* Filters */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="all">All Transactions</option>
                <option value="receipt">Receipts Only</option>
                <option value="payment">Payments Only</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search transactions..."
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

      {/* Cash Book Table */}
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
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Account Head</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Debit (In)</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Credit (Out)</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-600">No transactions found</p>
                        <p className="text-sm text-gray-400">Add a new cash receipt or payment to get started</p>
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
                        <span className="font-mono text-sm text-blue-600 hover:underline cursor-pointer">
                          {transaction.voucherNo}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVoucherTypeColor(transaction.voucherType)}`}>
                          {transaction.voucherType}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{transaction.particulars}</p>
                          <p className="text-xs text-gray-500">{transaction.narration}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{transaction.accountHead}</TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filteredTransactions.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={5} className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalReceipts)}</td>
                    <td className="px-4 py-3 text-right text-red-700">{formatCurrency(totalPayments)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(closingBalance)}</td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Entry Dialog */}
      <Dialog open={newEntryDialogOpen} onOpenChange={setNewEntryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {entryType === 'receipt' ? 'New Cash Receipt' : 'New Cash Payment'}
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
            </div>

            <div>
              <Label htmlFor="entry-account" className="text-sm font-medium mb-2 block">Account Head</Label>
              <Select
                id="entry-account"
                value={entryForm.accountHead}
                onChange={(e) => setEntryForm({ ...entryForm, accountHead: e.target.value })}
                required
              >
                <option value="">Select Account</option>
                {entryType === 'receipt' ? (
                  <>
                    <option value="Sales Revenue">Sales Revenue</option>
                    <option value="Accounts Receivable">Accounts Receivable</option>
                    <option value="Service Revenue">Service Revenue</option>
                    <option value="Interest Income">Interest Income</option>
                    <option value="Other Income">Other Income</option>
                  </>
                ) : (
                  <>
                    <option value="Accounts Payable">Accounts Payable</option>
                    <option value="Salary Expense">Salary Expense</option>
                    <option value="Rent Expense">Rent Expense</option>
                    <option value="Utilities Expense">Utilities Expense</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Miscellaneous Expense">Miscellaneous Expense</option>
                  </>
                )}
              </Select>
            </div>

            <div>
              <Label htmlFor="entry-reference" className="text-sm font-medium mb-2 block">Reference</Label>
              <Input
                id="entry-reference"
                type="text"
                placeholder="Invoice/Receipt reference"
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
                className={entryType === 'receipt' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {entryType === 'receipt' ? 'Add Receipt' : 'Add Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

