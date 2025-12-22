'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface Receivable {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceDate: string;
  originalDueDate: string;
  currentDueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  daysOverdue: number;
  status: 'pending' | 'overdue' | 'reminded' | 'rescheduled' | 'promised' | 'disputed';
  reminderCount: number;
  lastReminderDate?: string;
  nextReminderDate?: string;
  promisedDate?: string;
  promisedAmount?: number;
  notes?: string;
  rescheduleHistory?: RescheduleEntry[];
}

export interface RescheduleEntry {
  id: string;
  previousDueDate: string;
  newDueDate: string;
  reason: string;
  rescheduledBy: string;
  rescheduledAt: string;
}

export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp';
  message: string;
  daysBeforeDue: number;
}

export default function ReceivableReminders() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReceivables, setSelectedReceivables] = useState<string[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedForReschedule, setSelectedForReschedule] = useState<Receivable | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<Receivable | null>(null);

  const [rescheduleData, setRescheduleData] = useState({
    newDueDate: '',
    reason: '',
  });

  const [reminderData, setReminderData] = useState({
    type: 'sms' as 'sms' | 'email' | 'whatsapp',
    message: '',
    promisedDate: '',
    promisedAmount: 0,
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    reference: '',
  });

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const response = await api.get('/receivables');
      setReceivables(response.data.receivables || []);
    } catch (error: any) {
      console.error('Failed to fetch receivables:', error);
      // Demo data
      setReceivables([
        {
          id: '1',
          invoiceNo: 'INV-2025-001',
          customerName: 'ABC Trading Co.',
          customerPhone: '0300-1234567',
          customerEmail: 'abc@trading.com',
          invoiceDate: '2025-10-01',
          originalDueDate: '2025-10-31',
          currentDueDate: '2025-11-15',
          totalAmount: 150000,
          paidAmount: 50000,
          balanceAmount: 100000,
          daysOverdue: 26,
          status: 'overdue',
          reminderCount: 3,
          lastReminderDate: '2025-12-05',
          nextReminderDate: '2025-12-12',
          notes: 'Customer promised to pay by 15th',
        },
        {
          id: '2',
          invoiceNo: 'INV-2025-002',
          customerName: 'XYZ Distributors',
          customerPhone: '0321-7654321',
          customerEmail: 'xyz@dist.com',
          invoiceDate: '2025-10-15',
          originalDueDate: '2025-11-15',
          currentDueDate: '2025-11-15',
          totalAmount: 85000,
          paidAmount: 0,
          balanceAmount: 85000,
          daysOverdue: 26,
          status: 'reminded',
          reminderCount: 2,
          lastReminderDate: '2025-12-08',
          promisedDate: '2025-12-20',
          promisedAmount: 85000,
        },
        {
          id: '3',
          invoiceNo: 'INV-2025-003',
          customerName: 'Regional Auto Parts',
          customerPhone: '0333-9876543',
          customerEmail: 'regional@auto.com',
          invoiceDate: '2025-11-01',
          originalDueDate: '2025-12-01',
          currentDueDate: '2025-12-15',
          totalAmount: 220000,
          paidAmount: 100000,
          balanceAmount: 120000,
          daysOverdue: 10,
          status: 'rescheduled',
          reminderCount: 1,
          lastReminderDate: '2025-12-01',
        },
        {
          id: '4',
          invoiceNo: 'INV-2025-004',
          customerName: 'City Motors',
          customerPhone: '0345-1122334',
          customerEmail: 'city@motors.com',
          invoiceDate: '2025-11-10',
          originalDueDate: '2025-12-10',
          currentDueDate: '2025-12-10',
          totalAmount: 65000,
          paidAmount: 0,
          balanceAmount: 65000,
          daysOverdue: 1,
          status: 'overdue',
          reminderCount: 0,
        },
        {
          id: '5',
          invoiceNo: 'INV-2025-005',
          customerName: 'Highway Traders',
          customerPhone: '0312-5566778',
          customerEmail: 'highway@traders.com',
          invoiceDate: '2025-11-20',
          originalDueDate: '2025-12-20',
          currentDueDate: '2025-12-20',
          totalAmount: 180000,
          paidAmount: 0,
          balanceAmount: 180000,
          daysOverdue: 0,
          status: 'pending',
          reminderCount: 0,
        },
        {
          id: '6',
          invoiceNo: 'INV-2025-006',
          customerName: 'Metro Parts Hub',
          customerPhone: '0341-9988776',
          customerEmail: 'metro@parts.com',
          invoiceDate: '2025-09-15',
          originalDueDate: '2025-10-15',
          currentDueDate: '2025-10-15',
          totalAmount: 95000,
          paidAmount: 20000,
          balanceAmount: 75000,
          daysOverdue: 57,
          status: 'disputed',
          reminderCount: 5,
          lastReminderDate: '2025-11-30',
          notes: 'Customer claims goods were damaged',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedReceivables.length && !selectedForReschedule) return;
    
    try {
      setLoading(true);
      const ids = selectedForReschedule ? [selectedForReschedule.id] : selectedReceivables;
      await api.post('/receivables/send-reminder', {
        receivableIds: ids,
        ...reminderData,
      });
      setShowReminderModal(false);
      setReminderData({ type: 'sms', message: '', promisedDate: '', promisedAmount: 0 });
      fetchReceivables();
      alert('Reminder sent successfully!');
    } catch (error: any) {
      console.error('Failed to send reminder:', error);
      alert(error.response?.data?.error || 'Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedForReschedule) return;
    
    try {
      setLoading(true);
      await api.post(`/receivables/${selectedForReschedule.id}/reschedule`, rescheduleData);
      setShowRescheduleModal(false);
      setRescheduleData({ newDueDate: '', reason: '' });
      setSelectedForReschedule(null);
      fetchReceivables();
      alert('Due date rescheduled successfully!');
    } catch (error: any) {
      console.error('Failed to reschedule:', error);
      alert(error.response?.data?.error || 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedForPayment) return;
    
    try {
      setLoading(true);
      await api.post(`/receivables/${selectedForPayment.id}/payment`, paymentData);
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, date: new Date().toISOString().split('T')[0], method: 'cash', reference: '' });
      setSelectedForPayment(null);
      fetchReceivables();
      alert('Payment recorded successfully!');
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      alert(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedReceivables.length === filteredReceivables.length) {
      setSelectedReceivables([]);
    } else {
      setSelectedReceivables(filteredReceivables.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedReceivables.includes(id)) {
      setSelectedReceivables(selectedReceivables.filter(i => i !== id));
    } else {
      setSelectedReceivables([...selectedReceivables, id]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'reminded':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rescheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'promised':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'disputed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getOverdueColor = (days: number) => {
    if (days <= 0) return 'text-green-600';
    if (days <= 15) return 'text-yellow-600';
    if (days <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredReceivables = receivables.filter((r) => {
    const matchesSearch =
      r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalReceivables: receivables.length,
    totalAmount: receivables.reduce((sum, r) => sum + r.balanceAmount, 0),
    overdue: receivables.filter(r => r.daysOverdue > 0).length,
    overdueAmount: receivables.filter(r => r.daysOverdue > 0).reduce((sum, r) => sum + r.balanceAmount, 0),
    pendingReminders: receivables.filter(r => r.status === 'pending' || r.status === 'overdue').length,
    promisedPayments: receivables.filter(r => r.promisedDate).length,
  };

  const reminderTemplates = [
    { name: 'Friendly Reminder', message: 'Dear {customer}, this is a friendly reminder that your payment of Rs. {amount} for invoice {invoice} is due on {dueDate}. Please arrange the payment. Thank you!' },
    { name: 'Overdue Notice', message: 'Dear {customer}, your payment of Rs. {amount} for invoice {invoice} is now {days} days overdue. Please clear the outstanding balance at your earliest convenience.' },
    { name: 'Final Notice', message: 'Dear {customer}, this is a final reminder for the overdue payment of Rs. {amount} for invoice {invoice}. Please make the payment immediately to avoid any service interruption.' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-300 font-medium">Total Receivables</p>
              <p className="text-xl font-bold">{stats.totalReceivables}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-blue-100 font-medium">Total Amount</p>
              <p className="text-lg font-bold">Rs. {(stats.totalAmount / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-red-100 font-medium">Overdue</p>
              <p className="text-xl font-bold">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-orange-100 font-medium">Overdue Amount</p>
              <p className="text-lg font-bold">Rs. {(stats.overdueAmount / 1000).toFixed(0)}K</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-yellow-100 font-medium">Pending Reminders</p>
              <p className="text-xl font-bold">{stats.pendingReminders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-green-100 font-medium">Promised</p>
              <p className="text-xl font-bold">{stats.promisedPayments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-300 focus:border-primary-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="reminded">Reminded</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="promised">Promised</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        <div className="flex gap-2">
          {selectedReceivables.length > 0 && (
            <Button
              onClick={() => setShowReminderModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Send Reminder ({selectedReceivables.length})
            </Button>
          )}
          <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
          </Button>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedForReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Reschedule Due Date</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowRescheduleModal(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Invoice: <span className="font-medium">{selectedForReschedule.invoiceNo}</span></p>
                  <p className="text-sm text-gray-600">Customer: <span className="font-medium">{selectedForReschedule.customerName}</span></p>
                  <p className="text-sm text-gray-600">Balance: <span className="font-bold text-primary-600">Rs. {selectedForReschedule.balanceAmount.toLocaleString()}</span></p>
                  <p className="text-sm text-gray-600">Current Due: <span className="font-medium">{new Date(selectedForReschedule.currentDueDate).toLocaleDateString()}</span></p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Due Date *</label>
                  <Input
                    type="date"
                    value={rescheduleData.newDueDate}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, newDueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                  <select
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select reason</option>
                    <option value="customer_request">Customer Request</option>
                    <option value="financial_difficulty">Financial Difficulty</option>
                    <option value="partial_payment">Partial Payment Received</option>
                    <option value="dispute_resolution">Dispute Resolution</option>
                    <option value="goodwill">Goodwill Gesture</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleReschedule}
                    className="flex-1 bg-primary-500 hover:bg-primary-600"
                    disabled={loading || !rescheduleData.newDueDate || !rescheduleData.reason}
                  >
                    {loading ? 'Saving...' : 'Reschedule'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Send Payment Reminder</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowReminderModal(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{selectedReceivables.length || 1}</span> customer(s) will receive this reminder
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Type</label>
                  <div className="flex gap-2">
                    {['sms', 'email', 'whatsapp'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setReminderData({ ...reminderData, type: type as any })}
                        className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                          reminderData.type === type
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <div className="space-y-2">
                    {reminderTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReminderData({ ...reminderData, message: template.message })}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          reminderData.message === template.message
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{template.message}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
                  <textarea
                    value={reminderData.message}
                    onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="Enter custom message or select a template above..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promised Date (Optional)</label>
                    <Input
                      type="date"
                      value={reminderData.promisedDate}
                      onChange={(e) => setReminderData({ ...reminderData, promisedDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promised Amount</label>
                    <Input
                      type="number"
                      value={reminderData.promisedAmount}
                      onChange={(e) => setReminderData({ ...reminderData, promisedAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSendReminder}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                    disabled={loading || !reminderData.message}
                  >
                    {loading ? 'Sending...' : 'Send Reminder'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Record Payment</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPaymentModal(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Invoice: <span className="font-medium">{selectedForPayment.invoiceNo}</span></p>
                  <p className="text-sm text-gray-600">Customer: <span className="font-medium">{selectedForPayment.customerName}</span></p>
                  <p className="text-sm text-gray-600">Balance Due: <span className="font-bold text-red-600">Rs. {selectedForPayment.balanceAmount.toLocaleString()}</span></p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount *</label>
                  <Input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    max={selectedForPayment.balanceAmount}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                  <Input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference No</label>
                  <Input
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="Cheque no. / Transaction ID"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleRecordPayment}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    disabled={loading || !paymentData.amount}
                  >
                    {loading ? 'Recording...' : 'Record Payment'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receivables Table */}
      <Card>
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Receivable Invoices ({filteredReceivables.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : filteredReceivables.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No receivables found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedReceivables.length === filteredReceivables.length && filteredReceivables.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Invoice</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold text-right">Balance</TableHead>
                    <TableHead className="font-semibold text-center">Days Overdue</TableHead>
                    <TableHead className="font-semibold text-center">Reminders</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable) => (
                    <TableRow key={receivable.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedReceivables.includes(receivable.id)}
                          onChange={() => toggleSelect(receivable.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{receivable.invoiceNo}</div>
                          <div className="text-xs text-gray-500">{new Date(receivable.invoiceDate).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{receivable.customerName}</div>
                          <div className="text-xs text-gray-500">{receivable.customerPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className={`font-medium ${receivable.daysOverdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(receivable.currentDueDate).toLocaleDateString()}
                          </div>
                          {receivable.originalDueDate !== receivable.currentDueDate && (
                            <div className="text-xs text-gray-500 line-through">
                              {new Date(receivable.originalDueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-gray-900">Rs. {receivable.balanceAmount.toLocaleString()}</div>
                        {receivable.paidAmount > 0 && (
                          <div className="text-xs text-green-600">Paid: Rs. {receivable.paidAmount.toLocaleString()}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${getOverdueColor(receivable.daysOverdue)}`}>
                          {receivable.daysOverdue > 0 ? `${receivable.daysOverdue} days` : 'Current'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            {receivable.reminderCount}
                          </span>
                          {receivable.promisedDate && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium" title={`Promised: ${new Date(receivable.promisedDate).toLocaleDateString()}`}>
                              P
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(receivable.status)}`}>
                          {receivable.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForReschedule(receivable);
                              setShowReminderModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            title="Send Reminder"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForReschedule(receivable);
                              setShowRescheduleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Reschedule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedForPayment(receivable);
                              setShowPaymentModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Record Payment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

