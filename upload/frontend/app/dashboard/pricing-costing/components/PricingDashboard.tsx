'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface DashboardStats {
  totalItems: number;
  itemsWithPricing: number;
  averageMargin: number;
  lowMarginItems: number;
  highMarginItems: number;
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

interface MarginAlert {
  partNo: string;
  description: string;
  cost: number;
  price: number;
  margin: number;
  status: 'critical' | 'warning' | 'good';
}

export default function PricingDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    itemsWithPricing: 0,
    averageMargin: 0,
    lowMarginItems: 0,
    highMarginItems: 0,
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
  });
  const [marginAlerts, setMarginAlerts] = useState<MarginAlert[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const parts = response.data.parts || [];

      let totalItems = parts.length;
      let itemsWithPricing = 0;
      let totalMargin = 0;
      let lowMarginItems = 0;
      let highMarginItems = 0;
      let totalValue = 0;
      let totalCost = 0;
      const alerts: MarginAlert[] = [];

      parts.forEach((part: any) => {
        const cost = part.cost || 0;
        const price = part.priceA || 0;
        const quantity = part.stock?.quantity || 0;

        if (price > 0) {
          itemsWithPricing++;
          const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
          totalMargin += margin;

          if (margin < 10) {
            lowMarginItems++;
            alerts.push({
              partNo: part.partNo,
              description: part.description,
              cost,
              price,
              margin,
              status: margin < 5 ? 'critical' : 'warning',
            });
          } else if (margin > 50) {
            highMarginItems++;
          }
        }

        totalValue += quantity * price;
        totalCost += quantity * cost;
      });

      const totalProfit = totalValue - totalCost;
      const profitMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;
      const averageMargin = itemsWithPricing > 0 ? totalMargin / itemsWithPricing : 0;

      setStats({
        totalItems,
        itemsWithPricing,
        averageMargin,
        lowMarginItems,
        highMarginItems,
        totalValue,
        totalCost,
        totalProfit,
        profitMargin,
      });

      // Sort alerts by margin (lowest first) and take top 10
      setMarginAlerts(alerts.sort((a, b) => a.margin - b.margin).slice(0, 10));

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `Rs ${value.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span className="text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Stock Value</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
                <p className="text-blue-200 text-xs mt-2">{stats.totalItems} items in inventory</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Potential Profit</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalProfit)}</p>
                <p className="text-emerald-200 text-xs mt-2">{stats.profitMargin.toFixed(1)}% profit margin</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-500 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Average Margin</p>
                <p className="text-3xl font-bold mt-1">{stats.averageMargin.toFixed(1)}%</p>
                <p className="text-orange-200 text-xs mt-2">{stats.itemsWithPricing} items priced</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Margin Alerts</p>
                <p className="text-3xl font-bold mt-1">{stats.lowMarginItems}</p>
                <p className="text-purple-200 text-xs mt-2">items below 10% margin</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Distribution */}
        <Card>
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Margin Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600">Low (&lt;10%)</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalItems > 0 ? (stats.lowMarginItems / stats.totalItems) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-16 text-right font-medium text-red-600">{stats.lowMarginItems}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600">Normal (10-50%)</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalItems > 0 ? ((stats.itemsWithPricing - stats.lowMarginItems - stats.highMarginItems) / stats.totalItems) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-16 text-right font-medium text-green-600">{stats.itemsWithPricing - stats.lowMarginItems - stats.highMarginItems}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600">High (&gt;50%)</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalItems > 0 ? (stats.highMarginItems / stats.totalItems) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-16 text-right font-medium text-blue-600">{stats.highMarginItems}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-600">No Price Set</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gray-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalItems > 0 ? ((stats.totalItems - stats.itemsWithPricing) / stats.totalItems) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-16 text-right font-medium text-gray-600">{stats.totalItems - stats.itemsWithPricing}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost vs Revenue */}
        <Card>
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cost vs Revenue Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-end gap-4 h-40">
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${stats.totalValue > 0 ? (stats.totalCost / stats.totalValue) * 100 : 0}%` }}
                  />
                  <p className="mt-2 text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalCost)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                    style={{ height: '100%' }}
                  />
                  <p className="mt-2 text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${stats.totalValue > 0 ? (stats.totalProfit / stats.totalValue) * 100 : 0}%` }}
                  />
                  <p className="mt-2 text-sm font-medium text-gray-600">Profit</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalProfit)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Margin Alerts */}
      <Card className="border-2 border-red-100">
        <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Low Margin Alerts
            </CardTitle>
            <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">
              {marginAlerts.length} items need attention
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {marginAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-600 font-medium">All items have healthy margins!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Margin</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {marginAlerts.map((alert, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{alert.partNo}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{alert.description || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${alert.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${alert.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${alert.margin < 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {alert.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.status === 'critical' 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.status === 'critical' ? 'Critical' : 'Warning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Landed Cost</p>
                  <p className="text-xs text-gray-500">Calculate import costs</p>
                </div>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Bulk Price Update</p>
                  <p className="text-xs text-gray-500">Update multiple items</p>
                </div>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Set Margins</p>
                  <p className="text-xs text-gray-500">Configure profit targets</p>
                </div>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Export Report</p>
                  <p className="text-xs text-gray-500">Download pricing data</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

