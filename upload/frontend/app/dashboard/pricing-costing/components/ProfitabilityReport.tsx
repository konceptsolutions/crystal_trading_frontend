'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface ItemProfitability {
  id: string;
  partNo: string;
  description?: string;
  category?: string;
  brand?: string;
  cost: number;
  priceA: number;
  quantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  salesCount: number;
}

interface BrandProfitability {
  brand: string;
  itemCount: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  avgMargin: number;
  topItems: ItemProfitability[];
}

interface CustomerProfitability {
  id: string;
  name: string;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  avgOrderValue: number;
  profitMargin: number;
}

export default function ProfitabilityReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'item' | 'brand' | 'customer'>('item');
  
  // Date Range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Data
  const [itemData, setItemData] = useState<ItemProfitability[]>([]);
  const [brandData, setBrandData] = useState<BrandProfitability[]>([]);
  const [customerData, setCustomerData] = useState<CustomerProfitability[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'revenue'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Master Data
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load parts data
      const partsResponse = await api.get('/parts?limit=2000&status=A');
      const parts = partsResponse.data.parts || [];

      // Load sales data
      let salesInvoices: any[] = [];
      try {
        const salesResponse = await api.get('/sales-invoices');
        salesInvoices = salesResponse.data.invoices || [];
      } catch (e) {
        console.log('No sales data available');
      }

      // Load customers data
      let customers: any[] = [];
      try {
        const customersResponse = await api.get('/customers');
        customers = customersResponse.data.customers || [];
      } catch (e) {
        console.log('No customers data available');
      }

      // Calculate item profitability
      const itemProfitability: ItemProfitability[] = parts.map((part: any) => {
        const cost = part.cost || 0;
        const priceA = part.priceA || 0;
        const quantity = part.stock?.quantity || 0;
        
        // Calculate from inventory value
        const totalRevenue = quantity * priceA;
        const totalCost = quantity * cost;
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return {
          id: part.id,
          partNo: part.partNo,
          description: part.description,
          category: part.mainCategory || 'Uncategorized',
          brand: part.brand || 'Unknown',
          cost,
          priceA,
          quantity,
          totalRevenue,
          totalCost,
          grossProfit,
          profitMargin,
          salesCount: 0, // Would be calculated from actual sales data
        };
      });

      setItemData(itemProfitability);

      // Calculate brand profitability
      const brandMap = new Map<string, BrandProfitability>();
      itemProfitability.forEach(item => {
        const brand = item.brand || 'Unknown';
        if (!brandMap.has(brand)) {
          brandMap.set(brand, {
            brand,
            itemCount: 0,
            totalRevenue: 0,
            totalCost: 0,
            grossProfit: 0,
            avgMargin: 0,
            topItems: [],
          });
        }
        const brandStats = brandMap.get(brand)!;
        brandStats.itemCount++;
        brandStats.totalRevenue += item.totalRevenue;
        brandStats.totalCost += item.totalCost;
        brandStats.grossProfit += item.grossProfit;
        brandStats.topItems.push(item);
      });

      brandMap.forEach(brandStats => {
        brandStats.avgMargin = brandStats.totalRevenue > 0 
          ? (brandStats.grossProfit / brandStats.totalRevenue) * 100 
          : 0;
        brandStats.topItems = brandStats.topItems
          .sort((a, b) => b.grossProfit - a.grossProfit)
          .slice(0, 5);
      });

      setBrandData(Array.from(brandMap.values()).sort((a, b) => b.grossProfit - a.grossProfit));

      // Calculate customer profitability
      const customerProfitability: CustomerProfitability[] = customers.map((customer: any) => {
        // In production, this would aggregate actual sales data
        return {
          id: customer.id,
          name: customer.name,
          totalOrders: 0,
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          avgOrderValue: 0,
          profitMargin: 0,
        };
      });

      setCustomerData(customerProfitability);

      // Extract filter options
      const uniqueCategories = [...new Set(parts.map((p: any) => p.mainCategory).filter(Boolean))] as string[];
      const uniqueBrands = [...new Set(parts.map((p: any) => p.brand).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load profitability data');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalRevenue = itemData.reduce((sum, i) => sum + i.totalRevenue, 0);
    const totalCost = itemData.reduce((sum, i) => sum + i.totalCost, 0);
    const grossProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const profitableItems = itemData.filter(i => i.grossProfit > 0).length;
    const unprofitableItems = itemData.filter(i => i.grossProfit <= 0).length;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      avgMargin,
      profitableItems,
      unprofitableItems,
      totalItems: itemData.length,
    };
  }, [itemData]);

  const filteredItems = useMemo(() => {
    let filtered = itemData.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesBrand = !brandFilter || item.brand === brandFilter;
      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = sortBy === 'profit' ? a.grossProfit : sortBy === 'margin' ? a.profitMargin : a.totalRevenue;
      const bVal = sortBy === 'profit' ? b.grossProfit : sortBy === 'margin' ? b.profitMargin : b.totalRevenue;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [itemData, searchTerm, categoryFilter, brandFilter, sortBy, sortOrder]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const exportReport = () => {
    let csvContent = '';
    
    if (viewMode === 'item') {
      const headers = ['Part No', 'Description', 'Category', 'Brand', 'Cost', 'Price', 'Qty', 'Revenue', 'Cost Total', 'Profit', 'Margin %'];
      const rows = filteredItems.map(item => [
        item.partNo,
        item.description || '',
        item.category,
        item.brand,
        item.cost.toFixed(2),
        item.priceA.toFixed(2),
        item.quantity,
        item.totalRevenue.toFixed(2),
        item.totalCost.toFixed(2),
        item.grossProfit.toFixed(2),
        item.profitMargin.toFixed(2),
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    } else if (viewMode === 'brand') {
      const headers = ['Brand', 'Items', 'Revenue', 'Cost', 'Profit', 'Avg Margin %'];
      const rows = brandData.map(b => [
        b.brand,
        b.itemCount,
        b.totalRevenue.toFixed(2),
        b.totalCost.toFixed(2),
        b.grossProfit.toFixed(2),
        b.avgMargin.toFixed(2),
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profitability-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return `Rs ${value.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profitability Reports</h2>
            <p className="text-sm text-gray-500">Analyze profit margins by item, brand, or customer</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'item' ? 'default' : 'outline'}
            onClick={() => setViewMode('item')}
          >
            By Item
          </Button>
          <Button
            variant={viewMode === 'brand' ? 'default' : 'outline'}
            onClick={() => setViewMode('brand')}
          >
            By Brand
          </Button>
          <Button
            variant={viewMode === 'customer' ? 'default' : 'outline'}
            onClick={() => setViewMode('customer')}
          >
            By Customer
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Potential Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalRevenue)}</p>
                <p className="text-blue-200 text-xs mt-1">{summary.totalItems} items in stock</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Cost</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalCost)}</p>
                <p className="text-red-200 text-xs mt-1">Inventory investment</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Gross Profit</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.grossProfit)}</p>
                <p className="text-emerald-200 text-xs mt-1">{summary.avgMargin.toFixed(1)}% average margin</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Profit Ratio</p>
                <p className="text-2xl font-bold mt-1">{summary.profitableItems}</p>
                <p className="text-purple-200 text-xs mt-1">
                  <span className="text-green-300">{summary.profitableItems} profitable</span>
                  {' / '}
                  <span className="text-red-300">{summary.unprofitableItems} unprofitable</span>
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'item' && (
        /* Item Profitability Table */
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Item Profitability</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9 w-36"
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
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-28"
                >
                  <option value="profit">By Profit</option>
                  <option value="margin">By Margin</option>
                  <option value="revenue">By Revenue</option>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}>
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </Button>
                <Button variant="outline" size="sm" onClick={exportReport}>
                  Export
                </Button>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Brand</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-red-50">Cost Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50">Profit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-purple-50">Margin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          <span className="text-gray-500">Loading data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.grossProfit < 0 ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900 text-sm">{item.partNo}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm max-w-[150px] truncate">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{item.brand}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">${item.cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">${item.priceA.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-blue-700 bg-blue-50/50">
                          ${item.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-red-700 bg-red-50/50">
                          ${item.totalCost.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold bg-green-50/50 ${item.grossProfit < 0 ? 'text-red-600' : 'text-green-700'}`}>
                          ${item.grossProfit.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold bg-purple-50/50 ${item.profitMargin < 10 ? 'text-red-600' : 'text-purple-700'}`}>
                          {item.profitMargin.toFixed(1)}%
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
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredItems.length)} of {filteredItems.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded">{page} / {totalPages || 1}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'brand' && (
        /* Brand Profitability */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Cards */}
          <Card className="lg:col-span-2">
            <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Brand Profitability Ranking</CardTitle>
              <Button variant="outline" size="sm" onClick={exportReport}>
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {brandData.slice(0, 10).map((brand, index) => (
                  <div key={brand.brand} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' :
                      'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{brand.brand}</h4>
                        <span className="text-sm text-gray-500">{brand.itemCount} items</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full ${brand.avgMargin >= 30 ? 'bg-green-500' : brand.avgMargin >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, brand.avgMargin)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-blue-600">Revenue: {formatCurrency(brand.totalRevenue)}</span>
                        <span className="text-green-600">Profit: {formatCurrency(brand.grossProfit)}</span>
                        <span className={brand.avgMargin >= 30 ? 'text-green-600' : brand.avgMargin >= 15 ? 'text-yellow-600' : 'text-red-600'}>
                          Margin: {brand.avgMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'customer' && (
        /* Customer Profitability */
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Customer Profitability</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Profitability Analysis</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Customer profitability analysis requires sales transaction data. 
                Once sales invoices are recorded, this report will show profit contribution by customer.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

