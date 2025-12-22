'use client';

import { useState } from 'react';

interface ImportCostData {
  id: string;
  poNumber: string;
  supplier: string;
  country: string;
  importDate: string;
  productCost: number;
  shippingCost: number;
  customsDuty: number;
  insuranceCost: number;
  handlingCharges: number;
  otherCharges: number;
  totalLandedCost: number;
  itemCount: number;
  status: 'pending' | 'cleared' | 'delivered';
}

export default function ImportCostSummaryReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [supplier, setSupplier] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');

  // Mock data for demonstration
  const [importData] = useState<ImportCostData[]>([
    { id: '1', poNumber: 'IMP-2024-001', supplier: 'Toyota Japan Parts', country: 'Japan', importDate: '2024-01-15', productCost: 850000, shippingCost: 45000, customsDuty: 127500, insuranceCost: 8500, handlingCharges: 15000, otherCharges: 5000, totalLandedCost: 1051000, itemCount: 45, status: 'delivered' },
    { id: '2', poNumber: 'IMP-2024-002', supplier: 'Honda Thailand Co.', country: 'Thailand', importDate: '2024-01-20', productCost: 620000, shippingCost: 35000, customsDuty: 93000, insuranceCost: 6200, handlingCharges: 12000, otherCharges: 4000, totalLandedCost: 770200, itemCount: 32, status: 'delivered' },
    { id: '3', poNumber: 'IMP-2024-003', supplier: 'Denso Corporation', country: 'Japan', importDate: '2024-02-01', productCost: 1250000, shippingCost: 65000, customsDuty: 187500, insuranceCost: 12500, handlingCharges: 22000, otherCharges: 8000, totalLandedCost: 1545000, itemCount: 78, status: 'cleared' },
    { id: '4', poNumber: 'IMP-2024-004', supplier: 'Bosch Auto Parts', country: 'Germany', importDate: '2024-02-10', productCost: 980000, shippingCost: 55000, customsDuty: 147000, insuranceCost: 9800, handlingCharges: 18000, otherCharges: 6000, totalLandedCost: 1215800, itemCount: 56, status: 'pending' },
    { id: '5', poNumber: 'IMP-2024-005', supplier: 'KYB Indonesia', country: 'Indonesia', importDate: '2024-02-15', productCost: 420000, shippingCost: 28000, customsDuty: 63000, insuranceCost: 4200, handlingCharges: 10000, otherCharges: 3000, totalLandedCost: 528200, itemCount: 28, status: 'delivered' },
  ]);

  const summaryStats = {
    totalImports: importData.length,
    totalProductCost: importData.reduce((sum, i) => sum + i.productCost, 0),
    totalShipping: importData.reduce((sum, i) => sum + i.shippingCost, 0),
    totalCustomsDuty: importData.reduce((sum, i) => sum + i.customsDuty, 0),
    totalLandedCost: importData.reduce((sum, i) => sum + i.totalLandedCost, 0),
    avgCostPerItem: importData.reduce((sum, i) => sum + i.totalLandedCost, 0) / importData.reduce((sum, i) => sum + i.itemCount, 0),
    pendingShipments: importData.filter(i => i.status === 'pending').length,
    clearedShipments: importData.filter(i => i.status === 'cleared').length,
  };

  // Cost breakdown by category
  const costBreakdown = [
    { label: 'Product Cost', value: summaryStats.totalProductCost, color: 'bg-blue-500', percentage: (summaryStats.totalProductCost / summaryStats.totalLandedCost * 100).toFixed(1) },
    { label: 'Customs Duty', value: summaryStats.totalCustomsDuty, color: 'bg-primary-500', percentage: (summaryStats.totalCustomsDuty / summaryStats.totalLandedCost * 100).toFixed(1) },
    { label: 'Shipping', value: summaryStats.totalShipping, color: 'bg-emerald-500', percentage: (summaryStats.totalShipping / summaryStats.totalLandedCost * 100).toFixed(1) },
    { label: 'Insurance & Others', value: importData.reduce((sum, i) => sum + i.insuranceCost + i.handlingCharges + i.otherCharges, 0), color: 'bg-amber-500', percentage: ((importData.reduce((sum, i) => sum + i.insuranceCost + i.handlingCharges + i.otherCharges, 0)) / summaryStats.totalLandedCost * 100).toFixed(1) },
  ];

  // Cost by country
  const costByCountry = importData.reduce((acc, item) => {
    if (!acc[item.country]) {
      acc[item.country] = { totalCost: 0, count: 0 };
    }
    acc[item.country].totalCost += item.totalLandedCost;
    acc[item.country].count += 1;
    return acc;
  }, {} as Record<string, { totalCost: number; count: number }>);

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'cleared':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Cleared</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Import Cost Summary</h2>
          <p className="text-gray-500 text-sm">Analyze landed costs, duties, and import expenses</p>
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

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Countries</option>
              <option value="Japan">Japan</option>
              <option value="Thailand">Thailand</option>
              <option value="Germany">Germany</option>
              <option value="Indonesia">Indonesia</option>
              <option value="China">China</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="delivered">Delivered</option>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 text-sm font-medium">Total Product Cost</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(summaryStats.totalProductCost)}</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-primary-100 text-sm font-medium">Total Customs Duty</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(summaryStats.totalCustomsDuty)}</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-100 text-sm font-medium">Total Shipping</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(summaryStats.totalShipping)}</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-violet-100 text-sm font-medium">Total Landed Cost</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(summaryStats.totalLandedCost)}</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown & Country Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            {costBreakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{item.percentage}%</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost by Country */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Country</h3>
          <div className="space-y-4">
            {Object.entries(costByCountry).map(([country, data], index) => {
              const countryColors = ['bg-blue-500', 'bg-emerald-500', 'bg-primary-500', 'bg-violet-500', 'bg-amber-500'];
              const maxCost = Math.max(...Object.values(costByCountry).map(c => c.totalCost));
              return (
                <div key={country} className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${countryColors[index % countryColors.length].replace('500', '100')} rounded-lg flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${countryColors[index % countryColors.length].replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{country}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(data.totalCost)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${countryColors[index % countryColors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${(data.totalCost / maxCost) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{data.count} shipments</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Import Details Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Import Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Duties & Tax</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Shipping</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Landed Cost</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {importData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-medium text-primary-600">{item.poNumber}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-900">{item.supplier}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.country}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-600">
                    {new Date(item.importDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900">{formatCurrency(item.productCost)}</td>
                  <td className="px-4 py-4 text-right text-primary-600">{formatCurrency(item.customsDuty)}</td>
                  <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(item.shippingCost)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.totalLandedCost)}</td>
                  <td className="px-4 py-4 text-center">{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-4 py-3 text-right text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(summaryStats.totalProductCost)}</td>
                <td className="px-4 py-3 text-right text-primary-600">{formatCurrency(summaryStats.totalCustomsDuty)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(summaryStats.totalShipping)}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(summaryStats.totalLandedCost)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

