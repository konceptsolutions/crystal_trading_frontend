'use client';

import { useState } from 'react';
import ViewVouchers from './components/ViewVouchers';
import NewVoucher from './components/NewVoucher';

type VoucherTab = 'view' | 'new';

export default function VouchersPage() {
  const [activeTab, setActiveTab] = useState<VoucherTab>('view');

  const menuItems = [
    { 
      id: 'view' as VoucherTab, 
      label: 'View Vouchers', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'new' as VoucherTab, 
      label: 'New Voucher', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
  ];

  const handleTabClick = (tab: VoucherTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voucher Management</h1>
        <p className="text-gray-600">Manage your accounting vouchers and financial transactions</p>
      </div>

      {/* Horizontal Tabs Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'view' && <ViewVouchers />}
        {activeTab === 'new' && <NewVoucher />}
      </div>
    </div>
  );
}

