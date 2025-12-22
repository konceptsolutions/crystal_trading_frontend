'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';

type ReportType = 'balance-sheet' | 'trial-balance' | 'general-journal';

export default function FinancialStatementsPage() {
  const [reportType, setReportType] = useState<ReportType>('balance-sheet');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [generalJournal, setGeneralJournal] = useState<any>(null);

  const generateBalanceSheet = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/balance-sheet', {
        params: { date },
      });
      setBalanceSheet(response.data.data);
      toast.success('Balance Sheet generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate balance sheet', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTrialBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/trial-balance', {
        params: { from: fromDate, to: toDate },
      });
      setTrialBalance(response.data.data);
      toast.success('Trial Balance generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate trial balance', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateGeneralJournal = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/general-journal', {
        params: { from: fromDate, to: toDate },
      });
      setGeneralJournal(response.data.data);
      toast.success('General Journal generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate general journal', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    const totalAssets = balanceSheet.assets.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalLiabilities = balanceSheet.liabilities.reduce((sum: number, l: any) => sum + l.balance, 0);
    const totalCapital = balanceSheet.capital.reduce((sum: number, c: any) => sum + c.balance, 0) + balanceSheet.revExp;
    const totalLiabilitiesCapital = totalLiabilities + totalCapital;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceSheet.assets.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {asset.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell>Total Assets</TableCell>
                    <TableCell className="text-right">{totalAssets.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Liabilities & Capital */}
          <Card>
            <CardHeader>
              <CardTitle>Liabilities & Capital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Liabilities</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheet.liabilities.map((liability: any) => (
                        <TableRow key={liability.id}>
                          <TableCell>{liability.name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {liability.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-gray-50">
                        <TableCell>Total Liabilities</TableCell>
                        <TableCell className="text-right">{totalLiabilities.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Capital</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheet.capital.map((cap: any) => (
                        <TableRow key={cap.id}>
                          <TableCell>{cap.name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {cap.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>Net Profit/(Loss)</TableCell>
                        <TableCell className={`text-right font-semibold ${balanceSheet.revExp >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balanceSheet.revExp.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-gray-50">
                        <TableCell>Total Capital</TableCell>
                        <TableCell className="text-right">{totalCapital.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <Table>
                  <TableBody>
                    <TableRow className="font-bold bg-[#fff5f2]">
                      <TableCell>Total Liabilities & Capital</TableCell>
                      <TableCell className="text-right">{totalLiabilitiesCapital.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderTrialBalance = () => {
    if (!trialBalance) return null;

    const categories = [
      { name: 'Assets', data: trialBalance.assets },
      { name: 'Liabilities', data: trialBalance.liabilities },
      { name: 'Capital', data: trialBalance.capital },
      { name: 'Revenues', data: trialBalance.revenues },
      { name: 'Expenses', data: trialBalance.expenses },
      { name: 'Cost', data: trialBalance.cost },
    ];

    return (
      <div className="space-y-6">
        {categories.map(category => (
          category.data.length > 0 && (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.data.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.code} - {account.name}</TableCell>
                        <TableCell className="text-right">{account.debit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{account.credit.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {account.balance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    );
  };

  const renderGeneralJournal = () => {
    if (!generalJournal) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>General Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generalJournal.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">V{transaction.voucher.voucherNo}</TableCell>
                    <TableCell>{transaction.coaAccount.code} - {transaction.coaAccount.name}</TableCell>
                    <TableCell>{transaction.description || transaction.voucher.name || '-'}</TableCell>
                    <TableCell className="text-right">{transaction.debit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{transaction.credit.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Statements</h1>
        <p className="text-gray-600">Generate comprehensive financial reports</p>
      </div>

      {/* Report Type Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {[
              { id: 'balance-sheet' as ReportType, label: 'Balance Sheet', icon: '📊' },
              { id: 'trial-balance' as ReportType, label: 'Trial Balance', icon: '📋' },
              { id: 'general-journal' as ReportType, label: 'General Journal', icon: '📖' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${reportType === type.id
                    ? 'bg-[#ff6b35] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#ff6b35] hover:text-[#ff6b35]'
                  }
                `}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportType === 'balance-sheet' && (
              <div>
                <Label htmlFor="date">As of Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 max-w-xs"
                />
                <Button
                  onClick={generateBalanceSheet}
                  className="mt-4 bg-[#ff6b35] hover:bg-[#e55a2b]"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Balance Sheet'}
                </Button>
              </div>
            )}

            {(reportType === 'trial-balance' || reportType === 'general-journal') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate">From Date *</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">To Date *</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={reportType === 'trial-balance' ? generateTrialBalance : generateGeneralJournal}
                    className="bg-[#ff6b35] hover:bg-[#e55a2b]"
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : `Generate ${reportType === 'trial-balance' ? 'Trial Balance' : 'General Journal'}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      <div>
        {reportType === 'balance-sheet' && renderBalanceSheet()}
        {reportType === 'trial-balance' && renderTrialBalance()}
        {reportType === 'general-journal' && renderGeneralJournal()}
      </div>
    </div>
  );
}

