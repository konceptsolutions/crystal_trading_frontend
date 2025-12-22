'use client';

import { useState } from 'react';
import PurchasesReport from './components/PurchasesReport';
import SalesReport from './components/SalesReport';
import ExpensesReport from './components/ExpensesReport';
import BrandWiseReport from './components/BrandWiseReport';
import CustomerWiseReport from './components/CustomerWiseReport';
import SalesTypeReport from './components/SalesTypeReport';
import RealTimeDashboard from './components/RealTimeDashboard';
import ImportCostSummaryReport from './components/ImportCostSummaryReport';
import SupplierPerformanceReport from './components/SupplierPerformanceReport';
import PeriodicSalesReport from './components/PeriodicSalesReport';
import StockMovementReport from './components/StockMovementReport';
import CustomerAgingReport from './components/CustomerAgingReport';
import PurchaseComparisonReport from './components/PurchaseComparisonReport';
import SalesTargetReport from './components/SalesTargetReport';

type ReportTab = 
  | 'dashboard' 
  | 'purchases' 
  | 'sales' 
  | 'periodic-sales'
  | 'expenses' 
  | 'brand-wise' 
  | 'customer-wise' 
  | 'sales-type'
  | 'import-cost'
  | 'supplier-performance'
  | 'stock-movement'
  | 'customer-aging'
  | 'purchase-comparison'
  | 'sales-target';

interface MenuItem {
  id: ReportTab;
  label: string;
  icon: React.ReactNode;
  category: 'overview' | 'sales' | 'inventory' | 'financial' | 'analytics';
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('dashboard');
  const [showCategories, setShowCategories] = useState(true);

  const menuItems: MenuItem[] = [
    // Overview
    {
      id: 'dashboard',
      label: 'Real-Time Dashboard',
      category: 'overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    // Sales Reports
    {
      id: 'sales',
      label: 'Sales Report',
      category: 'sales',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: 'periodic-sales',
      label: 'Periodic Sales',
      category: 'sales',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'sales-type',
      label: 'Sales by Type',
      category: 'sales',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
    {
      id: 'sales-target',
      label: 'Target vs Achievement',
      category: 'sales',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    // Inventory Reports
    {
      id: 'stock-movement',
      label: 'Stock Movement',
      category: 'inventory',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: 'brand-wise',
      label: 'Brand Wise',
      category: 'inventory',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    // Financial Reports
    {
      id: 'purchases',
      label: 'Purchases',
      category: 'financial',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'purchase-comparison',
      label: 'Purchase Comparison',
      category: 'financial',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'import-cost',
      label: 'Import Cost Summary',
      category: 'financial',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'expenses',
      label: 'Expenses',
      category: 'financial',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    // Analytics Reports
    {
      id: 'customer-wise',
      label: 'Customer Analysis',
      category: 'analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'customer-aging',
      label: 'Customer/Distributor Aging',
      category: 'analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'supplier-performance',
      label: 'Supplier Performance',
      category: 'analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const categories = [
    { id: 'overview', label: 'Overview', color: 'bg-primary-500' },
    { id: 'sales', label: 'Sales Reports', color: 'bg-emerald-500' },
    { id: 'inventory', label: 'Inventory Reports', color: 'bg-blue-500' },
    { id: 'financial', label: 'Financial Reports', color: 'bg-violet-500' },
    { id: 'analytics', label: 'Analytics', color: 'bg-amber-500' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <RealTimeDashboard />;
      case 'purchases':
        return <PurchasesReport />;
      case 'sales':
        return <SalesReport />;
      case 'periodic-sales':
        return <PeriodicSalesReport />;
      case 'expenses':
        return <ExpensesReport />;
      case 'brand-wise':
        return <BrandWiseReport />;
      case 'customer-wise':
        return <CustomerWiseReport />;
      case 'sales-type':
        return <SalesTypeReport />;
      case 'import-cost':
        return <ImportCostSummaryReport />;
      case 'supplier-performance':
        return <SupplierPerformanceReport />;
      case 'stock-movement':
        return <StockMovementReport />;
      case 'customer-aging':
        return <CustomerAgingReport />;
      case 'purchase-comparison':
        return <PurchaseComparisonReport />;
      case 'sales-target':
        return <SalesTargetReport />;
      default:
        return <RealTimeDashboard />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'overview': return 'border-primary-500 bg-primary-50 text-primary-700';
      case 'sales': return 'border-emerald-500 bg-emerald-50 text-emerald-700';
      case 'inventory': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'financial': return 'border-violet-500 bg-violet-50 text-violet-700';
      case 'analytics': return 'border-amber-500 bg-amber-50 text-amber-700';
      default: return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Reports & Analytics</h1>
            <p className="text-gray-600 text-sm sm:text-base">Comprehensive business insights and reporting</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {showCategories ? 'Hide Categories' : 'Show Categories'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      {showCategories && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = menuItems.find(item => item.id === activeTab)?.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const firstItemInCategory = menuItems.find(item => item.category === cat.id);
                  if (firstItemInCategory) {
                    setActiveTab(firstItemInCategory.id);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? `${cat.color} text-white shadow-md`
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : cat.color}`}></div>
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Horizontal Tabs Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2
                  ${isActive
                    ? `text-primary-600 border-primary-500 bg-primary-50`
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                <span className={isActive ? 'text-primary-500' : ''}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
}
