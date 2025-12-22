'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface VoucherEntry {
  id: string;
  accountId: number | null;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

interface CoaAccount {
  id: number;
  name: string;
  code: string;
  coaGroup: { name: string };
  coaSubGroup: { name: string };
}

const VOUCHER_TYPES = [
  { value: 1, label: 'Receipt Voucher (RV)', description: 'Money received' },
  { value: 2, label: 'Payment Voucher (PV)', description: 'Money paid' },
  { value: 3, label: 'Purchase Voucher', description: 'Purchase transactions' },
  { value: 4, label: 'Sales Voucher', description: 'Sales transactions' },
  { value: 5, label: 'Contra Voucher (CV)', description: 'Cash/Bank transfers' },
  { value: 6, label: 'Journal Voucher (JV)', description: 'General journal entries' },
  { value: 7, label: 'Extended Journal Voucher', description: 'Complex multi-account entries' },
];

export default function NewVoucher() {
  const [voucherType, setVoucherType] = useState<number>(1);
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [entries, setEntries] = useState<VoucherEntry[]>([
    { id: '1', accountId: null, accountName: '', debit: 0, credit: 0, description: '' }
  ]);
  const [cashBankAccount, setCashBankAccount] = useState<{ id: number; name: string } | null>(null);
  const [accounts, setAccounts] = useState<CoaAccount[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<CoaAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccounts();
    if ([1, 2, 5].includes(voucherType)) {
      fetchCashBankAccounts();
    }
  }, [voucherType]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts/coa-accounts');
      setAccounts(response.data.coaAccounts || []);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      // Don't show toast for auth errors - they're handled by the interceptor
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch accounts', {
          description: error.response?.data?.message || 'An error occurred',
        });
      }
    }
  };

  const fetchCashBankAccounts = async () => {
    try {
      const cashResponse = await api.get('/accounts/cash-accounts');
      const bankResponse = await api.get('/accounts/bank-accounts');
      const all = [...(cashResponse.data.coaAccounts || []), ...(bankResponse.data.coaAccounts || [])];
      setCashBankAccounts(all);
    } catch (error: any) {
      console.error('Failed to fetch cash/bank accounts:', error);
      // Don't show toast for auth errors - they're handled by the interceptor
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch cash/bank accounts', {
          description: error.response?.data?.message || 'An error occurred',
        });
      }
    }
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addEntry = () => {
    const newEntry: VoucherEntry = {
      id: Date.now().toString(),
      accountId: null,
      accountName: '',
      debit: 0,
      credit: 0,
      description: ''
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof VoucherEntry, value: any) => {
    setEntries(entries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      toast.error('Voucher is not balanced', {
        description: `Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`,
      });
      return;
    }

    if (entries.some(e => !e.accountId || (e.debit === 0 && e.credit === 0))) {
      toast.error('Please fill all entries with account and amount');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type: voucherType,
        date: voucherDate,
        totalAmount: Math.max(totalDebit, totalCredit),
        name: narration,
        account: cashBankAccount ? { id: cashBankAccount.id } : undefined,
        list: entries.map(e => ({
          account: { id: e.accountId! },
          dr: Number(e.debit) || 0,
          cr: Number(e.credit) || 0,
          description: e.description,
        })),
        chequeNo: chequeNo || undefined,
        chequeDate: chequeDate || undefined,
      };

      await api.post('/vouchers', payload);
      toast.success('Voucher created successfully');
      
      // Reset form
      setEntries([{ id: '1', accountId: null, accountName: '', debit: 0, credit: 0, description: '' }]);
      setNarration('');
      setChequeNo('');
      setChequeDate('');
      setCashBankAccount(null);
    } catch (error: any) {
      toast.error('Failed to create voucher', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card>
        <CardHeader>
          <CardTitle>Create New Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Voucher Type */}
            <div>
              <Label htmlFor="voucherType">Voucher Type *</Label>
              <select
                id="voucherType"
                value={voucherType}
                onChange={(e) => {
                  setVoucherType(parseInt(e.target.value));
                  setEntries([{ id: '1', accountId: null, accountName: '', debit: 0, credit: 0, description: '' }]);
                  setCashBankAccount(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35]"
                required
              >
                {VOUCHER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Narration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voucherDate">Date *</Label>
                <Input
                  id="voucherDate"
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="narration">Narration</Label>
                <Input
                  id="narration"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="Voucher description"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Cash/Bank Account for RV/PV/CV */}
            {[1, 2, 5].includes(voucherType) && (
              <div>
                <Label htmlFor="cashBankAccount">Cash/Bank Account *</Label>
                <select
                  id="cashBankAccount"
                  value={cashBankAccount?.id || ''}
                  onChange={(e) => {
                    const acc = cashBankAccounts.find(a => a.id === parseInt(e.target.value));
                    setCashBankAccount(acc ? { id: acc.id, name: acc.name } : null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35]"
                  required
                >
                  <option value="">Select Account</option>
                  {cashBankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cheque Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chequeNo">Cheque Number</Label>
                <Input
                  id="chequeNo"
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="chequeDate">Cheque Date</Label>
                <Input
                  id="chequeDate"
                  type="date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Entries */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Transaction Entries *</Label>
                <Button type="button" onClick={addEntry} variant="outline" size="sm">
                  + Add Entry
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <select
                            value={entry.accountId || ''}
                            onChange={(e) => {
                              const acc = accounts.find(a => a.id === parseInt(e.target.value));
                              updateEntry(entry.id, 'accountId', acc ? acc.id : null);
                              updateEntry(entry.id, 'accountName', acc ? acc.name : '');
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            required
                          >
                            <option value="">Select Account</option>
                            {filteredAccounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.description}
                            onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="w-full"
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.debit || ''}
                            onChange={(e) => {
                              updateEntry(entry.id, 'debit', parseFloat(e.target.value) || 0);
                              if (voucherType === 6 || voucherType === 7) {
                                updateEntry(entry.id, 'credit', 0);
                              }
                            }}
                            placeholder="0.00"
                            className="w-full"
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.credit || ''}
                            onChange={(e) => {
                              updateEntry(entry.id, 'credit', parseFloat(e.target.value) || 0);
                              if (voucherType === 6 || voucherType === 7) {
                                updateEntry(entry.id, 'debit', 0);
                              }
                            }}
                            placeholder="0.00"
                            className="w-full"
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          {entries.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeEntry(entry.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Debit</div>
                  <div className="text-lg font-semibold">{totalDebit.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Credit</div>
                  <div className="text-lg font-semibold">{totalCredit.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Difference</div>
                  <div className={`text-lg font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {(totalDebit - totalCredit).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="submit" className="bg-[#ff6b35] hover:bg-[#e55a2b]" disabled={loading || !isBalanced}>
                {loading ? 'Creating...' : 'Create Voucher'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
