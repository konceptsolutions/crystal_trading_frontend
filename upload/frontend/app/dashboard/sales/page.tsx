'use client';

import { useState } from 'react';
import SalesInquiry from './components/SalesInquiry';
import SalesQuotation from './components/SalesQuotation';
import SalesOrder from './components/SalesOrder';
import SalesInvoice from './components/SalesInvoice';
import SalesReturn from './components/SalesReturn';
import DeliveryChallan from './components/DeliveryChallan';
import CustomerPriceStructure from './components/CustomerPriceStructure';
import DistributorAgingReport from './components/DistributorAgingReport';
import ReceivableReminders from './components/ReceivableReminders';

type SalesTab = 'inquiry' | 'quotation' | 'order' | 'invoice' | 'return' | 'delivery' | 'pricing' | 'aging' | 'receivables';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<SalesTab>('inquiry');

  const menuItems = [
    { 
      id: 'inquiry' as SalesTab, 
      label: 'Inquiry', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'quotation' as SalesTab, 
      label: 'Quotation', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'order' as SalesTab, 
      label: 'Orders', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'invoice' as SalesTab, 
      label: 'Invoice', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    { 
      id: 'return' as SalesTab, 
      label: 'Returns', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      )
    },
    { 
      id: 'delivery' as SalesTab, 
      label: 'Delivery', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      )
    },
    { 
      id: 'pricing' as SalesTab, 
      label: 'Pricing', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'aging' as SalesTab, 
      label: 'Aging Report', 
      isNew: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'receivables' as SalesTab, 
      label: 'Receivables', 
      isNew: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'inquiry':
        return <SalesInquiry />;
      case 'quotation':
        return <SalesQuotation />;
      case 'order':
        return <SalesOrder />;
      case 'invoice':
        return <SalesInvoice />;
      case 'return':
        return <SalesReturn />;
      case 'delivery':
        return <DeliveryChallan />;
      case 'pricing':
        return <CustomerPriceStructure />;
      case 'aging':
        return <DistributorAgingReport />;
      case 'receivables':
        return <ReceivableReminders />;
      default:
        return <SalesInquiry />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales & Distribution</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your complete sales workflow</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Single Row */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 mb-3 sm:mb-4 md:mb-6">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 min-w-fit
                  ${isActive
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.isNew && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded">NEW</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-3 sm:p-4 md:p-6">
        <div className="tab-fade">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
