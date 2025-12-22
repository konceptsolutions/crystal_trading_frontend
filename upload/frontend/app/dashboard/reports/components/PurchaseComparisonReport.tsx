'use client';

import { useState, useMemo } from 'react';

interface PurchaseComparison {
  id: string;
  supplier: string;
  period1: {
    orders: number;
    value: number;
    items: number;
  };
  period2: {
    orders: number;
    value: number;
    items: number;
  };
  change: {
    orders: number;
    value: number;
    items: number;
  };
}

interface CategoryComparison {
  category: string;
  period1Value: number;
  period2Value: number;
  change: number;
}

export default function PurchaseComparisonReport() {
  const [comparisonType, setComparisonType] = useState<'period' | 'supplier' | 'category'>('period');
  const [period1Start, setPeriod1Start] = useState('2024-01-01');
  const [period1End, setPeriod1End] = useState('2024-01-31');
  const [period2Start, setPeriod2Start] = useState('2024-02-01');
  const [period2End, setPeriod2End] = useState('2024-02-29');

  // Mock data
  const supplierData: PurchaseComparison[] = [
    { id: '1', supplier: 'Toyota Japan Parts', period1: { orders: 12, value: 850000, items: 145 }, period2: { orders: 15, value: 980000, items: 178 }, change: { orders: 25, value: 15.3, items: 22.8 } },
    { id: '2', supplier: 'Honda Thailand Co.', period1: { orders: 8, value: 520000, items: 98 }, period2: { orders: 10, value: 680000, items: 125 }, change: { orders: 25, value: 30.8, items: 27.6 } },
    { id: '3', supplier: 'Denso Corporation', period1: { orders: 15, value: 1200000, items: 220 }, period2: { orders: 18, value: 1450000, items: 268 }, change: { orders: 20, value: 20.8, items: 21.8 } },
    { id: '4', supplier: 'Bosch Auto Parts', period1: { orders: 10, value: 780000, items: 85 }, period2: { orders: 8, value: 650000, items: 72 }, change: { orders: -20, value: -16.7, items: -15.3 } },
    { id: '5', supplier: 'KYB Indonesia', period1: { orders: 6, value: 380000, items: 65 }, period2: { orders: 7, value: 420000, items: 75 }, change: { orders: 16.7, value: 10.5, items: 15.4 } },
  ];

  const categoryData: CategoryComparison[] = [
    { category: 'Brakes', period1Value: 450000, period2Value: 520000, change: 15.6 },
    { category: 'Filters', period1Value: 280000, period2Value: 350000, change: 25.0 },
    { category: 'Ignition', period1Value: 380000, period2Value: 410000, change: 7.9 },
    { category: 'Electrical', period1Value: 520000, period2Value: 480000, change: -7.7 },
    { category: 'Suspension', period1Value: 290000, period2Value: 380000, change: 31.0 },
    { category: 'Engine Parts', period1Value: 680000, period2Value: 750000, change: 10.3 },
    { category: 'Cooling', period1Value: 220000, period2Value: 245000, change: 11.4 },
    { category: 'Transmission', period1Value: 410000, period2Value: 395000, change: -3.7 },
  ];

  const summaryStats = useMemo(() => ({
    period1Total: supplierData.reduce((sum, s) => sum + s.period1.value, 0),
    period2Total: supplierData.reduce((sum, s) => sum + s.period2.value, 0),
    period1Orders: supplierData.reduce((sum, s) => sum + s.period1.orders, 0),
    period2Orders: supplierData.reduce((sum, s) => sum + s.period2.orders, 0),
    period1Items: supplierData.reduce((sum, s) => sum + s.period1.items, 0),
    period2Items: supplierData.reduce((sum, s) => sum + s.period2.items, 0),
  }), [supplierData]);

  const overallChange = useMemo(() => ({
    value: ((summaryStats.period2Total - summaryStats.period1Total) / summaryStats.period1Total * 100).toFixed(1),
    orders: ((summaryStats.period2Orders - summaryStats.period1Orders) / summaryStats.period1Orders * 100).toFixed(1),
    items: ((summaryStats.period2Items - summaryStats.period1Items) / summaryStats.period1Items * 100).toFixed(1),
  }), [summaryStats]);

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center text-emerald-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          +{change.toFixed(1)}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="flex items-center text-red-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          {change.toFixed(1)}%
        </span>
      );
    }
    return <span className="text-gray-500">0%</span>;
  };

  const maxCategoryValue = Math.max(...categoryData.map(c => Math.max(c.period1Value, c.period2Value)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Purchase Comparison</h2>
          <p className="text-gray-500 text-sm">Compare purchasing performance across periods</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Period 1 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Period 1
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={period1Start}
                  onChange={(e) => setPeriod1Start(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={period1End}
                  onChange={(e) => setPeriod1End(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Period 2 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              Period 2
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={period2Start}
                  onChange={(e) => setPeriod2Start(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={period2End}
                  onChange={(e) => setPeriod2End(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
            Compare Periods
          </button>
        </div>
      </div>

      {/* Summary Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-3">Total Purchase Value</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Period 1
              </div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(summaryStats.period1Total)}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-primary-600 mb-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Period 2
              </div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(summaryStats.period2Total)}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center">
            {getChangeIndicator(parseFloat(overallChange.value))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-3">Total Orders</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Period 1
              </div>
              <div className="text-xl font-bold text-gray-900">{summaryStats.period1Orders}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-primary-600 mb-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Period 2
              </div>
              <div className="text-xl font-bold text-gray-900">{summaryStats.period2Orders}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center">
            {getChangeIndicator(parseFloat(overallChange.orders))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-3">Total Items Purchased</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Period 1
              </div>
              <div className="text-xl font-bold text-gray-900">{summaryStats.period1Items}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-primary-600 mb-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Period 2
              </div>
              <div className="text-xl font-bold text-gray-900">{summaryStats.period2Items}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center">
            {getChangeIndicator(parseFloat(overallChange.items))}
          </div>
        </div>
      </div>

      {/* Category Comparison Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Purchase by Category Comparison</h3>
        <div className="space-y-4">
          {categoryData.map((cat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 w-32">{cat.category}</span>
                <div className="flex-1 mx-4">
                  <div className="flex gap-1">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-l overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${(cat.period1Value / maxCategoryValue) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-r overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all duration-500"
                          style={{ width: `${(cat.period2Value / maxCategoryValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  {getChangeIndicator(cat.change)}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pl-32">
                <div className="flex-1 mx-4 flex justify-between">
                  <span className="text-blue-600">{formatCurrency(cat.period1Value)}</span>
                  <span className="text-primary-600">{formatCurrency(cat.period2Value)}</span>
                </div>
                <div className="w-24"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Period 1 (Jan 2024)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-500 rounded"></div>
            <span className="text-sm text-gray-600">Period 2 (Feb 2024)</span>
          </div>
        </div>
      </div>

      {/* Supplier Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Supplier Performance Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider" colSpan={3}>Period 1</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-primary-600 uppercase tracking-wider" colSpan={3}>Period 2</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Value Change</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th></th>
                <th className="px-2 py-2 text-center text-xs text-gray-500">Orders</th>
                <th className="px-2 py-2 text-center text-xs text-gray-500">Value</th>
                <th className="px-2 py-2 text-center text-xs text-gray-500">Items</th>
                <th className="px-2 py-2 text-center text-xs text-gray-500">Orders</th>
                <th className="px-2 py-2 text-center text-xs text-gray-500">Value</th>
                <th className="px-2 py-2 text-center text-xs text-gray-500">Items</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {supplierData.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-900">{supplier.supplier}</td>
                  <td className="px-2 py-4 text-center text-gray-600">{supplier.period1.orders}</td>
                  <td className="px-2 py-4 text-center text-gray-900">{formatCurrency(supplier.period1.value)}</td>
                  <td className="px-2 py-4 text-center text-gray-600">{supplier.period1.items}</td>
                  <td className="px-2 py-4 text-center text-gray-600">{supplier.period2.orders}</td>
                  <td className="px-2 py-4 text-center text-gray-900">{formatCurrency(supplier.period2.value)}</td>
                  <td className="px-2 py-4 text-center text-gray-600">{supplier.period2.items}</td>
                  <td className="px-4 py-4 text-center">
                    {getChangeIndicator(supplier.change.value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-2 py-3 text-center text-gray-600">{summaryStats.period1Orders}</td>
                <td className="px-2 py-3 text-center text-gray-900">{formatCurrency(summaryStats.period1Total)}</td>
                <td className="px-2 py-3 text-center text-gray-600">{summaryStats.period1Items}</td>
                <td className="px-2 py-3 text-center text-gray-600">{summaryStats.period2Orders}</td>
                <td className="px-2 py-3 text-center text-gray-900">{formatCurrency(summaryStats.period2Total)}</td>
                <td className="px-2 py-3 text-center text-gray-600">{summaryStats.period2Items}</td>
                <td className="px-4 py-3 text-center">
                  {getChangeIndicator(parseFloat(overallChange.value))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

