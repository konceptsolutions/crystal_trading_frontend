'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface AgingRecord {
  id: string;
  customerName: string;
  customerType: 'retail' | 'wholesale' | 'market' | 'distributor';
  totalOutstanding: number;
  current: number; // 0-30 days
  days30to60: number;
  days60to90: number;
  days90to120: number;
  over120Days: number;
  creditLimit: number;
  creditDays: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  oldestInvoiceDate?: string;
  phone?: string;
  email?: string;
}

export interface AgingInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  daysOverdue: number;
  status: string;
}

export default function DistributorAgingReport() {
  const [agingData, setAgingData] = useState<AgingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('totalOutstanding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<AgingRecord | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<AgingInvoice[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAgingData();
  }, [dateRange]);

  const fetchAgingData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/distributor-aging', {
        params: { from: dateRange.from, to: dateRange.to },
      });
      setAgingData(response.data.records || []);
    } catch (error: any) {
      console.error('Failed to fetch aging data:', error);
      // Demo data
      setAgingData([
        {
          id: '1',
          customerName: 'ABC Trading Co.',
          customerType: 'distributor',
          totalOutstanding: 850000,
          current: 200000,
          days30to60: 250000,
          days60to90: 200000,
          days90to120: 150000,
          over120Days: 50000,
          creditLimit: 1000000,
          creditDays: 60,
          lastPaymentDate: '2025-11-15',
          lastPaymentAmount: 100000,
          oldestInvoiceDate: '2025-07-01',
          phone: '0300-1234567',
          email: 'abc@trading.com',
        },
        {
          id: '2',
          customerName: 'XYZ Distributors',
          customerType: 'distributor',
          totalOutstanding: 450000,
          current: 150000,
          days30to60: 150000,
          days60to90: 100000,
          days90to120: 50000,
          over120Days: 0,
          creditLimit: 500000,
          creditDays: 45,
          lastPaymentDate: '2025-12-01',
          lastPaymentAmount: 75000,
          oldestInvoiceDate: '2025-09-15',
          phone: '0321-7654321',
          email: 'xyz@dist.com',
        },
        {
          id: '3',
          customerName: 'Regional Auto Parts',
          customerType: 'wholesale',
          totalOutstanding: 320000,
          current: 100000,
          days30to60: 120000,
          days60to90: 80000,
          days90to120: 20000,
          over120Days: 0,
          creditLimit: 400000,
          creditDays: 30,
          lastPaymentDate: '2025-12-05',
          lastPaymentAmount: 50000,
          oldestInvoiceDate: '2025-10-01',
          phone: '0333-9876543',
          email: 'regional@auto.com',
        },
        {
          id: '4',
          customerName: 'City Motors',
          customerType: 'market',
          totalOutstanding: 180000,
          current: 80000,
          days30to60: 60000,
          days60to90: 40000,
          days90to120: 0,
          over120Days: 0,
          creditLimit: 250000,
          creditDays: 30,
          lastPaymentDate: '2025-12-08',
          lastPaymentAmount: 30000,
          oldestInvoiceDate: '2025-10-15',
          phone: '0345-1122334',
          email: 'city@motors.com',
        },
        {
          id: '5',
          customerName: 'Highway Traders',
          customerType: 'distributor',
          totalOutstanding: 620000,
          current: 120000,
          days30to60: 180000,
          days60to90: 170000,
          days90to120: 100000,
          over120Days: 50000,
          creditLimit: 800000,
          creditDays: 60,
          lastPaymentDate: '2025-11-20',
          lastPaymentAmount: 80000,
          oldestInvoiceDate: '2025-06-20',
          phone: '0312-5566778',
          email: 'highway@traders.com',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInvoices = async (customerId: string) => {
    try {
      const response = await api.get(`/reports/customer-invoices/${customerId}`);
      setCustomerInvoices(response.data.invoices || []);
    } catch (error: any) {
      console.error('Failed to fetch customer invoices:', error);
      // Demo data
      setCustomerInvoices([
        { id: '1', invoiceNo: 'INV-001', invoiceDate: '2025-10-01', dueDate: '2025-11-01', totalAmount: 50000, paidAmount: 0, balanceAmount: 50000, daysOverdue: 40, status: 'overdue' },
        { id: '2', invoiceNo: 'INV-002', invoiceDate: '2025-10-15', dueDate: '2025-11-15', totalAmount: 75000, paidAmount: 25000, balanceAmount: 50000, daysOverdue: 26, status: 'partial' },
        { id: '3', invoiceNo: 'INV-003', invoiceDate: '2025-11-01', dueDate: '2025-12-01', totalAmount: 100000, paidAmount: 0, balanceAmount: 100000, daysOverdue: 10, status: 'overdue' },
        { id: '4', invoiceNo: 'INV-004', invoiceDate: '2025-11-20', dueDate: '2025-12-20', totalAmount: 80000, paidAmount: 0, balanceAmount: 80000, daysOverdue: 0, status: 'pending' },
      ]);
    }
  };

  const handleCustomerClick = (customer: AgingRecord) => {
    setSelectedCustomer(customer);
    fetchCustomerInvoices(customer.id);
  };

  const getAgingColor = (amount: number, total: number) => {
    if (amount === 0) return '';
    const percentage = (amount / total) * 100;
    if (percentage > 30) return 'text-red-600 font-semibold';
    if (percentage > 15) return 'text-yellow-600 font-medium';
    return 'text-gray-700';
  };

  const getCreditUtilization = (outstanding: number, limit: number) => {
    const percentage = (outstanding / limit) * 100;
    if (percentage >= 100) return { color: 'bg-red-500', text: 'Over Limit' };
    if (percentage >= 80) return { color: 'bg-yellow-500', text: `${percentage.toFixed(0)}%` };
    return { color: 'bg-green-500', text: `${percentage.toFixed(0)}%` };
  };

  const filteredData = agingData
    .filter((record) => {
      const matchesSearch = record.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || record.customerType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof AgingRecord] || 0;
      const bValue = b[sortBy as keyof AgingRecord] || 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  // Calculate totals
  const totals = {
    totalOutstanding: agingData.reduce((sum, r) => sum + r.totalOutstanding, 0),
    current: agingData.reduce((sum, r) => sum + r.current, 0),
    days30to60: agingData.reduce((sum, r) => sum + r.days30to60, 0),
    days60to90: agingData.reduce((sum, r) => sum + r.days60to90, 0),
    days90to120: agingData.reduce((sum, r) => sum + r.days90to120, 0),
    over120Days: agingData.reduce((sum, r) => sum + r.over120Days, 0),
  };

  const exportToExcel = () => {
    alert('Export to Excel functionality - will generate aging report spreadsheet');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-300 font-medium">Total Outstanding</p>
              <p className="text-xl font-bold">Rs. {(totals.totalOutstanding / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-green-100 font-medium">Current (0-30)</p>
              <p className="text-xl font-bold">Rs. {(totals.current / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-blue-100 font-medium">30-60 Days</p>
              <p className="text-xl font-bold">Rs. {(totals.days30to60 / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-yellow-100 font-medium">60-90 Days</p>
              <p className="text-xl font-bold">Rs. {(totals.days60to90 / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-orange-100 font-medium">90-120 Days</p>
              <p className="text-xl font-bold">Rs. {(totals.days90to120 / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-red-100 font-medium">Over 120 Days</p>
              <p className="text-xl font-bold">Rs. {(totals.over120Days / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Distribution Chart */}
      <Card>
        <CardHeader className="border-b bg-gray-50 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Aging Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-8 w-full flex rounded-lg overflow-hidden">
            {totals.totalOutstanding > 0 && (
              <>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(totals.current / totals.totalOutstanding) * 100}%` }}
                  title={`Current: Rs. ${totals.current.toLocaleString()}`}
                >
                  {((totals.current / totals.totalOutstanding) * 100) > 10 && `${((totals.current / totals.totalOutstanding) * 100).toFixed(0)}%`}
                </div>
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(totals.days30to60 / totals.totalOutstanding) * 100}%` }}
                  title={`30-60 Days: Rs. ${totals.days30to60.toLocaleString()}`}
                >
                  {((totals.days30to60 / totals.totalOutstanding) * 100) > 10 && `${((totals.days30to60 / totals.totalOutstanding) * 100).toFixed(0)}%`}
                </div>
                <div
                  className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(totals.days60to90 / totals.totalOutstanding) * 100}%` }}
                  title={`60-90 Days: Rs. ${totals.days60to90.toLocaleString()}`}
                >
                  {((totals.days60to90 / totals.totalOutstanding) * 100) > 10 && `${((totals.days60to90 / totals.totalOutstanding) * 100).toFixed(0)}%`}
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(totals.days90to120 / totals.totalOutstanding) * 100}%` }}
                  title={`90-120 Days: Rs. ${totals.days90to120.toLocaleString()}`}
                >
                  {((totals.days90to120 / totals.totalOutstanding) * 100) > 10 && `${((totals.days90to120 / totals.totalOutstanding) * 100).toFixed(0)}%`}
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(totals.over120Days / totals.totalOutstanding) * 100}%` }}
                  title={`Over 120 Days: Rs. ${totals.over120Days.toLocaleString()}`}
                >
                  {((totals.over120Days / totals.totalOutstanding) * 100) > 10 && `${((totals.over120Days / totals.totalOutstanding) * 100).toFixed(0)}%`}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Current</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> 30-60 Days</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded"></span> 60-90 Days</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded"></span> 90-120 Days</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> 120+ Days</div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-300 focus:border-primary-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="distributor">Distributors</option>
            <option value="wholesale">Wholesale</option>
            <option value="market">Market</option>
            <option value="retail">Retail</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">From:</span>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-40"
            />
            <span className="text-sm text-gray-500">To:</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-40"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="border-green-500 text-green-600 hover:bg-green-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export Excel
          </Button>
          <Button variant="outline" onClick={printReport} className="border-gray-400 text-gray-600 hover:bg-gray-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedCustomer.customerName}</CardTitle>
                <p className="text-sm text-gray-600">
                  {selectedCustomer.phone} | {selectedCustomer.email}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Customer Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Outstanding</p>
                <p className="text-lg font-bold text-gray-900">Rs. {selectedCustomer.totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Credit Limit</p>
                <p className="text-lg font-bold text-gray-900">Rs. {selectedCustomer.creditLimit.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Last Payment</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedCustomer.lastPaymentDate ? new Date(selectedCustomer.lastPaymentDate).toLocaleDateString() : '-'}
                </p>
                <p className="text-xs text-green-600">Rs. {selectedCustomer.lastPaymentAmount?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Oldest Invoice</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedCustomer.oldestInvoiceDate ? new Date(selectedCustomer.oldestInvoiceDate).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* Invoice Details */}
            <h4 className="font-semibold text-gray-700 mb-2">Outstanding Invoices</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Days Overdue</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">Rs. {invoice.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">Rs. {invoice.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">Rs. {invoice.balanceAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          invoice.daysOverdue > 60 ? 'bg-red-100 text-red-700' :
                          invoice.daysOverdue > 30 ? 'bg-yellow-100 text-yellow-700' :
                          invoice.daysOverdue > 0 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.daysOverdue > 0 ? `${invoice.daysOverdue} days` : 'Current'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aging Report Table */}
      <Card>
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Distributor/Customer Aging Report ({filteredData.length})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-2 text-sm border border-gray-300 rounded-md"
              >
                <option value="totalOutstanding">Total Outstanding</option>
                <option value="over120Days">Over 120 Days</option>
                <option value="days90to120">90-120 Days</option>
                <option value="days60to90">60-90 Days</option>
                <option value="customerName">Customer Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {sortOrder === 'desc' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No aging data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">Total Outstanding</TableHead>
                    <TableHead className="font-semibold text-right text-green-600">Current (0-30)</TableHead>
                    <TableHead className="font-semibold text-right text-blue-600">30-60 Days</TableHead>
                    <TableHead className="font-semibold text-right text-yellow-600">60-90 Days</TableHead>
                    <TableHead className="font-semibold text-right text-orange-600">90-120 Days</TableHead>
                    <TableHead className="font-semibold text-right text-red-600">120+ Days</TableHead>
                    <TableHead className="font-semibold text-center">Credit Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record) => {
                    const utilization = getCreditUtilization(record.totalOutstanding, record.creditLimit);
                    return (
                      <TableRow
                        key={record.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleCustomerClick(record)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{record.customerName}</div>
                            <div className="text-xs text-gray-500">{record.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.customerType === 'distributor' ? 'bg-primary-100 text-primary-700' :
                            record.customerType === 'wholesale' ? 'bg-green-100 text-green-700' :
                            record.customerType === 'market' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {record.customerType}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">
                          Rs. {record.totalOutstanding.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getAgingColor(record.current, record.totalOutstanding)}`}>
                          Rs. {record.current.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getAgingColor(record.days30to60, record.totalOutstanding)}`}>
                          Rs. {record.days30to60.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getAgingColor(record.days60to90, record.totalOutstanding)}`}>
                          Rs. {record.days60to90.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getAgingColor(record.days90to120, record.totalOutstanding)}`}>
                          Rs. {record.days90to120.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${record.over120Days > 0 ? 'text-red-600 font-bold' : ''}`}>
                          Rs. {record.over120Days.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${utilization.color}`}
                                style={{ width: `${Math.min((record.totalOutstanding / record.creditLimit) * 100, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              utilization.text === 'Over Limit' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {utilization.text}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right">TOTAL:</td>
                    <td className="px-4 py-3 text-right">Rs. {totals.totalOutstanding.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">Rs. {totals.current.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-blue-600">Rs. {totals.days30to60.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">Rs. {totals.days60to90.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-orange-600">Rs. {totals.days90to120.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-600">Rs. {totals.over120Days.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

