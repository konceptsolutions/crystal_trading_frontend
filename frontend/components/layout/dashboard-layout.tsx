'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from './sidebar';
import PageTransition from './page-transition';
import SearchModal from './search-modal';
import NotificationsDropdown from './notifications-dropdown';
import UserMenu from './user-menu';
import TeamMembersPopover from './team-members-popover';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, init } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTeamMembersOpen, setIsTeamMembersOpen] = useState(false);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      init();
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router, init]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsNotificationsOpen(false);
        setIsUserMenuOpen(false);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Activity', path: '/dashboard/activity' },
    { label: 'Manage', path: '/dashboard/parts' },
    { label: 'Program', path: '/dashboard/programs' },
    { label: 'Folders', path: '/dashboard/categories' },
    { label: 'Documents', path: '/dashboard/documents' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar 
        isCollapsed={isCollapsed} 
        isHovered={isHovered}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <div className="flex-1 flex flex-col ml-20">
        {/* Header Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-gray-900">InventoryERP</span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden lg:flex items-center gap-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`
                        text-sm font-medium transition-colors whitespace-nowrap
                        ${isActive 
                          ? 'text-gray-900 border-b-2 border-primary-500 pb-1' 
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right: Team, Search, Notifications, User */}
            <div className="flex items-center gap-4">
              {/* Team Members */}
              <div className="hidden lg:flex items-center gap-2 relative">
                <button
                  onClick={() => {
                    setIsTeamMembersOpen(!isTeamMembersOpen);
                    setIsSearchOpen(false);
                    setIsNotificationsOpen(false);
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-orange-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:scale-110 transition-transform"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">+10</span>
                </button>
                <TeamMembersPopover
                  isOpen={isTeamMembersOpen}
                  onClose={() => setIsTeamMembersOpen(false)}
                />
              </div>

              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsNotificationsOpen(false);
                    setIsUserMenuOpen(false);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                  aria-label="Search"
                  title="Search (Ctrl+K or Cmd+K)"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="absolute -bottom-1 -right-1 text-[10px] bg-gray-200 text-gray-600 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ⌘K
                  </span>
                </button>
                <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsSearchOpen(false);
                    setIsUserMenuOpen(false);
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <NotificationsDropdown
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                />
              </div>

              {/* User Profile */}
              <div className="relative flex items-center gap-3 pl-4 border-l border-gray-200">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsSearchOpen(false);
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-medium text-sm cursor-pointer">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>
                <UserMenu isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
