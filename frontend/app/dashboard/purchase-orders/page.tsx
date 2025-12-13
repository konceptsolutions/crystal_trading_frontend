'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';
import { Part } from '@/components/inventory/PartForm';

export interface PurchaseOrderItem {
  id?: string;
  partId?: string;
  part?: Part;
  partNo: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface PurchaseOrder {
  id?: string;
  poNo: string;
  type: 'purchase';
  supplierId?: string;
  supplier?: Supplier;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  orderDate: string;
  expectedDate?: string;
  receivedAt?: string | null;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export default function PurchaseOrdersPage() {
  // Removed activeTab - only Purchase Order type is supported
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiveRemarks, setReceiveRemarks] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Receive form state
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [currencyRate, setCurrencyRate] = useState<number>(1);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [receiveDiscount, setReceiveDiscount] = useState<number>(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [availableRacks, setAvailableRacks] = useState<any[]>([]);
  const [availableShelves, setAvailableShelves] = useState<any[]>([]);

  // Currency options
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  ];

  const [formData, setFormData] = useState<PurchaseOrder>({
    poNo: '',
    type: 'purchase',
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    status: 'draft',
    subTotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    notes: '',
    items: [],
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchParts();
    fetchSuppliers();
    fetchStores();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPurchaseOrders();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax, formData.discount]);

  useEffect(() => {
    // Recalculate receive items when currency rate changes
    if (receivingPO && receiveItems.length > 0) {
      const updated = receiveItems.map(item => {
        const unitPrice = item.unitPrice || 0;
        const receivedQty = item.receivedQty || item.quantity || 0;
        const purchasePricePKR = unitPrice * currencyRate;
        const costPKR = receivedQty * purchasePricePKR;
        return {
          ...item,
          purchasePricePKR,
          costPKR,
          amount: costPKR,
        };
      });
      setReceiveItems(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyRate]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('type', 'purchase');
      
      const response = await api.get(`/purchase-orders?${params.toString()}`);
      setPurchaseOrders(response.data.purchaseOrders);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      const response = await api.get('/parts?limit=1000&status=A');
      setAvailableParts(response.data.parts);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers?status=A');
      setAvailableSuppliers(response.data.suppliers);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get('/parts-management/getStoredropdown');
      setAvailableStores(response.data.store || []);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const fetchRacks = async (storeId?: string) => {
    try {
      const params = storeId ? `?storeId=${storeId}&status=A` : '?status=A';
      const response = await api.get(`/racks${params}`);
      setAvailableRacks(response.data.racks || []);
    } catch (err) {
      console.error('Failed to fetch racks:', err);
    }
  };

  const fetchShelves = async (rackId?: string) => {
    try {
      const params = rackId ? `?id=${rackId}` : '';
      const response = await api.get(`/parts-management/getShelvesDropdown${params}`);
      setAvailableShelves(response.data.shelves || []);
    } catch (err) {
      console.error('Failed to fetch shelves:', err);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    if (!supplierId) {
      setFormData(prev => ({
        ...prev,
        supplierId: '',
        supplierName: '',
        supplierEmail: '',
        supplierPhone: '',
        supplierAddress: '',
      }));
      return;
    }

    const supplier = availableSuppliers.find(s => s.id === supplierId);
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierEmail: supplier.email || '',
        supplierPhone: supplier.phone || '',
        supplierAddress: [
          supplier.address,
          supplier.city,
          supplier.state,
          supplier.country,
        ].filter(Boolean).join(', '),
      }));
    }
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = formData.discount || 0;
    const tax = formData.tax || 0;
    const totalAmount = subTotal - discount + tax;
    
    setFormData(prev => ({
      ...prev,
      subTotal,
      totalAmount,
    }));
  };

  const addItem = () => {
    if (formData.items.length >= 20) {
      setError('Maximum 20 items allowed per purchase order');
      return;
    }
    // Add new item at the beginning of the array (top of the list)
    setFormData(prev => ({
      ...prev,
      items: [{
        partNo: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        uom: '',
      }, ...prev.items],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    }
    
    // Auto-fill part details if part is selected
    if (field === 'partId' && value) {
      const part = availableParts.find(p => p.id === value);
      if (part) {
        updated[index].partNo = part.partNo;
        updated[index].description = part.description || '';
        updated[index].unitPrice = part.cost || 0;
        updated[index].totalPrice = (updated[index].quantity || 1) * (part.cost || 0);
        updated[index].uom = part.uom || '';
      }
    }
    
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      setError('Please add at least one item to the purchase order');
      return;
    }

    if (formData.items.some(item => !item.partNo || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please fill in all item details correctly');
      return;
    }

    try {
      setLoading(true);
      // Ensure poNo is present for new orders (preview fetch can fail / backend can generate)
      let poNoToSend = formData.poNo;
      if (!selectedPO?.id && (!poNoToSend || poNoToSend.trim() === '')) {
        poNoToSend = await fetchNextPONumber();
      }
      if (!selectedPO?.id && (!poNoToSend || poNoToSend.trim() === '')) {
        setError('Failed to generate PO number. Please try again.');
        return;
      }

      const poData = {
        ...formData,
        poNo: selectedPO?.id ? formData.poNo : poNoToSend,
        type: 'purchase',
        supplierId: formData.supplierId ? formData.supplierId : undefined,
        items: formData.items.map(item => ({
          partId: item.partId || undefined,
          partNo: item.partNo,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          uom: item.uom,
        })),
      };

      if (selectedPO?.id) {
        const response = await api.put(`/purchase-orders/${selectedPO.id}`, poData);
        setSuccess('Purchase order updated successfully');
        setSelectedPO(response.data.purchaseOrder);
      } else {
        const response = await api.post('/purchase-orders', poData);
        setSuccess('Purchase order created successfully');
        setSelectedPO(response.data.purchaseOrder);
      }
      
      await                       resetForm().then(() => {
                        fetchPurchaseOrders();
                      });
      setTimeout(() => setShowForm(false), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setFormData({
      ...po,
      supplierId: po.supplierId || po.supplier?.id || '',
      orderDate: po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDate: po.expectedDate ? new Date(po.expectedDate).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/purchase-orders/${id}`);
      setSuccess('Purchase order deleted successfully');
      if (selectedPO?.id === id) {
        resetForm();
        setShowForm(false);
      }
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete purchase order');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPONumber = async () => {
    try {
      const response = await api.get('/purchase-orders/next-po-number/purchase');
      return response.data.nextPONumber;
    } catch (error) {
      console.error('Failed to fetch next PO number:', error);
      return '';
    }
  };

  const resetForm = async () => {
    const nextPONumber = await fetchNextPONumber();
    setFormData({
      poNo: nextPONumber,
      type: 'purchase',
      supplierId: '',
      supplierName: '',
      supplierEmail: '',
      supplierPhone: '',
      supplierAddress: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      status: 'draft',
      subTotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      notes: '',
      items: [],
    });
    setSelectedPO(null);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-primary-100 text-primary-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.draft;
  };

  const formatDate = (value: any) => {
    if (!value) return '-';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  const handleReceive = async (po: PurchaseOrder) => {
    if (!po.id) return;
    if (po.status === 'received') return;
    // Open receive section (hide list) instead of instantly updating
    setReceivingPO(po);
    setReceiveDate(new Date().toISOString().split('T')[0]);
    setReceiveRemarks(po.notes || '');
    setSelectedCurrency('USD');
    setCurrencyRate(1);
    setSelectedStore('');
    setReceiveDiscount(0);
    setExpenses([]);
    
    // Initialize receive items with PO items and fetch part details
    const items = await Promise.all((po.items || []).map(async (item: any) => {
      // Try to get part details from availableParts or fetch if needed
      let partDetails: any = null;
      if (item.partId) {
        partDetails = availableParts.find(p => p.id === item.partId);
        if (!partDetails) {
          try {
            const partResponse = await api.get(`/parts/${item.partId}`);
            partDetails = partResponse.data.part;
          } catch (err) {
            console.error('Failed to fetch part details:', err);
          }
        }
      }
      
      return {
        ...item,
        partNo: item.partNo || partDetails?.partNo || '',
        description: item.description || partDetails?.description || '',
        application: partDetails?.application || '',
        brand: partDetails?.brand || '',
      receivedQty: item.quantity,
      purchasePricePKR: item.unitPrice * 1, // Will be recalculated when currency rate changes
      salePrice: item.unitPrice * 1.1, // Default 10% markup
      costPKR: item.unitPrice * item.quantity * 1,
      amount: item.unitPrice * item.quantity * 1,
        itemRemarks: '',
        racks: [],
        shelves: [],
      };
    }));
    
    setReceiveItems(items);
    setShowForm(false);
    setViewingPO(null);
    fetchRacks();
    fetchShelves();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateReceiveItem = (index: number, field: string, value: any) => {
    const updated = [...receiveItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate purchasePricePKR, costPKR, and amount
    const unitPrice = updated[index].unitPrice || 0;
    const receivedQty = updated[index].receivedQty || updated[index].quantity || 0;
    const purchasePricePKR = unitPrice * currencyRate;
    const costPKR = receivedQty * purchasePricePKR;
    
    updated[index].purchasePricePKR = purchasePricePKR;
    updated[index].costPKR = costPKR;
    updated[index].amount = costPKR;
    
    setReceiveItems(updated);
  };

  const addExpense = () => {
    setExpenses([...expenses, {
      expenseType: '',
      payableAccount: '',
      description: '',
      amount: 0,
    }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: any) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const calculateReceiveTotals = () => {
    const total = receiveItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalAfterDiscount = total - receiveDiscount;
    const totalInCurrency = currencyRate > 0 ? total / currencyRate : 0;
    const discountInCurrency = currencyRate > 0 ? receiveDiscount / currencyRate : 0;
    const totalAfterDiscountInCurrency = currencyRate > 0 ? totalAfterDiscount / currencyRate : 0;
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    return {
      total,
      totalAfterDiscount,
      totalInCurrency,
      discountInCurrency,
      totalAfterDiscountInCurrency,
      totalExpenses,
    };
  };

  const handleConfirmReceive = async () => {
    if (!receivingPO?.id) return;
    
    try {
      setLoading(true);
      const totals = calculateReceiveTotals();
      
      await api.put(`/purchase-orders/${receivingPO.id}`, {
        status: 'received',
        notes: receiveRemarks,
        receivedAt: receiveDate,
        // Store receive data in notes or extend schema later
        receiveData: {
          store: selectedStore,
          currency: selectedCurrency,
          currencyRate,
          items: receiveItems,
          discount: receiveDiscount,
          expenses,
          totals,
        },
      });
      
      setSuccess('Purchase order received successfully');
      setReceivingPO(null);
      fetchPurchaseOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to receive purchase order');
    } finally {
      setLoading(false);
    }
  };

  // Filter is now handled in the API call, but keep this for client-side filtering if needed
  const filteredPOs = purchaseOrders;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .tab-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-in {
          animation: slideIn 0.4s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
          <p className="text-sm text-gray-500">Manage purchase orders</p>
        </div>
        {receivingPO ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReceivingPO(null);
              setReceiveRemarks('');
              setError('');
              setSuccess('');
            }}
            className="border-gray-300"
          >
            ← Back to List
          </Button>
        ) : (
          <Button
            onClick={() => {
              resetForm().then(() => {
                setShowForm(true);
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-primary-500 hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            + New Purchase Order
          </Button>
        )}
      </div>


      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-sm animate-fade-in">
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md shadow-sm animate-fade-in">
          {success}
        </div>
      )}

      {/* View PO Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Purchase Order Details</CardTitle>
              <Button variant="ghost" onClick={() => setViewingPO(null)}>✕</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">PO No</p>
                  <p className="font-semibold">{viewingPO.poNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="font-semibold">{viewingPO.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold">{viewingPO.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Request Date</p>
                  <p className="font-semibold">{formatDate(viewingPO.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Receive Date</p>
                  <p className="font-semibold">{formatDate((viewingPO as any).receivedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Grand Total</p>
                  <p className="font-semibold">{Number(viewingPO.totalAmount || 0).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Items</p>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-3 py-2">Part No</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingPO.items || []).map((it: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2 font-medium">{it.partNo}</td>
                          <td className="px-3 py-2">{it.quantity}</td>
                          <td className="px-3 py-2">{Number(it.unitPrice || 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{Number(it.totalPrice || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receive PO Section (shows instead of list) */}
      {receivingPO && (
        <Card className="shadow-lg border">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Receive Purchase Order</CardTitle>
              <Button variant="ghost" onClick={() => setReceivingPO(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* PO Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">PO NO</Label>
                  <Input value={receivingPO.poNo} disabled readOnly className="w-full bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">Supplier</Label>
                  <Input value={receivingPO.supplierName} disabled readOnly className="w-full bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">Store</Label>
                  <Select
                    value={selectedStore}
                    onChange={(e) => {
                      setSelectedStore(e.target.value);
                      fetchRacks();
                    }}
                    className="w-full"
                  >
                    <option value="">Select Store...</option>
                    {availableStores.map((store: any) => (
                      <option key={store.id || store.name} value={store.name}>
                        {store.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">Request Date</Label>
                  <Input value={formatDate(receivingPO.orderDate)} disabled readOnly className="w-full bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">Received Date</Label>
                  <Input
                    type="date"
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">Currency</Label>
                  <Select
                    value={selectedCurrency}
                    onChange={(e) => {
                      setSelectedCurrency(e.target.value);
                      // Reset rate to 1 when currency changes
                      setCurrencyRate(1);
                    }}
                    className="w-full"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">
                    {currencies.find(c => c.code === selectedCurrency)?.name || 'Currency'} Rate (PKR)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currencyRate}
                    onChange={(e) => setCurrencyRate(parseFloat(e.target.value) || 1)}
                    className="w-full border-orange-300 focus:border-orange-500"
                    placeholder="Enter rate..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 block">Remarks</Label>
                  <Input
                    value={receiveRemarks}
                    onChange={(e) => setReceiveRemarks(e.target.value)}
                    placeholder="Enter remarks..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-100 p-4 border-b">
                <h3 className="text-lg font-medium text-gray-800">Items</h3>
              </div>
              {receiveItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No items to receive. Please check the purchase order.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-white border-b">
                      <tr className="text-gray-700">
                        <th className="py-3 px-3 text-left font-medium">Item Description</th>
                        <th className="py-3 px-3 text-left font-medium">Remarks</th>
                        <th className="py-3 px-3 text-right font-medium">
                          Price ({currencies.find(c => c.code === selectedCurrency)?.code || 'USD'})
                        </th>
                        <th className="py-3 px-3 text-right font-medium">Purchase Price(PKR)</th>
                        <th className="py-3 px-3 text-right font-medium">Sale Price</th>
                        <th className="py-3 px-3 text-right font-medium">Qty</th>
                        <th className="py-3 px-3 text-right font-medium">Received Qty</th>
                        <th className="py-3 px-3 text-right font-medium">Cost(PKR)</th>
                        <th className="py-3 px-3 text-right font-medium">Amount</th>
                        <th className="py-3 px-3 text-center font-medium">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveItems.map((item: any, idx: number) => {
                        const receivedQty = item.receivedQty || item.quantity || 0;
                        const costPKR = item.costPKR || 0;
                        const costPerPart = receivedQty > 0 ? costPKR / receivedQty : 0;
                        
                        return (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-3 font-medium text-gray-900">
                              {item.partNo || 'N/A'} / {item.application || 'N/A'} / {item.brand || 'N/A'} / {item.description?.substring(0, 30) || '-'}
                            </td>
                            <td className="py-3 px-3">
                              <Input
                                value={item.itemRemarks || ''}
                                onChange={(e) => updateReceiveItem(idx, 'itemRemarks', e.target.value)}
                                placeholder="Enter remarks..."
                                className="w-full text-xs border-gray-300"
                              />
                            </td>
                            <td className="py-3 px-3 text-right font-medium">{Number(item.unitPrice || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-medium">{Number(item.purchasePricePKR || 0).toLocaleString()}</td>
                            <td className="py-3 px-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.salePrice || 0}
                                onChange={(e) => updateReceiveItem(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                                className="w-full text-xs text-right border-gray-300"
                              />
                            </td>
                            <td className="py-3 px-3 text-right font-medium">{item.quantity}</td>
                            <td className="py-3 px-3">
                              <Input
                                type="number"
                                min="0"
                                value={receivedQty}
                                onChange={(e) => updateReceiveItem(idx, 'receivedQty', parseInt(e.target.value) || 0)}
                                className="w-full text-xs text-right border-gray-300"
                              />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="space-y-0.5">
                                <div className="font-medium">{Number(costPKR).toLocaleString()}</div>
                                <div className="text-xs text-gray-600">
                                  {costPerPart > 0 ? Number(costPerPart).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '/Part' : '-'}
                                </div>
                                <div className="text-xs text-gray-600">100%</div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-900">{Number(item.amount || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-center">
                              <Button
                                type="button"
                                onClick={() => {
                                  const updated = receiveItems.filter((_, i) => i !== idx);
                                  setReceiveItems(updated);
                                }}
                                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center p-0"
                                title="Remove item"
                              >
                                <span className="text-lg font-bold">×</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Rack and Shelves Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Rack and Shelves</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Open modal to add new rack
                      alert('Add New Rack functionality - to be implemented');
                    }}
                  >
                    + Add New Rack
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Open modal to add new shelf
                      alert('Add New Shelf functionality - to be implemented');
                    }}
                  >
                    + Add New Shelf
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                    onClick={() => {
                      // TODO: Add rack/shelf to selected item
                      alert('Add Rack/Shelf to item - to be implemented');
                    }}
                  >
                    + Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Totals and Discounts Section */}
            {(() => {
              const totals = calculateReceiveTotals();
              return (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block">Total</Label>
                      <Input value={totals.total.toLocaleString()} disabled readOnly className="w-full bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block">Discount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={receiveDiscount}
                        onChange={(e) => setReceiveDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block">Total after discount</Label>
                      <Input value={totals.totalAfterDiscount.toLocaleString()} disabled readOnly className="w-full bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block">
                        Total ({currencies.find(c => c.code === selectedCurrency)?.code || 'USD'})
                      </Label>
                      <Input value={totals.totalInCurrency.toLocaleString()} disabled readOnly className="w-full bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block">
                        Discount ({currencies.find(c => c.code === selectedCurrency)?.code || 'USD'})
                      </Label>
                      <Input value={totals.discountInCurrency.toLocaleString()} disabled readOnly className="w-full bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block">
                        Total after discount ({currencies.find(c => c.code === selectedCurrency)?.code || 'USD'})
                      </Label>
                      <Input value={totals.totalAfterDiscountInCurrency.toLocaleString()} disabled readOnly className="w-full bg-white" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Expenses Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">Expense Type</h3>
                <Button
                  type="button"
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                  size="sm"
                  onClick={addExpense}
                >
                  + Add New Expense
                </Button>
              </div>
              <div className="p-4 space-y-3">
                {expenses.map((expense, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Expense Type</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={expense.expenseType}
                          onChange={(e) => updateExpense(idx, 'expenseType', e.target.value)}
                          className="flex-1"
                        >
                          <option value="">Select...</option>
                          <option value="Shipping Cost">Shipping Cost</option>
                          <option value="Customs">Customs</option>
                          <option value="Handling">Handling</option>
                          <option value="Other">Other</option>
                        </Select>
                        {expense.expenseType && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateExpense(idx, 'expenseType', '')}
                            className="p-1"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Payable Account</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={expense.payableAccount}
                          onChange={(e) => updateExpense(idx, 'payableAccount', e.target.value)}
                          className="flex-1"
                        >
                          <option value="">Select...</option>
                          <option value="302006-SHIPPING ACCOUNT">302006-SHIPPING ACCOUNT</option>
                          <option value="302007-CUSTOMS ACCOUNT">302007-CUSTOMS ACCOUNT</option>
                          <option value="302008-HANDLING ACCOUNT">302008-HANDLING ACCOUNT</option>
                        </Select>
                        {expense.payableAccount && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateExpense(idx, 'payableAccount', '')}
                            className="p-1"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Description</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={expense.description}
                          onChange={(e) => updateExpense(idx, 'description', e.target.value)}
                          placeholder="Enter description..."
                          className="flex-1"
                        />
                        {expense.description && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expense.amount}
                        onChange={(e) => updateExpense(idx, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={() => removeExpense(idx)}
                        className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No expenses added. Click "+ Add New Expense" to add one.
                  </div>
                )}
                {expenses.length > 0 && (
                  <div className="flex justify-end pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-gray-700">Total Expenses:</Label>
                      <span className="text-lg font-semibold">{calculateReceiveTotals().totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceivingPO(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={handleConfirmReceive}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Receive'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && !receivingPO && (
        <Card className="shadow-lg border-2 border-primary-200 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {selectedPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}
              </CardTitle>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main Purchase Order Fields - Professional Single Line Layout */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-4 gap-6 items-start">
                  <div className="space-y-2">
                    <Label htmlFor="poNo" className="text-sm font-medium text-gray-700 block">
                      PO NO
                    </Label>
                    <Input
                      id="poNo"
                      value={formData.poNo}
                      disabled
                      readOnly
                      className="w-full bg-gray-100 cursor-not-allowed"
                      title="PO Number is auto-generated and cannot be edited"
                      placeholder="Loading..."
                    />
                    <p className="text-xs text-gray-500">Auto-generated</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supplierId" className="text-sm font-medium text-gray-700 block">
                      Supplier
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        id="supplierId"
                        value={formData.supplierId || ''}
                        onChange={(e) => handleSupplierChange(e.target.value)}
                        className="flex-1"
                        required
                      >
                        <option value="">Select...</option>
                        {availableSuppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <p className="text-xs text-red-500">Required</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orderDate" className="text-sm font-medium text-gray-700 block">
                      Request Date
                    </Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 block">
                      Remarks
                    </Label>
                    <Input
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter remarks..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Item Parts Section - Professional Table Layout */}
              <div className="mt-8">
                <div className="bg-white border rounded-lg overflow-hidden">
                  {/* Table Header with Add New Item Button */}
                  <div className="bg-gray-100 p-4 border-b">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-800">Item Parts</h3>
                      <Button 
                        type="button" 
                        onClick={addItem} 
                        disabled={formData.items.length >= 20}
                        className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-lg"
                      >
                        + Add New Item
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 font-medium text-gray-700 text-sm">
                      <div>Item Parts</div>
                      <div>Quantity</div>
                      <div>Remarks</div>
                      <div className="text-center">Remove</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50 transition-colors">
                        <div>
                          <Select
                            value={item.partId || ''}
                            onChange={(e) => updateItem(index, 'partId', e.target.value)}
                            className="w-full"
                          >
                            <option value="">Select...</option>
                            {availableParts.map((part) => (
                              <option key={part.id} value={part.id}>
                                {[
                                  part.partNo,
                                  part.application,
                                  part.brand,
                                  part.description ? part.description.substring(0, 40) : undefined,
                                ]
                                  .filter(Boolean)
                                  .join(' - ') || 'No part info'}
                              </option>
                            ))}
                          </Select>
                          <p className="text-xs text-red-500 mt-1">Required!</p>
                        </div>
                        
                        <div>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                            className="w-full"
                            placeholder="1"
                          />
                        </div>
                        
                        <div>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Enter remarks..."
                            className="w-full bg-green-50 border-green-200 focus:bg-green-100 focus:border-green-300"
                          />
                        </div>
                        
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 font-bold text-lg flex items-center justify-center"
                            title="Remove item"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {formData.items.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p>No items added yet</p>
                        <p className="text-sm">Click "Add New Item" to add items to this purchase order</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Information */}
                {formData.items.length >= 20 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">Maximum 20 items allowed per purchase order</p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Professional Layout */}
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {formData.items.length === 0 ? (
                    "Please add at least one item to save the purchase order"
                  ) : (
                    `${formData.items.length} item${formData.items.length > 1 ? 's' : ''} added`
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    onClick={() => {
                      resetForm();
                      setError('');
                      setSuccess('');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-lg border-0"
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || formData.items.length === 0 || !formData.supplierId} 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg border-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Purchase Orders List */}
      {!receivingPO && (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>All Purchase Orders ({filteredPOs.length})</CardTitle>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[150px]"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading && !purchaseOrders.length ? (
            <div className="text-center py-12 text-gray-500">Loading purchase orders...</div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter ? 'No purchase orders found matching your filters.' : 'No purchase orders found. Create one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-700">
                    <th className="py-3 px-3 w-10">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th className="py-3 px-3">S.NO</th>
                    <th className="py-3 px-3">PO.No</th>
                    <th className="py-3 px-3">Suppliers</th>
                    <th className="py-3 px-3">Store</th>
                    <th className="py-3 px-3">Request Date</th>
                    <th className="py-3 px-3">Receive Date</th>
                    <th className="py-3 px-3">Grand Total</th>
                    <th className="py-3 px-3">Remarks</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po, idx) => (
                    <tr key={po.id || idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <input type="checkbox" aria-label={`Select ${po.poNo}`} />
                      </td>
                      <td className="py-3 px-3">{idx + 1}</td>
                      <td className="py-3 px-3 font-medium">{po.poNo}</td>
                      <td className="py-3 px-3">{po.supplierName}</td>
                      <td className="py-3 px-3">{(po as any).store || po.supplierAddress || '-'}</td>
                      <td className="py-3 px-3">{formatDate(po.orderDate)}</td>
                      <td className="py-3 px-3">{formatDate((po as any).receivedAt)}</td>
                      <td className="py-3 px-3 font-semibold">{Number(po.totalAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3">{po.notes || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingPO(po)}
                            title="View"
                            className="px-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(po)}
                            className="hover:bg-primary-50 hover:border-primary-300 transition-colors"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => po.id && handleDelete(po.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleReceive(po)}
                            disabled={po.status === 'received'}
                            className={
                              po.status === 'received'
                                ? 'bg-green-600 hover:bg-green-600 text-white px-4'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-black px-4'
                            }
                          >
                            {po.status === 'received' ? 'Received' : 'Receive'}
                          </Button>
                          <Button variant="outline" size="sm" title="More" className="px-2">
                            ⋮
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

