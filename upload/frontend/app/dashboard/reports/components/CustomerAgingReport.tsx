'use client';

import { useState } from 'react';

interface CustomerAging {
  id: string;
  name: string;
  type: 'customer' | 'distributor';
  totalOutstanding: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
  creditLimit: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  contactPerson: string;
  phone: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function CustomerAgingReport() {
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'distributor'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'outstanding' | 'overdue' | 'risk'>('outstanding');

  // Mock data for demonstration
  const [agingData] = useState<CustomerAging[]>([
    { id: '1', name: 'Auto Parts Karachi', type: 'distributor', totalOutstanding: 850000, current: 350000, days30: 250000, days60: 150000, days90: 80000, days90Plus: 20000, creditLimit: 1000000, lastPaymentDate: '2024-02-10', lastPaymentAmount: 150000, contactPerson: 'Ahmed Khan', phone: '0321-1234567', riskLevel: 'medium' },
    { id: '2', name: 'Lahore Motors', type: 'distributor', totalOutstanding: 1250000, current: 200000, days30: 150000, days60: 200000, days90: 400000, days90Plus: 300000, creditLimit: 1500000, lastPaymentDate: '2024-01-15', lastPaymentAmount: 100000, contactPerson: 'Usman Ali', phone: '0333-9876543', riskLevel: 'critical' },
    { id: '3', name: 'City Auto Works', type: 'customer', totalOutstanding: 125000, current: 125000, days30: 0, days60: 0, days90: 0, days90Plus: 0, creditLimit: 200000, lastPaymentDate: '2024-02-18', lastPaymentAmount: 50000, contactPerson: 'Imran Shah', phone: '0300-1112223', riskLevel: 'low' },
    { id: '4', name: 'Express Auto Parts', type: 'distributor', totalOutstanding: 680000, current: 280000, days30: 200000, days60: 100000, days90: 100000, days90Plus: 0, creditLimit: 800000, lastPaymentDate: '2024-02-05', lastPaymentAmount: 80000, contactPerson: 'Tariq Mahmood', phone: '0345-5556667', riskLevel: 'medium' },
    { id: '5', name: 'Quick Fix Garage', type: 'customer', totalOutstanding: 45000, current: 25000, days30: 20000, days60: 0, days90: 0, days90Plus: 0, creditLimit: 100000, lastPaymentDate: '2024-02-12', lastPaymentAmount: 30000, contactPerson: 'Shahid Hussain', phone: '0312-4443332', riskLevel: 'low' },
    { id: '6', name: 'Premium Motors Islamabad', type: 'distributor', totalOutstanding: 920000, current: 150000, days30: 100000, days60: 170000, days90: 250000, days90Plus: 250000, creditLimit: 1200000, lastPaymentDate: '2024-01-20', lastPaymentAmount: 120000, contactPerson: 'Bilal Ahmad', phone: '0323-7778889', riskLevel: 'high' },
    { id: '7', name: 'Speedway Auto', type: 'customer', totalOutstanding: 210000, current: 80000, days30: 50000, days60: 40000, days90: 25000, days90Plus: 15000, creditLimit: 300000, lastPaymentDate: '2024-01-28', lastPaymentAmount: 40000, contactPerson: 'Kamran Zafar', phone: '0311-2223334', riskLevel: 'medium' },
    { id: '8', name: 'Al-Madina Auto Parts', type: 'distributor', totalOutstanding: 1580000, current: 180000, days30: 200000, days60: 300000, days90: 400000, days90Plus: 500000, creditLimit: 2000000, lastPaymentDate: '2023-12-15', lastPaymentAmount: 200000, contactPerson: 'Hassan Raza', phone: '0334-6667778', riskLevel: 'critical' },
  ]);

  const filteredData = agingData
    .filter(item => filterType === 'all' || item.type === filterType)
    .filter(item => riskFilter === 'all' || item.riskLevel === riskFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'outstanding':
          return b.totalOutstanding - a.totalOutstanding;
        case 'overdue':
          return (b.days60 + b.days90 + b.days90Plus) - (a.days60 + a.days90 + a.days90Plus);
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        default:
          return 0;
      }
    });

  const summaryStats = {
    totalOutstanding: agingData.reduce((sum, c) => sum + c.totalOutstanding, 0),
    current: agingData.reduce((sum, c) => sum + c.current, 0),
    days30: agingData.reduce((sum, c) => sum + c.days30, 0),
    days60: agingData.reduce((sum, c) => sum + c.days60, 0),
    days90: agingData.reduce((sum, c) => sum + c.days90, 0),
    days90Plus: agingData.reduce((sum, c) => sum + c.days90Plus, 0),
    totalCustomers: agingData.filter(c => c.type === 'customer').length,
    totalDistributors: agingData.filter(c => c.type === 'distributor').length,
    criticalAccounts: agingData.filter(c => c.riskLevel === 'critical').length,
    highRiskAccounts: agingData.filter(c => c.riskLevel === 'high').length,
  };

  const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Critical</span>;
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Medium</span>;
      case 'low':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Low</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'distributor' 
      ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">Distributor</span>
      : <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">Customer</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customer & Distributor Aging</h2>
          <p className="text-gray-500 text-sm">Monitor receivables and payment aging analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Reminders
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterType === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterType === 'customer' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Customers ({summaryStats.totalCustomers})
            </button>
            <button
              onClick={() => setFilterType('distributor')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterType === 'distributor' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Distributors ({summaryStats.totalDistributors})
            </button>
          </div>
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="outstanding">Sort by Outstanding</option>
              <option value="overdue">Sort by Overdue</option>
              <option value="risk">Sort by Risk Level</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Outstanding</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(summaryStats.totalOutstanding)}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Current</div>
          <div className="text-xl font-bold text-emerald-700">{formatCurrency(summaryStats.current)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs text-blue-600 uppercase tracking-wider mb-1">1-30 Days</div>
          <div className="text-xl font-bold text-blue-700">{formatCurrency(summaryStats.days30)}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs text-amber-600 uppercase tracking-wider mb-1">31-60 Days</div>
          <div className="text-xl font-bold text-amber-700">{formatCurrency(summaryStats.days60)}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-xs text-orange-600 uppercase tracking-wider mb-1">61-90 Days</div>
          <div className="text-xl font-bold text-orange-700">{formatCurrency(summaryStats.days90)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs text-red-600 uppercase tracking-wider mb-1">90+ Days</div>
          <div className="text-xl font-bold text-red-700">{formatCurrency(summaryStats.days90Plus)}</div>
        </div>
      </div>

      {/* Aging Distribution Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Receivables Aging Distribution</h3>
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(summaryStats.current / summaryStats.totalOutstanding) * 100}%` }}
          >
            {(summaryStats.current / summaryStats.totalOutstanding) * 100 > 10 && (
              <span className="text-white text-xs font-medium">{((summaryStats.current / summaryStats.totalOutstanding) * 100).toFixed(0)}%</span>
            )}
          </div>
          <div 
            className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(summaryStats.days30 / summaryStats.totalOutstanding) * 100}%` }}
          >
            {(summaryStats.days30 / summaryStats.totalOutstanding) * 100 > 10 && (
              <span className="text-white text-xs font-medium">{((summaryStats.days30 / summaryStats.totalOutstanding) * 100).toFixed(0)}%</span>
            )}
          </div>
          <div 
            className="bg-amber-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(summaryStats.days60 / summaryStats.totalOutstanding) * 100}%` }}
          >
            {(summaryStats.days60 / summaryStats.totalOutstanding) * 100 > 10 && (
              <span className="text-white text-xs font-medium">{((summaryStats.days60 / summaryStats.totalOutstanding) * 100).toFixed(0)}%</span>
            )}
          </div>
          <div 
            className="bg-orange-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(summaryStats.days90 / summaryStats.totalOutstanding) * 100}%` }}
          >
            {(summaryStats.days90 / summaryStats.totalOutstanding) * 100 > 10 && (
              <span className="text-white text-xs font-medium">{((summaryStats.days90 / summaryStats.totalOutstanding) * 100).toFixed(0)}%</span>
            )}
          </div>
          <div 
            className="bg-red-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(summaryStats.days90Plus / summaryStats.totalOutstanding) * 100}%` }}
          >
            {(summaryStats.days90Plus / summaryStats.totalOutstanding) * 100 > 10 && (
              <span className="text-white text-xs font-medium">{((summaryStats.days90Plus / summaryStats.totalOutstanding) * 100).toFixed(0)}%</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">1-30 Days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm text-gray-600">31-60 Days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600">61-90 Days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">90+ Days</span>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      {(summaryStats.criticalAccounts > 0 || summaryStats.highRiskAccounts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaryStats.criticalAccounts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-red-800">{summaryStats.criticalAccounts} Critical Accounts</h4>
                <p className="text-sm text-red-600">Immediate action required - severely overdue payments</p>
              </div>
            </div>
          )}
          {summaryStats.highRiskAccounts > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-orange-800">{summaryStats.highRiskAccounts} High Risk Accounts</h4>
                <p className="text-sm text-orange-600">Follow up needed - approaching critical status</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer/Distributor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Due</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wider">Current</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider">1-30</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">31-60</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-orange-600 uppercase tracking-wider">61-90</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-red-600 uppercase tracking-wider">90+</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Payment</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((customer) => (
                <tr key={customer.id} className={`hover:bg-gray-50 transition-colors ${
                  customer.riskLevel === 'critical' ? 'bg-red-50/50' :
                  customer.riskLevel === 'high' ? 'bg-orange-50/50' : ''
                }`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        customer.type === 'distributor' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <span className={`font-bold ${customer.type === 'distributor' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {customer.name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.contactPerson} • {customer.phone}</div>
                        <div className="mt-1">{getTypeBadge(customer.type)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">{formatCurrency(customer.totalOutstanding)}</td>
                  <td className="px-4 py-4 text-right text-emerald-600">{customer.current > 0 ? formatCurrency(customer.current) : '-'}</td>
                  <td className="px-4 py-4 text-right text-blue-600">{customer.days30 > 0 ? formatCurrency(customer.days30) : '-'}</td>
                  <td className="px-4 py-4 text-right text-amber-600">{customer.days60 > 0 ? formatCurrency(customer.days60) : '-'}</td>
                  <td className="px-4 py-4 text-right text-orange-600">{customer.days90 > 0 ? formatCurrency(customer.days90) : '-'}</td>
                  <td className="px-4 py-4 text-right font-semibold text-red-600">{customer.days90Plus > 0 ? formatCurrency(customer.days90Plus) : '-'}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm text-gray-900">{new Date(customer.lastPaymentDate).toLocaleDateString('en-GB')}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(customer.lastPaymentAmount)}</div>
                  </td>
                  <td className="px-4 py-4 text-center">{getRiskBadge(customer.riskLevel)}</td>
                  <td className="px-4 py-4 text-center">
                    <button className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                      Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(summaryStats.totalOutstanding)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(summaryStats.current)}</td>
                <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(summaryStats.days30)}</td>
                <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(summaryStats.days60)}</td>
                <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(summaryStats.days90)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(summaryStats.days90Plus)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

