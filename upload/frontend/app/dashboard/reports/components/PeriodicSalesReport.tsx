'use client';

import { useState, useMemo } from 'react';

interface SalesData {
  period: string;
  sales: number;
  orders: number;
  returns: number;
  netSales: number;
  profit: number;
  margin: number;
  avgOrderValue: number;
}

export default function PeriodicSalesReport() {
  const [viewType, setViewType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [year, setYear] = useState('2024');
  const [month, setMonth] = useState('');

  // Generate mock data based on view type
  const salesData = useMemo(() => {
    if (viewType === 'daily') {
      return Array.from({ length: 30 }, (_, i) => ({
        period: `${i + 1}`,
        sales: Math.floor(Math.random() * 150000) + 50000,
        orders: Math.floor(Math.random() * 30) + 10,
        returns: Math.floor(Math.random() * 5000),
        netSales: 0,
        profit: 0,
        margin: 0,
        avgOrderValue: 0,
      })).map(d => ({
        ...d,
        netSales: d.sales - d.returns,
        profit: (d.sales - d.returns) * 0.22,
        margin: 22,
        avgOrderValue: d.sales / d.orders,
      }));
    } else if (viewType === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((m, i) => ({
        period: m,
        sales: Math.floor(Math.random() * 3000000) + 1500000,
        orders: Math.floor(Math.random() * 500) + 200,
        returns: Math.floor(Math.random() * 100000),
        netSales: 0,
        profit: 0,
        margin: 0,
        avgOrderValue: 0,
      })).map(d => ({
        ...d,
        netSales: d.sales - d.returns,
        profit: (d.sales - d.returns) * 0.22,
        margin: 22,
        avgOrderValue: d.sales / d.orders,
      }));
    } else {
      return ['2020', '2021', '2022', '2023', '2024'].map(y => ({
        period: y,
        sales: Math.floor(Math.random() * 40000000) + 20000000,
        orders: Math.floor(Math.random() * 5000) + 2000,
        returns: Math.floor(Math.random() * 1000000),
        netSales: 0,
        profit: 0,
        margin: 0,
        avgOrderValue: 0,
      })).map(d => ({
        ...d,
        netSales: d.sales - d.returns,
        profit: (d.sales - d.returns) * 0.22,
        margin: 22,
        avgOrderValue: d.sales / d.orders,
      }));
    }
  }, [viewType]);

  const summaryStats = useMemo(() => ({
    totalSales: salesData.reduce((sum, d) => sum + d.sales, 0),
    totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
    totalReturns: salesData.reduce((sum, d) => sum + d.returns, 0),
    totalProfit: salesData.reduce((sum, d) => sum + d.profit, 0),
    avgMargin: 22,
    avgOrderValue: salesData.reduce((sum, d) => sum + d.sales, 0) / salesData.reduce((sum, d) => sum + d.orders, 0),
  }), [salesData]);

  const maxSales = Math.max(...salesData.map(d => d.sales));

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;
  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Periodic Sales Report</h2>
          <p className="text-gray-500 text-sm">View sales performance by day, month, or year</p>
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

      {/* Period Toggle */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewType('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'daily' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'monthly' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewType('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'yearly' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Yearly
            </button>
          </div>
          <div className="flex items-center gap-3">
            {viewType !== 'yearly' && (
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            )}
            {viewType === 'daily' && (
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            )}
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-emerald-600 text-xs font-medium uppercase tracking-wider">Total Sales</div>
          <div className="text-xl font-bold text-emerald-900 mt-1">{formatCompact(summaryStats.totalSales)}</div>
          <div className="text-xs text-emerald-600 mt-1">+12.5% vs prev</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-blue-600 text-xs font-medium uppercase tracking-wider">Total Orders</div>
          <div className="text-xl font-bold text-blue-900 mt-1">{summaryStats.totalOrders.toLocaleString()}</div>
          <div className="text-xs text-blue-600 mt-1">+8.2% vs prev</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-red-600 text-xs font-medium uppercase tracking-wider">Returns</div>
          <div className="text-xl font-bold text-red-900 mt-1">{formatCompact(summaryStats.totalReturns)}</div>
          <div className="text-xs text-red-600 mt-1">-3.1% vs prev</div>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="text-violet-600 text-xs font-medium uppercase tracking-wider">Total Profit</div>
          <div className="text-xl font-bold text-violet-900 mt-1">{formatCompact(summaryStats.totalProfit)}</div>
          <div className="text-xs text-violet-600 mt-1">+15.3% vs prev</div>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="text-primary-600 text-xs font-medium uppercase tracking-wider">Avg Margin</div>
          <div className="text-xl font-bold text-primary-900 mt-1">{summaryStats.avgMargin}%</div>
          <div className="text-xs text-primary-600 mt-1">+0.5% vs prev</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-amber-600 text-xs font-medium uppercase tracking-wider">Avg Order</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{formatCompact(summaryStats.avgOrderValue)}</div>
          <div className="text-xs text-amber-600 mt-1">+4.2% vs prev</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Trend - {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View</h3>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end gap-1">
            {salesData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-full max-w-8 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t hover:from-primary-600 hover:to-primary-500 transition-all cursor-pointer"
                    style={{ height: `${(data.sales / maxSales) * 200}px` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      <div className="font-semibold">{formatCurrency(data.sales)}</div>
                      <div className="text-gray-400">{data.orders} orders</div>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 truncate max-w-full">{data.period}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewType === 'daily' ? 'Daily' : viewType === 'monthly' ? 'Monthly' : 'Yearly'} Breakdown
          </h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Gross Sales</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Returns</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Sales</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Margin</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {viewType === 'daily' ? `Day ${data.period}` : data.period}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900">{formatCurrency(data.sales)}</td>
                  <td className="px-4 py-4 text-right text-gray-600">{data.orders}</td>
                  <td className="px-4 py-4 text-right text-red-600">-{formatCurrency(data.returns)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(data.netSales)}</td>
                  <td className="px-4 py-4 text-right font-semibold text-emerald-600">{formatCurrency(data.profit)}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                      {data.margin}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(data.avgOrderValue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(summaryStats.totalSales)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{summaryStats.totalOrders}</td>
                <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(summaryStats.totalReturns)}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(summaryStats.totalSales - summaryStats.totalReturns)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(summaryStats.totalProfit)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                    {summaryStats.avgMargin}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(summaryStats.avgOrderValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

