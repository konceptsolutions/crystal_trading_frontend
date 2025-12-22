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
  cost: number;
  priceA: number;
  priceB: number;
  priceM: number;
  newCost: number | null;
  newPriceA: number | null;
  newPriceB: number | null;
  newPriceM: number | null;
  isSelected: boolean;
  status: 'unchanged' | 'modified';
}

interface UpdateGroup {
  id: string;
  name: string;
  type: 'category' | 'brand' | 'custom';
  value: string;
  itemCount: number;
}

export default function PriceUpdating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'individual' | 'group'>('individual');
  
  // Items
  const [items, setItems] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  
  // Master Data
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  // Group Updates
  const [selectedGroupType, setSelectedGroupType] = useState<'category' | 'brand'>('category');
  const [selectedGroupValue, setSelectedGroupValue] = useState('');
  const [groupUpdateType, setGroupUpdateType] = useState<'percentage' | 'fixed'>('percentage');
  const [groupUpdateValue, setGroupUpdateValue] = useState<number>(0);
  const [groupUpdateField, setGroupUpdateField] = useState<'cost' | 'priceA' | 'priceB' | 'priceM' | 'all'>('all');
  const [updateReason, setUpdateReason] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Update History
  const [updateHistory, setUpdateHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const parts = response.data.parts || [];

      const priceItems: PriceItem[] = parts.map((part: any) => ({
        id: part.id,
        partNo: part.partNo,
        description: part.description,
        category: part.mainCategory || 'Uncategorized',
        brand: part.brand,
        cost: part.cost || 0,
        priceA: part.priceA || 0,
        priceB: part.priceB || 0,
        priceM: part.priceM || 0,
        newCost: null,
        newPriceA: null,
        newPriceB: null,
        newPriceM: null,
        isSelected: false,
        status: 'unchanged' as const,
      }));

      setItems(priceItems);

      const uniqueCategories = [...new Set(parts.map((p: any) => p.mainCategory).filter(Boolean))] as string[];
      const uniqueBrands = [...new Set(parts.map((p: any) => p.brand).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (itemId: string, field: 'newCost' | 'newPriceA' | 'newPriceB' | 'newPriceM', value: number | null) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        updated.status = (updated.newCost !== null || updated.newPriceA !== null || updated.newPriceB !== null || updated.newPriceM !== null) ? 'modified' : 'unchanged';
        return updated;
      }
      return item;
    }));
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, isSelected: selected } : item));
  };

  const handleSelectAll = (selected: boolean) => {
    const visibleIds = new Set(paginatedItems.map(i => i.id));
    setItems(prev => prev.map(item => visibleIds.has(item.id) ? { ...item, isSelected: selected } : item));
  };

  const handleSelectByGroup = () => {
    if (!selectedGroupValue) {
      setError('Please select a group value');
      return;
    }

    setItems(prev => prev.map(item => {
      const matches = selectedGroupType === 'category' 
        ? item.category === selectedGroupValue
        : item.brand === selectedGroupValue;
      return { ...item, isSelected: matches };
    }));

    setSuccess(`Selected all items in ${selectedGroupType}: ${selectedGroupValue}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const applyGroupUpdate = () => {
    if (groupUpdateValue === 0) {
      setError('Please enter a value for the update');
      return;
    }

    const selectedItems = items.filter(i => i.isSelected);
    if (selectedItems.length === 0) {
      setError('Please select items to update');
      return;
    }

    setItems(prev => prev.map(item => {
      if (!item.isSelected) return item;

      const updated = { ...item };
      const calculateNewValue = (currentValue: number) => {
        if (groupUpdateType === 'percentage') {
          return currentValue * (1 + groupUpdateValue / 100);
        }
        return currentValue + groupUpdateValue;
      };

      if (groupUpdateField === 'cost' || groupUpdateField === 'all') {
        updated.newCost = Math.max(0, calculateNewValue(item.cost));
      }
      if (groupUpdateField === 'priceA' || groupUpdateField === 'all') {
        updated.newPriceA = Math.max(0, calculateNewValue(item.priceA));
      }
      if (groupUpdateField === 'priceB' || groupUpdateField === 'all') {
        updated.newPriceB = Math.max(0, calculateNewValue(item.priceB));
      }
      if (groupUpdateField === 'priceM' || groupUpdateField === 'all') {
        updated.newPriceM = Math.max(0, calculateNewValue(item.priceM));
      }

      updated.status = 'modified';
      return updated;
    }));

    setSuccess(`Applied ${groupUpdateType === 'percentage' ? groupUpdateValue + '%' : '$' + groupUpdateValue} update to ${selectedItems.length} items`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const applyChanges = async () => {
    const modifiedItems = items.filter(i => i.status === 'modified');
    
    if (modifiedItems.length === 0) {
      setError('No items have been modified');
      return;
    }

    if (!updateReason.trim()) {
      setError('Please provide a reason for the update');
      return;
    }

    if (!confirm(`Update prices for ${modifiedItems.length} items?\n\nReason: ${updateReason}`)) {
      return;
    }

    try {
      setLoading(true);

      for (const item of modifiedItems) {
        const updateData: any = {};
        if (item.newCost !== null) updateData.cost = item.newCost;
        if (item.newPriceA !== null) updateData.priceA = item.newPriceA;
        if (item.newPriceB !== null) updateData.priceB = item.newPriceB;
        if (item.newPriceM !== null) updateData.priceM = item.newPriceM;

        await api.put(`/parts/${item.id}`, updateData);
      }

      // Log the update
      const newLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        itemsUpdated: modifiedItems.length,
        reason: updateReason,
        updateType: viewMode,
      };
      setUpdateHistory(prev => [newLog, ...prev]);

      setSuccess(`Successfully updated ${modifiedItems.length} items!`);
      setUpdateReason('');
      loadData();
    } catch (err) {
      setError('Failed to apply changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetChanges = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      newCost: null,
      newPriceA: null,
      newPriceB: null,
      newPriceM: null,
      isSelected: false,
      status: 'unchanged' as const,
    })));
    setSuccess('All changes reset');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesBrand = !brandFilter || item.brand === brandFilter;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [items, searchTerm, categoryFilter, brandFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const summary = useMemo(() => {
    const selected = items.filter(i => i.isSelected).length;
    const modified = items.filter(i => i.status === 'modified').length;
    return { selected, modified };
  }, [items]);

  const groupSummary = useMemo(() => {
    const categoryGroups = categories.map(cat => ({
      name: cat,
      count: items.filter(i => i.category === cat).length,
    }));
    const brandGroups = brands.map(brand => ({
      name: brand,
      count: items.filter(i => i.brand === brand).length,
    }));
    return { categoryGroups, brandGroups };
  }, [items, categories, brands]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Price Updating</h2>
            <p className="text-sm text-gray-500">Update prices individually or by group (Category/Brand)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'individual' ? 'default' : 'outline'}
            onClick={() => setViewMode('individual')}
          >
            Individual
          </Button>
          <Button
            variant={viewMode === 'group' ? 'default' : 'outline'}
            onClick={() => setViewMode('group')}
          >
            Group Level
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-700">Selected</p>
            <p className="text-2xl font-bold text-blue-900">{summary.selected}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-yellow-700">Modified</p>
            <p className="text-2xl font-bold text-yellow-900">{summary.modified}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-700">Categories</p>
            <p className="text-2xl font-bold text-green-900">{categories.length}</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'group' && (
        /* Group Update Panel */
        <Card className="border-2 border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Group Selection & Update
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Group Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Group By</Label>
                <Select
                  value={selectedGroupType}
                  onChange={(e) => { setSelectedGroupType(e.target.value as any); setSelectedGroupValue(''); }}
                  className="mt-1 w-full"
                >
                  <option value="category">Category</option>
                  <option value="brand">Brand</option>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Select {selectedGroupType}</Label>
                <Select
                  value={selectedGroupValue}
                  onChange={(e) => setSelectedGroupValue(e.target.value)}
                  className="mt-1 w-full"
                >
                  <option value="">-- Select --</option>
                  {(selectedGroupType === 'category' ? categories : brands).map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSelectByGroup} className="w-full bg-blue-600 hover:bg-blue-700">
                  Select Group Items
                </Button>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => handleSelectAll(false)} className="w-full">
                  Clear Selection
                </Button>
              </div>
            </div>

            {/* Group Update Settings */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Apply Update to Selected Items</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Price Field</Label>
                  <Select
                    value={groupUpdateField}
                    onChange={(e) => setGroupUpdateField(e.target.value as any)}
                    className="mt-1 w-full"
                  >
                    <option value="all">All Prices</option>
                    <option value="cost">Cost Only</option>
                    <option value="priceA">Price A Only</option>
                    <option value="priceB">Price B Only</option>
                    <option value="priceM">Price M Only</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Update Type</Label>
                  <Select
                    value={groupUpdateType}
                    onChange={(e) => setGroupUpdateType(e.target.value as any)}
                    className="mt-1 w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Value ({groupUpdateType === 'percentage' ? '%' : '$'})
                  </Label>
                  <Input
                    type="number"
                    step={groupUpdateType === 'percentage' ? '0.1' : '0.01'}
                    value={groupUpdateValue}
                    onChange={(e) => setGroupUpdateValue(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder={groupUpdateType === 'percentage' ? 'e.g. 10 or -5' : 'e.g. 5.00'}
                  />
                </div>
                <div className="sm:col-span-2 flex items-end gap-2">
                  <Button 
                    onClick={applyGroupUpdate} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={summary.selected === 0}
                  >
                    Apply to {summary.selected} Items
                  </Button>
                </div>
              </div>
            </div>

            {/* Group Statistics */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Group Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {(selectedGroupType === 'category' ? groupSummary.categoryGroups : groupSummary.brandGroups)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 12)
                  .map(group => (
                    <button
                      key={group.name}
                      onClick={() => setSelectedGroupValue(group.name)}
                      className={`p-2 rounded-lg border transition-all text-left ${
                        selectedGroupValue === group.name 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className="text-xs text-gray-600 truncate">{group.name}</p>
                      <p className="text-lg font-bold text-gray-900">{group.count}</p>
                    </button>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">
              {viewMode === 'individual' ? 'Individual Price Editor' : 'Group Price Editor'}
            </CardTitle>
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
                  className="pl-9 w-40"
                />
              </div>
              <Select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-32"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
              <Select
                value={brandFilter}
                onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
                className="w-28"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
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
                      checked={paginatedItems.length > 0 && paginatedItems.every(i => i.isSelected)}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-blue-50">New Cost</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price A</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-green-50">New A</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price B</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-yellow-50">New B</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price M</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-purple-50">New M</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-gray-500">Loading items...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === 'modified' ? 'bg-yellow-50/50' : ''} ${item.isSelected ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 text-sm">{item.partNo}</td>
                      <td className="px-3 py-2 text-gray-600 text-sm max-w-[120px] truncate">{item.description || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{item.category || '-'}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">${item.cost.toFixed(2)}</td>
                      <td className="px-3 py-2 bg-blue-50/50">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.newCost ?? ''}
                          onChange={(e) => handlePriceChange(item.id, 'newCost', e.target.value === '' ? null : parseFloat(e.target.value))}
                          className="w-20 text-center text-sm p-1"
                          placeholder={item.cost.toFixed(2)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-600">${item.priceA.toFixed(2)}</td>
                      <td className="px-3 py-2 bg-green-50/50">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.newPriceA ?? ''}
                          onChange={(e) => handlePriceChange(item.id, 'newPriceA', e.target.value === '' ? null : parseFloat(e.target.value))}
                          className="w-20 text-center text-sm p-1"
                          placeholder={item.priceA.toFixed(2)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-600">${item.priceB.toFixed(2)}</td>
                      <td className="px-3 py-2 bg-yellow-50/50">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.newPriceB ?? ''}
                          onChange={(e) => handlePriceChange(item.id, 'newPriceB', e.target.value === '' ? null : parseFloat(e.target.value))}
                          className="w-20 text-center text-sm p-1"
                          placeholder={item.priceB.toFixed(2)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-600">${item.priceM.toFixed(2)}</td>
                      <td className="px-3 py-2 bg-purple-50/50">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.newPriceM ?? ''}
                          onChange={(e) => handlePriceChange(item.id, 'newPriceM', e.target.value === '' ? null : parseFloat(e.target.value))}
                          className="w-20 text-center text-sm p-1"
                          placeholder={item.priceM.toFixed(2)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredItems.length)} of {filteredItems.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-48"
                  placeholder="Reason for update..."
                />
                <Button variant="outline" onClick={resetChanges} className="border-red-300 text-red-700 hover:bg-red-50">
                  Reset
                </Button>
                <Button 
                  onClick={applyChanges} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={summary.modified === 0 || loading}
                >
                  {loading ? 'Applying...' : `Apply ${summary.modified} Changes`}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

