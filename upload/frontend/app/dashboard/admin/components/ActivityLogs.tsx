'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  details?: Record<string, any>;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    // Generate demo logs
    const demoLogs: ActivityLog[] = [
      { id: '1', userId: 'u1', userName: 'Admin User', userRole: 'admin', action: 'login', module: 'auth', description: 'User logged in successfully', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 09:15:32', status: 'success' },
      { id: '2', userId: 'u2', userName: 'Sales Manager', userRole: 'manager', action: 'create', module: 'sales', description: 'Created new sales invoice INV-2024-125', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', timestamp: '2024-12-11 09:20:15', status: 'success', details: { invoiceNo: 'INV-2024-125', amount: 45000 } },
      { id: '3', userId: 'u3', userName: 'Inventory Staff', userRole: 'staff', action: 'update', module: 'inventory', description: 'Updated stock quantity for part #PT-001', ipAddress: '192.168.1.102', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 09:25:48', status: 'success', details: { partNo: 'PT-001', previousQty: 50, newQty: 75 } },
      { id: '4', userId: 'u1', userName: 'Admin User', userRole: 'admin', action: 'delete', module: 'users', description: 'Deleted inactive user account', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 09:30:22', status: 'warning', details: { deletedUser: 'old.user@company.com' } },
      { id: '5', userId: 'u4', userName: 'Accountant', userRole: 'accountant', action: 'export', module: 'reports', description: 'Exported financial report', ipAddress: '192.168.1.103', userAgent: 'Safari/17.1', timestamp: '2024-12-11 09:35:10', status: 'success', details: { reportType: 'Monthly Sales', format: 'PDF' } },
      { id: '6', userId: 'u2', userName: 'Sales Manager', userRole: 'manager', action: 'approve', module: 'purchase', description: 'Approved purchase order PO-2024-001', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', timestamp: '2024-12-11 09:40:55', status: 'success', details: { poNo: 'PO-2024-001', amount: 75000 } },
      { id: '7', userId: 'u5', userName: 'Viewer User', userRole: 'viewer', action: 'login_failed', module: 'auth', description: 'Failed login attempt - incorrect password', ipAddress: '192.168.1.150', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 09:45:30', status: 'error' },
      { id: '8', userId: 'u3', userName: 'Inventory Staff', userRole: 'staff', action: 'create', module: 'parts', description: 'Added new part to inventory', ipAddress: '192.168.1.102', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 09:50:18', status: 'success', details: { partNo: 'PT-125', category: 'Engine Parts' } },
      { id: '9', userId: 'u1', userName: 'Admin User', userRole: 'admin', action: 'settings_change', module: 'admin', description: 'Updated company profile settings', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 10:00:45', status: 'success' },
      { id: '10', userId: 'u4', userName: 'Accountant', userRole: 'accountant', action: 'create', module: 'accounts', description: 'Created new voucher entry', ipAddress: '192.168.1.103', userAgent: 'Safari/17.1', timestamp: '2024-12-11 10:15:22', status: 'success', details: { voucherNo: 'VCH-2024-089', type: 'Payment' } },
      { id: '11', userId: 'u2', userName: 'Sales Manager', userRole: 'manager', action: 'update', module: 'customers', description: 'Updated customer credit limit', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', timestamp: '2024-12-11 10:20:33', status: 'success', details: { customer: 'ABC Trading Co.', newLimit: 200000 } },
      { id: '12', userId: 'u1', userName: 'Admin User', userRole: 'admin', action: 'backup', module: 'admin', description: 'Initiated system backup', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 10:30:00', status: 'success' },
      { id: '13', userId: 'u3', userName: 'Inventory Staff', userRole: 'staff', action: 'adjustment', module: 'inventory', description: 'Stock adjustment for damaged goods', ipAddress: '192.168.1.102', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 10:45:15', status: 'warning', details: { partNo: 'PT-055', reason: 'Damaged', qty: -5 } },
      { id: '14', userId: 'u2', userName: 'Sales Manager', userRole: 'manager', action: 'create', module: 'sales', description: 'Created quotation for customer', ipAddress: '192.168.1.101', userAgent: 'Firefox/121.0', timestamp: '2024-12-11 11:00:28', status: 'success', details: { quotationNo: 'QT-2024-045', customer: 'XYZ Industries' } },
      { id: '15', userId: 'u1', userName: 'Admin User', userRole: 'admin', action: 'role_change', module: 'users', description: 'Changed user role from staff to manager', ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0', timestamp: '2024-12-11 11:15:42', status: 'success', details: { user: 'john.doe@company.com', oldRole: 'staff', newRole: 'manager' } },
    ];
    setLogs(demoLogs);
  }, []);

  const modules = ['auth', 'users', 'parts', 'inventory', 'sales', 'purchase', 'customers', 'suppliers', 'reports', 'accounts', 'admin'];
  const actions = ['login', 'login_failed', 'logout', 'create', 'update', 'delete', 'view', 'export', 'approve', 'reject', 'settings_change', 'backup', 'adjustment', 'role_change'];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesModule && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'create':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'update':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'delete':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'export':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        );
      case 'approve':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionColor = (action: string) => {
    if (['create', 'approve'].includes(action)) return 'bg-green-100 text-green-600';
    if (['update', 'settings_change', 'role_change'].includes(action)) return 'bg-blue-100 text-blue-600';
    if (['delete', 'login_failed'].includes(action)) return 'bg-red-100 text-red-600';
    if (['export', 'backup'].includes(action)) return 'bg-purple-100 text-purple-600';
    if (['adjustment'].includes(action)) return 'bg-yellow-100 text-yellow-600';
    return 'bg-gray-100 text-gray-600';
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Description', 'IP Address', 'Status'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName,
        log.userRole,
        log.action,
        log.module,
        `"${log.description}"`,
        log.ipAddress,
        log.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Activities</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Successful</p>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'success').length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Warnings</p>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'warning').length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Errors</p>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'error').length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Modules</option>
                {modules.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Actions</option>
                {actions.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
              </select>
            </div>
            <Button onClick={exportLogs} variant="outline" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-xs">
                            {log.userName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                          <p className="text-xs text-gray-500 capitalize">{log.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium capitalize">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.ipAddress}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.details && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600">Page {currentPage} of {totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Activity Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedLog(null)} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {selectedLog.userName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedLog.userName}</p>
                    <p className="text-sm text-gray-500">{selectedLog.timestamp}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Action</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedLog.action.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Module</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedLog.module}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">IP Address</p>
                    <p className="font-mono text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-gray-900">{selectedLog.description}</p>
                </div>

                {selectedLog.details && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">Additional Details</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">User Agent</p>
                  <p className="text-sm text-gray-600">{selectedLog.userAgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

