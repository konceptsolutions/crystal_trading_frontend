'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';

// Import Finance Components
import GeneralLedger from './components/GeneralLedger';
import TrialBalance from './components/TrialBalance';
import SupplierPayments from './components/SupplierPayments';
import PayableReminders from './components/PayableReminders';
import CustomerReceivables from './components/CustomerReceivables';
import CashBook from './components/CashBook';
import BankBook from './components/BankBook';
import CostPriceReporting from './components/CostPriceReporting';

// Icons
const ManageAccountsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const FinanceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Types
interface MainGroup {
  id: string;
  code: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SubGroup {
  id: string;
  mainGroupId: string;
  code: string;
  name: string;
  mainGroup?: MainGroup;
  createdAt?: string;
  updatedAt?: string;
}

interface Account {
  id: string;
  subGroupId: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
  subGroup?: SubGroup;
  createdAt?: string;
  updatedAt?: string;
}

type MainSection = 'manage-accounts' | 'finance';
type AccountTab = 'main-groups' | 'subgroups' | 'accounts';
type FinanceTab = 'general-ledger' | 'trial-balance' | 'supplier-payments' | 'payable-reminders' | 'customer-receivables' | 'cash-book' | 'bank-book' | 'cost-reporting';

export default function AccountsPage() {
  // Main section tabs
  const [mainSection, setMainSection] = useState<MainSection>('manage-accounts');
  const [activeTab, setActiveTab] = useState<AccountTab>('main-groups');
  const [financeTab, setFinanceTab] = useState<FinanceTab>('general-ledger');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Main Groups
  const [mainGroups, setMainGroups] = useState<MainGroup[]>([]);
  const [mainGroupDialogOpen, setMainGroupDialogOpen] = useState(false);
  const [selectedMainGroup, setSelectedMainGroup] = useState<MainGroup | null>(null);
  const [mainGroupForm, setMainGroupForm] = useState({ code: '', name: '' });

  // Sub Groups
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [subGroupDialogOpen, setSubGroupDialogOpen] = useState(false);
  const [selectedSubGroup, setSelectedSubGroup] = useState<SubGroup | null>(null);
  const [subGroupForm, setSubGroupForm] = useState({ mainGroupId: '', code: '', name: '' });
  const [subGroupMainGroupFilter, setSubGroupMainGroupFilter] = useState('');
  const [subGroupStatusFilter, setSubGroupStatusFilter] = useState('Active');

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [personAccountDialogOpen, setPersonAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState({ subGroupId: '', code: '', name: '', status: 'Active' as 'Active' | 'Inactive' });
  const [accountMainGroupFilter, setAccountMainGroupFilter] = useState('');
  const [accountSubGroupFilter, setAccountSubGroupFilter] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('Active');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [accountDialogMainGroupId, setAccountDialogMainGroupId] = useState('');
  const [accountDialogSubGroups, setAccountDialogSubGroups] = useState<SubGroup[]>([]);

  // Finance Tab Items
  const financeTabItems = [
    { id: 'general-ledger' as FinanceTab, label: 'General Ledger', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { id: 'trial-balance' as FinanceTab, label: 'Trial Balance', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { id: 'supplier-payments' as FinanceTab, label: 'Supplier Payments', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'payable-reminders' as FinanceTab, label: 'Payable Reminders', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
    { id: 'customer-receivables' as FinanceTab, label: 'Customer Receivables', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'cash-book' as FinanceTab, label: 'Cash Book', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: 'bank-book' as FinanceTab, label: 'Bank Book', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    )},
    { id: 'cost-reporting' as FinanceTab, label: 'Cost Price Reporting', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )},
  ];

  // Fetch data
  useEffect(() => {
    if (mainSection === 'manage-accounts') {
      if (activeTab === 'main-groups') {
        fetchMainGroups();
      } else if (activeTab === 'subgroups') {
        fetchSubGroups();
        fetchMainGroups();
      } else if (activeTab === 'accounts') {
        fetchAccounts();
        fetchMainGroups();
      }
    }
  }, [mainSection, activeTab, subGroupMainGroupFilter, subGroupStatusFilter, accountMainGroupFilter, accountSubGroupFilter, accountStatusFilter]);

  const fetchMainGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/accounts/main-groups');
      setMainGroups(response.data.mainGroups || []);
      setSuccess('');
    } catch (err: any) {
      console.error('Error fetching main groups:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch main groups';
      setError(errorMessage);
      if (errorMessage.includes('P2021') || errorMessage.includes('Table') || errorMessage.includes('does not exist')) {
        setError('Database tables are missing. The database has been synced. Please restart the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSubGroups = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (subGroupMainGroupFilter) params.mainGroupId = subGroupMainGroupFilter;
      if (subGroupStatusFilter) params.status = subGroupStatusFilter;
      
      const response = await api.get('/accounts/subgroups', { params });
      setSubGroups(response.data.subgroups || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch subgroups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (accountMainGroupFilter) params.mainGroupId = accountMainGroupFilter;
      if (accountSubGroupFilter) params.subGroupId = accountSubGroupFilter;
      if (accountStatusFilter) params.status = accountStatusFilter;
      
      const response = await api.get('/accounts/accounts', { params });
      setAccounts(response.data.accounts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  // Main Group handlers
  const openMainGroupDialog = (group?: MainGroup) => {
    if (group) {
      setSelectedMainGroup(group);
      setMainGroupForm({ code: group.code.toString(), name: group.name });
    } else {
      setSelectedMainGroup(null);
      setMainGroupForm({ code: '', name: '' });
    }
    setMainGroupDialogOpen(true);
  };

  const handleMainGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const data = {
        code: parseInt(mainGroupForm.code),
        name: mainGroupForm.name,
      };

      if (selectedMainGroup) {
        await api.put(`/accounts/main-groups/${selectedMainGroup.id}`, data);
        setSuccess('Main group updated successfully');
      } else {
        await api.post('/accounts/main-groups', data);
        setSuccess('Main group created successfully');
      }

      setMainGroupDialogOpen(false);
      fetchMainGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save main group');
    } finally {
      setLoading(false);
    }
  };

  const handleMainGroupDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this main group?')) return;

    try {
      setLoading(true);
      await api.delete(`/accounts/main-groups/${id}`);
      setSuccess('Main group deleted successfully');
      fetchMainGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete main group');
    } finally {
      setLoading(false);
    }
  };

  // Sub Group handlers
  const openSubGroupDialog = (group?: SubGroup) => {
    if (group) {
      setSelectedSubGroup(group);
      setSubGroupForm({
        mainGroupId: group.mainGroupId,
        code: group.code,
        name: group.name,
      });
    } else {
      setSelectedSubGroup(null);
      setSubGroupForm({ mainGroupId: '', code: '', name: '' });
    }
    setSubGroupDialogOpen(true);
  };

  const handleSubGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      if (selectedSubGroup) {
        await api.put(`/accounts/subgroups/${selectedSubGroup.id}`, subGroupForm);
        setSuccess('Subgroup updated successfully');
      } else {
        await api.post('/accounts/subgroups', subGroupForm);
        setSuccess('Subgroup created successfully');
      }

      setSubGroupDialogOpen(false);
      fetchSubGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save subgroup');
    } finally {
      setLoading(false);
    }
  };

  const handleSubGroupDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subgroup?')) return;

    try {
      setLoading(true);
      await api.delete(`/accounts/subgroups/${id}`);
      setSuccess('Subgroup deleted successfully');
      fetchSubGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete subgroup');
    } finally {
      setLoading(false);
    }
  };

  // Account handlers
  const openAccountDialog = async (account?: Account) => {
    if (account) {
      setSelectedAccount(account);
      setAccountForm({
        subGroupId: account.subGroupId,
        code: account.code,
        name: account.name,
        status: account.status,
      });
      if (account.subGroup?.mainGroupId) {
        setAccountDialogMainGroupId(account.subGroup.mainGroupId);
        try {
          const response = await api.get('/accounts/subgroups', {
            params: { mainGroupId: account.subGroup.mainGroupId },
          });
          setAccountDialogSubGroups(response.data.subgroups || []);
        } catch (err) {
          console.error('Failed to fetch subgroups:', err);
        }
      }
    } else {
      setSelectedAccount(null);
      setAccountForm({ subGroupId: '', code: '', name: '', status: 'Active' });
      setAccountDialogMainGroupId('');
      setAccountDialogSubGroups([]);
    }
    setAccountDialogOpen(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      if (selectedAccount) {
        await api.put(`/accounts/accounts/${selectedAccount.id}`, accountForm);
        setSuccess('Account updated successfully');
      } else {
        await api.post('/accounts/accounts', accountForm);
        setSuccess('Account created successfully');
      }

      setAccountDialogOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      setLoading(true);
      await api.delete(`/accounts/accounts/${id}`);
      setSuccess('Account deleted successfully');
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const getSubGroupsForMainGroup = (mainGroupId: string) => {
    return subGroups.filter(sg => sg.mainGroupId === mainGroupId);
  };

  useEffect(() => {
    if (activeTab === 'accounts' && accountMainGroupFilter) {
      fetchSubGroups();
    }
  }, [accountMainGroupFilter, activeTab]);

  // Render Finance Tab Content
  const renderFinanceContent = () => {
    switch (financeTab) {
      case 'general-ledger':
        return <GeneralLedger />;
      case 'trial-balance':
        return <TrialBalance />;
      case 'supplier-payments':
        return <SupplierPayments />;
      case 'payable-reminders':
        return <PayableReminders />;
      case 'customer-receivables':
        return <CustomerReceivables />;
      case 'cash-book':
        return <CashBook />;
      case 'bank-book':
        return <BankBook />;
      case 'cost-reporting':
        return <CostPriceReporting />;
      default:
        return <GeneralLedger />;
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen transition-smooth">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts & Finance</h1>
        <p className="text-gray-600">Complete accounting and financial management system</p>
      </div>

      <Card className="bg-white shadow-soft">
        {/* Main Section Tabs */}
        <div className="flex justify-center border-b border-gray-200 bg-white rounded-t-lg">
          <button
            onClick={() => setMainSection('manage-accounts')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              mainSection === 'manage-accounts'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ManageAccountsIcon className="w-5 h-5" />
            <span>Manage Accounts</span>
          </button>
          <button
            onClick={() => setMainSection('finance')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              mainSection === 'finance'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FinanceIcon className="w-5 h-5" />
            <span>Finance & Reports</span>
          </button>
        </div>

        {/* Manage Accounts Section */}
        {mainSection === 'manage-accounts' && (
          <div className="p-0">
            {/* Sub Tabs */}
            <div className="px-3 sm:px-4 md:px-6 pt-4 md:pt-6 border-b border-gray-100">
              <div className="flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('main-groups')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'main-groups'
                      ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">A</span>
                  <span className="hidden sm:inline">Main Groups</span>
                  <span className="sm:hidden">Main</span>
                </button>
                <button
                  onClick={() => setActiveTab('subgroups')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'subgroups'
                      ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">S</span>
                  <span className="hidden sm:inline">Subgroups</span>
                  <span className="sm:hidden">Sub</span>
                </button>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'accounts'
                      ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">A</span>
                  <span className="hidden sm:inline">Accounts</span>
                  <span className="sm:hidden">Acc</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
                {typeof error === 'object' ? JSON.stringify(error) : error}
              </div>
            )}

            {success && (
              <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
                {success}
              </div>
            )}

            {/* Main Groups Tab */}
            {activeTab === 'main-groups' && (
              <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-lg sm:text-xl">👥</span>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Main Groups</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      onClick={() => openMainGroupDialog()} 
                      className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5"
                    >
                      <span className="hidden sm:inline">+ Add New Main Group</span>
                      <span className="sm:hidden">+ Add</span>
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 sm:w-12 px-2 sm:px-4">
                              <input type="checkbox" className="rounded w-4 h-4" />
                            </TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Code</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Main Group Name</TableHead>
                            <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading && mainGroups.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : mainGroups.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                No main groups found. Create one to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            mainGroups.map((group) => (
                              <TableRow key={group.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="px-2 sm:px-4">
                                  <input type="checkbox" className="rounded w-4 h-4" />
                                </TableCell>
                                <TableCell className="font-medium px-2 sm:px-4 text-sm sm:text-base">{group.code}</TableCell>
                                <TableCell className="px-2 sm:px-4 text-sm sm:text-base">{group.name}</TableCell>
                                <TableCell className="px-2 sm:px-4">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openMainGroupDialog(group)}
                                      className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                                    >
                                      <span className="text-xs sm:text-sm">✏️</span>
                                      <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMainGroupDelete(group.id)}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                                    >
                                      <span className="text-xs sm:text-sm">🗑️</span>
                                      <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600 px-2 sm:px-0">
                    <span>Showing 1 to {mainGroups.length} of {mainGroups.length} items</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                      className="w-full sm:w-20 text-xs sm:text-sm"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Subgroups Tab */}
            {activeTab === 'subgroups' && (
              <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-lg sm:text-xl">👥</span>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Subgroups</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => openSubGroupDialog()} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5">
                      <span className="hidden sm:inline">+ Add New Subgroup</span>
                      <span className="sm:hidden">+ Add</span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="subgroup-main-group-filter" className="text-sm sm:text-base mb-1 sm:mb-2 block">Main Group</Label>
                    <Select
                      id="subgroup-main-group-filter"
                      value={subGroupMainGroupFilter}
                      onChange={(e) => setSubGroupMainGroupFilter(e.target.value)}
                      className="w-full text-sm sm:text-base"
                    >
                      <option value="">Select...</option>
                      {mainGroups.map((mg) => (
                        <option key={mg.id} value={mg.id}>
                          {mg.code} - {mg.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subgroup-status-filter" className="text-sm sm:text-base mb-1 sm:mb-2 block">Status</Label>
                    <Select
                      id="subgroup-status-filter"
                      value={subGroupStatusFilter}
                      onChange={(e) => setSubGroupStatusFilter(e.target.value)}
                      className="w-full text-sm sm:text-base"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 sm:w-12 px-2 sm:px-4">
                              <input type="checkbox" className="rounded w-4 h-4" />
                            </TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Main Group</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Code</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Sub Group</TableHead>
                            <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading && subGroups.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : subGroups.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                No subgroups found. Create one to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            subGroups.map((group) => (
                              <TableRow key={group.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="px-2 sm:px-4">
                                  <input type="checkbox" className="rounded w-4 h-4" />
                                </TableCell>
                                <TableCell className="px-2 sm:px-4">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                    <span className="text-xs sm:text-sm truncate">{group.mainGroup?.name || 'N/A'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm">{group.code}</TableCell>
                                <TableCell className="px-2 sm:px-4 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{group.name}</TableCell>
                                <TableCell className="px-2 sm:px-4">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openSubGroupDialog(group)}
                                      className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                                    >
                                      <span className="text-xs sm:text-sm">✏️</span>
                                      <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSubGroupDelete(group.id)}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                                    >
                                      <span className="text-xs sm:text-sm">🗑️</span>
                                      <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
              <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-lg sm:text-xl">👥</span>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Accounts</h2>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => openAccountDialog()} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5">
                      <span className="hidden sm:inline">+ Add New Account</span>
                      <span className="sm:hidden">+ Add Account</span>
                    </Button>
                    <Button onClick={() => setPersonAccountDialogOpen(true)} variant="outline" className="flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5">
                      <span className="hidden md:inline">Add New person's Account</span>
                      <span className="md:hidden">+ Person Account</span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="account-main-group-filter" className="text-sm sm:text-base mb-1 sm:mb-2 block">Main Group</Label>
                    <Select
                      id="account-main-group-filter"
                      value={accountMainGroupFilter}
                      onChange={(e) => {
                        setAccountMainGroupFilter(e.target.value);
                        setAccountSubGroupFilter('');
                      }}
                      className="w-full text-sm sm:text-base"
                    >
                      <option value="">Select...</option>
                      {mainGroups.map((mg) => (
                        <option key={mg.id} value={mg.id}>
                          {mg.code} - {mg.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="account-sub-group-filter" className="text-sm sm:text-base mb-1 sm:mb-2 block">Sub Group</Label>
                    <Select
                      id="account-sub-group-filter"
                      value={accountSubGroupFilter}
                      onChange={(e) => setAccountSubGroupFilter(e.target.value)}
                      className="w-full text-sm sm:text-base"
                    >
                      <option value="">Select...</option>
                      {getSubGroupsForMainGroup(accountMainGroupFilter).map((sg) => (
                        <option key={sg.id} value={sg.id}>
                          {sg.code} - {sg.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="account-status-filter" className="text-sm sm:text-base mb-1 sm:mb-2 block">Status</Label>
                    <Select
                      id="account-status-filter"
                      value={accountStatusFilter}
                      onChange={(e) => setAccountStatusFilter(e.target.value)}
                      className="w-full text-sm sm:text-base"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 sm:w-12 px-2 sm:px-4">
                              <input type="checkbox" className="rounded w-4 h-4" />
                            </TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Group</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Sub Group</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Code</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Name</TableHead>
                            <TableHead className="underline cursor-pointer px-2 sm:px-4 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading && accounts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                Loading...
                              </TableCell>
                            </TableRow>
                          ) : accounts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                                No accounts found. Create one to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            accounts.map((account) => (
                              <TableRow key={account.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="px-2 sm:px-4">
                                  <input type="checkbox" className="rounded w-4 h-4" />
                                </TableCell>
                                <TableCell className="px-2 sm:px-4">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                    <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                                      {account.subGroup?.mainGroup?.code}-{account.subGroup?.mainGroup?.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                                  {account.subGroup?.code} - {account.subGroup?.name}
                                </TableCell>
                                <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm">{account.code}</TableCell>
                                <TableCell className="px-2 sm:px-4 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{account.name}</TableCell>
                                <TableCell className="px-2 sm:px-4">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className={`w-2 h-2 rounded-full ${account.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} flex-shrink-0`}></div>
                                    <span className="text-xs sm:text-sm">{account.status}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 sm:px-4">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openAccountDialog(account)}
                                      className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                                    >
                                      <span className="text-xs sm:text-sm">✏️</span>
                                      <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAccountDelete(account.id)}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                                    >
                                      <span className="text-xs sm:text-sm">🗑️</span>
                                      <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finance Section */}
        {mainSection === 'finance' && (
          <div className="p-0">
            {/* Finance Sub Tabs */}
            <div className="px-3 sm:px-4 md:px-6 pt-4 border-b border-gray-100 overflow-x-auto">
              <div className="flex gap-1 min-w-max pb-px">
                {financeTabItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFinanceTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                      financeTab === item.id
                        ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="md:hidden">{item.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Finance Content */}
            <div className="p-4 md:p-6">
              {renderFinanceContent()}
            </div>
          </div>
        )}
      </Card>

      {/* Main Group Dialog */}
      <Dialog open={mainGroupDialogOpen} onOpenChange={setMainGroupDialogOpen}>
        <DialogContent className="max-h-[100vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedMainGroup ? 'Edit Main Group' : 'Add Main Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMainGroupSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="main-group-code" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Code</Label>
              <Input
                id="main-group-code"
                type="number"
                value={mainGroupForm.code}
                onChange={(e) => setMainGroupForm({ ...mainGroupForm, code: e.target.value })}
                placeholder="Enter code (e.g., 1, 2, 3)"
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            <div>
              <Label htmlFor="main-group-name" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Main Group Name</Label>
              <Input
                id="main-group-name"
                value={mainGroupForm.name}
                onChange={(e) => setMainGroupForm({ ...mainGroupForm, name: e.target.value })}
                placeholder="Enter main group name"
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setMainGroupDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto text-sm sm:text-base">
                {loading ? 'Saving...' : selectedMainGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub Group Dialog */}
      <Dialog open={subGroupDialogOpen} onOpenChange={setSubGroupDialogOpen}>
        <DialogContent className="max-h-[100vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedSubGroup ? 'Edit Subgroup' : 'Add Subgroup'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubGroupSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="sub-group-main-group" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Main Group</Label>
              <Select
                id="sub-group-main-group"
                value={subGroupForm.mainGroupId}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, mainGroupId: e.target.value })}
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              >
                <option value="">Select main group...</option>
                {mainGroups.map((mg) => (
                  <option key={mg.id} value={mg.id}>
                    {mg.code} - {mg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="sub-group-code" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Code</Label>
              <Input
                id="sub-group-code"
                value={subGroupForm.code}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, code: e.target.value })}
                placeholder="Enter code (e.g., 101, 102)"
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            <div>
              <Label htmlFor="sub-group-name" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Sub Group Name</Label>
              <Input
                id="sub-group-name"
                value={subGroupForm.name}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, name: e.target.value })}
                placeholder="Enter subgroup name"
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setSubGroupDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto text-sm sm:text-base">
                {loading ? 'Saving...' : selectedSubGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-h-[100vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="account-main-group-dialog" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Main Group</Label>
              <Select
                id="account-main-group-dialog"
                value={accountDialogMainGroupId}
                onChange={async (e) => {
                  const mainGroupId = e.target.value;
                  setAccountDialogMainGroupId(mainGroupId);
                  setAccountForm({ ...accountForm, subGroupId: '' });
                  
                  if (mainGroupId) {
                    try {
                      const response = await api.get('/accounts/subgroups', {
                        params: { mainGroupId },
                      });
                      setAccountDialogSubGroups(response.data.subgroups || []);
                    } catch (err) {
                      console.error('Failed to fetch subgroups:', err);
                      setAccountDialogSubGroups([]);
                    }
                  } else {
                    setAccountDialogSubGroups([]);
                  }
                }}
                className="text-sm sm:text-base h-10 sm:h-11"
              >
                <option value="">Select main group...</option>
                {mainGroups.map((mg) => (
                  <option key={mg.id} value={mg.id}>
                    {mg.code} - {mg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="account-sub-group-dialog" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Sub Group</Label>
              <Select
                id="account-sub-group-dialog"
                value={accountForm.subGroupId}
                onChange={(e) => setAccountForm({ ...accountForm, subGroupId: e.target.value })}
                required
                disabled={!accountDialogMainGroupId}
                className="text-sm sm:text-base h-10 sm:h-11"
              >
                <option value="">Select subgroup...</option>
                {accountDialogSubGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.code} - {sg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="account-code" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Code</Label>
              <Input
                id="account-code"
                value={accountForm.code}
                onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                placeholder="Enter code (e.g., 101001, 102008)"
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            <div>
              <Label htmlFor="account-name" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Name</Label>
              <Input
                id="account-name"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="Enter account name"
                required
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
            <div>
              <Label htmlFor="account-status" className="text-sm sm:text-base mb-1.5 sm:mb-2 block">Status</Label>
              <Select
                id="account-status"
                value={accountForm.status}
                onChange={(e) => setAccountForm({ ...accountForm, status: e.target.value as 'Active' | 'Inactive' })}
                className="text-sm sm:text-base h-10 sm:h-11"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto text-sm sm:text-base">
                {loading ? 'Saving...' : selectedAccount ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Person Account Dialog */}
      <Dialog open={personAccountDialogOpen} onOpenChange={setPersonAccountDialogOpen}>
        <DialogContent className="max-h-[100vh] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Person's Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5">
            <p className="text-sm sm:text-base text-gray-600">This feature will allow you to add accounts for specific persons.</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPersonAccountDialogOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
