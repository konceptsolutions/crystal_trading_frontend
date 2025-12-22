'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface Voucher {
  id: number;
  voucherNo: number;
  type: number;
  date: string;
  name: string | null;
  totalAmount: number;
  isApproved: boolean;
  isPostDated: number;
  chequeNo: string | null;
  chequeDate: string | null;
  transactions: Array<{
    id: number;
    debit: number;
    credit: number;
    description: string | null;
    coaAccount: {
      id: number;
      name: string;
      code: string;
    };
  }>;
}

const VOUCHER_TYPE_NAMES: Record<number, string> = {
  1: 'Receipt Voucher',
  2: 'Payment Voucher',
  3: 'Purchase Voucher',
  4: 'Sales Voucher',
  5: 'Contra Voucher',
  6: 'Journal Voucher',
  7: 'Extended Journal Voucher',
};

const VOUCHER_TYPE_PREFIXES: Record<number, string> = {
  1: 'RV',
  2: 'PV',
  3: 'PV',
  4: 'SV',
  5: 'CV',
  6: 'JV',
  7: 'EJV',
};

export default function ViewVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterApproved, setFilterApproved] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchVouchers();
  }, [filterType, filterApproved, dateFrom, dateTo]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterApproved !== 'all') params.isApproved = filterApproved === 'true';
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const response = await api.get('/vouchers', { params });
      setVouchers(response.data.vouchers || []);
    } catch (error: any) {
      toast.error('Failed to fetch vouchers', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (voucherId: number) => {
    try {
      await api.post(`/vouchers/${voucherId}/approve`);
      toast.success('Voucher approval toggled');
      fetchVouchers();
    } catch (error: any) {
      toast.error('Failed to toggle approval', {
        description: error.response?.data?.message || 'An error occurred',
      });
    }
  };

  const handleDelete = async (voucherId: number) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      await api.delete(`/vouchers/${voucherId}`);
      toast.success('Voucher deleted successfully');
      fetchVouchers();
    } catch (error: any) {
      toast.error('Failed to delete voucher', {
        description: error.response?.data?.message || 'An error occurred',
      });
    }
  };

  const formatVoucherNo = (type: number, voucherNo: number) => {
    const prefix = VOUCHER_TYPE_PREFIXES[type] || 'V';
    return `${prefix}${String(voucherNo).padStart(3, '0')}`;
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      formatVoucherNo(voucher.type, voucher.voucherNo).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (voucher.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Input
              placeholder="Search vouchers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            >
              <option value="all">All Types</option>
              {Object.entries(VOUCHER_TYPE_NAMES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35]"
            >
              <option value="all">All</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Loading vouchers...</div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No vouchers found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Post-Dated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono font-semibold">
                      {formatVoucherNo(voucher.type, voucher.voucherNo)}
                    </TableCell>
                    <TableCell>{VOUCHER_TYPE_NAMES[voucher.type]}</TableCell>
                    <TableCell>{new Date(voucher.date).toLocaleDateString()}</TableCell>
                    <TableCell>{voucher.name || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {voucher.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          voucher.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {voucher.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {voucher.isPostDated === 1 ? (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          Post-Dated
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(voucher.id)}
                        >
                          {voucher.isApproved ? 'Unapprove' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(voucher.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
