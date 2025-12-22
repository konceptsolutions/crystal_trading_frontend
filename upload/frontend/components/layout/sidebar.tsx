'use client';

import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  isHovered?: boolean;
  onToggle: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number | string;
}

export default function Sidebar({ isCollapsed, isHovered = false, onToggle, onMouseEnter, onMouseLeave }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path?: string, label?: string) => {
    if (!path) return false;
    
    // Special handling for Part Management - check all related paths
    if (label === 'Part Management') {
      return (
        pathname === '/dashboard/parts' || 
        pathname.startsWith('/dashboard/parts/') ||
        pathname === '/dashboard/parts-list' ||
        pathname.startsWith('/dashboard/parts-list/') ||
        pathname === '/dashboard/categories' ||
        pathname.startsWith('/dashboard/categories/') ||
        pathname === '/dashboard/subcategories' ||
        pathname.startsWith('/dashboard/subcategories/')
      );
    }
    
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  // Icon menu items for ERP system
  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/dashboard',
    },
    {
      label: 'Part Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: '/dashboard/parts',
    },
    {
      label: 'Inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      path: '/dashboard/inventory',
    },
    {
      label: 'Sale',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      path: '/dashboard/sales',
    },
    {
      label: 'Suppliers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/dashboard/suppliers',
    },
    {
      label: 'Customers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/dashboard/customers',
    },
    {
      label: 'Pricing & Costing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/dashboard/pricing-costing',
    },
    {
      label: 'Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/dashboard/reports',
    },
    {
      label: 'Expense Type',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/dashboard/expense-types',
    },
    {
      label: 'Accounts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: '/dashboard/accounts',
    },
    {
      label: 'Voucher',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      path: '/dashboard/vouchers',
    },
    {
      label: 'Financial Statements',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/dashboard/financial-statements',
    },
    {
      label: 'Administration',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/dashboard/admin',
    },
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.path) {
      router.push(item.path);
    } else if (item.label === 'Refresh') {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className="hidden sm:flex bg-white border-r border-gray-200 h-screen fixed left-0 top-0 w-16 sm:w-20 flex-col items-center py-4 sm:py-6 z-50"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Menu Items */}
        <nav className="flex flex-col items-center gap-2 sm:gap-3 flex-1 w-full px-1 sm:px-2">
        {menuItems.map((item) => {
          const active = isActive(item.path, item.label);
          return (
            <button
              key={item.label}
              onClick={() => handleItemClick(item)}
              className={`
                relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                dock-icon group transition-all
                ${active 
                  ? 'bg-primary-500 text-white dock-icon-active' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <div className="relative z-10">
                {item.icon}
              </div>
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium z-20">
                  {item.badge}
                </span>
              )}
              {/* Tooltip - only on desktop */}
              <span className="dock-tooltip hidden sm:block">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
        <nav className="flex items-center justify-around px-2 py-2 max-h-20 overflow-x-auto scrollbar-hide">
          {menuItems.slice(0, 6).map((item) => {
            const active = isActive(item.path, item.label);
            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                className={`
                  flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-2 rounded-lg
                  transition-all active:scale-95
                  ${active 
                    ? 'text-primary-500 bg-primary-50' 
                    : 'text-gray-500 active:bg-gray-100'
                  }
                `}
              >
                <div className="w-5 h-5">
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {item.label.length > 8 ? item.label.substring(0, 7) + '...' : item.label}
                </span>
                {item.badge && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
