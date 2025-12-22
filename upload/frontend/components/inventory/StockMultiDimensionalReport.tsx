'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface ReportDimension {
  key: string;
  label: string;
  type: 'category' | 'brand' | 'store' | 'origin' | 'uom' | 'grade' | 'status';
}

interface ReportData {
  dimension1: string;
  dimension2?: string;
  dimension3?: string;
  quantity: number;
  value: number;
  itemCount: number;
  avgCost: number;
}

const DIMENSIONS: ReportDimension[] = [
  { key: 'category', label: 'Category', type: 'category' },
  { key: 'brand', label: 'Brand', type: 'brand' },
  { key: 'store', label: 'Store', type: 'store' },
  { key: 'origin', label: 'Origin', type: 'origin' },
  { key: 'uom', label: 'Unit of Measure', type: 'uom' },
  { key: 'grade', label: 'Grade', type: 'grade' },
  { key: 'status', label: 'Status', type: 'status' },
];

export default function StockMultiDimensionalReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parts, setParts] = useState<any[]>([]);

  // Dimension Selection
  const [dimension1, setDimension1] = useState('category');
  const [dimension2, setDimension2] = useState('');
  const [dimension3, setDimension3] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Report Data
  const [reportData, setReportData] = useState<ReportData[]>([]);

  // Master Data
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // View Mode
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [sortBy, setSortBy] = useState<'value' | 'quantity' | 'itemCount'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (parts.length > 0) {
      generateReport();
    }
  }, [parts, dimension1, dimension2, dimension3, categoryFilter, brandFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const partsData = response.data.parts || [];
      setParts(partsData);

      // Extract unique values for filters
      const uniqueCategories = [...new Set(partsData.map((p: any) => p.mainCategory).filter(Boolean))] as string[];
      const uniqueBrands = [...new Set(partsData.map((p: any) => p.brand).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getDimensionValue = (part: any, dimension: string): string => {
    const mapping: Record<string, string> = {
      category: part.mainCategory || 'Uncategorized',
      brand: part.brand || 'No Brand',
      store: part.stock?.store || 'Main Store',
      origin: part.origin || 'Unknown',
      uom: part.uom || 'Pcs',
      grade: part.grade || 'Standard',
      status: part.status === 'A' ? 'Active' : 'Inactive',
    };
    return mapping[dimension] || 'Unknown';
  };

  const generateReport = () => {
    // Filter parts
    let filteredParts = parts;
    if (categoryFilter) {
      filteredParts = filteredParts.filter(p => p.mainCategory === categoryFilter);
    }
    if (brandFilter) {
      filteredParts = filteredParts.filter(p => p.brand === brandFilter);
    }

    // Group by dimensions
    const groupKey = (part: any): string => {
      const keys = [getDimensionValue(part, dimension1)];
      if (dimension2) keys.push(getDimensionValue(part, dimension2));
      if (dimension3) keys.push(getDimensionValue(part, dimension3));
      return keys.join('|||');
    };

    const groups = new Map<string, { quantity: number; value: number; count: number }>();
    
    filteredParts.forEach(part => {
      const key = groupKey(part);
      const quantity = part.stock?.quantity || 0;
      const cost = part.cost || 0;
      const value = quantity * cost;

      const existing = groups.get(key) || { quantity: 0, value: 0, count: 0 };
      groups.set(key, {
        quantity: existing.quantity + quantity,
        value: existing.value + value,
        count: existing.count + 1,
      });
    });

    // Convert to report data
    const data: ReportData[] = Array.from(groups.entries()).map(([key, data]) => {
      const dimensions = key.split('|||');
      return {
        dimension1: dimensions[0],
        dimension2: dimensions[1],
        dimension3: dimensions[2],
        quantity: data.quantity,
        value: data.value,
        itemCount: data.count,
        avgCost: data.quantity > 0 ? data.value / data.quantity : 0,
      };
    });

    // Sort
    data.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return multiplier * (a[sortBy] - b[sortBy]);
    });

    setReportData(data);
  };

  const totals = useMemo(() => {
    return reportData.reduce(
      (acc, row) => ({
        quantity: acc.quantity + row.quantity,
        value: acc.value + row.value,
        itemCount: acc.itemCount + row.itemCount,
      }),
      { quantity: 0, value: 0, itemCount: 0 }
    );
  }, [reportData]);

  const getDimensionLabel = (key: string): string => {
    return DIMENSIONS.find(d => d.key === key)?.label || key;
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const headers = [getDimensionLabel(dimension1)];
    if (dimension2) headers.push(getDimensionLabel(dimension2));
    if (dimension3) headers.push(getDimensionLabel(dimension3));
    headers.push('Items', 'Quantity', 'Value', 'Avg Cost');

    if (format === 'csv') {
      const rows = reportData.map(row => {
        const values = [row.dimension1];
        if (dimension2) values.push(row.dimension2 || '');
        if (dimension3) values.push(row.dimension3 || '');
        values.push(
          row.itemCount.toString(),
          row.quantity.toString(),
          row.value.toFixed(2),
          row.avgCost.toFixed(2)
        );
        return values;
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `multi-dimensional-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Multi-Dimensional Stock Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #ff6b35; color: white; font-weight: bold; }
              h1 { color: #333; margin-bottom: 5px; }
              .report-info { color: #666; margin-bottom: 20px; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .text-right { text-align: right; }
              .total-row { background-color: #ff6b35 !important; color: white; font-weight: bold; }
              .dimensions { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <h1>Multi-Dimensional Stock Report</h1>
            <p class="report-info">Generated on: ${new Date().toLocaleString()}</p>
            
            <div class="dimensions">
              <strong>Report Dimensions:</strong> ${getDimensionLabel(dimension1)}${dimension2 ? ` → ${getDimensionLabel(dimension2)}` : ''}${dimension3 ? ` → ${getDimensionLabel(dimension3)}` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${reportData.map(row => `
                  <tr>
                    <td>${row.dimension1}</td>
                    ${dimension2 ? `<td>${row.dimension2 || '-'}</td>` : ''}
                    ${dimension3 ? `<td>${row.dimension3 || '-'}</td>` : ''}
                    <td class="text-right">${row.itemCount.toLocaleString()}</td>
                    <td class="text-right">${row.quantity.toLocaleString()}</td>
                    <td class="text-right">Rs ${row.value.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">Rs ${row.avgCost.toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="${1 + (dimension2 ? 1 : 0) + (dimension3 ? 1 : 0)}">TOTAL</td>
                  <td class="text-right">${totals.itemCount.toLocaleString()}</td>
                  <td class="text-right">${totals.quantity.toLocaleString()}</td>
                  <td class="text-right">Rs ${totals.value.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right">-</td>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Multi-Dimensional Stock Report</h1>
            <p className="text-xs sm:text-sm text-gray-500">Analyze stock by multiple dimensions</p>
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

      {/* Dimension Selector */}
      <Card className="shadow-md border-2 border-primary-100">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Primary Dimension */}
            <div>
              <Label className="text-sm font-semibold text-primary-700">Primary Dimension *</Label>
              <Select
                value={dimension1}
                onChange={(e) => setDimension1(e.target.value)}
                className="mt-1 w-full border-primary-200 focus:border-primary-500"
              >
                {DIMENSIONS.map(dim => (
                  <option key={dim.key} value={dim.key}>{dim.label}</option>
                ))}
              </Select>
            </div>

            {/* Secondary Dimension */}
            <div>
              <Label className="text-sm font-semibold text-blue-700">Secondary Dimension</Label>
              <Select
                value={dimension2}
                onChange={(e) => setDimension2(e.target.value)}
                className="mt-1 w-full border-blue-200 focus:border-blue-500"
              >
                <option value="">None</option>
                {DIMENSIONS.filter(d => d.key !== dimension1).map(dim => (
                  <option key={dim.key} value={dim.key}>{dim.label}</option>
                ))}
              </Select>
            </div>

            {/* Tertiary Dimension */}
            <div>
              <Label className="text-sm font-semibold text-green-700">Tertiary Dimension</Label>
              <Select
                value={dimension3}
                onChange={(e) => setDimension3(e.target.value)}
                className="mt-1 w-full border-green-200 focus:border-green-500"
                disabled={!dimension2}
              >
                <option value="">None</option>
                {DIMENSIONS.filter(d => d.key !== dimension1 && d.key !== dimension2).map(dim => (
                  <option key={dim.key} value={dim.key}>{dim.label}</option>
                ))}
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Filter by Category</Label>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-1 w-full"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Filter by Brand</Label>
              <Select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="mt-1 w-full"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Sort By</Label>
              <div className="flex gap-1 mt-1">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full"
                >
                  <option value="value">Value</option>
                  <option value="quantity">Quantity</option>
                  <option value="itemCount">Items</option>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  className="px-2"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Dimensions:</span>{' '}
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{getDimensionLabel(dimension1)}</span>
              {dimension2 && (
                <>
                  <span className="mx-1">→</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{getDimensionLabel(dimension2)}</span>
                </>
              )}
              {dimension3 && (
                <>
                  <span className="mx-1">→</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{getDimensionLabel(dimension3)}</span>
                </>
              )}
            </div>
            <Button onClick={generateReport} className="bg-primary-500 hover:bg-primary-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-orange-50 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-700">Total Groups</p>
                <p className="text-3xl font-bold text-primary-900">{reportData.length.toLocaleString()}</p>
                <p className="text-xs text-primary-600 mt-1">{totals.itemCount.toLocaleString()} total items</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
                <p className="text-3xl font-bold text-blue-900">{totals.quantity.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">across all groups</p>
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
                <p className="text-3xl font-bold text-green-900">${totals.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-green-600 mt-1">inventory value</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Report Results</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{reportData.length} groups found</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    {getDimensionLabel(dimension1)}
                  </th>
                  {dimension2 && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {getDimensionLabel(dimension2)}
                    </th>
                  )}
                  {dimension3 && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      {getDimensionLabel(dimension3)}
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% of Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Avg Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-gray-500">Generating report...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No data to display. Adjust filters and generate report.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => {
                    const percentage = totals.value > 0 ? (row.value / totals.value) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-primary-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{row.dimension1}</span>
                        </td>
                        {dimension2 && (
                          <td className="px-4 py-3 text-sm text-gray-600">{row.dimension2 || '-'}</td>
                        )}
                        {dimension3 && (
                          <td className="px-4 py-3 text-sm text-gray-600">{row.dimension3 || '-'}</td>
                        )}
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{row.itemCount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-gray-900">{row.quantity.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-green-600">${row.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-orange-500 rounded-full"
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">{percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">${row.avgCost.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {reportData.length > 0 && (
                <tfoot className="bg-primary-50 border-t-2 border-primary-200">
                  <tr>
                    <td className="px-4 py-3 font-bold text-gray-900" colSpan={dimension2 ? (dimension3 ? 3 : 2) : 1}>
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{totals.itemCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{totals.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">${totals.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">100%</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

