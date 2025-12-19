'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface InvoiceItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom?: string;
}

export interface SalesInvoice {
  id?: string;
  invoiceNo: string;
  quotationId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  items: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export default function SalesInvoice() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SalesInvoice>({
    invoiceNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subTotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    notes: '',
    items: [],
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales-invoices');
      const invoicesData = response.data.invoices || [];
      // Transform API response to match component interface
      const transformedInvoices = invoicesData.map((inv: any) => ({
        ...inv,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
        items: inv.items || [],
      }));
      setInvoices(transformedInvoices);
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: InvoiceItem[], tax: number, discount: number, paidAmount: number) => {
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subTotal - discount + tax;
    const balanceAmount = totalAmount - paidAmount;
    return { subTotal, totalAmount, balanceAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      setLoading(true);
      const totals = calculateTotals(formData.items, formData.tax, formData.discount, formData.paidAmount);
      const submitData = {
        ...formData,
        ...totals,
      };
      
      if (selectedInvoice?.id) {
        await api.put(`/sales-invoices/${selectedInvoice.id}`, submitData);
      } else {
        await api.post('/sales-invoices', submitData);
      }
      resetForm();
      fetchInvoices();
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      alert(error.response?.data?.error || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      setLoading(true);
      await api.delete(`/sales-invoices/${id}`);
      fetchInvoices();
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      alert(error.response?.data?.error || 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/sales-invoices/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next invoice number:', error);
      return 'INV-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      invoiceNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subTotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      notes: '',
      items: [],
    });
    setSelectedInvoice(null);
    setShowForm(false);
  };

  const handleEdit = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      ...invoice,
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const [parts, setParts] = useState<any[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchParts = async () => {
      if (partSearchTerm.length > 0) {
        try {
          const response = await api.get('/parts', { params: { search: partSearchTerm } });
          // Filter out inactive parts (only show active parts)
          const activeParts = (response.data.parts || []).filter((part: any) => part.status === 'A');
          setParts(activeParts);
        } catch (error) {
          console.error('Failed to fetch parts:', error);
        }
      } else {
        setParts([]);
      }
    };
    fetchParts();
  }, [partSearchTerm]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { partNo: '', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    });
    setCurrentItemIndex(formData.items.length);
    setShowPartSearch(true);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }
    
    const totals = calculateTotals(newItems, formData.tax, formData.discount, formData.paidAmount);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems, formData.tax, formData.discount, formData.paidAmount);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const selectPart = (part: any, index: number) => {
    updateItem(index, 'partId', part.id);
    updateItem(index, 'partNo', part.partNo);
    updateItem(index, 'description', part.description || '');
    updateItem(index, 'unitPrice', part.priceA || part.priceB || part.priceM || 0);
    updateItem(index, 'uom', part.uom || '');
    setShowPartSearch(false);
    setPartSearchTerm('');
    setCurrentItemIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-primary-100 text-primary-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search invoices..."
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
          + New Invoice
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <CardTitle>{selectedInvoice ? 'Edit Invoice' : 'New Sales Invoice'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice No</label>
                  <Input
                    value={formData.invoiceNo}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                  <Input
                    type="email"
                    value={formData.customerEmail || ''}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                  <Input
                    value={formData.customerPhone || ''}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Address</label>
                  <textarea
                    value={formData.customerAddress || ''}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <Button type="button" onClick={addItem} className="bg-primary-500 hover:bg-primary-600 text-white text-sm">
                    + Add Item
                  </Button>
                </div>

                {/* Part Search */}
                {showPartSearch && currentItemIndex !== null && (
                  <div className="relative">
                    <Input
                      placeholder="Search parts..."
                      value={partSearchTerm}
                      onChange={(e) => setPartSearchTerm(e.target.value)}
                      className="w-full"
                    />
                    {parts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {parts.map((part) => (
                          <div
                            key={part.id}
                            onClick={() => selectPart(part, currentItemIndex)}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                          >
                            <div className="font-medium">{part.partNo}</div>
                            <div className="text-sm text-gray-600">{part.description}</div>
                            <div className="text-sm text-gray-500">Price: Rs {part.priceA || part.priceB || part.priceM || 0}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Items Table */}
                {formData.items.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part No</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={item.partNo}
                                onChange={(e) => {
                                  updateItem(index, 'partNo', e.target.value);
                                  if (e.target.value && currentItemIndex !== index) {
                                    setCurrentItemIndex(index);
                                    setPartSearchTerm(e.target.value);
                                    setShowPartSearch(true);
                                  }
                                }}
                                placeholder="Part No"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.description || ''}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Description"
                                className="w-48"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-24"
                                step="0.01"
                                min="0"
                              />
                            </TableCell>
                            <TableCell className="font-medium">Rs {item.totalPrice.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between w-64">
                      <span>Subtotal:</span>
                      <span className="font-medium">Rs {formData.subTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, formData.tax, discount, formData.paidAmount);
                          setFormData({ ...formData, discount, ...totals });
                        }}
                        className="w-24"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <Input
                        type="number"
                        value={formData.tax}
                        onChange={(e) => {
                          const tax = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, tax, formData.discount, formData.paidAmount);
                          setFormData({ ...formData, tax, ...totals });
                        }}
                        className="w-24"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold text-lg">Rs {formData.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <Input
                        type="number"
                        value={formData.paidAmount}
                        onChange={(e) => {
                          const paidAmount = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, formData.tax, formData.discount, paidAmount);
                          setFormData({ ...formData, paidAmount, ...totals });
                        }}
                        className="w-24"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Balance:</span>
                      <span className="font-medium">Rs {formData.balanceAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600" disabled={loading}>
                  {loading ? 'Saving...' : selectedInvoice ? 'Update' : 'Create'} Invoice
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
          <CardTitle>Sales Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No invoices found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">Rs {invoice.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-semibold">Rs {invoice.balanceAmount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => invoice.id && handleDelete(invoice.id)}
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

