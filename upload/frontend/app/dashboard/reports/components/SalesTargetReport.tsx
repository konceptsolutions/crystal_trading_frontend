'use client';

import { useState, useMemo } from 'react';

interface SalesTarget {
  id: string;
  period: string;
  target: number;
  achieved: number;
  percentage: number;
  status: 'exceeded' | 'met' | 'below' | 'critical';
}

interface SalesPersonTarget {
  id: string;
  name: string;
  monthlyTarget: number;
  achieved: number;
  percentage: number;
  deals: number;
  avgDealSize: number;
  trend: 'up' | 'down' | 'stable';
}

interface CategoryTarget {
  category: string;
  target: number;
  achieved: number;
  percentage: number;
}

export default function SalesTargetReport() {
  const [viewPeriod, setViewPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [year, setYear] = useState('2024');

  // Mock data
  const monthlyTargets: SalesTarget[] = [
    { id: '1', period: 'January', target: 5000000, achieved: 4850000, percentage: 97, status: 'met' },
    { id: '2', period: 'February', target: 5500000, achieved: 6200000, percentage: 112.7, status: 'exceeded' },
    { id: '3', period: 'March', target: 6000000, achieved: 5100000, percentage: 85, status: 'below' },
    { id: '4', period: 'April', target: 5500000, achieved: 5650000, percentage: 102.7, status: 'exceeded' },
    { id: '5', period: 'May', target: 6000000, achieved: 5400000, percentage: 90, status: 'met' },
    { id: '6', period: 'June', target: 6500000, achieved: 4500000, percentage: 69.2, status: 'critical' },
    { id: '7', period: 'July', target: 6000000, achieved: 6800000, percentage: 113.3, status: 'exceeded' },
    { id: '8', period: 'August', target: 6500000, achieved: 5800000, percentage: 89.2, status: 'below' },
    { id: '9', period: 'September', target: 7000000, achieved: 7250000, percentage: 103.6, status: 'exceeded' },
    { id: '10', period: 'October', target: 7500000, achieved: 6900000, percentage: 92, status: 'met' },
    { id: '11', period: 'November', target: 8000000, achieved: 7200000, percentage: 90, status: 'met' },
    { id: '12', period: 'December', target: 10000000, achieved: 8500000, percentage: 85, status: 'below' },
  ];

  const salesPersonTargets: SalesPersonTarget[] = [
    { id: '1', name: 'Ahmed Hassan', monthlyTarget: 1500000, achieved: 1720000, percentage: 114.7, deals: 28, avgDealSize: 61428, trend: 'up' },
    { id: '2', name: 'Usman Ali', monthlyTarget: 1200000, achieved: 1150000, percentage: 95.8, deals: 22, avgDealSize: 52272, trend: 'stable' },
    { id: '3', name: 'Bilal Mahmood', monthlyTarget: 1000000, achieved: 1250000, percentage: 125, deals: 18, avgDealSize: 69444, trend: 'up' },
    { id: '4', name: 'Tariq Shah', monthlyTarget: 1300000, achieved: 980000, percentage: 75.4, deals: 15, avgDealSize: 65333, trend: 'down' },
    { id: '5', name: 'Imran Khan', monthlyTarget: 1100000, achieved: 1080000, percentage: 98.2, deals: 20, avgDealSize: 54000, trend: 'stable' },
    { id: '6', name: 'Hassan Raza', monthlyTarget: 900000, achieved: 720000, percentage: 80, deals: 12, avgDealSize: 60000, trend: 'down' },
  ];

  const categoryTargets: CategoryTarget[] = [
    { category: 'Brakes', target: 1500000, achieved: 1650000, percentage: 110 },
    { category: 'Filters', target: 1200000, achieved: 1080000, percentage: 90 },
    { category: 'Ignition', target: 800000, achieved: 920000, percentage: 115 },
    { category: 'Electrical', target: 1000000, achieved: 850000, percentage: 85 },
    { category: 'Suspension', target: 900000, achieved: 780000, percentage: 86.7 },
    { category: 'Engine Parts', target: 1400000, achieved: 1320000, percentage: 94.3 },
    { category: 'Cooling', target: 600000, achieved: 580000, percentage: 96.7 },
    { category: 'Transmission', target: 600000, achieved: 720000, percentage: 120 },
  ];

  const summaryStats = useMemo(() => ({
    totalTarget: monthlyTargets.reduce((sum, t) => sum + t.target, 0),
    totalAchieved: monthlyTargets.reduce((sum, t) => sum + t.achieved, 0),
    averagePercentage: (monthlyTargets.reduce((sum, t) => sum + t.percentage, 0) / monthlyTargets.length).toFixed(1),
    exceededMonths: monthlyTargets.filter(t => t.status === 'exceeded').length,
    metMonths: monthlyTargets.filter(t => t.status === 'met').length,
    belowMonths: monthlyTargets.filter(t => t.status === 'below' || t.status === 'critical').length,
  }), [monthlyTargets]);

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;
  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Exceeded</span>;
      case 'met':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Met</span>;
      case 'below':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Below Target</span>;
      case 'critical':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Critical</span>;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
      case 'down':
        return <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
      default:
        return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 90) return 'bg-blue-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const maxTarget = Math.max(...monthlyTargets.map(t => t.target));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sales Target vs Achievement</h2>
          <p className="text-gray-500 text-sm">Track sales performance against targets</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-primary-100 text-sm font-medium mb-2">Annual Performance {year}</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold">{summaryStats.averagePercentage}%</span>
              <span className="text-primary-200">of target achieved</span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(summaryStats.averagePercentage), 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-200">Target: {formatCurrency(summaryStats.totalTarget)}</span>
              <span className="font-semibold">Achieved: {formatCurrency(summaryStats.totalAchieved)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 md:col-span-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{summaryStats.exceededMonths}</div>
              <div className="text-primary-200 text-sm">Exceeded</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{summaryStats.metMonths}</div>
              <div className="text-primary-200 text-sm">Met Target</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{summaryStats.belowMonths}</div>
              <div className="text-primary-200 text-sm">Below</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Target Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Target vs Achievement</h3>
        <div className="relative h-80">
          <div className="absolute inset-0 flex items-end">
            {monthlyTargets.map((month, index) => (
              <div key={month.id} className="flex-1 flex flex-col items-center px-1 group">
                <div className="relative w-full flex gap-1 justify-center items-end" style={{ height: '250px' }}>
                  {/* Target Bar */}
                  <div
                    className="w-3 bg-gray-200 rounded-t transition-all"
                    style={{ height: `${(month.target / maxTarget) * 100}%` }}
                  />
                  {/* Achievement Bar */}
                  <div
                    className={`w-3 rounded-t transition-all ${getProgressColor(month.percentage)}`}
                    style={{ height: `${(month.achieved / maxTarget) * 100}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      <div className="font-semibold">{month.period}</div>
                      <div className="text-gray-400">Target: {formatCompact(month.target)}</div>
                      <div className="text-emerald-400">Achieved: {formatCompact(month.achieved)}</div>
                      <div className={month.percentage >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                        {month.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 truncate">{month.period.substring(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span className="text-sm text-gray-600">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span className="text-sm text-gray-600">Exceeded (100%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Met (90-99%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-sm text-gray-600">Below (75-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Critical (&lt;75%)</span>
          </div>
        </div>
      </div>

      {/* Sales Person Performance */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Team Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesPersonTargets.map((person) => (
            <div key={person.id} className={`border rounded-xl p-4 ${
              person.percentage >= 100 ? 'border-emerald-200 bg-emerald-50/50' :
              person.percentage >= 90 ? 'border-blue-200 bg-blue-50/50' :
              person.percentage >= 75 ? 'border-amber-200 bg-amber-50/50' :
              'border-red-200 bg-red-50/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-gray-600">{person.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{person.name}</div>
                    <div className="text-xs text-gray-500">{person.deals} deals closed</div>
                  </div>
                </div>
                {getTrendIcon(person.trend)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target: {formatCompact(person.monthlyTarget)}</span>
                  <span className="font-semibold">{person.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(person.percentage)}`}
                    style={{ width: `${Math.min(person.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Achieved: {formatCompact(person.achieved)}</span>
                  <span>Avg Deal: {formatCompact(person.avgDealSize)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Target Performance */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Category-wise Target Performance</h3>
        <div className="space-y-4">
          {categoryTargets.map((cat, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 font-medium text-gray-900">{cat.category}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Target: {formatCompact(cat.target)}</span>
                  <span className="font-semibold">{formatCompact(cat.achieved)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                  {/* Target marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                    style={{ left: '100%', transform: 'translateX(-50%)' }}
                  />
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(cat.percentage)}`}
                    style={{ width: `${Math.min(cat.percentage, 120)}%` }}
                  />
                </div>
              </div>
              <div className={`w-16 text-right font-semibold ${
                cat.percentage >= 100 ? 'text-emerald-600' : 
                cat.percentage >= 90 ? 'text-blue-600' : 'text-amber-600'
              }`}>
                {cat.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Details Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Target</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Achieved</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Variance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyTargets.map((month) => {
                const variance = month.achieved - month.target;
                return (
                  <tr key={month.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{month.period}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(month.target)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(month.achieved)}</td>
                    <td className={`px-4 py-4 text-right font-semibold ${variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(month.percentage)}`}
                            style={{ width: `${Math.min(month.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-12">{month.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">{getStatusBadge(month.status)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(summaryStats.totalTarget)}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(summaryStats.totalAchieved)}</td>
                <td className={`px-4 py-3 text-right ${summaryStats.totalAchieved >= summaryStats.totalTarget ? 'text-emerald-600' : 'text-red-600'}`}>
                  {summaryStats.totalAchieved >= summaryStats.totalTarget ? '+' : ''}{formatCurrency(summaryStats.totalAchieved - summaryStats.totalTarget)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(parseFloat(summaryStats.averagePercentage))}`}
                        style={{ width: `${Math.min(parseFloat(summaryStats.averagePercentage), 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12">{summaryStats.averagePercentage}%</span>
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

