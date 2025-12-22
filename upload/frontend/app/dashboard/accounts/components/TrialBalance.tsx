'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

interface TrialBalanceEntry {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  mainGroup: string;
  debit: number;
  credit: number;
}

export default function TrialBalance() {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('account');
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  // Demo data
  useEffect(() => {
    const demoEntries: TrialBalanceEntry[] = [
      // Assets
      { id: '1', accountCode: '101001', accountName: 'Cash in Hand', accountType: 'Asset', mainGroup: 'Current Assets', debit: 105000, credit: 0 },
      { id: '2', accountCode: '101002', accountName: 'Bank Account - HBL', accountType: 'Asset', mainGroup: 'Current Assets', debit: 250000, credit: 0 },
      { id: '3', accountCode: '101003', accountName: 'Bank Account - MCB', accountType: 'Asset', mainGroup: 'Current Assets', debit: 180000, credit: 0 },
      { id: '4', accountCode: '102001', accountName: 'Accounts Receivable', accountType: 'Asset', mainGroup: 'Current Assets', debit: 350000, credit: 0 },
      { id: '5', accountCode: '103001', accountName: 'Inventory - Parts', accountType: 'Asset', mainGroup: 'Current Assets', debit: 450000, credit: 0 },
      { id: '6', accountCode: '104001', accountName: 'Prepaid Expenses', accountType: 'Asset', mainGroup: 'Current Assets', debit: 25000, credit: 0 },
      { id: '7', accountCode: '151001', accountName: 'Furniture & Fixtures', accountType: 'Asset', mainGroup: 'Fixed Assets', debit: 150000, credit: 0 },
      { id: '8', accountCode: '151002', accountName: 'Office Equipment', accountType: 'Asset', mainGroup: 'Fixed Assets', debit: 85000, credit: 0 },
      { id: '9', accountCode: '151003', accountName: 'Vehicles', accountType: 'Asset', mainGroup: 'Fixed Assets', debit: 500000, credit: 0 },
      // Liabilities
      { id: '10', accountCode: '201001', accountName: 'Accounts Payable', accountType: 'Liability', mainGroup: 'Current Liabilities', debit: 0, credit: 280000 },
      { id: '11', accountCode: '201002', accountName: 'Accrued Expenses', accountType: 'Liability', mainGroup: 'Current Liabilities', debit: 0, credit: 45000 },
      { id: '12', accountCode: '202001', accountName: 'Short Term Loan', accountType: 'Liability', mainGroup: 'Current Liabilities', debit: 0, credit: 100000 },
      { id: '13', accountCode: '251001', accountName: 'Long Term Loan', accountType: 'Liability', mainGroup: 'Long Term Liabilities', debit: 0, credit: 300000 },
      // Equity
      { id: '14', accountCode: '301001', accountName: 'Capital Account', accountType: 'Equity', mainGroup: 'Owner\'s Equity', debit: 0, credit: 800000 },
      { id: '15', accountCode: '301002', accountName: 'Retained Earnings', accountType: 'Equity', mainGroup: 'Owner\'s Equity', debit: 0, credit: 250000 },
      // Income
      { id: '16', accountCode: '401001', accountName: 'Sales Revenue', accountType: 'Income', mainGroup: 'Operating Income', debit: 0, credit: 850000 },
      { id: '17', accountCode: '401002', accountName: 'Service Revenue', accountType: 'Income', mainGroup: 'Operating Income', debit: 0, credit: 120000 },
      { id: '18', accountCode: '402001', accountName: 'Interest Income', accountType: 'Income', mainGroup: 'Other Income', debit: 0, credit: 15000 },
      // Expenses
      { id: '19', accountCode: '501001', accountName: 'Cost of Goods Sold', accountType: 'Expense', mainGroup: 'Cost of Sales', debit: 520000, credit: 0 },
      { id: '20', accountCode: '601001', accountName: 'Salary Expense', accountType: 'Expense', mainGroup: 'Operating Expenses', debit: 180000, credit: 0 },
      { id: '21', accountCode: '601002', accountName: 'Rent Expense', accountType: 'Expense', mainGroup: 'Operating Expenses', debit: 60000, credit: 0 },
      { id: '22', accountCode: '601003', accountName: 'Utilities Expense', accountType: 'Expense', mainGroup: 'Operating Expenses', debit: 25000, credit: 0 },
      { id: '23', accountCode: '601004', accountName: 'Marketing Expense', accountType: 'Expense', mainGroup: 'Operating Expenses', debit: 35000, credit: 0 },
      { id: '24', accountCode: '601005', accountName: 'Office Supplies', accountType: 'Expense', mainGroup: 'Operating Expenses', debit: 15000, credit: 0 },
      { id: '25', accountCode: '601006', accountName: 'Depreciation Expense', accountType: 'Expense', mainGroup: 'Operating Expenses', debit: 45000, credit: 0 },
      { id: '26', accountCode: '701001', accountName: 'Interest Expense', accountType: 'Expense', mainGroup: 'Other Expenses', debit: 35000, credit: 0 },
    ];
    setEntries(demoEntries);

    // Calculate totals
    const debitTotal = demoEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const creditTotal = demoEntries.reduce((sum, entry) => sum + entry.credit, 0);
    setTotalDebit(debitTotal);
    setTotalCredit(creditTotal);
  }, [asOfDate]);

  const filteredEntries = showZeroBalance 
    ? entries 
    : entries.filter(entry => entry.debit !== 0 || entry.credit !== 0);

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const group = entry.mainGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(entry);
    return acc;
  }, {} as Record<string, TrialBalanceEntry[]>);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'bg-blue-100 text-blue-700';
      case 'Liability': return 'bg-red-100 text-red-700';
      case 'Equity': return 'bg-purple-100 text-purple-700';
      case 'Income': return 'bg-green-100 text-green-700';
      case 'Expense': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trial Balance</h2>
            <p className="text-sm text-gray-500">Summary of all account balances</p>
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

      {/* Balance Status */}
      <div className={`p-4 rounded-xl border ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <>
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-700">Trial Balance is Balanced</p>
                <p className="text-sm text-green-600">Total Debit equals Total Credit</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-700">Trial Balance is NOT Balanced</p>
                <p className="text-sm text-red-600">Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="as-of-date" className="text-sm font-medium mb-2 block">As of Date</Label>
              <Input
                id="as-of-date"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="group-by" className="text-sm font-medium mb-2 block">Group By</Label>
              <Select
                id="group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full"
              >
                <option value="account">Account</option>
                <option value="type">Account Type</option>
                <option value="group">Main Group</option>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showZeroBalance}
                  onChange={(e) => setShowZeroBalance(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show Zero Balance Accounts</span>
              </label>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Accounts</p>
              <p className="text-2xl font-bold text-blue-700">{filteredEntries.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-32">Account Code</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Account Name</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-28">Type</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right w-40">Debit</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right w-40">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedEntries).map(([group, entries]) => {
                  const groupDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                  const groupCredit = entries.reduce((sum, e) => sum + e.credit, 0);
                  const isExpanded = expandedGroups.includes(group);

                  return (
                    <React.Fragment key={group}>
                      {/* Group Header */}
                      <TableRow 
                        className="bg-gray-100 cursor-pointer hover:bg-gray-150"
                        onClick={() => toggleGroup(group)}
                      >
                        <TableCell colSpan={3} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <svg 
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="font-semibold text-gray-800">{group}</span>
                            <span className="text-xs text-gray-500">({entries.length} accounts)</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold text-green-700">
                          {groupDebit > 0 && formatCurrency(groupDebit)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold text-red-700">
                          {groupCredit > 0 && formatCurrency(groupCredit)}
                        </TableCell>
                      </TableRow>
                      {/* Group Items */}
                      {isExpanded && entries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-4 py-3 pl-10 font-mono text-sm text-gray-600">
                            {entry.accountCode}
                          </TableCell>
                          <TableCell className="px-4 py-3 font-medium text-gray-900">
                            {entry.accountName}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(entry.accountType)}`}>
                              {entry.accountType}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {entry.debit > 0 ? (
                              <span className="font-medium text-green-600">{formatCurrency(entry.debit)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {entry.credit > 0 ? (
                              <span className="font-medium text-red-600">{formatCurrency(entry.credit)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </TableBody>
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td colSpan={3} className="px-4 py-4 text-right text-gray-800">Grand Total:</td>
                  <td className="px-4 py-4 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                  <td className="px-4 py-4 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan={3} className="px-4 py-3 text-right text-gray-600 font-medium">Difference:</td>
                  <td colSpan={2} className={`px-4 py-3 text-center font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {isBalanced ? 'Balanced' : formatCurrency(Math.abs(totalDebit - totalCredit))}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

