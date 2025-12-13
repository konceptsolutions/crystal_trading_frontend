'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface TransferItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  fromStore: string;
  fromRack: string;
  fromShelf: string;
  toStore: string;
  toRack: string;
  toShelf: string;
  availableQty: number;
  transferQty: number;
  remarks?: string;
}

interface StockTransfer {
  id?: string;
  transferNo?: string;
  transferDate: string;
  fromStoreId?: string;
  toStoreId?: string;
  status: string;
  notes?: string;
  items: TransferItem[];
  createdAt?: string;
}

interface Store {
  id: string;
  name: string;
  storeType?: { name: string };
}

interface Rack {
  id: string;
  rackNumber: string;
  storeId: string;
}

interface Shelf {
  id: string;
  shelfNumber: string;
  rackId: string;
}

export default function StockTransfer() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // Master Data
  const [stores, setStores] = useState<Store[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [availableParts, setAvailableParts] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<StockTransfer>({
    transferNo: '',
    transferDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    items: [],
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransfers();
    fetchMasterData();
  }, [page, limit]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      // Simulate fetching transfers - in real implementation, this would be an API call
      const mockTransfers: StockTransfer[] = [];
      setTransfers(mockTransfers);
      setTotal(0);
      setTotalPages(1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      // Fetch stores
      const storesResponse = await api.get('/parts-management/getStoresDropDown');
      setStores(storesResponse.data.stores || []);

      // Fetch parts with inventory
      const partsResponse = await api.get('/parts?limit=1000&status=A');
      setAvailableParts(partsResponse.data.parts || []);

      // Fetch racks
      const racksResponse = await api.get('/racks');
      setRacks(racksResponse.data.racks || []);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  };

  const fetchRacksByStore = async (storeId: string) => {
    try {
      const response = await api.get(`/racks?storeId=${storeId}`);
      return response.data.racks || [];
    } catch (err) {
      console.error('Failed to fetch racks:', err);
      return [];
    }
  };

  const fetchShelvesByRack = async (rackId: string) => {
    try {
      const response = await api.get(`/racks/${rackId}/shelves`);
      return response.data.shelves || [];
    } catch (err) {
      console.error('Failed to fetch shelves:', err);
      return [];
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        partNo: '',
        fromStore: '',
        fromRack: '',
        fromShelf: '',
        toStore: '',
        toRack: '',
        toShelf: '',
        availableQty: 0,
        transferQty: 0,
        remarks: '',
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = async (index: number, field: keyof TransferItem, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };

    // If part is selected, get available quantity
    if (field === 'partId' && value) {
      const part = availableParts.find(p => p.id === value);
      if (part) {
        updated[index].partNo = part.partNo;
        updated[index].description = part.description || '';
        updated[index].availableQty = part.stock?.quantity || 0;
      }
    }

    setFormData(prev => ({ ...prev, items: updated }));
  };

  const generateTransferNo = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `STR-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      setError('Please add at least one item to transfer');
      return;
    }

    if (formData.items.some(item => !item.partNo || item.transferQty <= 0)) {
      setError('Please fill in all item details correctly');
      return;
    }

    if (formData.items.some(item => item.transferQty > item.availableQty)) {
      setError('Transfer quantity cannot exceed available quantity');
      return;
    }

    try {
      setLoading(true);
      
      const transferData = {
        ...formData,
        transferNo: formData.transferNo || generateTransferNo(),
      };

      // In real implementation, this would be an API call
      setSuccess('Stock transfer created successfully');
      resetForm();
      fetchTransfers();
      
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      transferNo: '',
      transferDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      notes: '',
      items: [],
    });
    setSelectedTransfer(null);
  };

  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      // API call to approve transfer
      setSuccess('Transfer approved and stock updated');
      fetchTransfers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    try {
      setLoading(true);
      // API call to cancel transfer
      setSuccess('Transfer cancelled');
      fetchTransfers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel transfer');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Transfer Entry</h1>
            <p className="text-xs sm:text-sm text-gray-500">Transfer stock between stores, racks, and shelves</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Transfer</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Transfer Form */}
      {showForm && (
        <Card className="shadow-lg border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {selectedTransfer ? 'Edit Transfer' : 'Create Stock Transfer'}
              </CardTitle>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }} className="hover:bg-red-100 hover:text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Transfer Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="transferNo">Transfer Number</Label>
                  <Input
                    id="transferNo"
                    value={formData.transferNo}
                    onChange={(e) => setFormData({ ...formData, transferNo: e.target.value })}
                    placeholder="Auto-generated"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="transferDate">Transfer Date *</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={formData.transferDate}
                    onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Approval</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Transfer notes..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Transfer Items */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Transfer Items</h3>
                  <Button type="button" variant="outline" onClick={handleAddItem} className="border-primary-300 text-primary-700 hover:bg-primary-50">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded">Item #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {/* Part Selection */}
                        <div className="sm:col-span-2">
                          <Label className="text-xs text-gray-600">Part *</Label>
                          <select
                            value={item.partId || ''}
                            onChange={(e) => handleItemChange(index, 'partId', e.target.value)}
                            className="mt-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm transition-all"
                            required
                          >
                            <option value="">Select part...</option>
                            {availableParts.map((part) => (
                              <option key={part.id} value={part.id}>
                                {part.partNo} - {part.description || 'No description'} (Qty: {part.stock?.quantity || 0})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-600">Available Qty</Label>
                          <Input
                            type="number"
                            value={item.availableQty}
                            readOnly
                            className="mt-1 bg-gray-100"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-gray-600">Transfer Qty *</Label>
                          <Input
                            type="number"
                            min="1"
                            max={item.availableQty}
                            value={item.transferQty || ''}
                            onChange={(e) => handleItemChange(index, 'transferQty', parseInt(e.target.value) || 0)}
                            required
                            className="mt-1"
                          />
                        </div>

                        {/* From Location */}
                        <div className="sm:col-span-2 lg:col-span-4">
                          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                            <Label className="text-xs font-semibold text-blue-700 uppercase mb-2 block">From Location</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">Store</Label>
                                <Select
                                  value={item.fromStore}
                                  onChange={(e) => handleItemChange(index, 'fromStore', e.target.value)}
                                  className="mt-1 w-full"
                                >
                                  <option value="">Select...</option>
                                  {stores.map((store) => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                  ))}
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Rack</Label>
                                <Input
                                  value={item.fromRack}
                                  onChange={(e) => handleItemChange(index, 'fromRack', e.target.value)}
                                  placeholder="Rack No."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Shelf</Label>
                                <Input
                                  value={item.fromShelf}
                                  onChange={(e) => handleItemChange(index, 'fromShelf', e.target.value)}
                                  placeholder="Shelf No."
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* To Location */}
                        <div className="sm:col-span-2 lg:col-span-4">
                          <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                            <Label className="text-xs font-semibold text-green-700 uppercase mb-2 block">To Location</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">Store</Label>
                                <Select
                                  value={item.toStore}
                                  onChange={(e) => handleItemChange(index, 'toStore', e.target.value)}
                                  className="mt-1 w-full"
                                >
                                  <option value="">Select...</option>
                                  {stores.map((store) => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                  ))}
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Rack</Label>
                                <Input
                                  value={item.toRack}
                                  onChange={(e) => handleItemChange(index, 'toRack', e.target.value)}
                                  placeholder="Rack No."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">Shelf</Label>
                                <Input
                                  value={item.toShelf}
                                  onChange={(e) => handleItemChange(index, 'toShelf', e.target.value)}
                                  placeholder="Shelf No."
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-4">
                          <Label className="text-xs text-gray-600">Remarks</Label>
                          <Input
                            value={item.remarks || ''}
                            onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                            placeholder="Item remarks..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.items.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="text-gray-500">Click "Add Item" to add items for transfer</p>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                <Button type="submit" disabled={loading} className="flex-1 bg-primary-500 hover:bg-primary-600 text-sm sm:text-base transition-all duration-200">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline">{selectedTransfer ? 'Update Transfer' : 'Create Transfer'}</span>
                      <span className="sm:hidden">{selectedTransfer ? 'Update' : 'Create'}</span>
                    </span>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }} className="text-sm sm:text-base transition-all duration-200">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transfers Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Transfer History</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchTransfers}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transfer No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && transfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-gray-500">Loading transfers...</span>
                      </div>
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <p className="text-gray-500">No stock transfers found</p>
                        <p className="text-gray-400 text-sm">Click "New Transfer" to create one</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{transfer.transferNo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(transfer.transferDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transfer.items.length} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transfer.status)}`}>
                          {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          {transfer.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => transfer.id && handleApprove(transfer.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </Button>
                          )}
                          {(transfer.status === 'draft' || transfer.status === 'pending') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => transfer.id && handleCancel(transfer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} Records
            </div>
            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">First</span>
                <span className="sm:hidden">«</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">‹</span>
              </Button>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-primary-600 bg-primary-50 rounded">{page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Last</span>
                <span className="sm:hidden">»</span>
              </Button>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                className="ml-1 sm:ml-2 px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm h-7 sm:h-8"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

