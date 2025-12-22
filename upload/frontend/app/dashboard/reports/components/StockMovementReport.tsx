'use client';

import { useState } from 'react';

interface StockItem {
  id: string;
  partNo: string;
  description: string;
  category: string;
  brand: string;
  currentStock: number;
  avgMonthlySales: number;
  lastSaleDate: string;
  daysSinceLastSale: number;
  stockValue: number;
  turnoverRatio: number;
  classification: 'fast' | 'slow' | 'dead';
  recommendedAction: string;
}

export default function StockMovementReport() {
  const [filterType, setFilterType] = useState<'all' | 'fast' | 'slow' | 'dead'>('all');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Mock data for demonstration
  const [stockData] = useState<StockItem[]>([
    { id: '1', partNo: 'TOY-BRK-001', description: 'Brake Pad Set Front', category: 'Brakes', brand: 'Toyota', currentStock: 45, avgMonthlySales: 28, lastSaleDate: '2024-02-18', daysSinceLastSale: 2, stockValue: 67500, turnoverRatio: 7.4, classification: 'fast', recommendedAction: 'Reorder soon' },
    { id: '2', partNo: 'HON-FIL-002', description: 'Oil Filter Premium', category: 'Filters', brand: 'Honda', currentStock: 120, avgMonthlySales: 85, lastSaleDate: '2024-02-19', daysSinceLastSale: 1, stockValue: 36000, turnoverRatio: 8.5, classification: 'fast', recommendedAction: 'Optimal stock' },
    { id: '3', partNo: 'DEN-SPK-003', description: 'Spark Plug Set', category: 'Ignition', brand: 'Denso', currentStock: 200, avgMonthlySales: 45, lastSaleDate: '2024-02-15', daysSinceLastSale: 5, stockValue: 80000, turnoverRatio: 2.7, classification: 'slow', recommendedAction: 'Reduce reorder qty' },
    { id: '4', partNo: 'BSH-ALT-004', description: 'Alternator Assembly', category: 'Electrical', brand: 'Bosch', currentStock: 8, avgMonthlySales: 2, lastSaleDate: '2024-01-28', daysSinceLastSale: 23, stockValue: 96000, turnoverRatio: 3.0, classification: 'slow', recommendedAction: 'Monitor closely' },
    { id: '5', partNo: 'KYB-SHK-005', description: 'Shock Absorber Rear', category: 'Suspension', brand: 'KYB', currentStock: 35, avgMonthlySales: 0.5, lastSaleDate: '2023-11-15', daysSinceLastSale: 97, stockValue: 105000, turnoverRatio: 0.2, classification: 'dead', recommendedAction: 'Consider clearance sale' },
    { id: '6', partNo: 'NGK-GLW-006', description: 'Glow Plug Diesel', category: 'Ignition', brand: 'NGK', currentStock: 50, avgMonthlySales: 0, lastSaleDate: '2023-08-20', daysSinceLastSale: 184, stockValue: 25000, turnoverRatio: 0, classification: 'dead', recommendedAction: 'Liquidate stock' },
    { id: '7', partNo: 'TOY-CLT-007', description: 'Clutch Kit Complete', category: 'Transmission', brand: 'Toyota', currentStock: 12, avgMonthlySales: 8, lastSaleDate: '2024-02-17', daysSinceLastSale: 3, stockValue: 144000, turnoverRatio: 8.0, classification: 'fast', recommendedAction: 'Maintain stock' },
    { id: '8', partNo: 'HON-RAD-008', description: 'Radiator Assembly', category: 'Cooling', brand: 'Honda', currentStock: 6, avgMonthlySales: 3, lastSaleDate: '2024-02-10', daysSinceLastSale: 10, stockValue: 54000, turnoverRatio: 6.0, classification: 'fast', recommendedAction: 'Reorder soon' },
    { id: '9', partNo: 'MIT-TIM-009', description: 'Timing Belt Kit', category: 'Engine', brand: 'Mitsubishi', currentStock: 25, avgMonthlySales: 1, lastSaleDate: '2024-01-05', daysSinceLastSale: 46, stockValue: 62500, turnoverRatio: 0.5, classification: 'slow', recommendedAction: 'Review pricing' },
    { id: '10', partNo: 'NIS-PUM-010', description: 'Water Pump Assembly', category: 'Cooling', brand: 'Nissan', currentStock: 18, avgMonthlySales: 0.2, lastSaleDate: '2023-10-12', daysSinceLastSale: 131, stockValue: 36000, turnoverRatio: 0.1, classification: 'dead', recommendedAction: 'Discount heavily' },
  ]);

  const filteredData = stockData.filter(item => {
    if (filterType !== 'all' && item.classification !== filterType) return false;
    return true;
  });

  const summaryStats = {
    totalItems: stockData.length,
    fastMoving: stockData.filter(i => i.classification === 'fast').length,
    slowMoving: stockData.filter(i => i.classification === 'slow').length,
    deadStock: stockData.filter(i => i.classification === 'dead').length,
    totalStockValue: stockData.reduce((sum, i) => sum + i.stockValue, 0),
    deadStockValue: stockData.filter(i => i.classification === 'dead').reduce((sum, i) => sum + i.stockValue, 0),
    avgTurnover: (stockData.reduce((sum, i) => sum + i.turnoverRatio, 0) / stockData.length).toFixed(1),
  };

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'fast':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Fast Moving
          </span>
        );
      case 'slow':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Slow Moving
          </span>
        );
      case 'dead':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Dead Stock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stock Movement Report</h2>
          <p className="text-gray-500 text-sm">Identify fast, slow, and dead stock items</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterType === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Items ({summaryStats.totalItems})
        </button>
        <button
          onClick={() => setFilterType('fast')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            filterType === 'fast'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Fast Moving ({summaryStats.fastMoving})
        </button>
        <button
          onClick={() => setFilterType('slow')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            filterType === 'slow'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Slow Moving ({summaryStats.slowMoving})
        </button>
        <button
          onClick={() => setFilterType('dead')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            filterType === 'dead'
              ? 'bg-red-500 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Dead Stock ({summaryStats.deadStock})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="brakes">Brakes</option>
              <option value="filters">Filters</option>
              <option value="ignition">Ignition</option>
              <option value="electrical">Electrical</option>
              <option value="suspension">Suspension</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Brands</option>
              <option value="toyota">Toyota</option>
              <option value="honda">Honda</option>
              <option value="denso">Denso</option>
              <option value="bosch">Bosch</option>
              <option value="kyb">KYB</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Total Stock Value</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalStockValue)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Dead Stock Value</span>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summaryStats.deadStockValue)}</div>
          <div className="text-xs text-red-500 mt-1">{((summaryStats.deadStockValue / summaryStats.totalStockValue) * 100).toFixed(1)}% of total</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Avg Turnover Ratio</span>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{summaryStats.avgTurnover}x</div>
          <div className="text-xs text-gray-500 mt-1">per year</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">Items Needing Action</span>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{summaryStats.slowMoving + summaryStats.deadStock}</div>
          <div className="text-xs text-gray-500 mt-1">slow + dead stock</div>
        </div>
      </div>

      {/* Stock Distribution Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution by Movement</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-40">
            {/* Simple donut visualization */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle 
                cx="50" cy="50" r="40" fill="none" 
                stroke="#10b981" strokeWidth="12"
                strokeDasharray={`${(summaryStats.fastMoving / summaryStats.totalItems) * 251.2} 251.2`}
                strokeLinecap="round"
              />
              <circle 
                cx="50" cy="50" r="40" fill="none" 
                stroke="#f59e0b" strokeWidth="12"
                strokeDasharray={`${(summaryStats.slowMoving / summaryStats.totalItems) * 251.2} 251.2`}
                strokeDashoffset={`-${(summaryStats.fastMoving / summaryStats.totalItems) * 251.2}`}
                strokeLinecap="round"
              />
              <circle 
                cx="50" cy="50" r="40" fill="none" 
                stroke="#ef4444" strokeWidth="12"
                strokeDasharray={`${(summaryStats.deadStock / summaryStats.totalItems) * 251.2} 251.2`}
                strokeDashoffset={`-${((summaryStats.fastMoving + summaryStats.slowMoving) / summaryStats.totalItems) * 251.2}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{summaryStats.totalItems}</div>
                <div className="text-xs text-gray-500">Items</div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Fast Moving</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{summaryStats.fastMoving} items</div>
                <div className="text-xs text-gray-500">{((summaryStats.fastMoving / summaryStats.totalItems) * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Slow Moving</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{summaryStats.slowMoving} items</div>
                <div className="text-xs text-gray-500">{((summaryStats.slowMoving / summaryStats.totalItems) * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Dead Stock</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{summaryStats.deadStock} items</div>
                <div className="text-xs text-gray-500">{((summaryStats.deadStock / summaryStats.totalItems) * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Part Details</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Monthly</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Sale</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Value</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Turnover</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${
                  item.classification === 'dead' ? 'bg-red-50/30' : 
                  item.classification === 'slow' ? 'bg-amber-50/30' : ''
                }`}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-primary-600">{item.partNo}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{item.brand}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-900">{item.currentStock}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{item.avgMonthlySales}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-gray-900">{new Date(item.lastSaleDate).toLocaleDateString('en-GB')}</div>
                    <div className={`text-xs ${item.daysSinceLastSale > 90 ? 'text-red-500' : item.daysSinceLastSale > 30 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {item.daysSinceLastSale} days ago
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.stockValue)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${item.turnoverRatio >= 6 ? 'text-emerald-600' : item.turnoverRatio >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                      {item.turnoverRatio}x
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">{getClassificationBadge(item.classification)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm ${
                      item.classification === 'dead' ? 'text-red-600 font-medium' : 
                      item.classification === 'slow' ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {item.recommendedAction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

