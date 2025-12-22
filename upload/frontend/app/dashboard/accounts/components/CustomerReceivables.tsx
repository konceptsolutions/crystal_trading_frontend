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

interface Customer {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  totalReceivable: number;
  overdueAmount: number;
  creditLimit: number;
  lastPaymentDate: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  customer: string;
  customerId: string;
  amount: number;
  paidAmount: number;
  balance: number;
  daysOverdue: number;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
}

interface Receipt {
  id: string;
  receiptNo: string;
  date: string;
  customer: string;
  amount: number;
  paymentMode: string;
  reference: string;
}

export default function CustomerReceivables() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [customerDetailDialogOpen, setCustomerDetailDialogOpen] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);
  const [activeView, setActiveView] = useState<'summary' | 'detailed'>('summary');

  // Receipt form state
  const [receiptForm, setReceiptForm] = useState({
    customerId: '',
    amount: '',
    paymentMode: 'Cash',
    reference: '',
    narration: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Demo data
  useEffect(() => {
    const demoCustomers: Customer[] = [
      { id: '1', name: 'Ahmed Auto Workshop', code: 'CUS-001', phone: '0300-1234567', email: 'ahmed@autoworks.pk', totalReceivable: 185000, overdueAmount: 75000, creditLimit: 500000, lastPaymentDate: '2025-12-08' },
      { id: '2', name: 'City Motors', code: 'CUS-002', phone: '0321-7654321', email: 'info@citymotors.pk', totalReceivable: 320000, overdueAmount: 120000, creditLimit: 750000, lastPaymentDate: '2025-12-05' },
      { id: '3', name: 'Fast Track Service', code: 'CUS-003', phone: '0333-9876543', email: 'service@fasttrack.pk', totalReceivable: 95000, overdueAmount: 0, creditLimit: 300000, lastPaymentDate: '2025-12-10' },
      { id: '4', name: 'Premium Auto Care', code: 'CUS-004', phone: '0345-5555555', email: 'care@premiumauto.pk', totalReceivable: 450000, overdueAmount: 200000, creditLimit: 600000, lastPaymentDate: '2025-11-28' },
      { id: '5', name: 'Quick Fix Garage', code: 'CUS-005', phone: '0312-1111222', email: 'quick@fixgarage.pk', totalReceivable: 0, overdueAmount: 0, creditLimit: 200000, lastPaymentDate: '2025-12-09' },
      { id: '6', name: 'Star Auto Parts', code: 'CUS-006', phone: '0300-3334444', email: 'star@autoparts.pk', totalReceivable: 125000, overdueAmount: 45000, creditLimit: 400000, lastPaymentDate: '2025-12-01' },
    ];
    setCustomers(demoCustomers);

    const demoInvoices: Invoice[] = [
      { id: '1', invoiceNo: 'INV-2025-101', date: '2025-11-15', dueDate: '2025-11-30', customer: 'Ahmed Auto Workshop', customerId: '1', amount: 85000, paidAmount: 10000, balance: 75000, daysOverdue: 11, status: 'Overdue' },
      { id: '2', invoiceNo: 'INV-2025-102', date: '2025-12-01', dueDate: '2025-12-15', customer: 'Ahmed Auto Workshop', customerId: '1', amount: 110000, paidAmount: 0, balance: 110000, daysOverdue: 0, status: 'Pending' },
      { id: '3', invoiceNo: 'INV-2025-103', date: '2025-11-10', dueDate: '2025-11-25', customer: 'City Motors', customerId: '2', amount: 150000, paidAmount: 30000, balance: 120000, daysOverdue: 16, status: 'Overdue' },
      { id: '4', invoiceNo: 'INV-2025-104', date: '2025-12-05', dueDate: '2025-12-20', customer: 'City Motors', customerId: '2', amount: 200000, paidAmount: 0, balance: 200000, daysOverdue: 0, status: 'Pending' },
      { id: '5', invoiceNo: 'INV-2025-105', date: '2025-12-08', dueDate: '2025-12-23', customer: 'Fast Track Service', customerId: '3', amount: 95000, paidAmount: 0, balance: 95000, daysOverdue: 0, status: 'Pending' },
      { id: '6', invoiceNo: 'INV-2025-106', date: '2025-10-20', dueDate: '2025-11-05', customer: 'Premium Auto Care', customerId: '4', amount: 250000, paidAmount: 50000, balance: 200000, daysOverdue: 36, status: 'Overdue' },
      { id: '7', invoiceNo: 'INV-2025-107', date: '2025-12-01', dueDate: '2025-12-16', customer: 'Premium Auto Care', customerId: '4', amount: 250000, paidAmount: 0, balance: 250000, daysOverdue: 0, status: 'Pending' },
      { id: '8', invoiceNo: 'INV-2025-108', date: '2025-11-25', dueDate: '2025-12-10', customer: 'Star Auto Parts', customerId: '6', amount: 125000, paidAmount: 80000, balance: 45000, daysOverdue: 1, status: 'Overdue' },
    ];
    setInvoices(demoInvoices);
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(invoice => {
    const matchesCustomer = selectedCustomer === '' || invoice.customerId === selectedCustomer;
    const matchesStatus = filterStatus === 'all' || invoice.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCustomer && matchesStatus && matchesSearch;
  });

  const totalReceivable = customers.reduce((sum, c) => sum + c.totalReceivable, 0);
  const totalOverdue = customers.reduce((sum, c) => sum + c.overdueAmount, 0);
  const customersWithOverdue = customers.filter(c => c.overdueAmount > 0).length;

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomerDetail(customer);
    setCustomerDetailDialogOpen(true);
  };

  const handleCollectPayment = (customerId: string) => {
    setReceiptForm({
      ...receiptForm,
      customerId: customerId,
    });
    setReceiptDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Receivables</h2>
            <p className="text-sm text-gray-500">Track outstanding customer payments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setReceiptDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Collect Payment
          </Button>
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-600 font-medium">Total Receivable</p>
              <p className="text-2xl font-bold text-cyan-700">{formatCurrency(totalReceivable)}</p>
              <p className="text-xs text-cyan-500">{customers.filter(c => c.totalReceivable > 0).length} customers</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Overdue</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOverdue)}</p>
              <p className="text-xs text-red-500">{customersWithOverdue} customers overdue</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Collected This Month</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(450000)}</p>
              <p className="text-xs text-green-500">15 payments received</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Average Days Outstanding</p>
              <p className="text-2xl font-bold text-purple-700">18</p>
              <p className="text-xs text-purple-500">Days to collect</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'summary' ? 'default' : 'outline'}
          onClick={() => setActiveView('summary')}
          className={activeView === 'summary' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
        >
          Customer Summary
        </Button>
        <Button
          variant={activeView === 'detailed' ? 'default' : 'outline'}
          onClick={() => setActiveView('detailed')}
          className={activeView === 'detailed' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
        >
          Invoice Details
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder={activeView === 'summary' ? "Search customer..." : "Search invoice or customer..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {activeView === 'detailed' && (
              <>
                <div>
                  <Label htmlFor="customer-filter" className="text-sm font-medium mb-2 block">Customer</Label>
                  <Select
                    id="customer-filter"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full"
                  >
                    <option value="">All Customers</option>
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.code} - {cust.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">Status</Label>
                  <Select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="overdue">Overdue</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary View */}
      {activeView === 'summary' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Contact</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Credit Limit</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Total Due</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Overdue</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Last Payment</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-600">No customers found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <p className="text-sm">{customer.phone}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium">
                          {formatCurrency(customer.creditLimit)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className={`font-semibold ${customer.totalReceivable > 0 ? 'text-cyan-600' : 'text-gray-400'}`}>
                            {formatCurrency(customer.totalReceivable)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className={`font-semibold ${customer.overdueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(customer.overdueAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {new Date(customer.lastPaymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCustomerDetails(customer)}
                            >
                              View
                            </Button>
                            {customer.totalReceivable > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleCollectPayment(customer.id)}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                Collect
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details View */}
      {activeView === 'detailed' && (
        <Card className="bg-white shadow-soft">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Invoice No.</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Invoice Date</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Due Date</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Balance</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Overdue</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-600">No invoices found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id} 
                        className={`hover:bg-gray-50 transition-colors ${invoice.status === 'Overdue' ? 'bg-red-50/50' : ''}`}
                      >
                        <TableCell className="px-4 py-3">
                          <span className="font-mono text-sm text-cyan-600">{invoice.invoiceNo}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium">{invoice.customer}</TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-medium">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <span className={`font-semibold ${invoice.balance > 0 ? 'text-cyan-600' : 'text-green-600'}`}>
                            {formatCurrency(invoice.balance)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {invoice.daysOverdue > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              {invoice.daysOverdue} days
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm">View</Button>
                            {invoice.balance > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleCollectPayment(invoice.customerId)}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                Collect
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collect Payment Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Collect Payment</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="receipt-customer" className="text-sm font-medium mb-2 block">Customer</Label>
              <Select
                id="receipt-customer"
                value={receiptForm.customerId}
                onChange={(e) => setReceiptForm({ ...receiptForm, customerId: e.target.value })}
                required
              >
                <option value="">Select Customer</option>
                {customers.filter(c => c.totalReceivable > 0).map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} (Due: {formatCurrency(cust.totalReceivable)})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receipt-date" className="text-sm font-medium mb-2 block">Date</Label>
                <Input
                  id="receipt-date"
                  type="date"
                  value={receiptForm.date}
                  onChange={(e) => setReceiptForm({ ...receiptForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="receipt-amount" className="text-sm font-medium mb-2 block">Amount</Label>
                <Input
                  id="receipt-amount"
                  type="number"
                  placeholder="0.00"
                  value={receiptForm.amount}
                  onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receipt-mode" className="text-sm font-medium mb-2 block">Payment Mode</Label>
                <Select
                  id="receipt-mode"
                  value={receiptForm.paymentMode}
                  onChange={(e) => setReceiptForm({ ...receiptForm, paymentMode: e.target.value })}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Transfer">Online Transfer</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="receipt-reference" className="text-sm font-medium mb-2 block">Reference</Label>
                <Input
                  id="receipt-reference"
                  type="text"
                  placeholder="Transaction reference"
                  value={receiptForm.reference}
                  onChange={(e) => setReceiptForm({ ...receiptForm, reference: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="receipt-narration" className="text-sm font-medium mb-2 block">Narration</Label>
              <Textarea
                id="receipt-narration"
                placeholder="Enter payment details..."
                value={receiptForm.narration}
                onChange={(e) => setReceiptForm({ ...receiptForm, narration: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setReceiptDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={customerDetailDialogOpen} onOpenChange={setCustomerDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomerDetail && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-semibold">{selectedCustomerDetail.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Code</p>
                    <p className="font-semibold">{selectedCustomerDetail.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">{selectedCustomerDetail.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{selectedCustomerDetail.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">Credit Limit</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedCustomerDetail.creditLimit)}</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-cyan-600 font-medium">Total Due</p>
                  <p className="text-xl font-bold text-cyan-700">{formatCurrency(selectedCustomerDetail.totalReceivable)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 font-medium">Overdue</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(selectedCustomerDetail.overdueAmount)}</p>
                </div>
              </div>

              {/* Outstanding Invoices */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Outstanding Invoices</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {invoices.filter(inv => inv.customerId === selectedCustomerDetail.id && inv.balance > 0).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{inv.invoiceNo}</p>
                        <p className="text-xs text-gray-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-cyan-600">{formatCurrency(inv.balance)}</p>
                        {inv.daysOverdue > 0 && (
                          <p className="text-xs text-red-500">{inv.daysOverdue} days overdue</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCustomerDetailDialogOpen(false)}>
                  Close
                </Button>
                {selectedCustomerDetail.totalReceivable > 0 && (
                  <Button 
                    className="bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => {
                      setCustomerDetailDialogOpen(false);
                      handleCollectPayment(selectedCustomerDetail.id);
                    }}
                  >
                    Collect Payment
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

