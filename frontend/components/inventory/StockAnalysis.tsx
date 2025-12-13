'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface StockItem {
  id: string;
  partNo: string;
  description?: string;
  category?: string;
  brand?: string;
  quantity: number;
  cost: number;
  value: number;
  lastMovement?: string;
  movementCount: number;
  daysSinceMovement: number;
  classification: 'fast' | 'slow' | 'dead' | 'normal';
  turnoverRate: number;
}

interface AnalysisSummary {
  fastMoving: { count: number; value: number; percentage: number };
  normalMoving: { count: number; value: number; percentage: number };
  slowMoving: { count: number; value: number; percentage: number };
  deadStock: { count: number; value: number; percentage: number };
}

export default function StockAnalysis() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configuration
  const [fastMovingDays, setFastMovingDays] = useState(30);
  const [slowMovingDays, setSlowMovingDays] = useState(90);
  const [deadStockDays, setDeadStockDays] = useState(180);
  const [analysisMonths, setAnalysisMonths] = useState(6);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');

  // Summary
  const [summary, setSummary] = useState<AnalysisSummary>({
    fastMoving: { count: 0, value: 0, percentage: 0 },
    normalMoving: { count: 0, value: 0, percentage: 0 },
    slowMoving: { count: 0, value: 0, percentage: 0 },
    deadStock: { count: 0, value: 0, percentage: 0 },
  });

  // Master data
  const [categories, setCategories] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'all' | 'fast' | 'normal' | 'slow' | 'dead'>('all');

  useEffect(() => {
    fetchAndAnalyzeStock();
  }, [fastMovingDays, slowMovingDays, deadStockDays, analysisMonths]);

  const fetchAndAnalyzeStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const parts = response.data.parts || [];

      // Extract categories
      const uniqueCategories = [...new Set(parts.map((p: any) => p.mainCategory).filter(Boolean))] as string[];
      setCategories(uniqueCategories);

      // Analyze each part
      const analyzed: StockItem[] = parts.map((part: any) => {
        const quantity = part.stock?.quantity || 0;
        const cost = part.cost || 0;
        const value = quantity * cost;
        
        // Simulate movement data (in real app, this would come from transaction history)
        const lastMovementDate = part.updatedAt ? new Date(part.updatedAt) : new Date();
        const daysSinceMovement = Math.floor((new Date().getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Simulate movement count based on random data (in real app, count from transactions)
        const movementCount = Math.floor(Math.random() * 50);
        
        // Calculate turnover rate (movements per month)
        const turnoverRate = movementCount / (analysisMonths || 1);
        
        // Classify stock
        let classification: 'fast' | 'slow' | 'dead' | 'normal';
        if (daysSinceMovement >= deadStockDays || (quantity > 0 && movementCount === 0)) {
          classification = 'dead';
        } else if (daysSinceMovement >= slowMovingDays || turnoverRate < 1) {
          classification = 'slow';
        } else if (daysSinceMovement <= fastMovingDays && turnoverRate > 5) {
          classification = 'fast';
        } else {
          classification = 'normal';
        }

        return {
          id: part.id,
          partNo: part.partNo,
          description: part.description,
          category: part.mainCategory || 'Uncategorized',
          brand: part.brand,
          quantity,
          cost,
          value,
          lastMovement: part.updatedAt,
          movementCount,
          daysSinceMovement,
          classification,
          turnoverRate,
        };
      });

      setStockItems(analyzed);
      calculateSummary(analyzed);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze stock');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (items: StockItem[]) => {
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    
    const fast = items.filter(i => i.classification === 'fast');
    const normal = items.filter(i => i.classification === 'normal');
    const slow = items.filter(i => i.classification === 'slow');
    const dead = items.filter(i => i.classification === 'dead');

    const fastValue = fast.reduce((sum, i) => sum + i.value, 0);
    const normalValue = normal.reduce((sum, i) => sum + i.value, 0);
    const slowValue = slow.reduce((sum, i) => sum + i.value, 0);
    const deadValue = dead.reduce((sum, i) => sum + i.value, 0);

    setSummary({
      fastMoving: {
        count: fast.length,
        value: fastValue,
        percentage: totalValue > 0 ? (fastValue / totalValue) * 100 : 0,
      },
      normalMoving: {
        count: normal.length,
        value: normalValue,
        percentage: totalValue > 0 ? (normalValue / totalValue) * 100 : 0,
      },
      slowMoving: {
        count: slow.length,
        value: slowValue,
        percentage: totalValue > 0 ? (slowValue / totalValue) * 100 : 0,
      },
      deadStock: {
        count: dead.length,
        value: deadValue,
        percentage: totalValue > 0 ? (deadValue / totalValue) * 100 : 0,
      },
    });
  };

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesClassification = activeTab === 'all' || item.classification === activeTab;
      return matchesSearch && matchesCategory && matchesClassification;
    });
  }, [stockItems, searchTerm, categoryFilter, activeTab]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const getClassificationBadge = (classification: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      fast: { bg: 'bg-green-100', text: 'text-green-700', label: 'Fast Moving' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Normal' },
      slow: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Slow Moving' },
      dead: { bg: 'bg-red-100', text: 'text-red-700', label: 'Dead Stock' },
    };
    const style = styles[classification] || styles.normal;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const handleExport = (format: 'csv' | 'pdf', type: 'all' | 'fast' | 'slow' | 'dead' | 'normal') => {
    const dataToExport = type === 'all' ? filteredItems : filteredItems.filter(i => i.classification === type);
    
    if (format === 'csv') {
      const headers = ['Part No', 'Description', 'Category', 'Brand', 'Quantity', 'Cost', 'Value', 'Days Since Movement', 'Turnover Rate', 'Classification'];
      const rows = dataToExport.map(item => [
        item.partNo,
        item.description || '',
        item.category || '',
        item.brand || '',
        item.quantity,
        item.cost.toFixed(2),
        item.value.toFixed(2),
        item.daysSinceMovement,
        item.turnoverRate.toFixed(2),
        item.classification,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stock-analysis-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const title = type === 'all' ? 'Complete Stock Analysis' : 
                   type === 'fast' ? 'Fast Moving Stock Report' :
                   type === 'normal' ? 'Normal Moving Stock Report' :
                   type === 'slow' ? 'Slow Moving Stock Report' : 'Dead Stock Report';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
              th { background-color: #ff6b35; color: white; font-weight: bold; }
              h1 { color: #333; margin-bottom: 5px; font-size: 18px; }
              .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
              .summary-card { background: #f9f9f9; padding: 12px; border-radius: 8px; text-align: center; }
              .summary-card.fast { border-left: 4px solid #10b981; }
              .summary-card.normal { border-left: 4px solid #3b82f6; }
              .summary-card.slow { border-left: 4px solid #f59e0b; }
              .summary-card.dead { border-left: 4px solid #ef4444; }
              .text-right { text-align: right; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
              .badge-fast { background: #d1fae5; color: #065f46; }
              .badge-normal { background: #dbeafe; color: #1e40af; }
              .badge-slow { background: #fef3c7; color: #92400e; }
              .badge-dead { background: #fee2e2; color: #991b1b; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p style="color: #666; margin-bottom: 15px;">Generated on: ${new Date().toLocaleString()}</p>
            
            <div class="summary">
              <div class="summary-card fast">
                <h3 style="margin: 0; color: #065f46;">Fast Moving</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.fastMoving.count}</p>
                <p style="color: #666; font-size: 10px;">$${summary.fastMoving.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="summary-card normal">
                <h3 style="margin: 0; color: #1e40af;">Normal</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.normalMoving.count}</p>
                <p style="color: #666; font-size: 10px;">$${summary.normalMoving.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="summary-card slow">
                <h3 style="margin: 0; color: #92400e;">Slow Moving</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.slowMoving.count}</p>
                <p style="color: #666; font-size: 10px;">$${summary.slowMoving.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="summary-card dead">
                <h3 style="margin: 0; color: #991b1b;">Dead Stock</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${summary.deadStock.count}</p>
                <p style="color: #666; font-size: 10px;">$${summary.deadStock.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Part No</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Value</th>
                  <th class="text-right">Days Idle</th>
                  <th class="text-right">Turnover</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${dataToExport.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.partNo}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td class="text-right">${item.quantity.toLocaleString()}</td>
                    <td class="text-right">$${item.value.toFixed(2)}</td>
                    <td class="text-right">${item.daysSinceMovement}</td>
                    <td class="text-right">${item.turnoverRate.toFixed(1)}</td>
                    <td><span class="badge badge-${item.classification}">${item.classification.toUpperCase()}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Movement Analysis</h1>
            <p className="text-xs sm:text-sm text-gray-500">Fast, Slow, and Dead Stock Analysis</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv', activeTab)}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf', activeTab)}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Configuration */}
      <Card className="shadow-md border-2 border-primary-100">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Analysis Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-green-700">Fast Moving (≤ days)</Label>
              <Input
                type="number"
                min="1"
                value={fastMovingDays}
                onChange={(e) => setFastMovingDays(parseInt(e.target.value) || 30)}
                className="mt-1 border-green-200 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Items with activity within these days</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-yellow-700">Slow Moving (≥ days)</Label>
              <Input
                type="number"
                min="1"
                value={slowMovingDays}
                onChange={(e) => setSlowMovingDays(parseInt(e.target.value) || 90)}
                className="mt-1 border-yellow-200 focus:border-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">Items idle for these many days</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-red-700">Dead Stock (≥ days)</Label>
              <Input
                type="number"
                min="1"
                value={deadStockDays}
                onChange={(e) => setDeadStockDays(parseInt(e.target.value) || 180)}
                className="mt-1 border-red-200 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">Items with no movement</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Analysis Period (months)</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={analysisMonths}
                onChange={(e) => setAnalysisMonths(parseInt(e.target.value) || 6)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Period for turnover calculation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 ${activeTab === 'fast' ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => { setActiveTab('fast'); setPage(1); }}
        >
          <CardContent className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Fast Moving</p>
                <p className="text-3xl font-bold text-green-900">{summary.fastMoving.count}</p>
                <p className="text-sm text-green-600">${summary.fastMoving.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-green-500 mt-1">{summary.fastMoving.percentage.toFixed(1)}% of value</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${activeTab === 'normal' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => { setActiveTab('normal'); setPage(1); }}
        >
          <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Normal Moving</p>
                <p className="text-3xl font-bold text-blue-900">{summary.normalMoving.count}</p>
                <p className="text-sm text-blue-600">${summary.normalMoving.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-blue-500 mt-1">{summary.normalMoving.percentage.toFixed(1)}% of value</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${activeTab === 'slow' ? 'ring-2 ring-yellow-500 shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => { setActiveTab('slow'); setPage(1); }}
        >
          <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Slow Moving</p>
                <p className="text-3xl font-bold text-yellow-900">{summary.slowMoving.count}</p>
                <p className="text-sm text-yellow-600">${summary.slowMoving.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-yellow-500 mt-1">{summary.slowMoving.percentage.toFixed(1)}% of value</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${activeTab === 'dead' ? 'ring-2 ring-red-500 shadow-lg' : 'hover:shadow-md'}`}
          onClick={() => { setActiveTab('dead'); setPage(1); }}
        >
          <CardContent className="p-6 bg-gradient-to-br from-red-50 to-rose-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Dead Stock</p>
                <p className="text-3xl font-bold text-red-900">{summary.deadStock.count}</p>
                <p className="text-sm text-red-600">${summary.deadStock.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                <p className="text-xs text-red-500 mt-1">{summary.deadStock.percentage.toFixed(1)}% of value</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Stock Details</CardTitle>
              <div className="flex gap-1">
                {(['all', 'fast', 'normal', 'slow', 'dead'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setPage(1); }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      activeTab === tab
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sr.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Days Idle</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Turnover</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-gray-500">Analyzing stock...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No items found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-primary-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{item.partNo}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        ${item.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <span className={item.daysSinceMovement > deadStockDays ? 'text-red-600 font-medium' : item.daysSinceMovement > slowMovingDays ? 'text-yellow-600' : 'text-gray-600'}>
                          {item.daysSinceMovement}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {item.turnoverRate.toFixed(1)}/mo
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getClassificationBadge(item.classification)}
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
    </div>
  );
}

