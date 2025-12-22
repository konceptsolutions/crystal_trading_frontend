'use client';

import { useState } from 'react';
import AdjustInventory from '@/components/inventory/AdjustInventory';
import InventoryStock from '@/components/inventory/InventoryStock';
import StockTransfer from '@/components/inventory/StockTransfer';
import StockBalanceValuation from '@/components/inventory/StockBalanceValuation';
import StockMultiDimensionalReport from '@/components/inventory/StockMultiDimensionalReport';
import StockAnalysis from '@/components/inventory/StockAnalysis';
import StockVerificationReport from '@/components/inventory/StockVerificationReport';
import StockPriceManagement from '@/components/inventory/StockPriceManagement';
import PurchaseOrdersPage from '../purchase-orders/page';
import DirectPurchaseOrdersPage from '../direct-purchase-orders/page';
import InventoryDashboard from '../inventory-dashboard/page';
import RacksPage from '../racks/page';

type TabType = 
  | 'dashboard'
  | 'adjust-inventory' 
  | 'stock' 
  | 'stock-transfer'
  | 'purchase-order' 
  | 'direct-purchase' 
  | 'racks' 
  | 'shelves' 
  | 'return-purchase' 
  | 'balance-valuation'
  | 'multi-dimensional'
  | 'stock-analysis'
  | 'verification'
  | 'prices';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'stock' as TabType,
      label: 'Stock In/Out',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'stock-transfer' as TabType,
      label: 'Stock Transfer',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: 'adjust-inventory' as TabType,
      label: 'Adjust Stock',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: 'balance-valuation' as TabType,
      label: 'Balance & Valuation',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'multi-dimensional' as TabType,
      label: 'Multi-Dimensional',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
    {
      id: 'stock-analysis' as TabType,
      label: 'Stock Analysis',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: 'verification' as TabType,
      label: 'Verification',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'prices' as TabType,
      label: 'Price Control',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'purchase-order' as TabType,
      label: 'Purchase Order',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'direct-purchase' as TabType,
      label: 'Direct Purchase',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'racks' as TabType,
      label: 'Racks & Shelves',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'return-purchase' as TabType,
      label: 'Return Purchase',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 p-2 sm:p-3 md:p-4 lg:p-6 transition-all duration-300">
      <div className="mb-3 sm:mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 transition-all duration-200">Inventory Management</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600">Manage your inventory operations and track stock levels</p>
      </div>

      {/* Horizontal Tabs Bar - Matching Parts Management Style */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-soft border border-gray-200 mb-3 sm:mb-4 md:mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide scroll-smooth">
          <div className="flex min-w-full">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`
                    flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
                    ${isActive
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4">{item.icon}</span>
                  <span className="hidden xs:inline sm:hidden">{item.label.split(' ')[0]}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area - Matching Parts Management Style */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-soft border border-gray-200 p-2 sm:p-3 md:p-4 lg:p-6 transition-all duration-300">
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'dashboard' && (
            <div className="-m-2 sm:-m-3 md:-m-4 lg:-m-6 -mb-2 sm:-mb-3 md:-mb-4 lg:-mb-6">
              <InventoryDashboard />
            </div>
          )}
          {activeTab === 'purchase-order' && (
            <div className="-m-2 sm:-m-3 md:-m-4 lg:-m-6 -mb-0">
              <PurchaseOrdersPage />
            </div>
          )}
          {activeTab === 'direct-purchase' && (
            <div className="-m-2 sm:-m-3 md:-m-4 lg:-m-6 -mb-0">
              <DirectPurchaseOrdersPage />
            </div>
          )}
          {activeTab === 'stock' && (
            <InventoryStock />
          )}
          {activeTab === 'stock-transfer' && (
            <StockTransfer />
          )}
          {activeTab === 'adjust-inventory' && (
            <AdjustInventory />
          )}
          {activeTab === 'balance-valuation' && (
            <StockBalanceValuation />
          )}
          {activeTab === 'multi-dimensional' && (
            <StockMultiDimensionalReport />
          )}
          {activeTab === 'stock-analysis' && (
            <StockAnalysis />
          )}
          {activeTab === 'verification' && (
            <StockVerificationReport />
          )}
          {activeTab === 'prices' && (
            <StockPriceManagement />
          )}
          {activeTab === 'racks' && (
            <div className="-m-2 sm:-m-3 md:-m-4 lg:-m-6 -mb-0">
              <RacksPage />
            </div>
          )}
          {activeTab === 'shelves' && (
            <div>
              <p className="text-gray-600">Shelves management content will be displayed here.</p>
            </div>
          )}
          {activeTab === 'return-purchase' && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Return Purchase</h3>
              <p className="text-gray-500">Return Purchase functionality coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
