'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface OrderItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom?: string;
  availableStock?: number;
}

export interface SalesOrder {
  id?: string;
  orderNo: string;
  quotationId?: string;
  quotationNo?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerType?: 'retail' | 'wholesale' | 'market' | 'distributor';
  priceCategory?: 'A' | 'B' | 'M';
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'draft' | 'confirmed' | 'processing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentTerms?: string;
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  notes?: string;
  deliveryNotes?: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export default function SalesOrder() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const [formData, setFormData] = useState<SalesOrder>({
    orderNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerType: 'retail',
    priceCategory: 'A',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    paymentStatus: 'pending',
    paymentTerms: 'Net 30',
    subTotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    advanceAmount: 0,
    balanceAmount: 0,
    notes: '',
    deliveryNotes: '',
    items: [],
  });

  const [parts, setParts] = useState<any[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales-orders');
      const ordersData = response.data.orders || [];
      const transformedOrders = ordersData.map((o: any) => ({
        ...o,
        orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
        expectedDeliveryDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().split('T')[0] : '',
        items: o.items || [],
      }));
      setOrders(transformedOrders);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      // Demo data
      setOrders([
        {
          id: '1',
          orderNo: 'SO-2025-001',
          quotationNo: 'SQ-001',
          customerName: 'ABC Trading Co.',
          customerType: 'wholesale',
          priceCategory: 'B',
          orderDate: '2025-12-10',
          expectedDeliveryDate: '2025-12-17',
          status: 'confirmed',
          paymentStatus: 'partial',
          subTotal: 50000,
          tax: 4500,
          discount: 5000,
          totalAmount: 49500,
          advanceAmount: 20000,
          balanceAmount: 29500,
          items: [
            { partNo: 'BRK-001', description: 'Brake Pads', quantity: 10, unitPrice: 2500, totalPrice: 25000 },
            { partNo: 'OIL-002', description: 'Engine Oil', quantity: 50, unitPrice: 500, totalPrice: 25000 },
          ],
        },
        {
          id: '2',
          orderNo: 'SO-2025-002',
          customerName: 'XYZ Retailers',
          customerType: 'retail',
          priceCategory: 'A',
          orderDate: '2025-12-11',
          expectedDeliveryDate: '2025-12-18',
          status: 'processing',
          paymentStatus: 'pending',
          subTotal: 15000,
          tax: 1350,
          discount: 0,
          totalAmount: 16350,
          advanceAmount: 0,
          balanceAmount: 16350,
          items: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: OrderItem[], tax: number, discount: number, advanceAmount: number) => {
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subTotal - discount + tax;
    const balanceAmount = totalAmount - advanceAmount;
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
      const totals = calculateTotals(formData.items, formData.tax, formData.discount, formData.advanceAmount);
      const submitData = { ...formData, ...totals };
      
      if (selectedOrder?.id) {
        await api.put(`/sales-orders/${selectedOrder.id}`, submitData);
      } else {
        await api.post('/sales-orders', submitData);
      }
      resetForm();
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to save order:', error);
      alert(error.response?.data?.error || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      setLoading(true);
      await api.delete(`/sales-orders/${id}`);
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      alert(error.response?.data?.error || 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      await api.patch(`/sales-orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = (order: SalesOrder) => {
    if (!confirm('Convert this order to a sales invoice?')) return;
    // Navigate to invoice creation with order data
    alert('Order will be converted to invoice. Navigate to Invoice tab.');
  };

  const handleCreateChallan = (order: SalesOrder) => {
    if (!confirm('Create delivery challan for this order?')) return;
    alert('Delivery challan will be created. Navigate to Delivery tab.');
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/sales-orders/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next order number:', error);
      return 'SO-2025-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      orderNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      customerType: 'retail',
      priceCategory: 'A',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      paymentStatus: 'pending',
      paymentTerms: 'Net 30',
      subTotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      advanceAmount: 0,
      balanceAmount: 0,
      notes: '',
      deliveryNotes: '',
      items: [],
    });
    setSelectedOrder(null);
    setShowForm(false);
  };

  const handleEdit = (order: SalesOrder) => {
    setSelectedOrder(order);
    setFormData({
      ...order,
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { partNo: '', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    });
    setCurrentItemIndex(formData.items.length);
    setShowPartSearch(true);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }
    
    const totals = calculateTotals(newItems, formData.tax, formData.discount, formData.advanceAmount);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems, formData.tax, formData.discount, formData.advanceAmount);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const selectPart = (part: any, index: number) => {
    const priceKey = formData.priceCategory === 'A' ? 'priceA' : formData.priceCategory === 'B' ? 'priceB' : 'priceM';
    const price = part[priceKey] || part.priceA || 0;
    
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      partId: part.id,
      partNo: part.partNo,
      description: part.description || '',
      unitPrice: price,
      totalPrice: price * newItems[index].quantity,
      uom: part.uom || '',
      availableStock: part.stockQuantity || 0,
    };
    
    const totals = calculateTotals(newItems, formData.tax, formData.discount, formData.advanceAmount);
    setFormData({ ...formData, items: newItems, ...totals });
    setShowPartSearch(false);
    setPartSearchTerm('');
    setCurrentItemIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ready':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'dispatched':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Confirmed</p>
              <p className="text-2xl font-bold text-blue-700">{stats.confirmed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-yellow-600 font-medium">Processing</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.processing}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-green-600 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 bg-gradient-to-br from-primary-50 to-orange-100 border-primary-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-primary-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-primary-700">Rs. {stats.totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 ${viewMode === 'card' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          <Button
            onClick={async () => {
              await resetForm();
              setShowForm(true);
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            + New Order
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle>{selectedOrder ? 'Edit Sales Order' : 'New Sales Order'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order No</label>
                  <Input
                    value={formData.orderNo}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Date *</label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery *</label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
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
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="ready">Ready for Dispatch</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer Details */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        let priceCategory: 'A' | 'B' | 'M' = 'A';
                        if (type === 'wholesale') priceCategory = 'B';
                        else if (type === 'market' || type === 'distributor') priceCategory = 'M';
                        setFormData({ ...formData, customerType: type, priceCategory });
                      }}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="market">Market</option>
                      <option value="distributor">Distributor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Category</label>
                    <select
                      value={formData.priceCategory}
                      onChange={(e) => setFormData({ ...formData, priceCategory: e.target.value as any })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="A">Price A (Retail)</option>
                      <option value="B">Price B (Wholesale)</option>
                      <option value="M">Price M (Market)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <Input
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <Input
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
                  <Button type="button" onClick={addItem} className="bg-primary-500 hover:bg-primary-600 text-white text-sm">
                    + Add Item
                  </Button>
                </div>

                {/* Part Search */}
                {showPartSearch && currentItemIndex !== null && (
                  <div className="relative mb-4">
                    <Input
                      placeholder="Search parts by name or part number..."
                      value={partSearchTerm}
                      onChange={(e) => setPartSearchTerm(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                    {parts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {parts.map((part) => (
                          <div
                            key={part.id}
                            onClick={() => selectPart(part, currentItemIndex)}
                            className="p-3 hover:bg-primary-50 cursor-pointer border-b border-gray-200 last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">{part.partNo}</div>
                                <div className="text-sm text-gray-600">{part.description}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-primary-600">
                                  Rs. {part[formData.priceCategory === 'A' ? 'priceA' : formData.priceCategory === 'B' ? 'priceB' : 'priceM'] || part.priceA || 0}
                                </div>
                                <div className="text-xs text-gray-500">Stock: {part.stockQuantity || 0}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Items Table */}
                {formData.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-24">Part No</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20 text-center">Stock</TableHead>
                          <TableHead className="w-20 text-center">Qty</TableHead>
                          <TableHead className="w-28 text-right">Unit Price</TableHead>
                          <TableHead className="w-28 text-right">Total</TableHead>
                          <TableHead className="w-16"></TableHead>
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
                                className="w-full text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.description || ''}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Description"
                                className="w-full text-sm"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-sm ${(item.availableStock || 0) < item.quantity ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                {item.availableStock || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full text-sm text-center"
                                min="1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full text-sm text-right"
                                step="0.01"
                                min="0"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              Rs. {item.totalPrice.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end mt-4">
                  <div className="w-80 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">Rs. {formData.subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, formData.tax, discount, formData.advanceAmount);
                          setFormData({ ...formData, discount, ...totals });
                        }}
                        className="w-28 h-8 text-sm text-right"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <Input
                        type="number"
                        value={formData.tax}
                        onChange={(e) => {
                          const tax = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, tax, formData.discount, formData.advanceAmount);
                          setFormData({ ...formData, tax, ...totals });
                        }}
                        className="w-28 h-8 text-sm text-right"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary-600">Rs. {formData.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Advance:</span>
                      <Input
                        type="number"
                        value={formData.advanceAmount}
                        onChange={(e) => {
                          const advanceAmount = parseFloat(e.target.value) || 0;
                          const totals = calculateTotals(formData.items, formData.tax, formData.discount, advanceAmount);
                          setFormData({ ...formData, advanceAmount, ...totals });
                        }}
                        className="w-28 h-8 text-sm text-right"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between text-sm font-medium text-red-600">
                      <span>Balance Due:</span>
                      <span>Rs. {formData.balanceAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Internal notes..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes</label>
                  <textarea
                    value={formData.deliveryNotes || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Special delivery instructions..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600" disabled={loading}>
                  {loading ? 'Saving...' : selectedOrder ? 'Update Order' : 'Create Order'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Orders List/Cards */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-lg">Sales Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Order No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Payment</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{order.orderNo}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            {order.quotationNo && (
                              <div className="text-xs text-gray-500">From: {order.quotationNo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {order.customerType || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          Rs. {order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(order)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              Edit
                            </Button>
                            {order.status === 'confirmed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConvertToInvoice(order)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Invoice
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateChallan(order)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  Challan
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => order.id && handleDelete(order.id)}
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{order.orderNo}</h3>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Date:</span>
                    <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery:</span>
                    <span>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-bold text-primary-600">Rs. {order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(order)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => order.id && handleDelete(order.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

