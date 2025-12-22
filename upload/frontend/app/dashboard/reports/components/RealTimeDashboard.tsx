'use client';

import { useState, useEffect } from 'react';

interface LiveMetric {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  format: 'currency' | 'number' | 'percentage';
  color: string;
}

interface RecentTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'return' | 'payment';
  description: string;
  amount: number;
  time: string;
  customer?: string;
}

export default function RealTimeDashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [isLive]);

  const liveMetrics: LiveMetric[] = [
    { label: 'Today\'s Sales', value: 485000, previousValue: 420000, change: 15.5, format: 'currency', color: 'emerald' },
    { label: 'Today\'s Orders', value: 42, previousValue: 38, change: 10.5, format: 'number', color: 'blue' },
    { label: 'Today\'s Purchases', value: 280000, previousValue: 310000, change: -9.7, format: 'currency', color: 'primary' },
    { label: 'Pending Orders', value: 15, previousValue: 18, change: -16.7, format: 'number', color: 'amber' },
    { label: 'Low Stock Items', value: 8, previousValue: 6, change: 33.3, format: 'number', color: 'red' },
    { label: 'Today\'s Profit', value: 95000, previousValue: 82000, change: 15.9, format: 'currency', color: 'violet' },
  ];

  const recentTransactions: RecentTransaction[] = [
    { id: '1', type: 'sale', description: 'Invoice #INV-2024-0892', amount: 45000, time: '2 mins ago', customer: 'Auto Parts Karachi' },
    { id: '2', type: 'payment', description: 'Payment received from Lahore Motors', amount: 125000, time: '8 mins ago' },
    { id: '3', type: 'sale', description: 'Invoice #INV-2024-0891', amount: 28500, time: '15 mins ago', customer: 'Quick Fix Garage' },
    { id: '4', type: 'purchase', description: 'PO #PO-2024-0156 received', amount: 85000, time: '22 mins ago' },
    { id: '5', type: 'return', description: 'Return #RET-2024-0045', amount: 5200, time: '35 mins ago', customer: 'City Auto Works' },
    { id: '6', type: 'sale', description: 'Invoice #INV-2024-0890', amount: 62000, time: '45 mins ago', customer: 'Premium Motors' },
    { id: '7', type: 'payment', description: 'Payment received from Express Auto', amount: 98000, time: '1 hour ago' },
    { id: '8', type: 'sale', description: 'Invoice #INV-2024-0889', amount: 35000, time: '1.5 hours ago', customer: 'Speedway Auto' },
  ];

  const topSellingToday = [
    { name: 'Brake Pad Set Front - Toyota', qty: 25, revenue: 62500 },
    { name: 'Oil Filter Premium - Honda', qty: 48, revenue: 28800 },
    { name: 'Spark Plug Set - Denso', qty: 32, revenue: 38400 },
    { name: 'Clutch Kit Complete - Toyota', qty: 8, revenue: 96000 },
    { name: 'Shock Absorber Rear - KYB', qty: 12, revenue: 54000 },
  ];

  const hourlyData = [
    { hour: '9AM', sales: 45000, orders: 4 },
    { hour: '10AM', sales: 68000, orders: 6 },
    { hour: '11AM', sales: 52000, orders: 5 },
    { hour: '12PM', sales: 38000, orders: 4 },
    { hour: '1PM', sales: 42000, orders: 4 },
    { hour: '2PM', sales: 85000, orders: 8 },
    { hour: '3PM', sales: 72000, orders: 6 },
    { hour: '4PM', sales: 83000, orders: 5 },
  ];

  const maxHourlySales = Math.max(...hourlyData.map(h => h.sales));

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return (
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case 'purchase':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'return':
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getMetricColor = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string }> = {
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
      primary: { bg: 'bg-primary-50', text: 'text-primary-600', badge: 'bg-primary-100 text-primary-700' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
      red: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
    };
    return colors[color] || colors.blue;
  };

  const formatMetricValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Real-Time Dashboard</h2>
          <p className="text-gray-500 text-sm">Live business metrics and activity feed</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live Status Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isLive ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isLive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {isLive ? (
                <span className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live
                </span>
              ) : (
                'Paused'
              )}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {liveMetrics.map((metric, index) => {
          const colors = getMetricColor(metric.color);
          return (
            <div
              key={index}
              className={`${colors.bg} border border-gray-200 rounded-xl p-4 relative overflow-hidden`}
            >
              <div className="relative z-10">
                <div className="text-xs text-gray-600 font-medium mb-1">{metric.label}</div>
                <div className={`text-xl font-bold ${colors.text}`}>
                  {formatMetricValue(metric.value, metric.format)}
                </div>
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {metric.change >= 0 ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {Math.abs(metric.change)}% vs yesterday
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Today's Hourly Sales</h3>
            <div className="text-sm text-gray-500">
              Total: {formatCurrency(hourlyData.reduce((sum, h) => sum + h.sales, 0))}
            </div>
          </div>
          <div className="relative h-48">
            <div className="absolute inset-0 flex items-end gap-2">
              {hourlyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full max-w-12 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t hover:from-primary-600 hover:to-primary-500 transition-all cursor-pointer relative"
                      style={{ height: `${(data.sales / maxHourlySales) * 150}px` }}
                    >
                      {/* Pulse animation on newest data */}
                      {index === hourlyData.length - 1 && isLive && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                        <div className="font-semibold">{formatCurrency(data.sales)}</div>
                        <div className="text-gray-400">{data.orders} orders</div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{data.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Selling Today */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Today</h3>
          <div className="space-y-3">
            {topSellingToday.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.qty} units sold</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2">
              {getTransactionIcon(transaction.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                {transaction.customer && (
                  <div className="text-xs text-gray-500">{transaction.customer}</div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  transaction.type === 'sale' || transaction.type === 'payment' ? 'text-emerald-600' : 
                  transaction.type === 'return' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {transaction.type === 'return' ? '-' : transaction.type === 'sale' || transaction.type === 'payment' ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="text-xs text-gray-400">{transaction.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">24</div>
              <div className="text-sm text-gray-500">Orders Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">18</div>
              <div className="text-sm text-gray-500">Customers Served</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-500">Pending Deliveries</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">126</div>
              <div className="text-sm text-gray-500">Items Sold Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

