'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface PriceItem {
  id: string;
  partNo: string;
  description?: string;
  category?: string;
  brand?: string;
  currentCost: number;
  newCost: number | null;
  priceA: number;
  newPriceA: number | null;
  priceB: number;
  newPriceB: number | null;
  priceM: number;
  newPriceM: number | null;
  quantity: number;
  currentValue: number;
  newValue: number;
  isSelected: boolean;
  costChangePercent: number;
  status: 'unchanged' | 'modified' | 'pending';
}

interface PriceUpdateLog {
  id: string;
  date: string;
  itemsUpdated: number;
  totalValueChange: number;
  updatedBy?: string;
  reason?: string;
}

interface UpdateSummary {
  totalItems: number;
  selectedItems: number;
  modifiedItems: number;
  totalCurrentValue: number;
  totalNewValue: number;
  valueChange: number;
  avgCostChange: number;
}

export default function StockPriceManagement() {
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updateLogs, setUpdateLogs] = useState<PriceUpdateLog[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [priceTypeFilter, setPriceTypeFilter] = useState<'all' | 'cost' | 'priceA' | 'priceB' | 'priceM'>('all');

  // Master Data
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Bulk Update Settings
  const [bulkUpdateType, setBulkUpdateType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkUpdateValue, setBulkUpdateValue] = useState<number>(0);
  const [bulkUpdateField, setBulkUpdateField] = useState<'cost' | 'priceA' | 'priceB' | 'priceM' | 'all'>('cost');
  const [updateReason, setUpdateReason] = useState('');

  // Summary
  const [summary, setSummary] = useState<UpdateSummary>({
    totalItems: 0,
    selectedItems: 0,
    modifiedItems: 0,
    totalCurrentValue: 0,
    totalNewValue: 0,
    valueChange: 0,
    avgCostChange: 0,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // View Mode
  const [viewMode, setViewMode] = useState<'prices' | 'history'>('prices');

  useEffect(() => {
    fetchPriceData();
  }, []);

  useEffect(() => {
    calculateSummary();
  }, [priceItems]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const parts = response.data.parts || [];

      const items: PriceItem[] = parts.map((part: any) => ({
        id: part.id,
        partNo: part.partNo,
        description: part.description,
        category: part.mainCategory || 'Uncategorized',
        brand: part.brand,
        currentCost: part.cost || 0,
        newCost: null,
        priceA: part.priceA || 0,
        newPriceA: null,
        priceB: part.priceB || 0,
        newPriceB: null,
        priceM: part.priceM || 0,
        newPriceM: null,
        quantity: part.stock?.quantity || 0,
        currentValue: (part.stock?.quantity || 0) * (part.cost || 0),
        newValue: (part.stock?.quantity || 0) * (part.cost || 0),
        isSelected: false,
        costChangePercent: 0,
        status: 'unchanged' as const,
      }));

      setPriceItems(items);

      // Extract unique values for filters
      const uniqueCategories = [...new Set(parts.map((p: any) => p.mainCategory).filter(Boolean))] as string[];
      const uniqueBrands = [...new Set(parts.map((p: any) => p.brand).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch price data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalItems = priceItems.length;
    const selectedItems = priceItems.filter(i => i.isSelected).length;
    const modifiedItems = priceItems.filter(i => i.status === 'modified').length;
    
    const totalCurrentValue = priceItems.reduce((sum, item) => sum + item.currentValue, 0);
    const totalNewValue = priceItems.reduce((sum, item) => {
      const newCost = item.newCost ?? item.currentCost;
      return sum + (item.quantity * newCost);
    }, 0);
    
    const valueChange = totalNewValue - totalCurrentValue;
    
    const modifiedCosts = priceItems.filter(i => i.newCost !== null);
    const avgCostChange = modifiedCosts.length > 0
      ? modifiedCosts.reduce((sum, i) => sum + i.costChangePercent, 0) / modifiedCosts.length
      : 0;

    setSummary({
      totalItems,
      selectedItems,
      modifiedItems,
      totalCurrentValue,
      totalNewValue,
      valueChange,
      avgCostChange,
    });
  };

  const handlePriceChange = (itemId: string, field: 'newCost' | 'newPriceA' | 'newPriceB' | 'newPriceM', value: number | null) => {
    setPriceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        
        // Calculate cost change percent if cost is being updated
        if (field === 'newCost' && value !== null) {
          updated.costChangePercent = item.currentCost > 0
            ? ((value - item.currentCost) / item.currentCost) * 100
            : 0;
          updated.newValue = item.quantity * value;
        }
        
        // Check if any price has changed
        updated.status = (
          updated.newCost !== null ||
          updated.newPriceA !== null ||
          updated.newPriceB !== null ||
          updated.newPriceM !== null
        ) ? 'modified' : 'unchanged';
        
        return updated;
      }
      return item;
    }));
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    setPriceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, isSelected: selected };
      }
      return item;
    }));
  };

  const handleSelectAll = (selected: boolean) => {
    setPriceItems(prev => prev.map(item => ({
      ...item,
      isSelected: selected,
    })));
  };

  const handleBulkUpdate = () => {
    if (bulkUpdateValue === 0) {
      setError('Please enter a value for bulk update');
      return;
    }

    const selectedItems = priceItems.filter(i => i.isSelected);
    if (selectedItems.length === 0) {
      setError('Please select items to update');
      return;
    }

    setPriceItems(prev => prev.map(item => {
      if (!item.isSelected) return item;

      const updated = { ...item };
      
      const calculateNewValue = (currentValue: number) => {
        if (bulkUpdateType === 'percentage') {
          return currentValue * (1 + bulkUpdateValue / 100);
        }
        return currentValue + bulkUpdateValue;
      };

      if (bulkUpdateField === 'cost' || bulkUpdateField === 'all') {
        updated.newCost = Math.max(0, calculateNewValue(item.currentCost));
        updated.costChangePercent = item.currentCost > 0
          ? ((updated.newCost - item.currentCost) / item.currentCost) * 100
          : 0;
        updated.newValue = item.quantity * updated.newCost;
      }
      if (bulkUpdateField === 'priceA' || bulkUpdateField === 'all') {
        updated.newPriceA = Math.max(0, calculateNewValue(item.priceA));
      }
      if (bulkUpdateField === 'priceB' || bulkUpdateField === 'all') {
        updated.newPriceB = Math.max(0, calculateNewValue(item.priceB));
      }
      if (bulkUpdateField === 'priceM' || bulkUpdateField === 'all') {
        updated.newPriceM = Math.max(0, calculateNewValue(item.priceM));
      }

      updated.status = 'modified';
      return updated;
    }));

    setSuccess(`Bulk update applied to ${selectedItems.length} items`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleApplyChanges = async () => {
    const modifiedItems = priceItems.filter(i => i.status === 'modified');
    
    if (modifiedItems.length === 0) {
      setError('No items have been modified');
      return;
    }

    if (!updateReason.trim()) {
      setError('Please provide a reason for the price update');
      return;
    }

    if (!confirm(`Are you sure you want to update prices for ${modifiedItems.length} items?\n\nReason: ${updateReason}`)) {
      return;
    }

    try {
      setLoading(true);

      // In a real app, this would be a batch API call
      for (const item of modifiedItems) {
        const updateData: any = {};
        if (item.newCost !== null) updateData.cost = item.newCost;
        if (item.newPriceA !== null) updateData.priceA = item.newPriceA;
        if (item.newPriceB !== null) updateData.priceB = item.newPriceB;
        if (item.newPriceM !== null) updateData.priceM = item.newPriceM;

        await api.put(`/parts/${item.id}`, updateData);
      }

      // Add to update logs
      const newLog: PriceUpdateLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        itemsUpdated: modifiedItems.length,
        totalValueChange: summary.valueChange,
        reason: updateReason,
      };
      setUpdateLogs(prev => [newLog, ...prev]);

      setSuccess(`Successfully updated ${modifiedItems.length} items`);
      setUpdateReason('');
      fetchPriceData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply price changes');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChanges = () => {
    if (!confirm('Are you sure you want to reset all pending changes?')) return;

    setPriceItems(prev => prev.map(item => ({
      ...item,
      newCost: null,
      newPriceA: null,
      newPriceB: null,
      newPriceM: null,
      newValue: item.currentValue,
      costChangePercent: 0,
      status: 'unchanged' as const,
      isSelected: false,
    })));

    setSuccess('All changes have been reset');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredItems = useMemo(() => {
    return priceItems.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesBrand = !brandFilter || item.brand === brandFilter;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [priceItems, searchTerm, categoryFilter, brandFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const handleExport = () => {
    const headers = ['Part No', 'Description', 'Category', 'Brand', 'Quantity', 'Current Cost', 'New Cost', 'Price A', 'New Price A', 'Price B', 'New Price B', 'Price M', 'New Price M', 'Current Value', 'New Value', 'Change %'];
    const rows = filteredItems.map(item => [
      item.partNo,
      item.description || '',
      item.category || '',
      item.brand || '',
      item.quantity,
      item.currentCost.toFixed(2),
      item.newCost?.toFixed(2) || '-',
      item.priceA.toFixed(2),
      item.newPriceA?.toFixed(2) || '-',
      item.priceB.toFixed(2),
      item.newPriceB?.toFixed(2) || '-',
      item.priceM.toFixed(2),
      item.newPriceM?.toFixed(2) || '-',
      item.currentValue.toFixed(2),
      item.newValue.toFixed(2),
      item.costChangePercent.toFixed(2) + '%',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `price-update-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Price Management</h1>
            <p className="text-xs sm:text-sm text-gray-500">Readjust and update inventory prices</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={viewMode === 'prices' ? 'default' : 'outline'}
            onClick={() => setViewMode('prices')}
            className={viewMode === 'prices' ? 'bg-primary-500' : ''}
          >
            Price Editor
          </Button>
          <Button
            variant={viewMode === 'history' ? 'default' : 'outline'}
            onClick={() => setViewMode('history')}
            className={viewMode === 'history' ? 'bg-primary-500' : ''}
          >
            Update History
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">×</button>
        </div>
      )}

      {viewMode === 'prices' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-700">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-blue-700">Selected</p>
                <p className="text-2xl font-bold text-blue-900">{summary.selectedItems}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-yellow-700">Modified</p>
                <p className="text-2xl font-bold text-yellow-900">{summary.modifiedItems}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-purple-700">Current Value</p>
                <p className="text-2xl font-bold text-purple-900">${summary.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary-50 to-orange-50 border-primary-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-primary-700">New Value</p>
                <p className="text-2xl font-bold text-primary-900">${summary.totalNewValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${summary.valueChange >= 0 ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'}`}>
              <CardContent className="p-4">
                <p className={`text-sm font-medium ${summary.valueChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>Value Change</p>
                <p className={`text-2xl font-bold ${summary.valueChange >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {summary.valueChange >= 0 ? '+' : '-'}${Math.abs(summary.valueChange).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Update Panel */}
          <Card className="shadow-md border-2 border-primary-100">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Bulk Price Update
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Price Field</Label>
                  <Select
                    value={bulkUpdateField}
                    onChange={(e) => setBulkUpdateField(e.target.value as any)}
                    className="mt-1 w-full"
                  >
                    <option value="cost">Cost</option>
                    <option value="priceA">Price A</option>
                    <option value="priceB">Price B</option>
                    <option value="priceM">Price M</option>
                    <option value="all">All Prices</option>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Update Type</Label>
                  <Select
                    value={bulkUpdateType}
                    onChange={(e) => setBulkUpdateType(e.target.value as any)}
                    className="mt-1 w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Value ({bulkUpdateType === 'percentage' ? '%' : '$'})
                  </Label>
                  <Input
                    type="number"
                    step={bulkUpdateType === 'percentage' ? '0.1' : '0.01'}
                    value={bulkUpdateValue}
                    onChange={(e) => setBulkUpdateValue(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder={bulkUpdateType === 'percentage' ? 'e.g. 10 or -5' : 'e.g. 5.00 or -2.50'}
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">Reason for Update *</Label>
                  <Input
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    className="mt-1"
                    placeholder="e.g. Market price adjustment, Supplier price change..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    disabled={summary.selectedItems === 0}
                  >
                    Apply to Selected
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{summary.selectedItems} items selected</span>
                  <span>|</span>
                  <span>{summary.modifiedItems} items modified</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </Button>
                  <Button variant="outline" onClick={handleResetChanges} className="border-red-300 text-red-700 hover:bg-red-50">
                    Reset All
                  </Button>
                  <Button
                    onClick={handleApplyChanges}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={summary.modifiedItems === 0 || loading}
                  >
                    {loading ? 'Applying...' : `Apply ${summary.modifiedItems} Changes`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Table */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Price List</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="w-36"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        <input
                          type="checkbox"
                          checked={filteredItems.length > 0 && filteredItems.every(i => i.isSelected)}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">New Cost</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price A</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">New A</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price B</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">New B</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Change %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            <span className="text-gray-500">Loading prices...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr key={item.id} className={`hover:bg-primary-50/50 transition-colors ${item.status === 'modified' ? 'bg-yellow-50/50' : ''}`}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={item.isSelected}
                              onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-900 text-sm">{item.partNo}</span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-[150px] truncate">
                            {item.description || '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                            ${item.currentCost.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.newCost ?? ''}
                              onChange={(e) => handlePriceChange(item.id, 'newCost', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="w-20 text-center text-sm p-1"
                              placeholder={item.currentCost.toFixed(2)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-600">
                            ${item.priceA.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.newPriceA ?? ''}
                              onChange={(e) => handlePriceChange(item.id, 'newPriceA', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="w-20 text-center text-sm p-1"
                              placeholder={item.priceA.toFixed(2)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-600">
                            ${item.priceB.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.newPriceB ?? ''}
                              onChange={(e) => handlePriceChange(item.id, 'newPriceB', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="w-20 text-center text-sm p-1"
                              placeholder={item.priceB.toFixed(2)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={`text-sm font-medium ${
                              item.costChangePercent > 0 ? 'text-green-600' :
                              item.costChangePercent < 0 ? 'text-red-600' :
                              'text-gray-500'
                            }`}>
                              {item.newCost !== null ? (item.costChangePercent > 0 ? '+' : '') + item.costChangePercent.toFixed(1) + '%' : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredItems.length)} of {filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // History View
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Price Update History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {updateLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No price update history found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {updateLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(log.date).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {log.itemsUpdated} items updated | Value change: 
                          <span className={log.totalValueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {' '}{log.totalValueChange >= 0 ? '+' : '-'}${Math.abs(log.totalValueChange).toFixed(2)}
                          </span>
                        </p>
                        {log.reason && (
                          <p className="text-sm text-gray-500 mt-1">Reason: {log.reason}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

