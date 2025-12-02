'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface ReturnItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  quantity: number;
  returnReason: string;
  uom?: string;
}

export interface SalesReturn {
  id?: string;
  returnNo: string;
  invoiceId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  returnDate: string;
  status: 'draft' | 'approved' | 'processed' | 'rejected';
  totalAmount: number;
  refundAmount: number;
  items: ReturnItem[];
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SalesReturn() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SalesReturn>({
    returnNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    returnDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    totalAmount: 0,
    refundAmount: 0,
    items: [],
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales-returns');
      const returnsData = response.data.returns || [];
      const transformedReturns = returnsData.map((r: any) => ({
        ...r,
        returnDate: r.returnDate ? new Date(r.returnDate).toISOString().split('T')[0] : '',
        items: r.items || [],
      }));
      setReturns(transformedReturns);
    } catch (error: any) {
      console.error('Failed to fetch returns:', error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      setLoading(true);
      if (selectedReturn?.id) {
        await api.put(`/sales-returns/${selectedReturn.id}`, formData);
      } else {
        await api.post('/sales-returns', formData);
      }
      resetForm();
      fetchReturns();
    } catch (error: any) {
      console.error('Failed to save return:', error);
      alert(error.response?.data?.error || 'Failed to save return');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this return?')) return;
    try {
      setLoading(true);
      await api.delete(`/sales-returns/${id}`);
      fetchReturns();
    } catch (error: any) {
      console.error('Failed to delete return:', error);
      alert(error.response?.data?.error || 'Failed to delete return');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/sales-returns/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next return number:', error);
      return 'SR-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      returnNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      returnDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      totalAmount: 0,
      refundAmount: 0,
      items: [],
      reason: '',
      notes: '',
    });
    setSelectedReturn(null);
    setShowForm(false);
  };

  const handleEdit = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem);
    setFormData(returnItem);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'approved':
        return 'bg-primary-100 text-primary-700';
      case 'processed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredReturns = returns.filter(
    (r) =>
      r.returnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search returns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <Button
          onClick={async () => {
            await resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          + New Return
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <CardTitle>{selectedReturn ? 'Edit Return' : 'New Sales Return'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return No</label>
                  <Input
                    value={formData.returnNo}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Date</label>
                  <Input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="processed">Processed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount</label>
                  <Input
                    type="number"
                    value={formData.refundAmount}
                    onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason</label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600">
                  {selectedReturn ? 'Update' : 'Create'} Return
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Returns ({filteredReturns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No returns found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-medium">{returnItem.returnNo}</TableCell>
                    <TableCell>{returnItem.customerName}</TableCell>
                    <TableCell>{new Date(returnItem.returnDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">${returnItem.refundAmount.toFixed(2)}</TableCell>
                    <TableCell>{returnItem.reason || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(returnItem.status)}`}>
                        {returnItem.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(returnItem)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => returnItem.id && handleDelete(returnItem.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

