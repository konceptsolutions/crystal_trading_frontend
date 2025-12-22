'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface PriceLevel {
  id: string;
  name: string;
  code: string;
  description: string;
  marginType: 'percentage' | 'fixed';
  marginValue: number;
  minMargin: number;
  maxDiscount: number;
  isDefault: boolean;
  status: 'active' | 'inactive';
  customerTypes: string[];
  createdAt: string;
}

interface PriceLevelItem {
  id: string;
  partNo: string;
  description?: string;
  brand?: string;
  cost: number;
  priceA: number;
  priceB: number;
  priceM: number;
  customPrices: { [levelId: string]: number };
}

export default function PriceLevels() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'levels' | 'items'>('levels');
  
  // Price Levels
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([
    { id: '1', name: 'Retail Price', code: 'RETAIL', description: 'Standard retail price for walk-in customers', marginType: 'percentage', marginValue: 50, minMargin: 20, maxDiscount: 10, isDefault: true, status: 'active', customerTypes: ['Walk-in', 'Retail'], createdAt: new Date().toISOString() },
    { id: '2', name: 'Wholesale Price', code: 'WHOLESALE', description: 'Discounted price for wholesale buyers', marginType: 'percentage', marginValue: 30, minMargin: 15, maxDiscount: 15, isDefault: false, status: 'active', customerTypes: ['Wholesale', 'Distributor'], createdAt: new Date().toISOString() },
    { id: '3', name: 'Dealer Price', code: 'DEALER', description: 'Special pricing for authorized dealers', marginType: 'percentage', marginValue: 25, minMargin: 10, maxDiscount: 20, isDefault: false, status: 'active', customerTypes: ['Dealer'], createdAt: new Date().toISOString() },
    { id: '4', name: 'Mechanic Price', code: 'MECHANIC', description: 'Pricing for mechanics and garages', marginType: 'percentage', marginValue: 35, minMargin: 15, maxDiscount: 15, isDefault: false, status: 'active', customerTypes: ['Mechanic', 'Garage'], createdAt: new Date().toISOString() },
  ]);
  
  const [selectedLevel, setSelectedLevel] = useState<PriceLevel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMarginType, setFormMarginType] = useState<'percentage' | 'fixed'>('percentage');
  const [formMarginValue, setFormMarginValue] = useState(0);
  const [formMinMargin, setFormMinMargin] = useState(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState(10);
  
  // Items with pricing
  const [items, setItems] = useState<PriceLevelItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [brands, setBrands] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const parts = response.data.parts || [];

      const priceItems: PriceLevelItem[] = parts.map((part: any) => ({
        id: part.id,
        partNo: part.partNo,
        description: part.description,
        brand: part.brand,
        cost: part.cost || 0,
        priceA: part.priceA || 0,
        priceB: part.priceB || 0,
        priceM: part.priceM || 0,
        customPrices: {},
      }));

      setItems(priceItems);
      
      const uniqueBrands = Array.from(new Set(parts.map((p: any) => p.brand).filter(Boolean))) as string[];
      setBrands(uniqueBrands);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormMarginType('percentage');
    setFormMarginValue(0);
    setFormMinMargin(10);
    setFormMaxDiscount(10);
    setSelectedLevel(null);
    setIsEditing(false);
  };

  const editLevel = (level: PriceLevel) => {
    setSelectedLevel(level);
    setFormName(level.name);
    setFormCode(level.code);
    setFormDescription(level.description);
    setFormMarginType(level.marginType);
    setFormMarginValue(level.marginValue);
    setFormMinMargin(level.minMargin);
    setFormMaxDiscount(level.maxDiscount);
    setIsEditing(true);
  };

  const saveLevel = () => {
    if (!formName || !formCode) {
      setError('Name and Code are required');
      return;
    }

    if (isEditing && selectedLevel) {
      setPriceLevels(prev => prev.map(level => 
        level.id === selectedLevel.id
          ? {
              ...level,
              name: formName,
              code: formCode,
              description: formDescription,
              marginType: formMarginType,
              marginValue: formMarginValue,
              minMargin: formMinMargin,
              maxDiscount: formMaxDiscount,
            }
          : level
      ));
      setSuccess('Price level updated successfully!');
    } else {
      const newLevel: PriceLevel = {
        id: Date.now().toString(),
        name: formName,
        code: formCode,
        description: formDescription,
        marginType: formMarginType,
        marginValue: formMarginValue,
        minMargin: formMinMargin,
        maxDiscount: formMaxDiscount,
        isDefault: false,
        status: 'active',
        customerTypes: [],
        createdAt: new Date().toISOString(),
      };
      setPriceLevels(prev => [...prev, newLevel]);
      setSuccess('Price level created successfully!');
    }

    resetForm();
    setTimeout(() => setSuccess(''), 3000);
  };

  const deleteLevel = (levelId: string) => {
    const level = priceLevels.find(l => l.id === levelId);
    if (level?.isDefault) {
      setError('Cannot delete the default price level');
      return;
    }

    if (!confirm('Are you sure you want to delete this price level?')) return;

    setPriceLevels(prev => prev.filter(l => l.id !== levelId));
    setSuccess('Price level deleted successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const setDefaultLevel = (levelId: string) => {
    setPriceLevels(prev => prev.map(level => ({
      ...level,
      isDefault: level.id === levelId,
    })));
    setSuccess('Default price level updated!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const calculatePriceForLevel = (cost: number, level: PriceLevel) => {
    if (level.marginType === 'percentage') {
      return cost * (1 + level.marginValue / 100);
    }
    return cost + level.marginValue;
  };

  const applyLevelToAllItems = async (level: PriceLevel, priceField: 'priceA' | 'priceB' | 'priceM') => {
    if (!confirm(`This will update ${priceField} for all items based on the "${level.name}" margin (${level.marginValue}%). Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      // In production, this would be a batch API call
      for (const item of items) {
        const newPrice = calculatePriceForLevel(item.cost, level);
        await api.put(`/parts/${item.id}`, { [priceField]: newPrice });
      }
      
      setSuccess(`Successfully updated ${priceField} for all items!`);
      loadItems();
    } catch (err) {
      setError('Failed to update prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = !brandFilter || item.brand === brandFilter;
      return matchesSearch && matchesBrand;
    });
  }, [items, searchTerm, brandFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Price Levels Management</h2>
            <p className="text-sm text-gray-500">Configure multiple selling price levels for different customer types</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'levels' ? 'default' : 'outline'}
            onClick={() => setViewMode('levels')}
          >
            Price Levels
          </Button>
          <Button
            variant={viewMode === 'items' ? 'default' : 'outline'}
            onClick={() => setViewMode('items')}
          >
            Item Pricing
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

      {viewMode === 'levels' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price Levels List */}
          <div className="lg:col-span-2 space-y-4">
            {priceLevels.map((level) => (
              <Card key={level.id} className={`border-2 transition-all ${level.isDefault ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{level.name}</h3>
                        <span className="px-2 py-1 text-xs font-mono font-medium bg-gray-100 text-gray-700 rounded">
                          {level.code}
                        </span>
                        {level.isDefault && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                            Default
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          level.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {level.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 uppercase">Margin</p>
                          <p className="text-lg font-bold text-blue-700">
                            {level.marginValue}{level.marginType === 'percentage' ? '%' : '$'}
                          </p>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 uppercase">Min Margin</p>
                          <p className="text-lg font-bold text-green-700">{level.minMargin}%</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600 uppercase">Max Discount</p>
                          <p className="text-lg font-bold text-red-700">{level.maxDiscount}%</p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-600 uppercase">Customer Types</p>
                          <p className="text-sm font-medium text-purple-700 truncate">{level.customerTypes.join(', ') || 'All'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => editLevel(level)}>
                        Edit
                      </Button>
                      {!level.isDefault && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setDefaultLevel(level.id)}>
                            Set Default
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteLevel(level.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Apply Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 mr-2 self-center">Apply to all items:</span>
                    <Button 
                      variant="outline" 
                      size="xs"
                      onClick={() => applyLevelToAllItems(level, 'priceA')}
                      disabled={loading}
                    >
                      Price A
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs"
                      onClick={() => applyLevelToAllItems(level, 'priceB')}
                      disabled={loading}
                    >
                      Price B
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs"
                      onClick={() => applyLevelToAllItems(level, 'priceM')}
                      disabled={loading}
                    >
                      Price M
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create/Edit Form */}
          <Card className="h-fit border-2 border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
              <CardTitle className="text-lg">
                {isEditing ? 'Edit Price Level' : 'Create Price Level'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Level Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. VIP Customer Price"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Code *</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="mt-1 font-mono"
                  placeholder="e.g. VIP"
                  maxLength={10}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1"
                  placeholder="Brief description of this price level"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Margin Type</Label>
                  <Select
                    value={formMarginType}
                    onChange={(e) => setFormMarginType(e.target.value as any)}
                    className="mt-1 w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Margin Value {formMarginType === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    type="number"
                    step={formMarginType === 'percentage' ? '1' : '0.01'}
                    value={formMarginValue}
                    onChange={(e) => setFormMarginValue(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Min Margin (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formMinMargin}
                    onChange={(e) => setFormMinMargin(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Max Discount (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <Button onClick={saveLevel} className="w-full">
                  {isEditing ? 'Update Price Level' : 'Create Price Level'}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={resetForm} className="w-full">
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Items Pricing View */
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Item Price Levels</CardTitle>
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
                  value={brandFilter}
                  onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
                  className="w-36"
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                    {priceLevels.filter(l => l.status === 'active').map(level => (
                      <th key={level.id} className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-purple-50">
                        {level.code}
                        <span className="block text-[10px] font-normal text-purple-500">
                          +{level.marginValue}{level.marginType === 'percentage' ? '%' : '$'}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50">Price A</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50">Price B</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Price M</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6 + priceLevels.filter(l => l.status === 'active').length} className="px-6 py-12 text-center">
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
                      <td colSpan={6 + priceLevels.filter(l => l.status === 'active').length} className="px-6 py-12 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 text-sm">{item.partNo}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm max-w-[200px] truncate">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${item.cost.toFixed(2)}</td>
                        {priceLevels.filter(l => l.status === 'active').map(level => (
                          <td key={level.id} className="px-4 py-3 text-right text-sm bg-purple-50/50">
                            <span className="font-medium text-purple-700">
                              ${calculatePriceForLevel(item.cost, level).toFixed(2)}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right text-sm bg-blue-50/50 font-medium text-blue-700">
                          ${item.priceA.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm bg-green-50/50 font-medium text-green-700">
                          ${item.priceB.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm bg-yellow-50/50 font-medium text-yellow-700">
                          ${item.priceM.toFixed(2)}
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

