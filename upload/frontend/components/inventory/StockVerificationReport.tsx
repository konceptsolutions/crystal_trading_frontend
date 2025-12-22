'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface VerificationItem {
  id: string;
  partNo: string;
  description?: string;
  category?: string;
  brand?: string;
  systemQty: number;
  physicalQty: number | null;
  variance: number;
  variancePercentage: number;
  status: 'pending' | 'verified' | 'discrepancy';
  remarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  location?: string;
}

interface VerificationSession {
  id?: string;
  sessionNo?: string;
  date: string;
  store?: string;
  status: 'draft' | 'in_progress' | 'completed';
  totalItems: number;
  verifiedItems: number;
  discrepancyItems: number;
  items: VerificationItem[];
  notes?: string;
  createdBy?: string;
}

interface VerificationSummary {
  totalItems: number;
  verified: number;
  pending: number;
  withDiscrepancy: number;
  totalSystemValue: number;
  totalPhysicalValue: number;
  varianceValue: number;
}

export default function StockVerificationReport() {
  const [sessions, setSessions] = useState<VerificationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VerificationSession | null>(null);

  // Master Data
  const [parts, setParts] = useState<any[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Current Session Form
  const [formData, setFormData] = useState<VerificationSession>({
    sessionNo: '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    totalItems: 0,
    verifiedItems: 0,
    discrepancyItems: 0,
    items: [],
    notes: '',
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'discrepancy'>('all');

  // Summary
  const [summary, setSummary] = useState<VerificationSummary>({
    totalItems: 0,
    verified: 0,
    pending: 0,
    withDiscrepancy: 0,
    totalSystemValue: 0,
    totalPhysicalValue: 0,
    varianceValue: 0,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const partsData = response.data.parts || [];
      setParts(partsData);

      // Extract unique values
      const uniqueCategories = [...new Set(partsData.map((p: any) => p.mainCategory).filter(Boolean))] as string[];
      const uniqueStores = [...new Set(partsData.map((p: any) => p.stock?.store).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setStores(uniqueStores);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateSessionNo = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SV-${year}${month}${day}-${random}`;
  };

  const startNewSession = () => {
    // Load all parts into verification items
    const verificationItems: VerificationItem[] = parts.map((part: any) => ({
      id: part.id,
      partNo: part.partNo,
      description: part.description,
      category: part.mainCategory || 'Uncategorized',
      brand: part.brand,
      systemQty: part.stock?.quantity || 0,
      physicalQty: null,
      variance: 0,
      variancePercentage: 0,
      status: 'pending' as const,
      location: `${part.stock?.store || 'Main'}/${part.stock?.racks || '-'}/${part.stock?.shelf || '-'}`,
    }));

    setFormData({
      sessionNo: generateSessionNo(),
      date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      totalItems: verificationItems.length,
      verifiedItems: 0,
      discrepancyItems: 0,
      items: verificationItems,
      notes: '',
    });
    setShowForm(true);
    calculateSummary(verificationItems);
  };

  const handlePhysicalQtyChange = (itemId: string, value: number | null) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const physicalQty = value;
        const variance = physicalQty !== null ? physicalQty - item.systemQty : 0;
        const variancePercentage = item.systemQty > 0 && physicalQty !== null 
          ? ((physicalQty - item.systemQty) / item.systemQty) * 100 
          : 0;
        const status = physicalQty === null ? 'pending' : (variance === 0 ? 'verified' : 'discrepancy');
        
        return {
          ...item,
          physicalQty,
          variance,
          variancePercentage,
          status: status as 'pending' | 'verified' | 'discrepancy',
          verifiedAt: physicalQty !== null ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      verifiedItems: updatedItems.filter(i => i.status !== 'pending').length,
      discrepancyItems: updatedItems.filter(i => i.status === 'discrepancy').length,
    }));
    calculateSummary(updatedItems);
  };

  const handleRemarksChange = (itemId: string, remarks: string) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        return { ...item, remarks };
      }
      return item;
    });
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateSummary = (items: VerificationItem[]) => {
    const totalSystemValue = items.reduce((sum, item) => {
      const part = parts.find(p => p.id === item.id);
      return sum + (item.systemQty * (part?.cost || 0));
    }, 0);

    const totalPhysicalValue = items.reduce((sum, item) => {
      if (item.physicalQty === null) return sum;
      const part = parts.find(p => p.id === item.id);
      return sum + (item.physicalQty * (part?.cost || 0));
    }, 0);

    setSummary({
      totalItems: items.length,
      verified: items.filter(i => i.status === 'verified').length,
      pending: items.filter(i => i.status === 'pending').length,
      withDiscrepancy: items.filter(i => i.status === 'discrepancy').length,
      totalSystemValue,
      totalPhysicalValue,
      varianceValue: totalPhysicalValue - totalSystemValue,
    });
  };

  const filteredItems = useMemo(() => {
    return formData.items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [formData.items, searchTerm, categoryFilter, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const handleCompleteVerification = () => {
    if (summary.pending > 0) {
      if (!confirm(`There are still ${summary.pending} items pending verification. Do you want to complete anyway?`)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      status: 'completed',
    }));

    setSuccess('Stock verification completed successfully!');
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
      verified: { bg: 'bg-green-100', text: 'text-green-700', label: 'Verified' },
      discrepancy: { bg: 'bg-red-100', text: 'text-red-700', label: 'Discrepancy' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Part No', 'Description', 'Category', 'Location', 'System Qty', 'Physical Qty', 'Variance', 'Variance %', 'Status', 'Remarks'];
      const rows = filteredItems.map(item => [
        item.partNo,
        item.description || '',
        item.category || '',
        item.location || '',
        item.systemQty,
        item.physicalQty ?? 'Not Counted',
        item.variance,
        item.variancePercentage.toFixed(2) + '%',
        item.status,
        item.remarks || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stock-verification-${formData.sessionNo || new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Stock Verification Report - ${formData.sessionNo}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
              th { background-color: #ff6b35; color: white; font-weight: bold; }
              h1 { color: #333; margin-bottom: 5px; font-size: 16px; }
              .header-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
              .header-info div { text-align: center; }
              .header-info h3 { margin: 0; font-size: 11px; color: #666; }
              .header-info p { margin: 5px 0 0; font-size: 14px; font-weight: bold; }
              .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
              .summary-card { padding: 10px; border-radius: 5px; text-align: center; }
              .summary-card.verified { background: #d1fae5; border-left: 3px solid #10b981; }
              .summary-card.pending { background: #f3f4f6; border-left: 3px solid #6b7280; }
              .summary-card.discrepancy { background: #fee2e2; border-left: 3px solid #ef4444; }
              .text-right { text-align: right; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .badge { padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
              .badge-pending { background: #f3f4f6; color: #374151; }
              .badge-verified { background: #d1fae5; color: #065f46; }
              .badge-discrepancy { background: #fee2e2; color: #991b1b; }
              .variance-positive { color: #10b981; }
              .variance-negative { color: #ef4444; }
              .total-row { background: #ff6b35 !important; color: white; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Stock Verification Report</h1>
            
            <div class="header-info">
              <div>
                <h3>Session No</h3>
                <p>${formData.sessionNo || '-'}</p>
              </div>
              <div>
                <h3>Date</h3>
                <p>${new Date(formData.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3>Status</h3>
                <p>${formData.status.toUpperCase()}</p>
              </div>
              <div>
                <h3>Total Items</h3>
                <p>${summary.totalItems}</p>
              </div>
            </div>
            
            <div class="summary">
              <div class="summary-card verified">
                <h3 style="margin: 0; color: #065f46;">Verified</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.verified}</p>
              </div>
              <div class="summary-card pending">
                <h3 style="margin: 0; color: #374151;">Pending</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.pending}</p>
              </div>
              <div class="summary-card discrepancy">
                <h3 style="margin: 0; color: #991b1b;">Discrepancy</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.withDiscrepancy}</p>
              </div>
              <div class="summary-card" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                <h3 style="margin: 0; color: #92400e;">Variance Value</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0; color: ${summary.varianceValue >= 0 ? '#10b981' : '#ef4444'};">
                  Rs ${Math.abs(summary.varianceValue).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Part No</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th class="text-right">System Qty</th>
                  <th class="text-right">Physical Qty</th>
                  <th class="text-right">Variance</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${filteredItems.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.partNo}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.location || '-'}</td>
                    <td class="text-right">${item.systemQty}</td>
                    <td class="text-right">${item.physicalQty !== null ? item.physicalQty : '-'}</td>
                    <td class="text-right ${item.variance > 0 ? 'variance-positive' : item.variance < 0 ? 'variance-negative' : ''}">
                      ${item.variance !== 0 ? (item.variance > 0 ? '+' : '') + item.variance : '-'}
                    </td>
                    <td><span class="badge badge-${item.status}">${item.status.toUpperCase()}</span></td>
                    <td>${item.remarks || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
              <p><strong>Notes:</strong> ${formData.notes || 'None'}</p>
              <p style="color: #666; font-size: 9px; margin-top: 20px;">Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Verification Report</h1>
            <p className="text-xs sm:text-sm text-gray-500">Verify physical stock against system records</p>
          </div>
        </div>
        {!showForm ? (
          <Button
            onClick={startNewSession}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Verification
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print PDF
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {!showForm ? (
        // Session List View
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Verification Session</h3>
            <p className="text-gray-500 mb-4">Start a new verification session to count and verify your stock</p>
            <Button onClick={startNewSession} className="bg-primary-500 hover:bg-primary-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Verification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Session Header */}
          <Card className="shadow-md border-2 border-primary-100">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-lg">
                    Verification Session: {formData.sessionNo}
                  </CardTitle>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    formData.status === 'completed' ? 'bg-green-100 text-green-700' :
                    formData.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {formData.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this verification session?')) {
                        setShowForm(false);
                        setFormData({
                          sessionNo: '',
                          date: new Date().toISOString().split('T')[0],
                          status: 'draft',
                          totalItems: 0,
                          verifiedItems: 0,
                          discrepancyItems: 0,
                          items: [],
                          notes: '',
                        });
                      }
                    }}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteVerification}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={formData.status === 'completed'}
                  >
                    Complete Verification
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Date</Label>
                  <p className="font-medium">{new Date(formData.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Progress</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${summary.totalItems > 0 ? ((summary.verified + summary.withDiscrepancy) / summary.totalItems) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {summary.verified + summary.withDiscrepancy}/{summary.totalItems}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Notes</Label>
                  <Input
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Verified</p>
                    <p className="text-2xl font-bold text-green-900">{summary.verified}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{summary.pending}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Discrepancy</p>
                    <p className="text-2xl font-bold text-red-900">{summary.withDiscrepancy}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${summary.varianceValue >= 0 ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${summary.varianceValue >= 0 ? 'text-green-700' : 'text-red-700'}`}>Variance Value</p>
                    <p className={`text-2xl font-bold ${summary.varianceValue >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      {summary.varianceValue >= 0 ? '+' : '-'}Rs {Math.abs(summary.varianceValue).toFixed(2)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${summary.varianceValue >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-5 h-5 ${summary.varianceValue >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Table */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Verification Items</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                    className="w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="discrepancy">Discrepancy</option>
                  </Select>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="w-40"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">System Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Physical Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Variance</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            <span className="text-gray-500">Loading items...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No items found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr key={item.id} className={`hover:bg-primary-50/50 transition-colors ${item.status === 'discrepancy' ? 'bg-red-50/50' : ''}`}>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{item.partNo}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                            {item.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.location}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {item.systemQty.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              value={item.physicalQty ?? ''}
                              onChange={(e) => handlePhysicalQtyChange(item.id, e.target.value === '' ? null : parseInt(e.target.value))}
                              className="w-24 mx-auto text-center"
                              placeholder="Count"
                              disabled={formData.status === 'completed'}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${
                              item.variance > 0 ? 'text-green-600' :
                              item.variance < 0 ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {item.physicalQty !== null ? (item.variance > 0 ? '+' : '') + item.variance : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.remarks || ''}
                              onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                              className="w-32 text-sm"
                              placeholder="Remarks"
                              disabled={formData.status === 'completed'}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredItems.length)} of {filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

