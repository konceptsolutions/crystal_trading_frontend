'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface QuotationItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom?: string;
}

export interface SalesQuotation {
  id?: string;
  quotationNo: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  quotationDate: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  items: QuotationItem[];
  createdAt?: string;
  updatedAt?: string;
}

export default function SalesQuotation() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SalesQuotation>({
    quotationNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subTotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    notes: '',
    items: [],
  });

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales-quotations');
      const quotationsData = response.data.quotations || [];
      const transformedQuotations = quotationsData.map((q: any) => ({
        ...q,
        quotationDate: q.quotationDate ? new Date(q.quotationDate).toISOString().split('T')[0] : '',
        validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '',
        items: q.items || [],
      }));
      setQuotations(transformedQuotations);
    } catch (error: any) {
      console.error('Failed to fetch quotations:', error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: QuotationItem[], tax: number, discount: number) => {
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subTotal - discount + tax;
    return { subTotal, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      setLoading(true);
      const totals = calculateTotals(formData.items, formData.tax, formData.discount);
      const submitData = { ...formData, ...totals };
      
      if (selectedQuotation?.id) {
        await api.put(`/sales-quotations/${selectedQuotation.id}`, submitData);
      } else {
        await api.post('/sales-quotations', submitData);
      }
      resetForm();
      fetchQuotations();
    } catch (error: any) {
      console.error('Failed to save quotation:', error);
      alert(error.response?.data?.error || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      setLoading(true);
      await api.delete(`/sales-quotations/${id}`);
      fetchQuotations();
    } catch (error: any) {
      console.error('Failed to delete quotation:', error);
      alert(error.response?.data?.error || 'Failed to delete quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = (quotation: SalesQuotation) => {
    if (!confirm('Convert this quotation to a sales invoice?')) return;
    // Navigate to invoice page with quotation data
    router.push(`/dashboard/sales?tab=invoice&fromQuotation=${quotation.id}`);
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/sales-quotations/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next quotation number:', error);
      return 'SQ-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      quotationNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subTotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      notes: '',
      items: [],
    });
    setSelectedQuotation(null);
    setShowForm(false);
  };

  const handleEdit = (quotation: SalesQuotation) => {
    setSelectedQuotation(quotation);
    setFormData(quotation);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-primary-100 text-primary-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search quotations..."
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
          + New Quotation
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <CardTitle>{selectedQuotation ? 'Edit Quotation' : 'New Sales Quotation'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quotation No</label>
                  <Input
                    value={formData.quotationNo}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Date</label>
                  <Input
                    type="date"
                    value={formData.quotationDate}
                    onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
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
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Address</label>
                  <textarea
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
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
                  {selectedQuotation ? 'Update' : 'Create'} Quotation
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
          <CardTitle>Sales Quotations ({filteredQuotations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No quotations found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.quotationNo}</TableCell>
                    <TableCell>{quotation.customerName}</TableCell>
                    <TableCell>{new Date(quotation.quotationDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(quotation.validUntil).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">Rs {quotation.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {quotation.status === 'accepted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToInvoice(quotation)}
                            className="text-primary-600 hover:text-primary-700 border-primary-300"
                          >
                            Convert to Invoice
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(quotation)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => quotation.id && handleDelete(quotation.id)}
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

