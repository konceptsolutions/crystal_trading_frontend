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

type StatementType = 'income-statement' | 'balance-sheet' | 'cash-flow' | 'profit-loss';

interface FinancialLineItem {
  id: string;
  name: string;
  amount: number;
  previousAmount?: number;
  children?: FinancialLineItem[];
  isTotal?: boolean;
  isHeader?: boolean;
}

export default function FinancialStatementsPage() {
  const [activeStatement, setActiveStatement] = useState<StatementType>('income-statement');
  const [period, setPeriod] = useState('current-month');
  const [year, setYear] = useState('2025');
  const [compareMode, setCompareMode] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Demo data for Income Statement
  const incomeStatementData: FinancialLineItem[] = [
    {
      id: '1',
      name: 'Revenue',
      amount: 0,
      isHeader: true,
      children: [
        { id: '1.1', name: 'Sales Revenue', amount: 2850000, previousAmount: 2650000 },
        { id: '1.2', name: 'Service Revenue', amount: 450000, previousAmount: 380000 },
        { id: '1.3', name: 'Other Income', amount: 75000, previousAmount: 45000 },
      ],
    },
    { id: '1t', name: 'Total Revenue', amount: 3375000, previousAmount: 3075000, isTotal: true },
    {
      id: '2',
      name: 'Cost of Goods Sold',
      amount: 0,
      isHeader: true,
      children: [
        { id: '2.1', name: 'Opening Stock', amount: 450000, previousAmount: 380000 },
        { id: '2.2', name: 'Purchases', amount: 1850000, previousAmount: 1720000 },
        { id: '2.3', name: 'Less: Closing Stock', amount: -520000, previousAmount: -450000 },
      ],
    },
    { id: '2t', name: 'Total Cost of Goods Sold', amount: 1780000, previousAmount: 1650000, isTotal: true },
    { id: 'gp', name: 'Gross Profit', amount: 1595000, previousAmount: 1425000, isTotal: true },
    {
      id: '3',
      name: 'Operating Expenses',
      amount: 0,
      isHeader: true,
      children: [
        { id: '3.1', name: 'Salary Expense', amount: 480000, previousAmount: 450000 },
        { id: '3.2', name: 'Rent Expense', amount: 120000, previousAmount: 120000 },
        { id: '3.3', name: 'Utilities Expense', amount: 45000, previousAmount: 42000 },
        { id: '3.4', name: 'Marketing Expense', amount: 85000, previousAmount: 65000 },
        { id: '3.5', name: 'Depreciation Expense', amount: 75000, previousAmount: 75000 },
        { id: '3.6', name: 'Office Supplies', amount: 25000, previousAmount: 22000 },
        { id: '3.7', name: 'Insurance Expense', amount: 35000, previousAmount: 35000 },
        { id: '3.8', name: 'Miscellaneous Expense', amount: 30000, previousAmount: 28000 },
      ],
    },
    { id: '3t', name: 'Total Operating Expenses', amount: 895000, previousAmount: 837000, isTotal: true },
    { id: 'op', name: 'Operating Profit', amount: 700000, previousAmount: 588000, isTotal: true },
    {
      id: '4',
      name: 'Other Income & Expenses',
      amount: 0,
      isHeader: true,
      children: [
        { id: '4.1', name: 'Interest Income', amount: 15000, previousAmount: 12000 },
        { id: '4.2', name: 'Interest Expense', amount: -45000, previousAmount: -48000 },
      ],
    },
    { id: 'np', name: 'Net Profit Before Tax', amount: 670000, previousAmount: 552000, isTotal: true },
    { id: 'tax', name: 'Income Tax Expense', amount: 167500, previousAmount: 138000 },
    { id: 'npat', name: 'Net Profit After Tax', amount: 502500, previousAmount: 414000, isTotal: true },
  ];

  // Demo data for Balance Sheet
  const balanceSheetData = {
    assets: [
      {
        id: 'ca',
        name: 'Current Assets',
        amount: 0,
        isHeader: true,
        children: [
          { id: 'ca1', name: 'Cash in Hand', amount: 185000, previousAmount: 145000 },
          { id: 'ca2', name: 'Bank Accounts', amount: 1700000, previousAmount: 1450000 },
          { id: 'ca3', name: 'Accounts Receivable', amount: 1175000, previousAmount: 980000 },
          { id: 'ca4', name: 'Inventory', amount: 520000, previousAmount: 450000 },
          { id: 'ca5', name: 'Prepaid Expenses', amount: 45000, previousAmount: 40000 },
        ],
      },
      { id: 'tca', name: 'Total Current Assets', amount: 3625000, previousAmount: 3065000, isTotal: true },
      {
        id: 'fa',
        name: 'Fixed Assets',
        amount: 0,
        isHeader: true,
        children: [
          { id: 'fa1', name: 'Furniture & Fixtures', amount: 250000, previousAmount: 280000 },
          { id: 'fa2', name: 'Office Equipment', amount: 185000, previousAmount: 210000 },
          { id: 'fa3', name: 'Vehicles', amount: 750000, previousAmount: 850000 },
          { id: 'fa4', name: 'Less: Accumulated Depreciation', amount: -375000, previousAmount: -300000 },
        ],
      },
      { id: 'tfa', name: 'Total Fixed Assets', amount: 810000, previousAmount: 1040000, isTotal: true },
      { id: 'ta', name: 'Total Assets', amount: 4435000, previousAmount: 4105000, isTotal: true },
    ],
    liabilities: [
      {
        id: 'cl',
        name: 'Current Liabilities',
        amount: 0,
        isHeader: true,
        children: [
          { id: 'cl1', name: 'Accounts Payable', amount: 465000, previousAmount: 520000 },
          { id: 'cl2', name: 'Accrued Expenses', amount: 85000, previousAmount: 75000 },
          { id: 'cl3', name: 'Short Term Loan', amount: 200000, previousAmount: 250000 },
          { id: 'cl4', name: 'Tax Payable', amount: 167500, previousAmount: 138000 },
        ],
      },
      { id: 'tcl', name: 'Total Current Liabilities', amount: 917500, previousAmount: 983000, isTotal: true },
      {
        id: 'll',
        name: 'Long Term Liabilities',
        amount: 0,
        isHeader: true,
        children: [
          { id: 'll1', name: 'Long Term Loan', amount: 500000, previousAmount: 600000 },
        ],
      },
      { id: 'tll', name: 'Total Long Term Liabilities', amount: 500000, previousAmount: 600000, isTotal: true },
      { id: 'tl', name: 'Total Liabilities', amount: 1417500, previousAmount: 1583000, isTotal: true },
    ],
    equity: [
      {
        id: 'eq',
        name: 'Owner\'s Equity',
        amount: 0,
        isHeader: true,
        children: [
          { id: 'eq1', name: 'Capital Account', amount: 2000000, previousAmount: 2000000 },
          { id: 'eq2', name: 'Retained Earnings', amount: 515000, previousAmount: 108000 },
          { id: 'eq3', name: 'Current Year Profit', amount: 502500, previousAmount: 414000 },
        ],
      },
      { id: 'te', name: 'Total Equity', amount: 3017500, previousAmount: 2522000, isTotal: true },
      { id: 'tle', name: 'Total Liabilities & Equity', amount: 4435000, previousAmount: 4105000, isTotal: true },
    ],
  };

  // Cash Flow Statement Data
  const cashFlowData = {
    operating: [
      { id: 'op1', name: 'Net Profit Before Tax', amount: 670000, previousAmount: 552000 },
      { id: 'op2', name: 'Depreciation', amount: 75000, previousAmount: 75000 },
      { id: 'op3', name: 'Increase in Receivables', amount: -195000, previousAmount: -120000 },
      { id: 'op4', name: 'Increase in Inventory', amount: -70000, previousAmount: -45000 },
      { id: 'op5', name: 'Decrease in Payables', amount: -55000, previousAmount: 35000 },
      { id: 'op6', name: 'Income Tax Paid', amount: -138000, previousAmount: -125000 },
    ],
    investing: [
      { id: 'in1', name: 'Purchase of Equipment', amount: 0, previousAmount: -85000 },
      { id: 'in2', name: 'Sale of Assets', amount: 50000, previousAmount: 0 },
    ],
    financing: [
      { id: 'fi1', name: 'Loan Repayment', amount: -150000, previousAmount: -100000 },
      { id: 'fi2', name: 'Drawings', amount: -100000, previousAmount: -75000 },
    ],
  };

  const renderLineItem = (item: FinancialLineItem, level: number = 0) => {
    const paddingLeft = level * 20;
    
    if (item.isHeader) {
      return (
        <React.Fragment key={item.id}>
          <TableRow className="bg-gray-50">
            <TableCell colSpan={compareMode ? 4 : 2} className="font-semibold text-gray-800" style={{ paddingLeft: `${paddingLeft + 16}px` }}>
              {item.name}
            </TableCell>
          </TableRow>
          {item.children?.map((child) => renderLineItem(child, level + 1))}
        </React.Fragment>
      );
    }

    if (item.isTotal) {
      return (
        <TableRow key={item.id} className="bg-primary-50 border-t-2 border-primary-200">
          <TableCell className="font-bold text-gray-900" style={{ paddingLeft: `${paddingLeft + 16}px` }}>
            {item.name}
          </TableCell>
          <TableCell className="text-right font-bold text-primary-700">
            {formatCurrency(item.amount)}
          </TableCell>
          {compareMode && (
            <>
              <TableCell className="text-right font-bold text-gray-600">
                {item.previousAmount !== undefined ? formatCurrency(item.previousAmount) : '-'}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {item.previousAmount !== undefined && (
                  <span className={item.amount >= item.previousAmount ? 'text-green-600' : 'text-red-600'}>
                    {((item.amount - item.previousAmount) / item.previousAmount * 100).toFixed(1)}%
                  </span>
                )}
              </TableCell>
            </>
          )}
        </TableRow>
      );
    }

    return (
      <TableRow key={item.id} className="hover:bg-gray-50">
        <TableCell style={{ paddingLeft: `${paddingLeft + 16}px` }}>
          {item.name}
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(item.amount)}
        </TableCell>
        {compareMode && (
          <>
            <TableCell className="text-right text-gray-600">
              {item.previousAmount !== undefined ? formatCurrency(item.previousAmount) : '-'}
            </TableCell>
            <TableCell className="text-right">
              {item.previousAmount !== undefined && item.previousAmount !== 0 && (
                <span className={item.amount >= item.previousAmount ? 'text-green-600' : 'text-red-600'}>
                  {((item.amount - item.previousAmount) / Math.abs(item.previousAmount) * 100).toFixed(1)}%
                </span>
              )}
            </TableCell>
          </>
        )}
      </TableRow>
    );
  };

  const statementTabs = [
    { id: 'income-statement' as StatementType, label: 'Income Statement', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { id: 'balance-sheet' as StatementType, label: 'Balance Sheet', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    )},
    { id: 'cash-flow' as StatementType, label: 'Cash Flow', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'profit-loss' as StatementType, label: 'Profit & Loss', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )},
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Statements</h1>
        <p className="text-gray-600">View and analyze your financial reports</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {statementTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatement(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeStatement === tab.id
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

      {/* Filters & Actions */}
      <Card className="mb-6 bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="period" className="text-sm font-medium mb-2 block">Period</Label>
              <Select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-40"
              >
                <option value="current-month">Current Month</option>
                <option value="previous-month">Previous Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="current-year">Current Year</option>
                <option value="custom">Custom Range</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="year" className="text-sm font-medium mb-2 block">Year</Label>
              <Select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="compare"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600"
              />
              <Label htmlFor="compare" className="text-sm cursor-pointer">Compare with Previous Period</Label>
            </div>
            <div className="flex-1 flex justify-end gap-2">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Statement */}
      {activeStatement === 'income-statement' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900">Income Statement</h2>
              <p className="text-sm text-gray-600">For the period ending December 2025</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 w-1/2">Particulars</TableHead>
                    <TableHead className="px-4 py-3 text-right w-1/4">Amount (PKR)</TableHead>
                    {compareMode && (
                      <>
                        <TableHead className="px-4 py-3 text-right">Previous Period</TableHead>
                        <TableHead className="px-4 py-3 text-right w-24">Change %</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeStatementData.map((item) => renderLineItem(item))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Sheet */}
      {activeStatement === 'balance-sheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          <Card className="bg-white shadow-soft">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-xl font-bold text-gray-900">Assets</h2>
                <p className="text-sm text-gray-600">As of December 31, 2025</p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="px-4 py-3">Particulars</TableHead>
                      <TableHead className="px-4 py-3 text-right">Amount (PKR)</TableHead>
                      {compareMode && (
                        <>
                          <TableHead className="px-4 py-3 text-right">Previous</TableHead>
                          <TableHead className="px-4 py-3 text-right w-20">%</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceSheetData.assets.map((item) => renderLineItem(item))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <Card className="bg-white shadow-soft">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
                <h2 className="text-xl font-bold text-gray-900">Liabilities & Equity</h2>
                <p className="text-sm text-gray-600">As of December 31, 2025</p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="px-4 py-3">Particulars</TableHead>
                      <TableHead className="px-4 py-3 text-right">Amount (PKR)</TableHead>
                      {compareMode && (
                        <>
                          <TableHead className="px-4 py-3 text-right">Previous</TableHead>
                          <TableHead className="px-4 py-3 text-right w-20">%</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceSheetData.liabilities.map((item) => renderLineItem(item))}
                    <TableRow>
                      <TableCell colSpan={compareMode ? 4 : 2} className="h-4"></TableCell>
                    </TableRow>
                    {balanceSheetData.equity.map((item) => renderLineItem(item))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cash Flow Statement */}
      {activeStatement === 'cash-flow' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <h2 className="text-xl font-bold text-gray-900">Cash Flow Statement</h2>
              <p className="text-sm text-gray-600">For the period ending December 2025</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 w-1/2">Particulars</TableHead>
                    <TableHead className="px-4 py-3 text-right">Amount (PKR)</TableHead>
                    {compareMode && (
                      <>
                        <TableHead className="px-4 py-3 text-right">Previous Period</TableHead>
                        <TableHead className="px-4 py-3 text-right w-24">Change %</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Operating Activities */}
                  <TableRow className="bg-blue-50">
                    <TableCell colSpan={compareMode ? 4 : 2} className="font-semibold text-blue-800">
                      Cash Flow from Operating Activities
                    </TableCell>
                  </TableRow>
                  {cashFlowData.operating.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="pl-8">{item.name}</TableCell>
                      <TableCell className={`text-right font-medium ${item.amount < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      {compareMode && (
                        <>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(item.previousAmount || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.previousAmount && item.previousAmount !== 0 && (
                              <span className={item.amount >= item.previousAmount ? 'text-green-600' : 'text-red-600'}>
                                {((item.amount - item.previousAmount) / Math.abs(item.previousAmount) * 100).toFixed(1)}%
                              </span>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-100">
                    <TableCell className="font-bold text-blue-800">Net Cash from Operating Activities</TableCell>
                    <TableCell className="text-right font-bold text-blue-800">
                      {formatCurrency(cashFlowData.operating.reduce((sum, item) => sum + item.amount, 0))}
                    </TableCell>
                    {compareMode && (
                      <>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(cashFlowData.operating.reduce((sum, item) => sum + (item.previousAmount || 0), 0))}
                        </TableCell>
                        <TableCell></TableCell>
                      </>
                    )}
                  </TableRow>

                  {/* Investing Activities */}
                  <TableRow className="bg-green-50">
                    <TableCell colSpan={compareMode ? 4 : 2} className="font-semibold text-green-800">
                      Cash Flow from Investing Activities
                    </TableCell>
                  </TableRow>
                  {cashFlowData.investing.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="pl-8">{item.name}</TableCell>
                      <TableCell className={`text-right font-medium ${item.amount < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      {compareMode && (
                        <>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(item.previousAmount || 0)}
                          </TableCell>
                          <TableCell></TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-100">
                    <TableCell className="font-bold text-green-800">Net Cash from Investing Activities</TableCell>
                    <TableCell className="text-right font-bold text-green-800">
                      {formatCurrency(cashFlowData.investing.reduce((sum, item) => sum + item.amount, 0))}
                    </TableCell>
                    {compareMode && (
                      <>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(cashFlowData.investing.reduce((sum, item) => sum + (item.previousAmount || 0), 0))}
                        </TableCell>
                        <TableCell></TableCell>
                      </>
                    )}
                  </TableRow>

                  {/* Financing Activities */}
                  <TableRow className="bg-purple-50">
                    <TableCell colSpan={compareMode ? 4 : 2} className="font-semibold text-purple-800">
                      Cash Flow from Financing Activities
                    </TableCell>
                  </TableRow>
                  {cashFlowData.financing.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="pl-8">{item.name}</TableCell>
                      <TableCell className={`text-right font-medium ${item.amount < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      {compareMode && (
                        <>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(item.previousAmount || 0)}
                          </TableCell>
                          <TableCell></TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-purple-100">
                    <TableCell className="font-bold text-purple-800">Net Cash from Financing Activities</TableCell>
                    <TableCell className="text-right font-bold text-purple-800">
                      {formatCurrency(cashFlowData.financing.reduce((sum, item) => sum + item.amount, 0))}
                    </TableCell>
                    {compareMode && (
                      <>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(cashFlowData.financing.reduce((sum, item) => sum + (item.previousAmount || 0), 0))}
                        </TableCell>
                        <TableCell></TableCell>
                      </>
                    )}
                  </TableRow>

                  {/* Net Change */}
                  <TableRow className="bg-primary-100 border-t-2 border-primary-300">
                    <TableCell className="font-bold text-primary-800">Net Change in Cash</TableCell>
                    <TableCell className="text-right font-bold text-primary-800">
                      {formatCurrency(
                        cashFlowData.operating.reduce((sum, item) => sum + item.amount, 0) +
                        cashFlowData.investing.reduce((sum, item) => sum + item.amount, 0) +
                        cashFlowData.financing.reduce((sum, item) => sum + item.amount, 0)
                      )}
                    </TableCell>
                    {compareMode && (
                      <>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            cashFlowData.operating.reduce((sum, item) => sum + (item.previousAmount || 0), 0) +
                            cashFlowData.investing.reduce((sum, item) => sum + (item.previousAmount || 0), 0) +
                            cashFlowData.financing.reduce((sum, item) => sum + (item.previousAmount || 0), 0)
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profit & Loss Summary */}
      {activeStatement === 'profit-loss' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(3375000)}</p>
              <p className="text-xs text-green-500 mt-1">↑ 9.8% vs last period</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Gross Profit</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(1595000)}</p>
              <p className="text-xs text-blue-500 mt-1">Margin: 47.3%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Operating Profit</p>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(700000)}</p>
              <p className="text-xs text-purple-500 mt-1">Margin: 20.7%</p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
              <p className="text-sm text-primary-600 font-medium">Net Profit</p>
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(502500)}</p>
              <p className="text-xs text-primary-500 mt-1">Margin: 14.9%</p>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-soft">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Sales Revenue', amount: 2850000, percentage: 84.4, color: 'bg-green-500' },
                    { name: 'Service Revenue', amount: 450000, percentage: 13.3, color: 'bg-blue-500' },
                    { name: 'Other Income', amount: 75000, percentage: 2.2, color: 'bg-purple-500' },
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-soft">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Cost of Goods Sold', amount: 1780000, percentage: 66.5, color: 'bg-red-500' },
                    { name: 'Salary Expense', amount: 480000, percentage: 17.9, color: 'bg-amber-500' },
                    { name: 'Rent & Utilities', amount: 165000, percentage: 6.2, color: 'bg-blue-500' },
                    { name: 'Other Expenses', amount: 250000, percentage: 9.4, color: 'bg-gray-500' },
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

