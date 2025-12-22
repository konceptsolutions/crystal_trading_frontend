'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface ChallanItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  orderedQty: number;
  dispatchedQty: number;
  deliveredQty: number;
  pendingQty: number;
  uom?: string;
  remarks?: string;
}

export interface DeliveryChallan {
  id?: string;
  challanNo: string;
  orderId?: string;
  orderNo?: string;
  invoiceId?: string;
  invoiceNo?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryDate: string;
  dispatchDate?: string;
  actualDeliveryDate?: string;
  deliveryAddress: string;
  vehicleNo?: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  transporterName?: string;
  status: 'draft' | 'ready' | 'dispatched' | 'in_transit' | 'delivered' | 'partial' | 'returned' | 'cancelled';
  dispatchedBy?: string;
  deliveryConfirmedBy?: string;
  receiverName?: string;
  receiverSignature?: string;
  deliveryProof?: string;
  items: ChallanItem[];
  totalPackages?: number;
  totalWeight?: number;
  notes?: string;
  dispatchNotes?: string;
  deliveryNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DeliveryChallan() {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tracking'>('list');

  const [formData, setFormData] = useState<DeliveryChallan>({
    challanNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryAddress: '',
    vehicleNo: '',
    vehicleType: '',
    driverName: '',
    driverPhone: '',
    transporterName: '',
    status: 'draft',
    items: [],
    totalPackages: 0,
    totalWeight: 0,
    notes: '',
    dispatchNotes: '',
    deliveryNotes: '',
  });

  const [dispatchData, setDispatchData] = useState({
    dispatchDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    vehicleType: 'truck',
    driverName: '',
    driverPhone: '',
    transporterName: '',
    dispatchedBy: '',
    dispatchNotes: '',
    items: [] as { itemId: string; dispatchedQty: number }[],
  });

  const [deliveryData, setDeliveryData] = useState({
    actualDeliveryDate: new Date().toISOString().split('T')[0],
    receiverName: '',
    deliveryConfirmedBy: '',
    deliveryNotes: '',
    items: [] as { itemId: string; deliveredQty: number; remarks: string }[],
  });

  const [parts, setParts] = useState<any[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchChallans();
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

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/delivery-challans');
      const challansData = response.data.challans || [];
      const transformedChallans = challansData.map((c: any) => ({
        ...c,
        deliveryDate: c.deliveryDate ? new Date(c.deliveryDate).toISOString().split('T')[0] : '',
        dispatchDate: c.dispatchDate ? new Date(c.dispatchDate).toISOString().split('T')[0] : '',
        actualDeliveryDate: c.actualDeliveryDate ? new Date(c.actualDeliveryDate).toISOString().split('T')[0] : '',
        items: c.items || [],
      }));
      setChallans(transformedChallans);
    } catch (error: any) {
      console.error('Failed to fetch challans:', error);
      // Demo data
      setChallans([
        {
          id: '1',
          challanNo: 'DC-2025-001',
          orderNo: 'SO-2025-001',
          customerName: 'ABC Trading Co.',
          customerPhone: '0300-1234567',
          deliveryDate: '2025-12-12',
          dispatchDate: '2025-12-11',
          deliveryAddress: 'Plot 45, Industrial Area, Karachi',
          vehicleNo: 'ABC-123',
          vehicleType: 'truck',
          driverName: 'Ali Khan',
          driverPhone: '0312-1234567',
          status: 'dispatched',
          items: [
            { partNo: 'BRK-001', description: 'Brake Pads', orderedQty: 10, dispatchedQty: 10, deliveredQty: 0, pendingQty: 10 },
            { partNo: 'OIL-002', description: 'Engine Oil', orderedQty: 50, dispatchedQty: 50, deliveredQty: 0, pendingQty: 50 },
          ],
          totalPackages: 5,
          totalWeight: 120,
        },
        {
          id: '2',
          challanNo: 'DC-2025-002',
          orderNo: 'SO-2025-002',
          customerName: 'XYZ Retailers',
          customerPhone: '0321-7654321',
          deliveryDate: '2025-12-13',
          deliveryAddress: 'Shop 12, Main Market, Lahore',
          vehicleNo: '',
          driverName: '',
          status: 'ready',
          items: [
            { partNo: 'FLT-001', description: 'Air Filter', orderedQty: 20, dispatchedQty: 0, deliveredQty: 0, pendingQty: 20 },
          ],
          totalPackages: 2,
          totalWeight: 25,
        },
        {
          id: '3',
          challanNo: 'DC-2025-003',
          orderNo: 'SO-2025-003',
          customerName: 'Regional Auto Parts',
          customerPhone: '0333-9876543',
          deliveryDate: '2025-12-10',
          dispatchDate: '2025-12-09',
          actualDeliveryDate: '2025-12-10',
          deliveryAddress: 'Warehouse 5, SITE Area, Hyderabad',
          vehicleNo: 'XYZ-456',
          vehicleType: 'pickup',
          driverName: 'Usman Ahmed',
          driverPhone: '0345-9876543',
          status: 'delivered',
          receiverName: 'Ahmad Hassan',
          items: [
            { partNo: 'SPK-001', description: 'Spark Plugs', orderedQty: 100, dispatchedQty: 100, deliveredQty: 100, pendingQty: 0 },
          ],
          totalPackages: 3,
          totalWeight: 15,
        },
      ]);
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
      if (selectedChallan?.id) {
        await api.put(`/delivery-challans/${selectedChallan.id}`, formData);
      } else {
        await api.post('/delivery-challans', formData);
      }
      resetForm();
      fetchChallans();
    } catch (error: any) {
      console.error('Failed to save challan:', error);
      alert(error.response?.data?.error || 'Failed to save challan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challan?')) return;
    try {
      setLoading(true);
      await api.delete(`/delivery-challans/${id}`);
      fetchChallans();
    } catch (error: any) {
      console.error('Failed to delete challan:', error);
      alert(error.response?.data?.error || 'Failed to delete challan');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedChallan) return;
    try {
      setLoading(true);
      await api.post(`/delivery-challans/${selectedChallan.id}/dispatch`, dispatchData);
      setShowDispatchModal(false);
      setDispatchData({
        dispatchDate: new Date().toISOString().split('T')[0],
        vehicleNo: '',
        vehicleType: 'truck',
        driverName: '',
        driverPhone: '',
        transporterName: '',
        dispatchedBy: '',
        dispatchNotes: '',
        items: [],
      });
      setSelectedChallan(null);
      fetchChallans();
      alert('Challan dispatched successfully!');
    } catch (error: any) {
      console.error('Failed to dispatch:', error);
      alert(error.response?.data?.error || 'Failed to dispatch');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryConfirmation = async () => {
    if (!selectedChallan) return;
    try {
      setLoading(true);
      await api.post(`/delivery-challans/${selectedChallan.id}/deliver`, deliveryData);
      setShowDeliveryModal(false);
      setDeliveryData({
        actualDeliveryDate: new Date().toISOString().split('T')[0],
        receiverName: '',
        deliveryConfirmedBy: '',
        deliveryNotes: '',
        items: [],
      });
      setSelectedChallan(null);
      fetchChallans();
      alert('Delivery confirmed successfully!');
    } catch (error: any) {
      console.error('Failed to confirm delivery:', error);
      alert(error.response?.data?.error || 'Failed to confirm delivery');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/delivery-challans/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next challan number:', error);
      return 'DC-2025-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      challanNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryAddress: '',
      vehicleNo: '',
      vehicleType: '',
      driverName: '',
      driverPhone: '',
      transporterName: '',
      status: 'draft',
      items: [],
      totalPackages: 0,
      totalWeight: 0,
      notes: '',
      dispatchNotes: '',
      deliveryNotes: '',
    });
    setSelectedChallan(null);
    setShowForm(false);
  };

  const handleEdit = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setFormData(challan);
    setShowForm(true);
  };

  const openDispatchModal = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setDispatchData({
      ...dispatchData,
      vehicleNo: challan.vehicleNo || '',
      vehicleType: challan.vehicleType || 'truck',
      driverName: challan.driverName || '',
      driverPhone: challan.driverPhone || '',
      transporterName: challan.transporterName || '',
      items: challan.items.map(item => ({
        itemId: item.id || '',
        dispatchedQty: item.orderedQty,
      })),
    });
    setShowDispatchModal(true);
  };

  const openDeliveryModal = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setDeliveryData({
      ...deliveryData,
      items: challan.items.map(item => ({
        itemId: item.id || '',
        deliveredQty: item.dispatchedQty,
        remarks: '',
      })),
    });
    setShowDeliveryModal(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { partNo: '', description: '', orderedQty: 1, dispatchedQty: 0, deliveredQty: 0, pendingQty: 1 }],
    });
    setCurrentItemIndex(formData.items.length);
    setShowPartSearch(true);
  };

  const updateItem = (index: number, field: keyof ChallanItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'orderedQty') {
      newItems[index].pendingQty = value - (newItems[index].deliveredQty || 0);
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const selectPart = (part: any, index: number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      partId: part.id,
      partNo: part.partNo,
      description: part.description || '',
      uom: part.uom || '',
    };
    setFormData({ ...formData, items: newItems });
    setShowPartSearch(false);
    setPartSearchTerm('');
    setCurrentItemIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'ready':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dispatched':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'partial':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'returned':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'ready':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      case 'dispatched':
      case 'in_transit':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const filteredChallans = challans.filter(
    (c) => {
      const matchesSearch = 
        c.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  // Statistics
  const stats = {
    total: challans.length,
    draft: challans.filter(c => c.status === 'draft').length,
    ready: challans.filter(c => c.status === 'ready').length,
    dispatched: challans.filter(c => c.status === 'dispatched' || c.status === 'in_transit').length,
    delivered: challans.filter(c => c.status === 'delivered').length,
  };

  const printChallan = (challan: DeliveryChallan) => {
    alert(`Print challan ${challan.challanNo}`);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-300 font-medium">Total Challans</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-100 font-medium">Ready to Dispatch</p>
                <p className="text-2xl font-bold">{stats.ready}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-yellow-100 font-medium">In Transit</p>
                <p className="text-2xl font-bold">{stats.dispatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-green-100 font-medium">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-primary-100 font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats.draft + stats.ready}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search challans..."
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
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="partial">Partial</option>
            <option value="returned">Returned</option>
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
              onClick={() => setViewMode('tracking')}
              className={`px-3 py-2 ${viewMode === 'tracking' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
            + New Challan
          </Button>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Dispatch Challan - {selectedChallan.challanNo}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDispatchModal(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Customer: <span className="font-medium">{selectedChallan.customerName}</span></p>
                  <p className="text-sm text-gray-600">Delivery Address: <span className="font-medium">{selectedChallan.deliveryAddress}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dispatch Date *</label>
                    <Input
                      type="date"
                      value={dispatchData.dispatchDate}
                      onChange={(e) => setDispatchData({ ...dispatchData, dispatchDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                    <select
                      value={dispatchData.vehicleType}
                      onChange={(e) => setDispatchData({ ...dispatchData, vehicleType: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md"
                    >
                      <option value="truck">Truck</option>
                      <option value="pickup">Pickup</option>
                      <option value="van">Van</option>
                      <option value="bike">Bike</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle No *</label>
                    <Input
                      value={dispatchData.vehicleNo}
                      onChange={(e) => setDispatchData({ ...dispatchData, vehicleNo: e.target.value })}
                      placeholder="ABC-123"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name *</label>
                    <Input
                      value={dispatchData.driverName}
                      onChange={(e) => setDispatchData({ ...dispatchData, driverName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver Phone</label>
                    <Input
                      value={dispatchData.driverPhone}
                      onChange={(e) => setDispatchData({ ...dispatchData, driverPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transporter</label>
                    <Input
                      value={dispatchData.transporterName}
                      onChange={(e) => setDispatchData({ ...dispatchData, transporterName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dispatched By *</label>
                    <Input
                      value={dispatchData.dispatchedBy}
                      onChange={(e) => setDispatchData({ ...dispatchData, dispatchedBy: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items to Dispatch</label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Part No</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Ordered</TableHead>
                          <TableHead className="text-center">Dispatch Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedChallan.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.partNo}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.orderedQty}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={dispatchData.items[idx]?.dispatchedQty || item.orderedQty}
                                onChange={(e) => {
                                  const newItems = [...dispatchData.items];
                                  newItems[idx] = { ...newItems[idx], dispatchedQty: parseInt(e.target.value) || 0 };
                                  setDispatchData({ ...dispatchData, items: newItems });
                                }}
                                className="w-24 mx-auto text-center"
                                max={item.orderedQty}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dispatch Notes</label>
                  <textarea
                    value={dispatchData.dispatchNotes}
                    onChange={(e) => setDispatchData({ ...dispatchData, dispatchNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleDispatch}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                    disabled={loading || !dispatchData.vehicleNo || !dispatchData.driverName || !dispatchData.dispatchedBy}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                    </svg>
                    {loading ? 'Dispatching...' : 'Confirm Dispatch'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {showDeliveryModal && selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Confirm Delivery - {selectedChallan.challanNo}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDeliveryModal(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Customer: <span className="font-medium">{selectedChallan.customerName}</span></p>
                  <p className="text-sm text-gray-600">Delivery Address: <span className="font-medium">{selectedChallan.deliveryAddress}</span></p>
                  <p className="text-sm text-gray-600">Dispatched: <span className="font-medium">{selectedChallan.dispatchDate ? new Date(selectedChallan.dispatchDate).toLocaleDateString() : '-'}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actual Delivery Date *</label>
                    <Input
                      type="date"
                      value={deliveryData.actualDeliveryDate}
                      onChange={(e) => setDeliveryData({ ...deliveryData, actualDeliveryDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Name *</label>
                    <Input
                      value={deliveryData.receiverName}
                      onChange={(e) => setDeliveryData({ ...deliveryData, receiverName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmed By *</label>
                    <Input
                      value={deliveryData.deliveryConfirmedBy}
                      onChange={(e) => setDeliveryData({ ...deliveryData, deliveryConfirmedBy: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivered Items</label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Part No</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Dispatched</TableHead>
                          <TableHead className="text-center">Delivered Qty</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedChallan.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.partNo}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.dispatchedQty}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={deliveryData.items[idx]?.deliveredQty || item.dispatchedQty}
                                onChange={(e) => {
                                  const newItems = [...deliveryData.items];
                                  newItems[idx] = { ...newItems[idx], deliveredQty: parseInt(e.target.value) || 0 };
                                  setDeliveryData({ ...deliveryData, items: newItems });
                                }}
                                className="w-24 mx-auto text-center"
                                max={item.dispatchedQty}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={deliveryData.items[idx]?.remarks || ''}
                                onChange={(e) => {
                                  const newItems = [...deliveryData.items];
                                  newItems[idx] = { ...newItems[idx], remarks: e.target.value };
                                  setDeliveryData({ ...deliveryData, items: newItems });
                                }}
                                placeholder="If any issue..."
                                className="w-full"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes</label>
                  <textarea
                    value={deliveryData.deliveryNotes}
                    onChange={(e) => setDeliveryData({ ...deliveryData, deliveryNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Any delivery remarks..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleDeliveryConfirmation}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    disabled={loading || !deliveryData.receiverName || !deliveryData.deliveryConfirmedBy}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {loading ? 'Confirming...' : 'Confirm Delivery'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeliveryModal(false)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle>{selectedChallan ? 'Edit Challan' : 'New Delivery Challan'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Challan No</label>
                  <Input value={formData.challanNo} disabled className="bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                  <Input
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Packages</label>
                  <Input
                    type="number"
                    value={formData.totalPackages}
                    onChange={(e) => setFormData({ ...formData, totalPackages: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Weight (kg)</label>
                  <Input
                    type="number"
                    value={formData.totalWeight}
                    onChange={(e) => setFormData({ ...formData, totalWeight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Challan Items</h3>
                  <Button type="button" onClick={addItem} className="bg-primary-500 hover:bg-primary-600 text-white text-sm">
                    + Add Item
                  </Button>
                </div>

                {showPartSearch && currentItemIndex !== null && (
                  <div className="relative mb-4">
                    <Input
                      placeholder="Search parts..."
                      value={partSearchTerm}
                      onChange={(e) => setPartSearchTerm(e.target.value)}
                      autoFocus
                    />
                    {parts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {parts.map((part) => (
                          <div
                            key={part.id}
                            onClick={() => selectPart(part, currentItemIndex)}
                            className="p-2 hover:bg-primary-50 cursor-pointer border-b"
                          >
                            <div className="font-medium">{part.partNo}</div>
                            <div className="text-sm text-gray-600">{part.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formData.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Part No</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead></TableHead>
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
                                  if (e.target.value) {
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
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.orderedQty}
                                onChange={(e) => updateItem(index, 'orderedQty', parseInt(e.target.value) || 0)}
                                className="w-24 text-center"
                                min="1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.remarks || ''}
                                onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                                placeholder="Remarks"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-700"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600" disabled={loading}>
                  {loading ? 'Saving...' : selectedChallan ? 'Update' : 'Create'} Challan
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Challans List or Tracking View */}
      {viewMode === 'tracking' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallans.map((challan) => (
            <Card key={challan.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{challan.challanNo}</h3>
                    <p className="text-sm text-gray-600">{challan.customerName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(challan.status)}`}>
                    {challan.status}
                  </span>
                </div>

                {/* Tracking Timeline */}
                <div className="relative pl-6 space-y-4 mb-4">
                  <div className={`relative flex items-center ${challan.status !== 'draft' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`absolute left-[-24px] w-4 h-4 rounded-full ${challan.status !== 'draft' ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                      {challan.status !== 'draft' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="absolute left-[-18px] top-4 h-full w-0.5 bg-gray-200"></div>
                    <div>
                      <p className="font-medium text-sm">Created</p>
                      <p className="text-xs text-gray-500">{challan.createdAt ? new Date(challan.createdAt).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>

                  <div className={`relative flex items-center ${['dispatched', 'in_transit', 'delivered'].includes(challan.status) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`absolute left-[-24px] w-4 h-4 rounded-full ${['dispatched', 'in_transit', 'delivered'].includes(challan.status) ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                      {['dispatched', 'in_transit', 'delivered'].includes(challan.status) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="absolute left-[-18px] top-4 h-full w-0.5 bg-gray-200"></div>
                    <div>
                      <p className="font-medium text-sm">Dispatched</p>
                      <p className="text-xs text-gray-500">{challan.dispatchDate ? new Date(challan.dispatchDate).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>

                  <div className={`relative flex items-center ${challan.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`absolute left-[-24px] w-4 h-4 rounded-full ${challan.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center`}>
                      {challan.status === 'delivered' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Delivered</p>
                      <p className="text-xs text-gray-500">{challan.actualDeliveryDate ? new Date(challan.actualDeliveryDate).toLocaleDateString() : 'Pending'}</p>
                    </div>
                  </div>
                </div>

                {challan.vehicleNo && (
                  <div className="bg-gray-50 rounded p-2 mb-3 text-xs">
                    <p><span className="text-gray-500">Vehicle:</span> {challan.vehicleNo}</p>
                    <p><span className="text-gray-500">Driver:</span> {challan.driverName}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {challan.status === 'ready' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDispatchModal(challan)}
                      className="flex-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                    >
                      Dispatch
                    </Button>
                  )}
                  {(challan.status === 'dispatched' || challan.status === 'in_transit') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeliveryModal(challan)}
                      className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                    >
                      Confirm Delivery
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printChallan(challan)}
                    className="text-gray-600"
                  >
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-lg">Delivery Challans ({filteredChallans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              </div>
            ) : filteredChallans.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium">No challans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Challan No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChallans.map((challan) => (
                      <TableRow key={challan.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{challan.challanNo}</div>
                            {challan.orderNo && (
                              <div className="text-xs text-gray-500">Order: {challan.orderNo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{challan.customerName}</div>
                            <div className="text-xs text-gray-500">{challan.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(challan.deliveryDate).toLocaleDateString()}</div>
                            {challan.actualDeliveryDate && (
                              <div className="text-xs text-green-600">
                                Delivered: {new Date(challan.actualDeliveryDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{challan.vehicleNo || '-'}</TableCell>
                        <TableCell>{challan.driverName || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {challan.items.length} items
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(challan.status)}`}>
                            {getStatusIcon(challan.status)}
                            {challan.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            {challan.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(challan)}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                Edit
                              </Button>
                            )}
                            {challan.status === 'ready' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDispatchModal(challan)}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              >
                                Dispatch
                              </Button>
                            )}
                            {(challan.status === 'dispatched' || challan.status === 'in_transit') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeliveryModal(challan)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                Deliver
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => printChallan(challan)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Print
                            </Button>
                            {challan.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => challan.id && handleDelete(challan.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            )}
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
      )}
    </div>
  );
}
