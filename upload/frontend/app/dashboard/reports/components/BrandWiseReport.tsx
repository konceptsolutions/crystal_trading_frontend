'use client';

import { useState, useEffect } from 'react';

interface BrandData {
  id: string;
  name: string;
  totalProducts: number;
  totalSales: number;
  totalPurchases: number;
  avgPrice: number;
  profit: number;
  margin: number;
  stockValue: number;
  trend: 'up' | 'down' | 'stable';
}

export default function BrandWiseReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'sales' | 'profit' | 'margin'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data for demonstration
  const [brandData, setBrandData] = useState<BrandData[]>([
    { id: '1', name: 'Toyota', totalProducts: 245, totalSales: 1250000, totalPurchases: 980000, avgPrice: 5100, profit: 270000, margin: 21.6, stockValue: 450000, trend: 'up' },
    { id: '2', name: 'Honda', totalProducts: 189, totalSales: 980000, totalPurchases: 750000, avgPrice: 5180, profit: 230000, margin: 23.5, stockValue: 380000, trend: 'up' },
    { id: '3', name: 'Suzuki', totalProducts: 156, totalSales: 750000, totalPurchases: 590000, avgPrice: 4807, profit: 160000, margin: 21.3, stockValue: 290000, trend: 'stable' },
    { id: '4', name: 'Nissan', totalProducts: 98, totalSales: 520000, totalPurchases: 420000, avgPrice: 5306, profit: 100000, margin: 19.2, stockValue: 180000, trend: 'down' },
    { id: '5', name: 'Mitsubishi', totalProducts: 75, totalSales: 380000, totalPurchases: 305000, avgPrice: 5067, profit: 75000, margin: 19.7, stockValue: 145000, trend: 'stable' },
  ]);

  const summaryStats = {
    totalBrands: brandData.length,
    totalSales: brandData.reduce((sum, b) => sum + b.totalSales, 0),
    totalProfit: brandData.reduce((sum, b) => sum + b.profit, 0),
    avgMargin: brandData.reduce((sum, b) => sum + b.margin, 0) / brandData.length,
    totalStockValue: brandData.reduce((sum, b) => sum + b.stockValue, 0),
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedData = [...brandData].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'sales':
        return multiplier * (a.totalSales - b.totalSales);
      case 'profit':
        return multiplier * (a.profit - b.profit);
      case 'margin':
        return multiplier * (a.margin - b.margin);
      default:
        return 0;
    }
  });

  const formatCurrency = (value: number) => {
    return `Rs ${value.toLocaleString()}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <span className="flex items-center text-emerald-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Rising
          </span>
        );
      case 'down':
        return (
          <span className="flex items-center text-red-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Falling
          </span>
        );
      default:
        return (
          <span className="flex items-center text-gray-500 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            Stable
          </span>
        );
    }
  };

  // Simple bar for chart visualization
  const maxSales = Math.max(...brandData.map(b => b.totalSales));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Brand Wise Report</h2>
          <p className="text-gray-500 text-sm">Analyze sales, purchases, and performance by brand</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'chart' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Brands</option>
              {brandData.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <div className="text-primary-600 text-sm font-medium">Total Brands</div>
          <div className="text-2xl font-bold text-primary-900 mt-1">{summaryStats.totalBrands}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="text-emerald-600 text-sm font-medium">Total Sales</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(summaryStats.totalSales)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="text-blue-600 text-sm font-medium">Total Profit</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(summaryStats.totalProfit)}</div>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <div className="text-violet-600 text-sm font-medium">Avg Margin</div>
          <div className="text-2xl font-bold text-violet-900 mt-1">{summaryStats.avgMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="text-amber-600 text-sm font-medium">Stock Value</div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(summaryStats.totalStockValue)}</div>
        </div>
      </div>

      {viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Brand
                      {sortBy === 'name' && (
                        <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sales')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Sales
                      {sortBy === 'sales' && (
                        <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Purchases</th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('profit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Profit
                      {sortBy === 'profit' && (
                        <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('margin')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Margin
                      {sortBy === 'margin' && (
                        <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedData.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-lg">{brand.name[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{brand.name}</div>
                          <div className="text-xs text-gray-500">Avg: {formatCurrency(brand.avgPrice)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {brand.totalProducts}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(brand.totalSales)}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(brand.totalPurchases)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">{formatCurrency(brand.profit)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${
                        brand.margin >= 22 ? 'bg-emerald-100 text-emerald-700' : 
                        brand.margin >= 20 ? 'bg-blue-100 text-blue-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {brand.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{getTrendIcon(brand.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Chart View */
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales by Brand</h3>
          <div className="space-y-4">
            {sortedData.map((brand) => (
              <div key={brand.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-bold">{brand.name[0]}</span>
                    </div>
                    <span className="font-medium text-gray-900">{brand.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(brand.totalSales)}</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(brand.totalSales / maxSales) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{brand.totalProducts} products</span>
                  <span className={brand.margin >= 22 ? 'text-emerald-600' : 'text-gray-600'}>
                    {brand.margin.toFixed(1)}% margin
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

