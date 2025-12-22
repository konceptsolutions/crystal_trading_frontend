'use client';

import { useState } from 'react';

interface SupplierData {
  id: string;
  name: string;
  country: string;
  totalOrders: number;
  totalValue: number;
  deliveredOnTime: number;
  avgDeliveryDays: number;
  defectRate: number;
  qualityScore: number;
  responseTime: number;
  overallScore: number;
  trend: 'improving' | 'declining' | 'stable';
  lastOrderDate: string;
}

export default function SupplierPerformanceReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'value' | 'ontime'>('score');

  // Mock data for demonstration
  const [supplierData] = useState<SupplierData[]>([
    { id: '1', name: 'Toyota Japan Parts', country: 'Japan', totalOrders: 45, totalValue: 2850000, deliveredOnTime: 42, avgDeliveryDays: 12, defectRate: 0.5, qualityScore: 98, responseTime: 4, overallScore: 95, trend: 'improving', lastOrderDate: '2024-02-15' },
    { id: '2', name: 'Honda Thailand Co.', country: 'Thailand', totalOrders: 38, totalValue: 1980000, deliveredOnTime: 35, avgDeliveryDays: 8, defectRate: 0.8, qualityScore: 96, responseTime: 6, overallScore: 92, trend: 'stable', lastOrderDate: '2024-02-10' },
    { id: '3', name: 'Denso Corporation', country: 'Japan', totalOrders: 52, totalValue: 3450000, deliveredOnTime: 48, avgDeliveryDays: 14, defectRate: 0.3, qualityScore: 99, responseTime: 3, overallScore: 97, trend: 'improving', lastOrderDate: '2024-02-18' },
    { id: '4', name: 'Bosch Auto Parts', country: 'Germany', totalOrders: 28, totalValue: 2150000, deliveredOnTime: 22, avgDeliveryDays: 18, defectRate: 1.2, qualityScore: 94, responseTime: 8, overallScore: 85, trend: 'declining', lastOrderDate: '2024-02-05' },
    { id: '5', name: 'KYB Indonesia', country: 'Indonesia', totalOrders: 32, totalValue: 1250000, deliveredOnTime: 28, avgDeliveryDays: 10, defectRate: 0.9, qualityScore: 95, responseTime: 5, overallScore: 88, trend: 'stable', lastOrderDate: '2024-02-12' },
    { id: '6', name: 'NGK Spark Plugs', country: 'Japan', totalOrders: 25, totalValue: 850000, deliveredOnTime: 24, avgDeliveryDays: 11, defectRate: 0.2, qualityScore: 99, responseTime: 4, overallScore: 96, trend: 'improving', lastOrderDate: '2024-02-08' },
  ]);

  const summaryStats = {
    totalSuppliers: supplierData.length,
    totalOrders: supplierData.reduce((sum, s) => sum + s.totalOrders, 0),
    totalValue: supplierData.reduce((sum, s) => sum + s.totalValue, 0),
    avgOnTimeRate: (supplierData.reduce((sum, s) => sum + (s.deliveredOnTime / s.totalOrders * 100), 0) / supplierData.length).toFixed(1),
    avgQualityScore: (supplierData.reduce((sum, s) => sum + s.qualityScore, 0) / supplierData.length).toFixed(1),
    avgDefectRate: (supplierData.reduce((sum, s) => sum + s.defectRate, 0) / supplierData.length).toFixed(2),
  };

  const sortedData = [...supplierData].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.overallScore - a.overallScore;
      case 'value':
        return b.totalValue - a.totalValue;
      case 'ontime':
        return (b.deliveredOnTime / b.totalOrders) - (a.deliveredOnTime / a.totalOrders);
      default:
        return 0;
    }
  });

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  const getScoreBadge = (score: number) => {
    if (score >= 95) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Excellent</span>;
    if (score >= 90) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Good</span>;
    if (score >= 85) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Average</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Poor</span>;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
      case 'declining':
        return <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
      default:
        return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600';
    if (score >= 90) return 'text-blue-600';
    if (score >= 85) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Supplier Performance</h2>
          <p className="text-gray-500 text-sm">Evaluate supplier quality, delivery, and reliability metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="score">Sort by Score</option>
            <option value="value">Sort by Value</option>
            <option value="ontime">Sort by On-Time Rate</option>
          </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Suppliers</option>
              {supplierData.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Suppliers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.totalSuppliers}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.totalOrders}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Value</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(summaryStats.totalValue)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-emerald-600 text-xs font-medium uppercase tracking-wider">On-Time Rate</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summaryStats.avgOnTimeRate}%</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-blue-600 text-xs font-medium uppercase tracking-wider">Avg Quality</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{summaryStats.avgQualityScore}%</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-amber-600 text-xs font-medium uppercase tracking-wider">Defect Rate</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summaryStats.avgDefectRate}%</div>
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((supplier, index) => (
          <div key={supplier.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  index === 0 ? 'bg-amber-100' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-100' : 'bg-gray-50'
                }`}>
                  {index < 3 ? (
                    <svg className={`w-6 h-6 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-500' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ) : (
                    <span className="text-gray-500 font-bold text-lg">{supplier.name[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-500">{supplier.country}</p>
                </div>
              </div>
              {getTrendIcon(supplier.trend)}
            </div>

            {/* Score Circle */}
            <div className="flex items-center justify-center my-4">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="40" 
                    stroke={supplier.overallScore >= 95 ? '#10b981' : supplier.overallScore >= 90 ? '#3b82f6' : supplier.overallScore >= 85 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray={`${(supplier.overallScore / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreColor(supplier.overallScore)}`}>{supplier.overallScore}</span>
                  <span className="text-xs text-gray-500">Score</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">On-Time Delivery</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-gray-900">{((supplier.deliveredOnTime / supplier.totalOrders) * 100).toFixed(0)}%</span>
                  <span className="text-xs text-gray-500">({supplier.deliveredOnTime}/{supplier.totalOrders})</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Avg Delivery</div>
                <div className="text-lg font-semibold text-gray-900">{supplier.avgDeliveryDays} days</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Quality Score</div>
                <div className="text-lg font-semibold text-emerald-600">{supplier.qualityScore}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Defect Rate</div>
                <div className="text-lg font-semibold text-amber-600">{supplier.defectRate}%</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500">Total Value</div>
                <div className="font-semibold text-gray-900">{formatCurrency(supplier.totalValue)}</div>
              </div>
              {getScoreBadge(supplier.overallScore)}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">On-Time</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Days</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Quality</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Defect</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Response</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{supplier.name}</div>
                    <div className="text-sm text-gray-500">{supplier.country}</div>
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-gray-900">{supplier.totalOrders}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-medium ${(supplier.deliveredOnTime / supplier.totalOrders * 100) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {((supplier.deliveredOnTime / supplier.totalOrders) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-600">{supplier.avgDeliveryDays} days</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-medium ${supplier.qualityScore >= 96 ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {supplier.qualityScore}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-medium ${supplier.defectRate <= 0.5 ? 'text-emerald-600' : supplier.defectRate <= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {supplier.defectRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-600">{supplier.responseTime}h</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-lg font-bold ${getScoreColor(supplier.overallScore)}`}>
                      {supplier.overallScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">{getTrendIcon(supplier.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

