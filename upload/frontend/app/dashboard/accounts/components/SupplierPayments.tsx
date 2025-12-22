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

interface Supplier {
  id: string;
  name: string;
  code: string;
  totalPayable: number;
  lastPaymentDate: string;
}

interface Payment {
  id: string;
  date: string;
  paymentNo: string;
  supplier: string;
  supplierId: string;
  amount: number;
  paymentMode: string;
  reference: string;
  status: string;
  narration: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  amount: number;
  paid: number;
  balance: number;
}

export default function SupplierPayments() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [viewPaymentDialogOpen, setViewPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [supplierInvoices, setSupplierInvoices] = useState<Invoice[]>([]);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    supplierId: '',
    amount: '',
    paymentMode: 'Cash',
    reference: '',
    narration: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Demo data
  useEffect(() => {
    const demoSuppliers: Supplier[] = [
      { id: '1', name: 'ABC Auto Parts', code: 'SUP-001', totalPayable: 125000, lastPaymentDate: '2025-12-05' },
      { id: '2', name: 'XYZ Motors', code: 'SUP-002', totalPayable: 85000, lastPaymentDate: '2025-12-03' },
      { id: '3', name: 'Global Spare Parts', code: 'SUP-003', totalPayable: 210000, lastPaymentDate: '2025-12-01' },
      { id: '4', name: 'Premium Auto Supplies', code: 'SUP-004', totalPayable: 45000, lastPaymentDate: '2025-11-28' },
      { id: '5', name: 'Quick Parts Ltd', code: 'SUP-005', totalPayable: 0, lastPaymentDate: '2025-12-08' },
    ];
    setSuppliers(demoSuppliers);

    const demoPayments: Payment[] = [
      {
        id: '1',
        date: '2025-12-10',
        paymentNo: 'PAY-2025-001',
        supplier: 'ABC Auto Parts',
        supplierId: '1',
        amount: 50000,
        paymentMode: 'Bank Transfer',
        reference: 'TRF-123456',
        status: 'Completed',
        narration: 'Payment against invoice INV-001 and INV-002',
      },
      {
        id: '2',
        date: '2025-12-08',
        paymentNo: 'PAY-2025-002',
        supplier: 'XYZ Motors',
        supplierId: '2',
        amount: 35000,
        paymentMode: 'Cheque',
        reference: 'CHQ-789012',
        status: 'Pending',
        narration: 'Partial payment for December purchases',
      },
      {
        id: '3',
        date: '2025-12-05',
        paymentNo: 'PAY-2025-003',
        supplier: 'Global Spare Parts',
        supplierId: '3',
        amount: 75000,
        paymentMode: 'Cash',
        reference: '',
        status: 'Completed',
        narration: 'Full settlement of outstanding balance',
      },
      {
        id: '4',
        date: '2025-12-03',
        paymentNo: 'PAY-2025-004',
        supplier: 'Premium Auto Supplies',
        supplierId: '4',
        amount: 25000,
        paymentMode: 'Bank Transfer',
        reference: 'TRF-456789',
        status: 'Completed',
        narration: 'Advance payment',
      },
      {
        id: '5',
        date: '2025-12-01',
        paymentNo: 'PAY-2025-005',
        supplier: 'Quick Parts Ltd',
        supplierId: '5',
        amount: 45000,
        paymentMode: 'Online Transfer',
        reference: 'ONL-321654',
        status: 'Completed',
        narration: 'Full and final settlement',
      },
    ];
    setPayments(demoPayments);

    // Demo invoices for a supplier
    const demoInvoices: Invoice[] = [
      { id: '1', invoiceNo: 'INV-001', date: '2025-11-15', amount: 50000, paid: 25000, balance: 25000 },
      { id: '2', invoiceNo: 'INV-002', date: '2025-11-20', amount: 35000, paid: 0, balance: 35000 },
      { id: '3', invoiceNo: 'INV-003', date: '2025-11-28', amount: 65000, paid: 0, balance: 65000 },
    ];
    setSupplierInvoices(demoInvoices);
  }, [selectedSupplier, dateFrom, dateTo]);

  const filteredPayments = payments.filter(payment => 
    (selectedSupplier === '' || payment.supplierId === selectedSupplier) &&
    (payment.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
     payment.paymentNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + s.totalPayable, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Processing': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'Bank Transfer':
      case 'Online Transfer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      case 'Cheque':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const handleCreatePayment = () => {
    setPaymentForm({
      supplierId: '',
      amount: '',
      paymentMode: 'Cash',
      reference: '',
      narration: '',
      date: new Date().toISOString().split('T')[0],
    });
    setPaymentDialogOpen(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setViewPaymentDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Supplier Payments</h2>
            <p className="text-sm text-gray-500">Manage payments to suppliers</p>
          </div>
        </div>
        <Button onClick={handleCreatePayment} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Suppliers</p>
              <p className="text-2xl font-bold text-blue-700">{suppliers.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Payable</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPayable)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Payments This Period</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPayments)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-700">{payments.filter(p => p.status === 'Pending').length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="supplier-select" className="text-sm font-medium mb-2 block">Supplier</Label>
              <Select
                id="supplier-select"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.code} - {sup.name}
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
                  placeholder="Search payments..."
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

      {/* Payments Table */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Payment No.</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Supplier</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Mode</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-600">No payments found</p>
                        <p className="text-sm text-gray-400">Create a new payment to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="px-4 py-3 font-medium whitespace-nowrap">
                        {new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600 hover:underline cursor-pointer">
                          {payment.paymentNo}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{payment.supplier}</p>
                          {payment.reference && (
                            <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getPaymentModeIcon(payment.paymentMode)}
                          <span className="text-sm">{payment.paymentMode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPayment(payment)}
                            className="gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </Button>
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

      {/* Create Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Payment</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-date" className="text-sm font-medium mb-2 block">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment-supplier" className="text-sm font-medium mb-2 block">Supplier</Label>
                <Select
                  id="payment-supplier"
                  value={paymentForm.supplierId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} (Payable: {formatCurrency(sup.totalPayable)})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Outstanding Invoices */}
            {paymentForm.supplierId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Outstanding Invoices</h4>
                <div className="space-y-2">
                  {supplierInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                        <div>
                          <p className="font-medium text-sm">{inv.invoiceNo}</p>
                          <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(inv.balance)}</p>
                        <p className="text-xs text-gray-500">of {formatCurrency(inv.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-amount" className="text-sm font-medium mb-2 block">Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment-mode" className="text-sm font-medium mb-2 block">Payment Mode</Label>
                <Select
                  id="payment-mode"
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Transfer">Online Transfer</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="payment-reference" className="text-sm font-medium mb-2 block">Reference Number</Label>
              <Input
                id="payment-reference"
                type="text"
                placeholder="Enter cheque/transaction reference"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="payment-narration" className="text-sm font-medium mb-2 block">Narration</Label>
              <Textarea
                id="payment-narration"
                placeholder="Enter payment description..."
                value={paymentForm.narration}
                onChange={(e) => setPaymentForm({ ...paymentForm, narration: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Create Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={viewPaymentDialogOpen} onOpenChange={setViewPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Payment No.</p>
                    <p className="font-semibold">{selectedPayment.paymentNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{new Date(selectedPayment.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-semibold">{selectedPayment.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Mode</p>
                    <p className="font-semibold">{selectedPayment.paymentMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-semibold">{selectedPayment.reference || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-600 font-medium">Amount Paid</p>
                <p className="text-3xl font-bold text-emerald-700">{formatCurrency(selectedPayment.amount)}</p>
              </div>

              {selectedPayment.narration && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Narration</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedPayment.narration}</p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setViewPaymentDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

