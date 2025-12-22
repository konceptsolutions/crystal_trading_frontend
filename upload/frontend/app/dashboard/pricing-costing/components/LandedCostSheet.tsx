'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface LandedCostItem {
  id: string;
  partId?: string;
  partNo: string;
  description?: string;
  quantity: number;
  unitCost: number;
  duty: number;
  dutyRate: number;
  freight: number;
  freightRate: number;
  blCharges: number;
  insurance: number;
  insuranceRate: number;
  localCost: number;
  otherCharges: number;
  totalLandedCost: number;
  landedUnitCost: number;
  currency: string;
  exchangeRate: number;
  supplierName?: string;
  invoiceNo?: string;
  invoiceDate?: string;
}

interface LandedCostSheet {
  id: string;
  sheetNo: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  currency: string;
  exchangeRate: number;
  totalDuty: number;
  totalFreight: number;
  totalBLCharges: number;
  totalInsurance: number;
  totalLocalCost: number;
  totalOtherCharges: number;
  grandTotal: number;
  status: 'draft' | 'completed' | 'approved';
  items: LandedCostItem[];
  notes?: string;
  createdAt: string;
}

export default function LandedCostSheet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  
  // Form State
  const [sheetNo, setSheetNo] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('PKR');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Cost Allocation Settings
  const [dutyAllocation, setDutyAllocation] = useState<'percentage' | 'fixed' | 'value-based'>('percentage');
  const [freightAllocation, setFreightAllocation] = useState<'percentage' | 'fixed' | 'weight-based' | 'value-based'>('percentage');
  const [defaultDutyRate, setDefaultDutyRate] = useState(5);
  const [defaultFreightRate, setDefaultFreightRate] = useState(3);
  const [defaultInsuranceRate, setDefaultInsuranceRate] = useState(1);
  
  // Items
  const [items, setItems] = useState<LandedCostItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [parts, setParts] = useState<any[]>([]);
  
  // Saved Sheets
  const [savedSheets, setSavedSheets] = useState<LandedCostSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<LandedCostSheet | null>(null);

  // Bulk Cost Entries
  const [bulkDuty, setBulkDuty] = useState<number>(0);
  const [bulkFreight, setBulkFreight] = useState<number>(0);
  const [bulkBLCharges, setBulkBLCharges] = useState<number>(0);
  const [bulkInsurance, setBulkInsurance] = useState<number>(0);
  const [bulkLocalCost, setBulkLocalCost] = useState<number>(0);
  const [bulkOtherCharges, setBulkOtherCharges] = useState<number>(0);

  useEffect(() => {
    loadParts();
    loadSavedSheets();
    generateSheetNo();
  }, []);

  const generateSheetNo = () => {
    const date = new Date();
    const prefix = 'LC';
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setSheetNo(`${prefix}${dateStr}${randomNum}`);
  };

  const loadParts = async () => {
    try {
      const response = await api.get('/parts?limit=2000&status=A');
      setParts(response.data.parts || []);
    } catch (err) {
      console.error('Failed to load parts:', err);
    }
  };

  const loadSavedSheets = async () => {
    // In production, this would load from API
    // For now, we'll use localStorage for demo
    const saved = localStorage.getItem('landedCostSheets');
    if (saved) {
      setSavedSheets(JSON.parse(saved));
    }
  };

  const saveSheet = () => {
    if (!supplierName || items.length === 0) {
      setError('Please add supplier name and at least one item');
      return;
    }

    const sheet: LandedCostSheet = {
      id: Date.now().toString(),
      sheetNo,
      supplierName,
      invoiceNo,
      invoiceDate,
      currency,
      exchangeRate,
      totalDuty: summary.totalDuty,
      totalFreight: summary.totalFreight,
      totalBLCharges: summary.totalBLCharges,
      totalInsurance: summary.totalInsurance,
      totalLocalCost: summary.totalLocalCost,
      totalOtherCharges: summary.totalOtherCharges,
      grandTotal: summary.grandTotal,
      status: 'draft',
      items,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updatedSheets = [sheet, ...savedSheets];
    setSavedSheets(updatedSheets);
    localStorage.setItem('landedCostSheets', JSON.stringify(updatedSheets));
    
    setSuccess('Landed Cost Sheet saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
    resetForm();
  };

  const resetForm = () => {
    setItems([]);
    setSupplierName('');
    setInvoiceNo('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setBulkDuty(0);
    setBulkFreight(0);
    setBulkBLCharges(0);
    setBulkInsurance(0);
    setBulkLocalCost(0);
    setBulkOtherCharges(0);
    generateSheetNo();
  };

  const addItem = (part: any) => {
    const newItem: LandedCostItem = {
      id: Date.now().toString(),
      partId: part.id,
      partNo: part.partNo,
      description: part.description,
      quantity: 1,
      unitCost: part.cost || 0,
      duty: 0,
      dutyRate: defaultDutyRate,
      freight: 0,
      freightRate: defaultFreightRate,
      blCharges: 0,
      insurance: 0,
      insuranceRate: defaultInsuranceRate,
      localCost: 0,
      otherCharges: 0,
      totalLandedCost: part.cost || 0,
      landedUnitCost: part.cost || 0,
      currency,
      exchangeRate,
      supplierName,
    };
    setItems([...items, newItem]);
    setSearchTerm('');
  };

  const updateItem = (itemId: string, field: keyof LandedCostItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        
        // Recalculate landed cost
        const baseCost = updated.quantity * updated.unitCost;
        updated.duty = dutyAllocation === 'percentage' 
          ? baseCost * (updated.dutyRate / 100) 
          : updated.duty;
        updated.freight = freightAllocation === 'percentage'
          ? baseCost * (updated.freightRate / 100)
          : updated.freight;
        updated.insurance = baseCost * (updated.insuranceRate / 100);
        
        updated.totalLandedCost = baseCost + updated.duty + updated.freight + 
          updated.blCharges + updated.insurance + updated.localCost + updated.otherCharges;
        updated.landedUnitCost = updated.quantity > 0 
          ? updated.totalLandedCost / updated.quantity 
          : 0;
        
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const applyBulkCosts = () => {
    if (items.length === 0) {
      setError('Please add items first');
      return;
    }

    const totalBaseCost = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    
    setItems(prev => prev.map(item => {
      const baseCost = item.quantity * item.unitCost;
      const costRatio = totalBaseCost > 0 ? baseCost / totalBaseCost : 0;
      
      const updated = { ...item };
      updated.duty = bulkDuty * costRatio;
      updated.freight = bulkFreight * costRatio;
      updated.blCharges = bulkBLCharges * costRatio;
      updated.insurance = bulkInsurance * costRatio;
      updated.localCost = bulkLocalCost * costRatio;
      updated.otherCharges = bulkOtherCharges * costRatio;
      
      updated.totalLandedCost = baseCost + updated.duty + updated.freight + 
        updated.blCharges + updated.insurance + updated.localCost + updated.otherCharges;
      updated.landedUnitCost = updated.quantity > 0 
        ? updated.totalLandedCost / updated.quantity 
        : 0;
      
      return updated;
    }));

    setSuccess('Bulk costs applied successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const summary = useMemo(() => {
    const totalBaseCost = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const totalDuty = items.reduce((sum, item) => sum + item.duty, 0);
    const totalFreight = items.reduce((sum, item) => sum + item.freight, 0);
    const totalBLCharges = items.reduce((sum, item) => sum + item.blCharges, 0);
    const totalInsurance = items.reduce((sum, item) => sum + item.insurance, 0);
    const totalLocalCost = items.reduce((sum, item) => sum + item.localCost, 0);
    const totalOtherCharges = items.reduce((sum, item) => sum + item.otherCharges, 0);
    const grandTotal = items.reduce((sum, item) => sum + item.totalLandedCost, 0);
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      totalBaseCost,
      totalDuty,
      totalFreight,
      totalBLCharges,
      totalInsurance,
      totalLocalCost,
      totalOtherCharges,
      grandTotal,
      totalItems,
      totalQuantity,
      costIncrease: totalBaseCost > 0 ? ((grandTotal - totalBaseCost) / totalBaseCost * 100) : 0,
    };
  }, [items]);

  const filteredParts = useMemo(() => {
    if (!searchTerm) return [];
    return parts.filter(part => 
      part.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [parts, searchTerm]);

  const exportToExcel = () => {
    const headers = ['Part No', 'Description', 'Qty', 'Unit Cost', 'Base Cost', 'Duty', 'Freight', 'BL Charges', 'Insurance', 'Local Cost', 'Other', 'Total Landed', 'Landed Unit Cost'];
    const rows = items.map(item => [
      item.partNo,
      item.description || '',
      item.quantity,
      item.unitCost.toFixed(2),
      (item.quantity * item.unitCost).toFixed(2),
      item.duty.toFixed(2),
      item.freight.toFixed(2),
      item.blCharges.toFixed(2),
      item.insurance.toFixed(2),
      item.localCost.toFixed(2),
      item.otherCharges.toFixed(2),
      item.totalLandedCost.toFixed(2),
      item.landedUnitCost.toFixed(2),
    ]);

    const csvContent = [
      `Landed Cost Sheet: ${sheetNo}`,
      `Supplier: ${supplierName}`,
      `Invoice: ${invoiceNo}`,
      `Date: ${invoiceDate}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      `Total Base Cost,${summary.totalBaseCost.toFixed(2)}`,
      `Total Duty,${summary.totalDuty.toFixed(2)}`,
      `Total Freight,${summary.totalFreight.toFixed(2)}`,
      `Total BL Charges,${summary.totalBLCharges.toFixed(2)}`,
      `Total Insurance,${summary.totalInsurance.toFixed(2)}`,
      `Total Local Cost,${summary.totalLocalCost.toFixed(2)}`,
      `Total Other Charges,${summary.totalOtherCharges.toFixed(2)}`,
      `Grand Total,${summary.grandTotal.toFixed(2)}`,
      `Cost Increase %,${summary.costIncrease.toFixed(2)}%`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `landed-cost-${sheetNo}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Landed Cost Calculator</h2>
            <p className="text-sm text-gray-500">Calculate total landed cost including Duty, Freight, BL, Insurance & Local Costs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'create' ? 'default' : 'outline'}
            onClick={() => setViewMode('create')}
          >
            Create New
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            View History
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">×</button>
        </div>
      )}

      {viewMode === 'create' ? (
        <>
          {/* Sheet Information */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-lg">Sheet Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Sheet No</Label>
                  <Input
                    value={sheetNo}
                    onChange={(e) => setSheetNo(e.target.value)}
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Supplier Name *</Label>
                  <Input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="mt-1"
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Invoice No</Label>
                  <Input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="mt-1"
                    placeholder="Enter invoice number"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Currency</Label>
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="PKR">PKR - Pakistani Rupee</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Cost Entry */}
          <Card className="border-2 border-amber-100">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Bulk Cost Entry (Total Amounts)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-4">Enter total amounts for each cost component. They will be distributed among items based on their value proportion.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Total Duty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkDuty}
                    onChange={(e) => setBulkDuty(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Total Freight</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkFreight}
                    onChange={(e) => setBulkFreight(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">BL Charges</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkBLCharges}
                    onChange={(e) => setBulkBLCharges(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Insurance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkInsurance}
                    onChange={(e) => setBulkInsurance(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Local Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkLocalCost}
                    onChange={(e) => setBulkLocalCost(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Other Charges</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkOtherCharges}
                    onChange={(e) => setBulkOtherCharges(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={applyBulkCosts} className="w-full bg-amber-500 hover:bg-amber-600">
                    Apply to Items
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card className="border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search by Part No or Description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {filteredParts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredParts.map(part => (
                      <button
                        key={part.id}
                        onClick={() => addItem(part)}
                        className="w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{part.partNo}</span>
                          <span className="text-gray-500 ml-2">{part.description}</span>
                        </div>
                        <span className="text-sm text-gray-600">${part.cost?.toFixed(2) || '0.00'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Line Items ({items.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={exportToExcel} disabled={items.length === 0}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part No</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Cost</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Base Cost</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50">Duty</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50">Freight</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-purple-50">BL</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Insurance</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-pink-50">Local</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-gray-100">Other</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-primary-50">Total</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-primary-50">Unit Cost</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-500">No items added. Search and add items above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 font-medium text-gray-900 text-sm">{item.partNo}</td>
                          <td className="px-3 py-2 text-gray-600 text-sm max-w-[150px] truncate">{item.description || '-'}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 text-center text-sm p-1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right text-sm p-1"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                            ${(item.quantity * item.unitCost).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-blue-50/50 text-right text-sm text-blue-700">
                            ${item.duty.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-green-50/50 text-right text-sm text-green-700">
                            ${item.freight.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-purple-50/50 text-right text-sm text-purple-700">
                            ${item.blCharges.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-yellow-50/50 text-right text-sm text-yellow-700">
                            ${item.insurance.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-pink-50/50 text-right text-sm text-pink-700">
                            ${item.localCost.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-gray-100/50 text-right text-sm text-gray-700">
                            ${item.otherCharges.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-primary-50/50 text-right text-sm font-bold text-primary-700">
                            ${item.totalLandedCost.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 bg-primary-50/50 text-right text-sm font-bold text-primary-700">
                            ${item.landedUnitCost.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Breakdown */}
            <Card className="lg:col-span-2 border-2 border-primary-100">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
                <CardTitle className="text-lg">Cost Breakdown Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Base Cost</p>
                    <p className="text-xl font-bold text-gray-900">${summary.totalBaseCost.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase">Total Duty</p>
                    <p className="text-xl font-bold text-blue-700">${summary.totalDuty.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 uppercase">Total Freight</p>
                    <p className="text-xl font-bold text-green-700">${summary.totalFreight.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase">BL Charges</p>
                    <p className="text-xl font-bold text-purple-700">${summary.totalBLCharges.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-600 uppercase">Insurance</p>
                    <p className="text-xl font-bold text-yellow-700">${summary.totalInsurance.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <p className="text-xs text-pink-600 uppercase">Local Cost</p>
                    <p className="text-xl font-bold text-pink-700">${summary.totalLocalCost.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase">Other Charges</p>
                    <p className="text-xl font-bold text-gray-700">${summary.totalOtherCharges.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-orange-500 rounded-lg">
                    <p className="text-xs text-white/80 uppercase">Grand Total</p>
                    <p className="text-xl font-bold text-white">${summary.grandTotal.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="text-gray-600">Cost Increase</span>
                  <span className={`text-lg font-bold ${summary.costIncrease >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    +{summary.costIncrease.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions & Notes */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg">Notes & Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 min-h-[100px]"
                    placeholder="Add any notes about this landed cost sheet..."
                  />
                </div>
                <div className="pt-4 border-t space-y-3">
                  <Button onClick={saveSheet} className="w-full" disabled={items.length === 0}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Landed Cost Sheet
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="w-full">
                    Reset Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* History View */
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Landed Cost Sheet History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {savedSheets.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No landed cost sheets saved yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {savedSheets.map((sheet) => (
                  <div key={sheet.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{sheet.sheetNo}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sheet.status === 'approved' ? 'bg-green-100 text-green-700' :
                            sheet.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Supplier: {sheet.supplierName} | Invoice: {sheet.invoiceNo || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {sheet.items.length} items | Created: {new Date(sheet.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">${sheet.grandTotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Total Landed Cost</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

