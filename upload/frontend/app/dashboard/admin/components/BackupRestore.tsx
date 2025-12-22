'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  createdAt: string;
  createdBy: string;
  tables?: string[];
  downloadUrl?: string;
}

interface ScheduledBackup {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  day?: string;
  type: 'full' | 'incremental';
  retention: number;
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
}

export default function BackupRestore() {
  const [activeView, setActiveView] = useState<'backups' | 'schedules' | 'restore'>('backups');
  const [backups, setBackups] = useState<Backup[]>([
    { id: '1', name: 'Full Backup - December 2024', type: 'full', size: '256 MB', status: 'completed', createdAt: '2024-12-10 23:00:00', createdBy: 'Admin User', tables: ['All Tables'] },
    { id: '2', name: 'Daily Incremental - Dec 10', type: 'incremental', size: '12 MB', status: 'completed', createdAt: '2024-12-10 03:00:00', createdBy: 'System (Scheduled)', tables: ['parts', 'inventory', 'sales', 'customers'] },
    { id: '3', name: 'Manual Backup - Pre-Update', type: 'full', size: '248 MB', status: 'completed', createdAt: '2024-12-09 14:30:00', createdBy: 'Admin User', tables: ['All Tables'] },
    { id: '4', name: 'Daily Incremental - Dec 09', type: 'incremental', size: '8 MB', status: 'completed', createdAt: '2024-12-09 03:00:00', createdBy: 'System (Scheduled)', tables: ['parts', 'inventory', 'sales'] },
    { id: '5', name: 'Weekly Full Backup', type: 'full', size: '245 MB', status: 'completed', createdAt: '2024-12-08 23:00:00', createdBy: 'System (Scheduled)', tables: ['All Tables'] },
    { id: '6', name: 'Failed Backup Attempt', type: 'full', size: '-', status: 'failed', createdAt: '2024-12-07 23:00:00', createdBy: 'System (Scheduled)', tables: ['All Tables'] },
  ]);

  const [schedules, setSchedules] = useState<ScheduledBackup[]>([
    { id: '1', name: 'Daily Incremental Backup', frequency: 'daily', time: '03:00', type: 'incremental', retention: 7, isActive: true, lastRun: '2024-12-10 03:00', nextRun: '2024-12-11 03:00' },
    { id: '2', name: 'Weekly Full Backup', frequency: 'weekly', time: '23:00', day: 'Sunday', type: 'full', retention: 4, isActive: true, lastRun: '2024-12-08 23:00', nextRun: '2024-12-15 23:00' },
    { id: '3', name: 'Monthly Archive Backup', frequency: 'monthly', time: '01:00', day: '1st', type: 'full', retention: 12, isActive: true, lastRun: '2024-12-01 01:00', nextRun: '2025-01-01 01:00' },
  ]);

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backupForm, setBackupForm] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental',
    tables: [] as string[],
    includeAll: true,
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '03:00',
    day: 'Sunday',
    type: 'incremental' as 'full' | 'incremental',
    retention: 7,
  });

  const availableTables = [
    'users', 'parts', 'inventory', 'stock', 'categories', 'brands',
    'customers', 'suppliers', 'sales_invoices', 'purchase_orders',
    'kits', 'accounts', 'vouchers', 'activity_logs'
  ];

  const handleCreateBackup = async () => {
    setBackupInProgress(true);
    setError('');
    
    // Simulate backup process
    setTimeout(() => {
      const newBackup: Backup = {
        id: String(Date.now()),
        name: backupForm.name || `Manual Backup - ${new Date().toLocaleDateString()}`,
        type: backupForm.type,
        size: backupForm.type === 'full' ? '250 MB' : '15 MB',
        status: 'completed',
        createdAt: new Date().toLocaleString(),
        createdBy: 'Admin User',
        tables: backupForm.includeAll ? ['All Tables'] : backupForm.tables,
      };
      setBackups(prev => [newBackup, ...prev]);
      setBackupInProgress(false);
      setShowBackupModal(false);
      setSuccess('Backup created successfully');
      setTimeout(() => setSuccess(''), 3000);
    }, 3000);
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    setRestoreInProgress(true);
    setError('');
    
    // Simulate restore process
    setTimeout(() => {
      setRestoreInProgress(false);
      setShowRestoreModal(false);
      setSelectedBackup(null);
      setSuccess('Database restored successfully from backup');
      setTimeout(() => setSuccess(''), 3000);
    }, 5000);
  };

  const handleDeleteBackup = (id: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;
    setBackups(prev => prev.filter(b => b.id !== id));
    setSuccess('Backup deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleCreateSchedule = () => {
    const newSchedule: ScheduledBackup = {
      id: String(Date.now()),
      ...scheduleForm,
      isActive: true,
      nextRun: 'Calculating...',
    };
    setSchedules(prev => [...prev, newSchedule]);
    setShowScheduleModal(false);
    setSuccess('Backup schedule created successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteSchedule = (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    setSchedules(prev => prev.filter(s => s.id !== id));
    setSuccess('Schedule deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-purple-100 text-purple-700';
      case 'incremental': return 'bg-blue-100 text-blue-700';
      case 'differential': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate storage stats
  const totalBackups = backups.length;
  const completedBackups = backups.filter(b => b.status === 'completed').length;
  const totalSize = backups.filter(b => b.status === 'completed').reduce((acc, b) => {
    const size = parseFloat(b.size) || 0;
    return acc + size;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Backups</p>
                <p className="text-2xl font-bold">{totalBackups}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
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
                <p className="text-2xl font-bold">{completedBackups}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Storage Used</p>
                <p className="text-2xl font-bold">{totalSize.toFixed(0)} MB</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Schedules</p>
                <p className="text-2xl font-bold">{schedules.filter(s => s.isActive).length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button onClick={() => setActiveView('backups')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'backups' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Backups
          </button>
          <button onClick={() => setActiveView('schedules')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'schedules' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Schedules
          </button>
          <button onClick={() => setActiveView('restore')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'restore' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}>
            Restore
          </button>
        </div>
        <div className="flex items-center gap-2">
          {activeView === 'backups' && (
            <Button onClick={() => setShowBackupModal(true)} className="bg-primary-500 hover:bg-primary-600 text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Create Backup
            </Button>
          )}
          {activeView === 'schedules' && (
            <Button onClick={() => setShowScheduleModal(true)} className="bg-primary-500 hover:bg-primary-600 text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Backups View */}
      {activeView === 'backups' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Backup Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{backup.name}</p>
                            <p className="text-xs text-gray-500">{backup.tables?.join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${getTypeColor(backup.type)}`}>
                          {backup.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{backup.size}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                          {backup.status === 'in_progress' && (
                            <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {backup.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{backup.createdAt}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{backup.createdBy}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {backup.status === 'completed' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                Restore
                              </Button>
                              <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteBackup(backup.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules View */}
      {activeView === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={`transition-opacity ${!schedule.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${schedule.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${schedule.isActive ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(schedule.type)}`}>
                        {schedule.type}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleToggleSchedule(schedule.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frequency</span>
                    <span className="text-gray-900 capitalize">{schedule.frequency} at {schedule.time}</span>
                  </div>
                  {schedule.day && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Day</span>
                      <span className="text-gray-900">{schedule.day}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retention</span>
                    <span className="text-gray-900">{schedule.retention} backups</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Run</span>
                    <span className="text-gray-900">{schedule.lastRun || 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Run</span>
                    <span className="text-gray-900 font-medium">{schedule.nextRun}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <Button size="sm" variant="ghost" className="text-gray-500">Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteSchedule(schedule.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore View */}
      {activeView === 'restore' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Restore from Backup</CardTitle>
              <CardDescription>Select a backup file to restore your database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".sql,.bak,.zip" onChange={(e) => { if (e.target.files?.length) { setSuccess('File selected: ' + e.target.files[0].name); }}} />
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">SQL, BAK, or ZIP files up to 500MB</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warning</p>
                      <p className="text-xs text-yellow-700">Restoring a backup will overwrite all current data. This action cannot be undone.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Backups</CardTitle>
              <CardDescription>Quick restore from recent backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.filter(b => b.status === 'completed').slice(0, 5).map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{backup.name}</p>
                        <p className="text-xs text-gray-500">{backup.createdAt} • {backup.size}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }} className="text-primary-600 border-primary-200 hover:bg-primary-50">
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create New Backup</CardTitle>
                <Button variant="ghost" onClick={() => setShowBackupModal(false)} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backupName">Backup Name</Label>
                  <Input id="backupName" value={backupForm.name} onChange={(e) => setBackupForm({ ...backupForm, name: e.target.value })} className="mt-1" placeholder="e.g., Pre-update backup" />
                </div>
                <div>
                  <Label>Backup Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button type="button" onClick={() => setBackupForm({ ...backupForm, type: 'full' })} className={`p-3 border rounded-lg text-left transition-colors ${backupForm.type === 'full' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-medium text-gray-900">Full Backup</p>
                      <p className="text-xs text-gray-500">Complete database backup</p>
                    </button>
                    <button type="button" onClick={() => setBackupForm({ ...backupForm, type: 'incremental' })} className={`p-3 border rounded-lg text-left transition-colors ${backupForm.type === 'incremental' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-medium text-gray-900">Incremental</p>
                      <p className="text-xs text-gray-500">Only changed data</p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={backupForm.includeAll} onChange={(e) => setBackupForm({ ...backupForm, includeAll: e.target.checked })} className="w-4 h-4 text-primary-500 rounded" />
                    <span className="text-sm text-gray-700">Include all tables</span>
                  </label>
                </div>
                {!backupForm.includeAll && (
                  <div>
                    <Label>Select Tables</Label>
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                      {availableTables.map((table) => (
                        <label key={table} className="flex items-center gap-2">
                          <input type="checkbox" checked={backupForm.tables.includes(table)} onChange={(e) => setBackupForm({ ...backupForm, tables: e.target.checked ? [...backupForm.tables, table] : backupForm.tables.filter(t => t !== table) })} className="w-4 h-4 text-primary-500 rounded" />
                          <span className="text-sm text-gray-700">{table}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleCreateBackup} disabled={backupInProgress} className="flex-1 bg-primary-500 hover:bg-primary-600">
                    {backupInProgress ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Backup...
                      </>
                    ) : 'Create Backup'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBackupModal(false)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardTitle className="text-lg">⚠️ Confirm Restore</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">You are about to restore:</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBackup.name}</p>
                  <p className="text-sm text-gray-500 mt-2">This will overwrite all current data. This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleRestoreBackup} disabled={restoreInProgress} className="flex-1 bg-red-500 hover:bg-red-600">
                    {restoreInProgress ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Restoring...
                      </>
                    ) : 'Yes, Restore Now'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowRestoreModal(false); setSelectedBackup(null); }}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create Backup Schedule</CardTitle>
                <Button variant="ghost" onClick={() => setShowScheduleModal(false)} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scheduleName">Schedule Name</Label>
                  <Input id="scheduleName" value={scheduleForm.name} onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })} className="mt-1" placeholder="e.g., Daily Backup" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <select value={scheduleForm.frequency} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as any })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })} className="mt-1" />
                  </div>
                </div>
                {scheduleForm.frequency === 'weekly' && (
                  <div>
                    <Label>Day of Week</Label>
                    <select value={scheduleForm.day} onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Backup Type</Label>
                    <select value={scheduleForm.type} onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value as any })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="full">Full Backup</option>
                      <option value="incremental">Incremental</option>
                    </select>
                  </div>
                  <div>
                    <Label>Retention (days)</Label>
                    <Input type="number" min="1" max="365" value={scheduleForm.retention} onChange={(e) => setScheduleForm({ ...scheduleForm, retention: parseInt(e.target.value) })} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleCreateSchedule} className="flex-1 bg-primary-500 hover:bg-primary-600">Create Schedule</Button>
                  <Button type="button" variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

