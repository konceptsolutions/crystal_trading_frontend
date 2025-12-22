'use client';

import { useState, useEffect } from 'react';
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

interface CoaAccount {
  id: number;
  name: string;
  code: string;
}

export default function DailyClosingPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [accounts, setAccounts] = useState<CoaAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const cashResponse = await api.get('/accounts/cash-accounts');
      const bankResponse = await api.get('/accounts/bank-accounts');
      const all = [
        ...(cashResponse.data.coaAccounts || []),
        ...(bankResponse.data.coaAccounts || []),
      ];
      setAccounts(all);
      setSelectedAccounts(all.map(a => a.id));
    } catch (error) {
      toast.error('Failed to fetch accounts');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await api.post('/reports/daily-closing', {
        date,
        coaAccounts: selectedAccounts.map(id => ({ id })),
      });
      setReport(response.data);
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate report', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateClosingBalance = (accountId: number) => {
    if (!report) return 0;
    const opening = report.openingBalances.find((b: any) => b.account_id === accountId)?.opening_bal || 0;
    const receipts = report.debitTransactions
      .filter((t: any) => t.descriptionArray.account === report.coaAccounts.find((a: CoaAccount) => a.id === accountId)?.name)
      .reduce((sum: number, t: any) => sum + t.transactions.reduce((s: number, tr: any) => s + tr.amount, 0), 0);
    const payments = report.creditTransactions
      .filter((t: any) => t.descriptionArray.account === report.coaAccounts.find((a: CoaAccount) => a.id === accountId)?.name)
      .reduce((sum: number, t: any) => sum + t.transactions.reduce((s: number, tr: any) => s + tr.amount, 0), 0);
    return opening + receipts - payments;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Closing Report</h1>
        <p className="text-gray-600">View cash and bank transactions for a specific date</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 max-w-xs"
                required
              />
            </div>
            <div>
              <Label>Select Accounts</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-4">
                {accounts.map(account => (
                  <label key={account.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccounts([...selectedAccounts, account.id]);
                        } else {
                          setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                        }
                      }}
                      className="rounded border-gray-300 text-[#ff6b35] focus:ring-[#ff6b35]"
                    />
                    <span className="text-sm">{account.code} - {account.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={generateReport}
              className="bg-[#ff6b35] hover:bg-[#e55a2b]"
              disabled={loading || selectedAccounts.length === 0}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6">
          {/* Opening Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Opening Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.openingBalances.map((bal: any) => (
                    <TableRow key={bal.account_id}>
                      <TableCell>{bal.account_name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {bal.opening_bal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Receipts */}
          <Card>
            <CardHeader>
              <CardTitle>Receipts (Debit Transactions)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.debitTransactions.map((trans: any, idx: number) => (
                  <div key={idx} className="border-b pb-4">
                    <div className="font-semibold mb-2">
                      {trans.descriptionArray.voucher_no} - {trans.descriptionArray.description}
                    </div>
                    <div className="text-sm text-gray-600 ml-4">
                      Amount: {trans.transactions.reduce((sum: number, t: any) => sum + t.amount, 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payments (Credit Transactions)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.creditTransactions.map((trans: any, idx: number) => (
                  <div key={idx} className="border-b pb-4">
                    <div className="font-semibold mb-2">
                      {trans.descriptionArray.voucher_no} - {trans.descriptionArray.description}
                    </div>
                    <div className="text-sm text-gray-600 ml-4">
                      Amount: {trans.transactions.reduce((sum: number, t: any) => sum + t.amount, 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Closing Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Closing Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Closing Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.coaAccounts.map((account: CoaAccount) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {calculateClosingBalance(account.id).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

