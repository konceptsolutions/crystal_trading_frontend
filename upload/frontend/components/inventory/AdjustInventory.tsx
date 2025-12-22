'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

export interface AdjustmentItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  previousQuantity: number;
  adjustedQuantity: number;
  newQuantity: number;
  lastPurchaseRate?: number;
  rate?: number;
  total?: number;
  reason?: string;
  part?: {
    partNo: string;
    description?: string;
    stock?: {
      quantity: number;
    };
    cost?: number;
  };
}

export interface InventoryAdjustment {
  id?: string;
  adjustmentNo?: string;
  total: number;
  date: string;
  notes?: string;
  subject?: string;
  storeId?: string;
  isAddInventory?: boolean;
  items: AdjustmentItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface AdjustInventoryProps {
  onClose?: () => void;
}

export default function AdjustInventory({ onClose }: AdjustInventoryProps) {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<InventoryAdjustment | null>(null);
  const [viewingAdjustment, setViewingAdjustment] = useState<InventoryAdjustment | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Generate adjustment number function
  const generateAdjustmentNo = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ADJ-${year}${month}-${random}`;
  };

  // Form state
  const [formData, setFormData] = useState<InventoryAdjustment>(() => ({
    adjustmentNo: generateAdjustmentNo(),
    total: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    subject: '',
    storeId: '',
    isAddInventory: true,
    items: [],
  }));

  // Part selection
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  useEffect(() => {
    fetchAdjustments();
    fetchParts();
    fetchStores();
    fetchCategories();
  }, [page, limit]);

  useEffect(() => {
    if (showForm && !selectedAdjustment) {
      // Always generate a new adjustment number for new adjustments
      setFormData(prev => ({
        ...prev,
        adjustmentNo: generateAdjustmentNo()
      }));
    }
  }, [showForm, selectedAdjustment]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/inventory-adjustments?page=${page}&limit=${limit}`);
      setAdjustments(response.data.adjustments || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch adjustments');
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

  const fetchStores = async () => {
    try {
      const response = await api.get('/parts-management/getStoresDropDown');
      const storesData = response.data?.store || response.data?.stores || [];
      setStores(storesData);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?status=A');
      setCategories(response.data.categories || response.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedCategory]);

  const fetchSubCategories = async (categoryId: string) => {
    try {
      const response = await api.get(`/subcategories?categoryId=${categoryId}&status=A`);
      setSubCategories(response.data.subcategories || response.data || []);
    } catch (err) {
      console.error('Failed to fetch subcategories:', err);
      setSubCategories([]);
    }
  };

  const fetchAdjustmentDetails = async (id: string) => {
    try {
      const response = await api.get(`/inventory-adjustments/${id}`);
      return response.data.adjustment;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch adjustment details');
      return null;
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        partNo: '',
        previousQuantity: 0,
        adjustedQuantity: 0,
        newQuantity: 0,
        lastPurchaseRate: 0,
        rate: 0,
        total: 0,
        reason: '',
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    calculateTotal();
  };

  const handleItemChange = (index: number, field: keyof AdjustmentItem, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };

    // If part is selected, fetch current stock
    if (field === 'partId' && value) {
      const part = availableParts.find(p => p.id === value);
      if (part) {
        updated[index].partNo = part.partNo;
        updated[index].description = part.description || '';
        updated[index].previousQuantity = part.stock?.quantity || 0;
        updated[index].lastPurchaseRate = part.cost || 0;
        // Don't auto-fill rate - user must enter it manually
        updated[index].rate = 0;
        updated[index].newQuantity = updated[index].previousQuantity + (updated[index].adjustedQuantity || 0);
        updated[index].total = (updated[index].rate || 0) * Math.abs(updated[index].adjustedQuantity || 0);
      }
    }

    // If adjusted quantity changes, update new quantity and total
    if (field === 'adjustedQuantity') {
      updated[index].newQuantity = updated[index].previousQuantity + (value || 0);
      updated[index].total = (updated[index].rate || 0) * Math.abs(value || 0);
    }

    // If rate changes, update total
    if (field === 'rate') {
      updated[index].total = (value || 0) * Math.abs(updated[index].adjustedQuantity || 0);
    }

    setFormData(prev => ({ ...prev, items: updated }));
    calculateTotal();
  };

  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => {
      const itemTotal = (item.rate || 0) * Math.abs(item.adjustedQuantity || 0);
      return sum + itemTotal;
    }, 0);
    setFormData(prev => ({ ...prev, total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      setError('Please add at least one item to adjust');
      return;
    }

    if (formData.items.some(item => !item.partNo || item.adjustedQuantity === 0)) {
      setError('Please fill in all item details correctly');
      return;
    }

    try {
      setLoading(true);
      const adjustmentData = {
        ...formData,
        items: formData.items.map(item => ({
          partId: item.partId || undefined,
          partNo: item.partNo,
          description: item.description,
          previousQuantity: item.previousQuantity,
          adjustedQuantity: item.adjustedQuantity,
          reason: item.reason,
        })),
      };

      if (selectedAdjustment?.id) {
        await api.put(`/inventory-adjustments/${selectedAdjustment.id}`, adjustmentData);
        setSuccess('Adjustment updated successfully');
      } else {
        await api.post('/inventory-adjustments', adjustmentData);
        setSuccess('Adjustment created successfully');
      }

      resetForm();
      fetchAdjustments();
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save adjustment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (adjustment: InventoryAdjustment) => {
    const details = await fetchAdjustmentDetails(adjustment.id!);
    if (details) {
      setSelectedAdjustment(details);
      setFormData({
        adjustmentNo: details.adjustmentNo || '',
        total: details.total,
        date: details.date ? new Date(details.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: details.notes || '',
        items: details.items.map((item: AdjustmentItem) => ({
          id: item.id,
          partId: item.partId,
          partNo: item.partNo,
          description: item.description,
          previousQuantity: item.previousQuantity,
          adjustedQuantity: item.adjustedQuantity,
          newQuantity: item.newQuantity,
          reason: item.reason,
        })),
      });
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleView = async (adjustment: InventoryAdjustment) => {
    const details = await fetchAdjustmentDetails(adjustment.id!);
    if (details) {
      setViewingAdjustment(details);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this adjustment? This will revert the stock changes.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/inventory-adjustments/${id}`);
      setSuccess('Adjustment deleted successfully');
      fetchAdjustments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete adjustment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      adjustmentNo: generateAdjustmentNo(),
      total: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      items: [],
    });
    setSelectedAdjustment(null);
  };

  const filteredParts = availableParts.filter(part =>
    part.partNo.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    part.description?.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Adjust Inventory</h1>
            <p className="text-xs sm:text-sm text-gray-500">Manage inventory adjustments and stock corrections</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">+ Adjust</span>
          <span className="sm:hidden">New Adjustment</span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md">
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="shadow-lg border-2 border-primary-200 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 rounded text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Adjust Item Stock
              </CardTitle>
              <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }} className="p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Add Inventory Toggle */}
              <div className="flex items-center gap-3">
                <Label htmlFor="addInventory" className="text-sm font-medium">Add Inventory</Label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAddInventory: !formData.isAddInventory })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isAddInventory ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isAddInventory ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Date, Subject, Store Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter subject"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="storeId">Store *</Label>
                  <select
                    id="storeId"
                    value={formData.storeId || ''}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">Select...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  {!formData.storeId && (
                    <p className="text-xs text-red-500 mt-1">Required</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                  <Button 
                    type="button" 
                    onClick={handleAddItem} 
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    + Add
                  </Button>
                  <div className="flex gap-3">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">Select...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Sub Category</Label>
                      <select
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                        disabled={!selectedCategory}
                        className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-gray-100"
                      >
                        <option value="">Select...</option>
                        {subCategories.map((subCat) => (
                          <option key={subCat.id} value={subCat.id}>
                            {subCat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="text-right">
                        <Label className="text-xs text-gray-500">Total Amount</Label>
                        <p className="text-lg font-bold text-gray-900">{formData.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Qty in Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Last Purchase Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <select
                              value={item.partId || ''}
                              onChange={(e) => handleItemChange(index, 'partId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              required
                            >
                              <option value="">Select item</option>
                              {filteredParts.map((part) => (
                                <option key={part.id} value={part.id}>
                                  {part.partNo} - {part.description || 'No description'}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              value={item.previousQuantity}
                              disabled
                              readOnly
                              className="w-full text-sm bg-gray-100 cursor-not-allowed text-gray-600"
                              tabIndex={-1}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <Input
                                type="number"
                                value={item.adjustedQuantity || ''}
                                onChange={(e) => handleItemChange(index, 'adjustedQuantity', parseInt(e.target.value) || 0)}
                                className={`w-full text-sm ${!item.adjustedQuantity ? 'border-red-300' : ''}`}
                                required
                                placeholder="Enter quantity"
                              />
                              {!item.adjustedQuantity && (
                                <p className="text-xs text-red-500 mt-1">Required</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.lastPurchaseRate || 0}
                              disabled
                              readOnly
                              className="w-full text-sm bg-gray-100 cursor-not-allowed text-gray-600"
                              tabIndex={-1}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.rate || ''}
                                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                className={`w-full text-sm ${!item.rate || item.rate === 0 ? 'border-red-300' : ''}`}
                                required
                                placeholder="Enter rate"
                              />
                              {(!item.rate || item.rate === 0) && (
                                <p className="text-xs text-red-500 mt-1">Required</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.total || 0}
                              disabled
                              readOnly
                              className="w-full text-sm bg-gray-100 cursor-not-allowed text-gray-600"
                              tabIndex={-1}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Click "+ Add" to add items to this adjustment
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300"
                >
                  Reset
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded flex items-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* View Modal */}
      {viewingAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 transition-all duration-300">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-xl shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">Adjustment Details</CardTitle>
                <Button variant="ghost" onClick={() => setViewingAdjustment(null)} className="p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Adjustment Number</Label>
                    <p className="font-medium">{viewingAdjustment.adjustmentNo || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Date</Label>
                    <p className="font-medium">{new Date(viewingAdjustment.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Total</Label>
                    <p className="font-medium text-lg text-primary-600">{viewingAdjustment.total.toFixed(2)}</p>
                  </div>
                </div>
                {viewingAdjustment.notes && (
                  <div>
                    <Label className="text-sm text-gray-500">Notes</Label>
                    <p className="font-medium">{viewingAdjustment.notes}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-500 mb-2 block">Items</Label>
                  <div className="space-y-2">
                    {viewingAdjustment.items.map((item: AdjustmentItem, idx) => (
                      <div key={idx} className="border border-gray-200 rounded p-3 sm:p-4 transition-all duration-200 hover:bg-gray-50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Part:</span> <span className="font-medium">{item.partNo}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Previous:</span> <span className="font-medium">{item.previousQuantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Adjusted:</span> <span className={`font-medium ${item.adjustedQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.adjustedQuantity >= 0 ? '+' : ''}{item.adjustedQuantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">New:</span> <span className="font-medium">{item.newQuantity}</span>
                          </div>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-gray-500 mt-2">Reason: {item.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="rounded border-gray-300 w-3 h-3 sm:w-4 sm:h-4" />
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Total</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm sm:text-base">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading adjustments...
                      </div>
                    </td>
                  </tr>
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm sm:text-base">
                      No adjustments found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300 w-3 h-3 sm:w-4 sm:h-4" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {adjustment.id?.substring(adjustment.id.length - 8) || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        {adjustment.total.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {new Date(adjustment.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                          <button
                            onClick={() => handleView(adjustment)}
                            className="text-primary-600 hover:text-primary-800 flex items-center gap-1 p-1 sm:p-2 rounded transition-all duration-200 hover:bg-primary-50"
                            title="View"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="hidden lg:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleEdit(adjustment)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1 sm:p-2 rounded transition-all duration-200 hover:bg-blue-50"
                            title="Edit"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden lg:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => adjustment.id && handleDelete(adjustment.id)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 p-1 sm:p-2 rounded transition-all duration-200 hover:bg-red-50"
                            title="Delete"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden lg:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-700 order-2 sm:order-1">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} Records
            </div>
            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">First</span>
                <span className="sm:hidden">«</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">‹</span>
              </Button>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-primary-600 bg-primary-50 rounded">
                {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Last</span>
                <span className="sm:hidden">»</span>
              </Button>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
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

