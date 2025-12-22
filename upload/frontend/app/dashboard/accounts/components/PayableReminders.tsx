'use client';

import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PayableReminder {
  id: string;
  supplier: string;
  supplierId: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balance: number;
  daysOverdue: number;
  status: 'Due' | 'Overdue' | 'Paid' | 'PartiallyPaid';
  priority: 'High' | 'Medium' | 'Low';
  reminderSent: boolean;
  lastReminderDate: string | null;
}

export default function PayableReminders() {
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<PayableReminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<PayableReminder | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);

  // Demo data
  useEffect(() => {
    const demoReminders: PayableReminder[] = [
      {
        id: '1',
        supplier: 'ABC Auto Parts',
        supplierId: '1',
        invoiceNo: 'INV-2025-001',
        invoiceDate: '2025-11-01',
        dueDate: '2025-11-30',
        amount: 75000,
        paidAmount: 25000,
        balance: 50000,
        daysOverdue: 11,
        status: 'Overdue',
        priority: 'High',
        reminderSent: true,
        lastReminderDate: '2025-12-05',
      },
      {
        id: '2',
        supplier: 'XYZ Motors',
        supplierId: '2',
        invoiceNo: 'INV-2025-002',
        invoiceDate: '2025-11-15',
        dueDate: '2025-12-15',
        amount: 120000,
        paidAmount: 0,
        balance: 120000,
        daysOverdue: 0,
        status: 'Due',
        priority: 'Medium',
        reminderSent: false,
        lastReminderDate: null,
      },
      {
        id: '3',
        supplier: 'Global Spare Parts',
        supplierId: '3',
        invoiceNo: 'INV-2025-003',
        invoiceDate: '2025-10-20',
        dueDate: '2025-11-20',
        amount: 85000,
        paidAmount: 0,
        balance: 85000,
        daysOverdue: 21,
        status: 'Overdue',
        priority: 'High',
        reminderSent: true,
        lastReminderDate: '2025-12-01',
      },
      {
        id: '4',
        supplier: 'Premium Auto Supplies',
        supplierId: '4',
        invoiceNo: 'INV-2025-004',
        invoiceDate: '2025-11-25',
        dueDate: '2025-12-25',
        amount: 45000,
        paidAmount: 0,
        balance: 45000,
        daysOverdue: 0,
        status: 'Due',
        priority: 'Low',
        reminderSent: false,
        lastReminderDate: null,
      },
      {
        id: '5',
        supplier: 'Quick Parts Ltd',
        supplierId: '5',
        invoiceNo: 'INV-2025-005',
        invoiceDate: '2025-11-10',
        dueDate: '2025-12-10',
        amount: 65000,
        paidAmount: 65000,
        balance: 0,
        daysOverdue: 0,
        status: 'Paid',
        priority: 'Low',
        reminderSent: false,
        lastReminderDate: null,
      },
      {
        id: '6',
        supplier: 'Auto Parts Wholesale',
        supplierId: '6',
        invoiceNo: 'INV-2025-006',
        invoiceDate: '2025-10-05',
        dueDate: '2025-11-05',
        amount: 150000,
        paidAmount: 50000,
        balance: 100000,
        daysOverdue: 36,
        status: 'Overdue',
        priority: 'High',
        reminderSent: true,
        lastReminderDate: '2025-12-08',
      },
    ];
    setReminders(demoReminders);
  }, []);

  const filteredReminders = reminders.filter(reminder => {
    const matchesStatus = filterStatus === 'all' || reminder.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesPriority = filterPriority === 'all' || reminder.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchesSearch = 
      reminder.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const totalOverdue = reminders.filter(r => r.status === 'Overdue').reduce((sum, r) => sum + r.balance, 0);
  const totalDue = reminders.filter(r => r.status === 'Due').reduce((sum, r) => sum + r.balance, 0);
  const overdueCount = reminders.filter(r => r.status === 'Overdue').length;

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Due': return 'bg-yellow-100 text-yellow-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      case 'PartiallyPaid': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-amber-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            <span className="text-red-600 font-medium">High</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-amber-600 font-medium">Medium</span>
          </div>
        );
      case 'Low':
        return (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" transform="rotate(180 10 10)" />
            </svg>
            <span className="text-green-600 font-medium">Low</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSelectAll = () => {
    if (selectedReminders.length === filteredReminders.length) {
      setSelectedReminders([]);
    } else {
      setSelectedReminders(filteredReminders.map(r => r.id));
    }
  };

  const handleSelectReminder = (id: string) => {
    setSelectedReminders(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSendReminders = () => {
    // In a real app, this would send reminder notifications
    alert(`Sending reminders for ${selectedReminders.length} payable(s)`);
    setSelectedReminders([]);
  };

  const handleViewDetails = (reminder: PayableReminder) => {
    setSelectedReminder(reminder);
    setReminderDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payable Reminders</h2>
            <p className="text-sm text-gray-500">Track and manage supplier payment dues</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedReminders.length > 0 && (
            <Button onClick={handleSendReminders} className="bg-red-600 hover:bg-red-700 gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Reminders ({selectedReminders.length})
            </Button>
          )}
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
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Overdue</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOverdue)}</p>
              <p className="text-xs text-red-500">{overdueCount} invoices overdue</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Due Soon</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalDue)}</p>
              <p className="text-xs text-amber-500">{reminders.filter(r => r.status === 'Due').length} invoices due</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Reminders Sent</p>
              <p className="text-2xl font-bold text-blue-700">{reminders.filter(r => r.reminderSent).length}</p>
              <p className="text-xs text-blue-500">This month</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">High Priority</p>
              <p className="text-2xl font-bold text-green-700">{reminders.filter(r => r.priority === 'High' && r.status !== 'Paid').length}</p>
              <p className="text-xs text-green-500">Needs attention</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search supplier or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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
                <option value="due">Due Soon</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority-filter" className="text-sm font-medium mb-2 block">Priority</Label>
              <Select
                id="priority-filter"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
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

      {/* Reminders Table */}
      <Card className="bg-white shadow-soft">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedReminders.length === filteredReminders.length && filteredReminders.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600"
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Supplier</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Invoice</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Due Date</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Balance</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Overdue</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Priority</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReminders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-600">No reminders found</p>
                        <p className="text-sm text-gray-400">All payments are up to date</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReminders.map((reminder) => (
                    <TableRow 
                      key={reminder.id} 
                      className={`hover:bg-gray-50 transition-colors ${reminder.status === 'Overdue' ? 'bg-red-50/50' : ''}`}
                    >
                      <TableCell className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReminders.includes(reminder.id)}
                          onChange={() => handleSelectReminder(reminder.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          disabled={reminder.status === 'Paid'}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium text-gray-900">
                        {reminder.supplier}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600">{reminder.invoiceNo}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {new Date(reminder.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium">
                        {formatCurrency(reminder.amount)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className={`font-semibold ${reminder.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(reminder.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {reminder.daysOverdue > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            {reminder.daysOverdue} days
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getPriorityIcon(reminder.priority)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                          {reminder.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(reminder)}
                            className="gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          {reminder.status !== 'Paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Pay
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

      {/* View Details Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Payable Details</DialogTitle>
          </DialogHeader>
          {selectedReminder && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-semibold">{selectedReminder.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice No.</p>
                    <p className="font-semibold">{selectedReminder.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-semibold">{new Date(selectedReminder.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-semibold">{new Date(selectedReminder.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">Invoice Amount</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedReminder.amount)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(selectedReminder.paidAmount)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 font-medium">Balance Due</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(selectedReminder.balance)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReminder.status)}`}>
                    {selectedReminder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Priority</span>
                  {getPriorityIcon(selectedReminder.priority)}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Days Overdue</span>
                  <span className="font-semibold text-red-600">
                    {selectedReminder.daysOverdue > 0 ? `${selectedReminder.daysOverdue} days` : 'Not overdue'}
                  </span>
                </div>
                {selectedReminder.lastReminderDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Reminder</span>
                    <span className="font-medium">{new Date(selectedReminder.lastReminderDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
                  Close
                </Button>
                {selectedReminder.status !== 'Paid' && (
                  <>
                    <Button variant="outline" className="gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Reminder
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Make Payment
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

