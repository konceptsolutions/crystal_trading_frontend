'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import AnimatedSelect from '@/components/ui/animated-select';
import { useToast } from '@/components/ui/toast-provider';
import api from '@/lib/api';
import { Part } from '@/components/inventory/PartForm';
import PurchaseOrderDetailsModal from '@/components/purchase-orders/PurchaseOrderDetailsModal';

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

export interface DirectPurchaseOrder {
  id?: string;
  poNo: string;
  type: 'direct';
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
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'other';
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export default function DirectPurchaseOrdersPage() {
  const { showToast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<DirectPurchaseOrder[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [availableRacks, setAvailableRacks] = useState<any[]>([]);
  const [availableShelves, setAvailableShelves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPO, setSelectedPO] = useState<DirectPurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<DirectPurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<DirectPurchaseOrder | null>(null);
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiveRemarks, setReceiveRemarks] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Rack / Shelf assignment state
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');
  const [isAddRackOpen, setIsAddRackOpen] = useState(false);
  const [isAddShelfOpen, setIsAddShelfOpen] = useState(false);
  const [newRackNumber, setNewRackNumber] = useState('');
  const [newRackDescription, setNewRackDescription] = useState('');
  const [newShelfNumber, setNewShelfNumber] = useState('');
  const [newShelfDescription, setNewShelfDescription] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [rackShelfAllocations, setRackShelfAllocations] = useState<{ [key: number]: { rackId: string; shelfId: string; quantity: number; rackNo: string; shelfNo: string }[] }>({});
  const [allocationQuantity, setAllocationQuantity] = useState<{ [key: number]: number }>({});

  const [formData, setFormData] = useState<DirectPurchaseOrder>({
    poNo: '',
    type: 'direct',
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    status: 'draft',
    paymentMethod: undefined,
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


  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('type', 'direct');
      
      const response = await api.get(`/purchase-orders?${params.toString()}`);
      setPurchaseOrders(response.data.purchaseOrders || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch direct purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      const response = await api.get('/parts?limit=1000&status=A');
      setAvailableParts(response.data.parts || []);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers?status=A');
      setAvailableSuppliers(response.data.suppliers || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores?status=A');
      setAvailableStores(response.data.stores || []);
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
      const params = rackId ? `?rackId=${encodeURIComponent(rackId)}&status=A` : '?status=A';
      const response = await api.get(`/shelves${params}`);
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
      setError('Maximum 20 items allowed per direct purchase order');
      return;
    }
    // Add new item at the beginning of the array (top of the list)
    setFormData(prev => ({
      ...prev,
      items: [{
        partNo: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        uom: 'NOS',
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
        // Do NOT auto-fill purchase price from Part Entry.
        // Admin will enter the original purchase price manually.
        updated[index].totalPrice = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
        updated[index].uom = part.uom || 'NOS';
      }
    }
    
    setFormData(prev => ({ ...prev, items: updated }));
    calculateTotals();
  };

  const addRackShelfAllocation = (itemIndex: number) => {
    if (!selectedRackId || !selectedShelfId) {
      showToast('Please select both rack and shelf', 'error');
      return;
    }
    const qty = allocationQuantity[itemIndex] || 0;
    if (qty <= 0) {
      showToast('Please enter a quantity', 'error');
      return;
    }
    
    const item = formData.items[itemIndex];
    const allocatedQty = (rackShelfAllocations[itemIndex] || []).reduce((sum, alloc) => sum + alloc.quantity, 0);
    const remainingQty = item.quantity - allocatedQty;
    
    if (qty > remainingQty) {
      showToast(`Only ${remainingQty} quantity remaining to allocate`, 'error');
      return;
    }

    const rack = availableRacks.find((r: any) => String(r.id) === String(selectedRackId));
    const shelf = availableShelves.find((s: any) => String(s.id) === String(selectedShelfId));
    const rackNo = rack?.rackNumber || rack?.rack_number || rack?.name || '';
    const shelfNo = shelf?.shelfNumber || shelf?.shelf_number || shelf?.name || '';

    setRackShelfAllocations(prev => ({
      ...prev,
      [itemIndex]: [
        ...(prev[itemIndex] || []),
        {
          rackId: selectedRackId,
          shelfId: selectedShelfId,
          quantity: qty,
          rackNo,
          shelfNo,
        },
      ],
    }));
    setAllocationQuantity(prev => ({ ...prev, [itemIndex]: 0 }));
    setSelectedRackId('');
    setSelectedShelfId('');
    setSelectedItemIndex(null);
  };

  const removeRackShelfAllocation = (itemIndex: number, allocIndex: number) => {
    setRackShelfAllocations(prev => {
      const updated = { ...prev };
      if (updated[itemIndex]) {
        updated[itemIndex] = updated[itemIndex].filter((_, i) => i !== allocIndex);
        if (updated[itemIndex].length === 0) {
          delete updated[itemIndex];
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      const msg = 'Please add at least one item to the direct purchase order';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (formData.items.some(item => !item.partNo || item.quantity <= 0 || item.unitPrice < 0)) {
      const msg = 'Please fill in all item details correctly';
      setError(msg);
      showToast(msg, 'error');
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
        type: 'direct',
        supplierId: formData.supplierId ? formData.supplierId : undefined,
        // Backend requires non-null values
        paymentMethod: (formData as any).paymentMethod || 'cash',
        notes: (formData.notes ?? '').toString(),
        items: formData.items.map(item => ({
          partId: item.partId || undefined,
          partNo: item.partNo,
          // Backend expects string (not null)
          description: (item.description ?? '').toString(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          uom:
            item.uom?.toString().trim() ||
            availableParts.find(p => p.id === item.partId)?.uom ||
            'NOS',
        })),
      };

      if (selectedPO?.id) {
        const response = await api.put(`/purchase-orders/${selectedPO.id}`, poData);
        setSuccess('Direct purchase order updated successfully');
        showToast('Direct purchase order updated successfully', 'success');
        setSelectedPO(response.data.purchaseOrder);
      } else {
        const response = await api.post('/purchase-orders', poData);
        setSuccess('Direct purchase order created successfully');
        showToast('Direct purchase order created successfully', 'success');
        setSelectedPO(response.data.purchaseOrder);
      }
      
      await resetForm().then(() => {
        fetchPurchaseOrders();
      });
      setTimeout(() => setShowForm(false), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save direct purchase order');
      showToast(err.response?.data?.error || 'Failed to save direct purchase order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (po: DirectPurchaseOrder) => {
    setSelectedPO(po);
    setFormData({
      ...po,
      supplierId: po.supplierId || po.supplier?.id || '',
      orderDate: po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDate: po.expectedDate ? new Date(po.expectedDate).toISOString().split('T')[0] : '',
      paymentMethod: (po as any).paymentMethod || 'cash',
      notes: (po.notes ?? '').toString(),
      items: (po.items || []).map((it: any) => ({
        ...it,
        description: (it?.description ?? '').toString(),
        uom: (it?.uom ?? 'NOS').toString(),
      })),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this direct purchase order?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/purchase-orders/${id}`);
      setSuccess('Direct purchase order deleted successfully');
      if (selectedPO?.id === id) {
        resetForm();
        setShowForm(false);
      }
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete direct purchase order');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPONumber = async () => {
    try {
      const response = await api.get('/purchase-orders/next-po-number/direct');
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
      type: 'direct',
      supplierId: '',
      supplierName: '',
      supplierEmail: '',
      supplierPhone: '',
      supplierAddress: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      status: 'draft',
      paymentMethod: undefined,
      subTotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      notes: '',
      items: [],
    });
    setSelectedPO(null);
    setSelectedStore('');
    setSelectedRackId('');
    setSelectedShelfId('');
    setRackShelfAllocations({});
    setAllocationQuantity({});
    setSelectedItemIndex(null);
    setIsAddRackOpen(false);
    setIsAddShelfOpen(false);
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

  const handleReceive = async (po: DirectPurchaseOrder) => {
    if (!po.id) return;
    if (po.status === 'received') return;
    setReceivingPO(po);
    setReceiveDate(new Date().toISOString().split('T')[0]);
    setReceiveRemarks(po.notes || '');
    setShowForm(false);
    setViewingPO(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      <div className="flex flex-wrap items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Direct Purchase Orders</h1>
          <p className="text-sm text-gray-500">Manage direct purchase orders</p>
        </div>
        {/* Start from the left (same line/margin as table), not anchored to the right */}
        <div className="w-full flex justify-start">
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
              + New Direct Purchase Order
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-sm animate-fade-in">
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}

      {/* Success is shown via top-right toast now (no inline banner) */}

      {/* View PO Modal */}
      {viewingPO && (
        <PurchaseOrderDetailsModal po={viewingPO} onClose={() => setViewingPO(null)} title="Direct Purchase Order Details" />
      )}

      {/* Receive PO Section (shows instead of list) */}
      {receivingPO && (
        <Card className="shadow-lg border">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Receive Direct Purchase Order</CardTitle>
              <Button variant="ghost" onClick={() => setReceivingPO(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
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

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-4 border-b">
                <h3 className="text-lg font-medium text-gray-800">Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr className="border-b text-gray-700">
                      <th className="py-3 px-3 text-left">Part No</th>
                      <th className="py-3 px-3 text-left">Description</th>
                      <th className="py-3 px-3 text-right">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receivingPO.items || []).map((it: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-3 px-3 font-medium">{it.partNo}</td>
                        <td className="py-3 px-3">{it.description || '-'}</td>
                        <td className="py-3 px-3 text-right">{it.quantity}</td>
                        <td className="py-3 px-3 text-right">{Number(it.unitPrice || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-semibold">{Number(it.totalPrice || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                onClick={async () => {
                  if (!receivingPO.id) return;
                  try {
                    setLoading(true);
                    await api.put(`/purchase-orders/${receivingPO.id}`, {
                      status: 'received',
                      notes: receiveRemarks,
                    });
                    setSuccess('Direct purchase order received successfully');
                    setReceivingPO(null);
                    fetchPurchaseOrders();
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to receive direct purchase order');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processing...' : 'Receive'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form - Inline (not modal) */}
      {showForm && !receivingPO && (
        <Card className="shadow-lg border-2 border-primary-200 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {selectedPO ? 'Edit Direct Purchase Order' : 'Add Direct Purchase Order'}
              </CardTitle>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Order Details Section */}
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orderDate" className="text-sm font-medium text-gray-700 block">
                      Request Date
                    </Label>
                    <DatePicker
                      value={formData.orderDate || undefined}
                      onChange={(v) => setFormData({ ...formData, orderDate: v || '' })}
                      placeholder="Select date"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="store" className="text-sm font-medium text-gray-700 block">
                      Store
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        id="store"
                        value={selectedStore}
                        onChange={(e) => {
                          const storeId = e.target.value;
                          setSelectedStore(storeId);
                          setSelectedRackId('');
                          setSelectedShelfId('');
                          setAvailableShelves([]);
                          if (storeId) {
                            fetchRacks(storeId);
                          } else {
                            setAvailableRacks([]);
                          }
                        }}
                        className="flex-1"
                      >
                        <option value="">Select...</option>
                        {availableStores.map((store: any) => (
                          <option key={store.id || store.name} value={String(store.id || store.name)}>
                            {store.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 block">
                      Description
                    </Label>
                    <Input
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter description..."
                      className="w-full"
                    />
                    <span className="text-green-500 text-xs">✓</span>
                  </div>
                </div>
              </div>

              {/* Item Parts Section */}
              <div className="mt-6">
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-4 border-b">
                    <h3 className="text-lg font-medium text-gray-800">Item Parts</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-5 gap-4 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Item</Label>
                            <div className="flex gap-2">
                              <Select
                                value={item.partId || ''}
                                onChange={(e) => updateItem(index, 'partId', e.target.value)}
                                className="flex-1"
                              >
                                <option value="">Select...</option>
                                {availableParts.map((part) => (
                                  <option key={part.id} value={part.id}>
                                    {[
                                      part.partNo,
                                      part.application,
                                      part.brand,
                                    ]
                                      .filter(Boolean)
                                      .join('/') || 'No part info'}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              required
                              className="w-full"
                              placeholder="1"
                            />
                            <span className="text-green-500 text-xs">✓</span>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Rate</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full"
                              placeholder="0.00"
                            />
                            <span className="text-green-500 text-xs">✓</span>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">Total</Label>
                            <Input
                              value={item.totalPrice.toFixed(2)}
                              readOnly
                              disabled
                              className="w-full bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                          
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center p-0"
                              title="Remove item"
                            >
                              <span className="text-lg font-bold">×</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {formData.items.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <p>No items added yet</p>
                        <p className="text-sm">Click "Add New Item" to add items</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rack and Shelves Section */}
              <div className="mt-6 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Rack and Shelves</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddRackOpen((v) => !v);
                        setIsAddShelfOpen(false);
                      }}
                    >
                      + Add New Rack
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddShelfOpen((v) => !v);
                        setIsAddRackOpen(false);
                      }}
                    >
                      + Add New Shelf
                    </Button>
                  </div>
                </div>

                {/* Inline Add Rack */}
                {isAddRackOpen && (
                  <div className="mb-4 rounded-lg border bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-gray-900">Add New Rack</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddRackOpen(false);
                          setNewRackNumber('');
                          setNewRackDescription('');
                        }}
                        className="px-2"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Store *</Label>
                        <Select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="w-full">
                          <option value="">Select Store...</option>
                          {availableStores.map((store: any) => (
                            <option key={store.id || store.name} value={String(store.id || store.name)}>
                              {store.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Rack Number *</Label>
                        <Input value={newRackNumber} onChange={(e) => setNewRackNumber(e.target.value)} placeholder="e.g. R001" className="w-full" />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label className="text-xs font-medium text-gray-700">Description</Label>
                        <Textarea value={newRackDescription} onChange={(e) => setNewRackDescription(e.target.value)} rows={2} className="w-full resize-y" />
                      </div>
                      <div className="md:col-span-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewRackNumber('');
                            setNewRackDescription('');
                            setIsAddRackOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!selectedStore) {
                              showToast('Please select a store.', 'error');
                              return;
                            }
                            if (!newRackNumber.trim()) {
                              showToast('Rack number is required.', 'error');
                              return;
                            }
                            try {
                              setLoading(true);
                              const resp = await api.post('/racks', {
                                rackNumber: newRackNumber.trim(),
                                storeId: String(selectedStore),
                                description: newRackDescription.trim() || undefined,
                                status: 'A',
                              });
                              const created = resp.data?.rack;
                              await fetchRacks(String(selectedStore));
                              if (created?.id) setSelectedRackId(String(created.id));
                              setNewRackNumber('');
                              setNewRackDescription('');
                              setIsAddRackOpen(false);
                              showToast('Rack created successfully', 'success');
                            } catch (err: any) {
                              showToast(err?.response?.data?.error || 'Failed to create rack', 'error');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="bg-primary-500 hover:bg-primary-600 text-white"
                        >
                          {loading ? 'Saving...' : 'Save Rack'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Add Shelf */}
                {isAddShelfOpen && (
                  <div className="mb-4 rounded-lg border bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-gray-900">Add New Shelf</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddShelfOpen(false);
                          setNewShelfNumber('');
                          setNewShelfDescription('');
                        }}
                        className="px-2"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Rack *</Label>
                        <Select
                          value={selectedRackId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedRackId(v);
                            setSelectedShelfId('');
                            if (v) fetchShelves(v);
                          }}
                          className="w-full"
                        >
                          <option value="">Select Rack...</option>
                          {(availableRacks || []).map((r: any) => (
                            <option key={r.id} value={String(r.id)}>
                              {r.rackNumber || r.rack_number || r.name || r.id}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Shelf Number *</Label>
                        <Input value={newShelfNumber} onChange={(e) => setNewShelfNumber(e.target.value)} placeholder="e.g. S001" className="w-full" />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label className="text-xs font-medium text-gray-700">Description</Label>
                        <Textarea value={newShelfDescription} onChange={(e) => setNewShelfDescription(e.target.value)} rows={2} className="w-full resize-y" />
                      </div>
                      <div className="md:col-span-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewShelfNumber('');
                            setNewShelfDescription('');
                            setIsAddShelfOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!selectedRackId) {
                              showToast('Please select a rack.', 'error');
                              return;
                            }
                            if (!newShelfNumber.trim()) {
                              showToast('Shelf number is required.', 'error');
                              return;
                            }
                            try {
                              setLoading(true);
                              const resp = await api.post('/shelves', {
                                shelfNumber: newShelfNumber.trim(),
                                rackId: String(selectedRackId),
                                description: newShelfDescription.trim() || undefined,
                                status: 'A',
                              });
                              const created = resp.data?.shelf;
                              await fetchShelves(String(selectedRackId));
                              if (created?.id) setSelectedShelfId(String(created.id));
                              setNewShelfNumber('');
                              setNewShelfDescription('');
                              setIsAddShelfOpen(false);
                              showToast('Shelf created successfully', 'success');
                            } catch (err: any) {
                              showToast(err?.response?.data?.error || 'Failed to create shelf', 'error');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="bg-primary-500 hover:bg-primary-600 text-white"
                        >
                          {loading ? 'Saving...' : 'Save Shelf'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rack/Shelf Allocation */}
                {formData.items.length > 0 && selectedItemIndex !== null && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Item: {formData.items[selectedItemIndex]?.partNo || `Item ${selectedItemIndex + 1}`}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Rack</Label>
                        <Select
                          value={selectedRackId}
                          onChange={(e) => {
                            const nextRackId = e.target.value;
                            setSelectedRackId(nextRackId);
                            setSelectedShelfId('');
                            if (nextRackId) fetchShelves(nextRackId);
                            else setAvailableShelves([]);
                          }}
                          className="w-full"
                        >
                          <option value="">Select Rack...</option>
                          {(availableRacks || []).map((r: any) => (
                            <option key={r.id} value={String(r.id)}>
                              {r.rackNumber || r.rack_number || r.name || r.id}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Shelf</Label>
                        <Select
                          value={selectedShelfId}
                          onChange={(e) => setSelectedShelfId(e.target.value)}
                          className="w-full"
                          disabled={!selectedRackId}
                        >
                          <option value="">{selectedRackId ? 'Select Shelf...' : 'Select rack first'}</option>
                          {(availableShelves || []).map((s: any) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.shelfNumber || s.shelf_number || s.name || s.id}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          max={formData.items[selectedItemIndex]?.quantity - ((rackShelfAllocations[selectedItemIndex] || []).reduce((sum, alloc) => sum + alloc.quantity, 0))}
                          value={allocationQuantity[selectedItemIndex] || ''}
                          onChange={(e) => setAllocationQuantity(prev => ({ ...prev, [selectedItemIndex]: parseInt(e.target.value) || 0 }))}
                          className="w-full"
                          placeholder="Qty"
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          size="sm"
                          onClick={() => addRackShelfAllocation(selectedItemIndex)}
                        >
                          + Add
                        </Button>
                      </div>
                    </div>
                    {/* Display allocations for selected item */}
                    {rackShelfAllocations[selectedItemIndex] && rackShelfAllocations[selectedItemIndex].length > 0 && (
                      <div className="mt-3 space-y-2">
                        {rackShelfAllocations[selectedItemIndex].map((alloc, allocIndex) => (
                          <div key={allocIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">
                              {alloc.rackNo} / {alloc.shelfNo} - Qty: {alloc.quantity}
                            </span>
                            <Button
                              type="button"
                              onClick={() => removeRackShelfAllocation(selectedItemIndex, allocIndex)}
                              className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs p-0"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Item selector for rack/shelf allocation */}
                {formData.items.length > 0 && selectedItemIndex === null && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-2">Select an item to assign rack and shelf:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {formData.items.map((item, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItemIndex(idx);
                            setSelectedRackId('');
                            setSelectedShelfId('');
                            setAvailableShelves([]);
                            if (selectedStore) fetchRacks(selectedStore);
                          }}
                        >
                          {item.partNo || `Item ${idx + 1}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add New Item Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={addItem}
                  disabled={formData.items.length >= 20}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-lg border-0"
                >
                  + Add New Item
                </Button>
              </div>

              {/* Account and Total Section */}
              <div className="flex justify-end gap-6 items-end">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 block">
                    Account
                  </Label>
                  <Select
                    id="paymentMethod"
                    value={formData.paymentMethod || ''}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any || undefined })}
                    className="w-full"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </Select>
                  <p className="text-xs text-red-500">Required</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmount" className="text-sm font-medium text-gray-700 block">
                    Total
                  </Label>
                  <Input
                    id="totalAmount"
                    value={formData.totalAmount.toFixed(2)}
                    readOnly
                    disabled
                    className="w-full bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setError('');
                    setSuccess('');
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-lg border-0"
                >
                  Reset
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading || formData.items.length === 0 || !formData.paymentMethod}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg border-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Close
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Direct Purchase Orders List */}
      {!receivingPO && (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle>All Direct Purchase Orders ({filteredPOs.length})</CardTitle>
            {/* Start filters from the left (same line/margin as table) */}
            <div className="w-full flex flex-wrap items-center justify-start gap-2">
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <AnimatedSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="All Status"
                className="w-full sm:w-[180px]"
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'received', label: 'Received' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading && !purchaseOrders.length ? (
            <div className="text-center py-12 text-gray-500">Loading direct purchase orders...</div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter ? 'No direct purchase orders found matching your filters.' : 'No direct purchase orders found. Create one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-hidden">
              <table className="w-full table-fixed text-xs sm:text-sm">
                <colgroup>
                  <col className="w-8" /> {/* checkbox */}
                  <col className="w-12" /> {/* S.NO */}
                  <col className="w-28" /> {/* PO.No */}
                  <col className="w-32" /> {/* Suppliers */}
                  <col className="hidden lg:table-cell w-[280px]" /> {/* Store */}
                  <col className="w-28" /> {/* Request Date */}
                  <col className="w-28" /> {/* Receive Date */}
                  <col className="w-24" /> {/* Grand Total */}
                  <col className="hidden lg:table-cell w-40" /> {/* Remarks */}
                  <col className="w-[340px]" /> {/* Actions */}
                </colgroup>
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-700">
                    <th className="py-2 px-2 sm:py-3 sm:px-3 w-8">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">S.NO</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">PO.No</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Suppliers</th>
                    <th className="hidden lg:table-cell py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Store</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Request Date</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Receive Date</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Grand Total</th>
                    <th className="hidden lg:table-cell py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Remarks</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po, idx) => (
                    <tr key={po.id || idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 sm:py-3 sm:px-3">
                        <input type="checkbox" aria-label={`Select ${po.poNo}`} />
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">{idx + 1}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-3 text-center font-medium whitespace-nowrap">{po.poNo}</td>
                      <td
                        className="py-2 px-2 sm:py-3 sm:px-3 text-center truncate max-w-[120px] sm:max-w-[160px]"
                        title={po.supplierName || ''}
                      >
                        {po.supplierName}
                      </td>
                      <td
                        className="hidden lg:table-cell py-2 px-2 sm:py-3 sm:px-3 text-center truncate max-w-[220px]"
                        title={String((po as any).store || po.supplierAddress || '-')}
                      >
                        {(po as any).store || po.supplierAddress || '-'}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">{formatDate(po.orderDate)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap">{formatDate((po as any).receivedAt)}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-3 text-center font-semibold whitespace-nowrap">
                        {Number(po.totalAmount || 0).toLocaleString()}
                      </td>
                      <td
                        className="hidden lg:table-cell py-2 px-2 sm:py-3 sm:px-3 text-center truncate max-w-[140px]"
                        title={po.notes || ''}
                      >
                        {po.notes || '-'}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-3 text-left align-top whitespace-nowrap">
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-start gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setViewingPO(po)}
                            title="View"
                            className="w-9 px-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleEdit(po)}
                            className="px-3 hover:bg-primary-50 hover:border-primary-300 transition-colors"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => po.id && handleDelete(po.id)}
                            className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            onClick={() => handleReceive(po)}
                            disabled={po.status === 'received'}
                            className={
                              po.status === 'received'
                                ? 'bg-green-600 hover:bg-green-600 text-white px-3'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-black px-3'
                            }
                          >
                            {po.status === 'received' ? 'Received' : 'Receive'}
                          </Button>
                          <Button variant="outline" size="xs" title="More" className="w-9 px-0">
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