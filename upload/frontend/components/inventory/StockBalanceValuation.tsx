'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface StockItem {
  id: string;
  partNo: string;
  description?: string;
  category?: string;
  brand?: string;
  uom?: string;
  quantity: number;
  cost: number;
  value: number;
  store?: string;
  rack?: string;
  shelf?: string;
  lastUpdated?: string;
}

interface ValuationSummary {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  categories: { name: string; value: number; count: number }[];
  byStore: { name: string; value: number; quantity: number }[];
}

export default function StockBalanceValuation() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [valuationMethod, setValuationMethod] = useState('average'); // average, fifo, lifo
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Master data
  const [categories, setCategories] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Summary
  const [summary, setSummary] = useState<ValuationSummary>({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    averageCost: 0,
    categories: [],
    byStore: [],
  });

  useEffect(() => {
    fetchStockData();
  }, [page, limit, categoryFilter, storeFilter]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=1000&status=A');
      const parts = response.data.parts || [];

      // Transform parts data to stock items
      const items: StockItem[] = parts.map((part: any) => ({
        id: part.id,
        partNo: part.partNo,
        description: part.description,
        category: part.mainCategory || 'Uncategorized',
        brand: part.brand,
        uom: part.uom,
        quantity: part.stock?.quantity || 0,
        cost: part.cost || 0,
        value: (part.stock?.quantity || 0) * (part.cost || 0),
        store: part.stock?.store || 'Main Store',
        rack: part.stock?.racks || '-',
        shelf: part.stock?.shelf || '-',
        lastUpdated: part.updatedAt,
      }));

      setStockItems(items);

      // Extract unique categories and stores
      const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))] as string[];
      const uniqueStores = [...new Set(items.map(item => item.store).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setStores(uniqueStores);

      // Calculate summary
      calculateSummary(items);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (items: StockItem[]) => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // Group by category
    const categoryMap = new Map<string, { value: number; count: number }>();
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      const existing = categoryMap.get(cat) || { value: 0, count: 0 };
      categoryMap.set(cat, {
        value: existing.value + item.value,
        count: existing.count + 1,
      });
    });
    const categorySummary = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);

    // Group by store
    const storeMap = new Map<string, { value: number; quantity: number }>();
    items.forEach(item => {
      const store = item.store || 'Unknown';
      const existing = storeMap.get(store) || { value: 0, quantity: 0 };
      storeMap.set(store, {
        value: existing.value + item.value,
        quantity: existing.quantity + item.quantity,
      });
    });
    const storeSummary = Array.from(storeMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);

    setSummary({
      totalItems,
      totalQuantity,
      totalValue,
      averageCost,
      categories: categorySummary,
      byStore: storeSummary,
    });
  };

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesStore = !storeFilter || item.store === storeFilter;
      return matchesSearch && matchesCategory && matchesStore;
    });
  }, [stockItems, searchTerm, categoryFilter, storeFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Part No', 'Description', 'Category', 'Brand', 'UOM', 'Quantity', 'Cost', 'Value', 'Store', 'Rack', 'Shelf'];
      const rows = filteredItems.map(item => [
        item.partNo,
        item.description || '',
        item.category || '',
        item.brand || '',
        item.uom || '',
        item.quantity,
        item.cost.toFixed(2),
        item.value.toFixed(2),
        item.store || '',
        item.rack || '',
        item.shelf || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stock-balance-valuation-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      // PDF Export
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Stock Balance & Valuation Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #ff6b35; color: white; font-weight: bold; }
              h1 { color: #333; margin-bottom: 5px; }
              .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
              .summary-card { background: #f9f9f9; padding: 15px; border-radius: 8px; }
              .summary-card h3 { margin: 0 0 5px 0; color: #666; font-size: 12px; }
              .summary-card p { margin: 0; font-size: 18px; font-weight: bold; color: #333; }
              .report-date { color: #666; margin-bottom: 20px; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .text-right { text-align: right; }
              .total-row { background-color: #ff6b35 !important; color: white; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Stock Balance & Valuation Report</h1>
            <p class="report-date">Generated on: ${new Date().toLocaleString()}</p>
            
            <div class="summary">
              <div class="summary-card">
                <h3>Total Items</h3>
                <p>${summary.totalItems.toLocaleString()}</p>
              </div>
              <div class="summary-card">
                <h3>Total Quantity</h3>
                <p>${summary.totalQuantity.toLocaleString()}</p>
              </div>
              <div class="summary-card">
                <h3>Total Value</h3>
                <p>Rs ${summary.totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="summary-card">
                <h3>Average Cost</h3>
                <p>Rs ${summary.averageCost.toFixed(2)}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Part No</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>UOM</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Cost</th>
                  <th class="text-right">Value</th>
                  <th>Store</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                ${filteredItems.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.partNo}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.uom || '-'}</td>
                    <td class="text-right">${item.quantity.toLocaleString()}</td>
                    <td class="text-right">Rs ${item.cost.toFixed(2)}</td>
                    <td class="text-right">Rs ${item.value.toFixed(2)}</td>
                    <td>${item.store || '-'}</td>
                    <td>${item.rack}/${item.shelf}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="5">TOTAL</td>
                  <td class="text-right">${summary.totalQuantity.toLocaleString()}</td>
                  <td class="text-right">-</td>
                  <td class="text-right">Rs ${summary.totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  <td colspan="2"></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Balance & Valuation</h1>
            <p className="text-xs sm:text-sm text-gray-500">View inventory valuation and stock levels</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-orange-50 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-700">Total Items</p>
                <p className="text-3xl font-bold text-primary-900">{summary.totalItems.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Quantity</p>
                <p className="text-3xl font-bold text-blue-900">{summary.totalQuantity.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Value</p>
                <p className="text-3xl font-bold text-green-900">Rs {summary.totalValue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Avg. Unit Cost</p>
                <p className="text-3xl font-bold text-purple-900">Rs {summary.averageCost.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="lg:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Search</Label>
              <div className="relative mt-1">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search by part number or description..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Category</Label>
              <Select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="mt-1 w-full"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Store</Label>
              <Select
                value={storeFilter}
                onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
                className="mt-1 w-full"
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Valuation Method</Label>
              <Select
                value={valuationMethod}
                onChange={(e) => setValuationMethod(e.target.value)}
                className="mt-1 w-full"
              >
                <option value="average">Average Cost</option>
                <option value="fifo">FIFO</option>
                <option value="lifo">LIFO</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-md">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Value by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {summary.categories.slice(0, 6).map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">{cat.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${(cat.value / summary.totalValue) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 w-28 text-right">
                    ${cat.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Stock by Store</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {summary.byStore.slice(0, 6).map((store) => (
                <div key={store.name} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">{store.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(store.quantity / summary.totalQuantity) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 w-20 text-right">
                    {store.quantity.toLocaleString()} pcs
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Stock Inventory Details</CardTitle>
            <div className="text-sm text-gray-500">
              Showing {filteredItems.length} of {stockItems.length} items
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sr.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">UOM</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
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
                        <span className="text-gray-500">Loading stock data...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      No stock items found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{item.partNo}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {item.category || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.uom || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${item.quantity === 0 ? 'text-red-600' : item.quantity < 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        ${item.cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-green-600">
                          ${item.value.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.store || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.rack}/{item.shelf}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-primary-50 border-t-2 border-primary-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {filteredItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    ${filteredItems.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
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
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

