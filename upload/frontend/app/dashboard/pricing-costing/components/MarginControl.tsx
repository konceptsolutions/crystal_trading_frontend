'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface MarginRule {
  id: string;
  name: string;
  type: 'global' | 'category' | 'brand' | 'item';
  targetValue: string;
  minMargin: number;
  targetMargin: number;
  maxMargin: number;
  priceField: 'priceA' | 'priceB' | 'priceM' | 'all';
  status: 'active' | 'inactive';
  priority: number;
  createdAt: string;
}

interface MarginItem {
  id: string;
  partNo: string;
  description?: string;
  category?: string;
  brand?: string;
  cost: number;
  priceA: number;
  priceB: number;
  priceM: number;
  marginA: number;
  marginB: number;
  marginM: number;
  status: 'compliant' | 'below-min' | 'above-max';
}

export default function MarginControl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'rules' | 'monitor'>('rules');
  
  // Margin Rules
  const [marginRules, setMarginRules] = useState<MarginRule[]>([
    { id: '1', name: 'Global Minimum Margin', type: 'global', targetValue: 'ALL', minMargin: 15, targetMargin: 30, maxMargin: 100, priceField: 'all', status: 'active', priority: 1, createdAt: new Date().toISOString() },
  ]);
  
  const [selectedRule, setSelectedRule] = useState<MarginRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'global' | 'category' | 'brand' | 'item'>('category');
  const [formTargetValue, setFormTargetValue] = useState('');
  const [formMinMargin, setFormMinMargin] = useState(15);
  const [formTargetMargin, setFormTargetMargin] = useState(30);
  const [formMaxMargin, setFormMaxMargin] = useState(100);
  const [formPriceField, setFormPriceField] = useState<'priceA' | 'priceB' | 'priceM' | 'all'>('all');
  
  // Monitor Data
  const [items, setItems] = useState<MarginItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'below-min' | 'above-max'>('all');
  
  // Master Data
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parts?limit=2000&status=A');
      const parts = response.data.parts || [];

      // Get global rule for comparison
      const globalRule = marginRules.find(r => r.type === 'global' && r.status === 'active');
      const minMargin = globalRule?.minMargin || 15;
      const maxMargin = globalRule?.maxMargin || 100;

      const marginItems: MarginItem[] = parts.map((part: any) => {
        const cost = part.cost || 0;
        const priceA = part.priceA || 0;
        const priceB = part.priceB || 0;
        const priceM = part.priceM || 0;

        const marginA = cost > 0 ? ((priceA - cost) / cost) * 100 : 0;
        const marginB = cost > 0 ? ((priceB - cost) / cost) * 100 : 0;
        const marginM = cost > 0 ? ((priceM - cost) / cost) * 100 : 0;

        // Determine status based on Price A margin
        let status: 'compliant' | 'below-min' | 'above-max' = 'compliant';
        if (marginA < minMargin) status = 'below-min';
        else if (marginA > maxMargin) status = 'above-max';

        return {
          id: part.id,
          partNo: part.partNo,
          description: part.description,
          category: part.mainCategory || 'Uncategorized',
          brand: part.brand,
          cost,
          priceA,
          priceB,
          priceM,
          marginA,
          marginB,
          marginM,
          status,
        };
      });

      setItems(marginItems);

      const uniqueCategories = Array.from(new Set(parts.map((p: any) => p.mainCategory).filter(Boolean))) as string[];
      const uniqueBrands = Array.from(new Set(parts.map((p: any) => p.brand).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
      setBrands(uniqueBrands);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType('category');
    setFormTargetValue('');
    setFormMinMargin(15);
    setFormTargetMargin(30);
    setFormMaxMargin(100);
    setFormPriceField('all');
    setSelectedRule(null);
    setIsEditing(false);
  };

  const editRule = (rule: MarginRule) => {
    setSelectedRule(rule);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormTargetValue(rule.targetValue);
    setFormMinMargin(rule.minMargin);
    setFormTargetMargin(rule.targetMargin);
    setFormMaxMargin(rule.maxMargin);
    setFormPriceField(rule.priceField);
    setIsEditing(true);
  };

  const saveRule = () => {
    if (!formName) {
      setError('Rule name is required');
      return;
    }

    if (formMinMargin >= formTargetMargin || formTargetMargin >= formMaxMargin) {
      setError('Min margin must be less than target, and target must be less than max');
      return;
    }

    if (isEditing && selectedRule) {
      setMarginRules(prev => prev.map(rule => 
        rule.id === selectedRule.id
          ? {
              ...rule,
              name: formName,
              type: formType,
              targetValue: formTargetValue || 'ALL',
              minMargin: formMinMargin,
              targetMargin: formTargetMargin,
              maxMargin: formMaxMargin,
              priceField: formPriceField,
            }
          : rule
      ));
      setSuccess('Margin rule updated successfully!');
    } else {
      const newRule: MarginRule = {
        id: Date.now().toString(),
        name: formName,
        type: formType,
        targetValue: formTargetValue || 'ALL',
        minMargin: formMinMargin,
        targetMargin: formTargetMargin,
        maxMargin: formMaxMargin,
        priceField: formPriceField,
        status: 'active',
        priority: marginRules.length + 1,
        createdAt: new Date().toISOString(),
      };
      setMarginRules(prev => [...prev, newRule]);
      setSuccess('Margin rule created successfully!');
    }

    resetForm();
    setTimeout(() => setSuccess(''), 3000);
  };

  const deleteRule = (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this margin rule?')) return;
    setMarginRules(prev => prev.filter(r => r.id !== ruleId));
    setSuccess('Margin rule deleted!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleRuleStatus = (ruleId: string) => {
    setMarginRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  const autoFixMargins = async (fixType: 'below-min' | 'above-max') => {
    const itemsToFix = items.filter(i => i.status === fixType);
    if (itemsToFix.length === 0) {
      setError(`No items with ${fixType === 'below-min' ? 'below minimum' : 'above maximum'} margin`);
      return;
    }

    const globalRule = marginRules.find(r => r.type === 'global' && r.status === 'active');
    const targetMargin = fixType === 'below-min' 
      ? (globalRule?.minMargin || 15) + 5 // Set 5% above minimum
      : (globalRule?.targetMargin || 30); // Set to target

    if (!confirm(`This will update ${itemsToFix.length} items to ${targetMargin}% margin. Continue?`)) {
      return;
    }

    try {
      setLoading(true);
      for (const item of itemsToFix) {
        const newPriceA = item.cost * (1 + targetMargin / 100);
        await api.put(`/parts/${item.id}`, { priceA: newPriceA });
      }
      setSuccess(`Successfully fixed ${itemsToFix.length} items!`);
      loadData();
    } catch (err) {
      setError('Failed to fix margins');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  const summary = useMemo(() => {
    const compliant = items.filter(i => i.status === 'compliant').length;
    const belowMin = items.filter(i => i.status === 'below-min').length;
    const aboveMax = items.filter(i => i.status === 'above-max').length;
    const avgMargin = items.length > 0 
      ? items.reduce((sum, i) => sum + i.marginA, 0) / items.length 
      : 0;
    return { compliant, belowMin, aboveMax, avgMargin };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Margin Control</h2>
            <p className="text-sm text-gray-500">Set margin rules and monitor profit margins across inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'rules' ? 'default' : 'outline'}
            onClick={() => setViewMode('rules')}
          >
            Margin Rules
          </Button>
          <Button
            variant={viewMode === 'monitor' ? 'default' : 'outline'}
            onClick={() => setViewMode('monitor')}
          >
            Monitor
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Compliant</p>
                <p className="text-2xl font-bold text-green-900">{summary.compliant}</p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Below Min</p>
                <p className="text-2xl font-bold text-red-900">{summary.belowMin}</p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Above Max</p>
                <p className="text-2xl font-bold text-yellow-900">{summary.aboveMax}</p>
              </div>
              <div className="p-2 bg-yellow-200 rounded-lg">
                <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-orange-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-700">Avg Margin</p>
                <p className="text-2xl font-bold text-primary-900">{summary.avgMargin.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-primary-200 rounded-lg">
                <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'rules' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-900">Active Margin Rules</h3>
            {marginRules.map((rule) => (
              <Card key={rule.id} className={`border-2 transition-all ${rule.status === 'active' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200 opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-900">{rule.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.type === 'global' ? 'bg-purple-100 text-purple-700' :
                          rule.type === 'category' ? 'bg-blue-100 text-blue-700' :
                          rule.type === 'brand' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {rule.type.charAt(0).toUpperCase() + rule.type.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rule.status}
                        </span>
                      </div>
                      
                      {rule.type !== 'global' && (
                        <p className="text-sm text-gray-600 mb-2">Target: {rule.targetValue}</p>
                      )}
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm text-gray-600">Min: <strong>{rule.minMargin}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm text-gray-600">Target: <strong>{rule.targetMargin}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm text-gray-600">Max: <strong>{rule.maxMargin}%</strong></span>
                        </div>
                      </div>

                      {/* Visual Margin Bar */}
                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div 
                            className="bg-red-400" 
                            style={{ width: `${rule.minMargin}%` }}
                          />
                          <div 
                            className="bg-green-400" 
                            style={{ width: `${rule.targetMargin - rule.minMargin}%` }}
                          />
                          <div 
                            className="bg-yellow-400" 
                            style={{ width: `${Math.min(100 - rule.targetMargin, rule.maxMargin - rule.targetMargin)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => editRule(rule)}>
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={rule.status === 'active' ? 'border-yellow-300 text-yellow-700' : 'border-green-300 text-green-700'}
                      >
                        {rule.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteRule(rule.id)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {marginRules.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-gray-500">No margin rules defined. Create one to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Create/Edit Form */}
          <Card className="h-fit border-2 border-amber-100">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
              <CardTitle className="text-lg">
                {isEditing ? 'Edit Margin Rule' : 'Create Margin Rule'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Rule Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. Electronics Min Margin"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Rule Type</Label>
                <Select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="mt-1 w-full"
                >
                  <option value="global">Global (All Items)</option>
                  <option value="category">Category Specific</option>
                  <option value="brand">Brand Specific</option>
                </Select>
              </div>
              
              {formType !== 'global' && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Target {formType.charAt(0).toUpperCase() + formType.slice(1)}
                  </Label>
                  <Select
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(e.target.value)}
                    className="mt-1 w-full"
                  >
                    <option value="">-- Select --</option>
                    {(formType === 'category' ? categories : brands).map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-sm font-medium text-red-700">Min %</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formMinMargin}
                    onChange={(e) => setFormMinMargin(parseFloat(e.target.value) || 0)}
                    className="mt-1 border-red-200"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-700">Target %</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formTargetMargin}
                    onChange={(e) => setFormTargetMargin(parseFloat(e.target.value) || 0)}
                    className="mt-1 border-green-200"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-yellow-700">Max %</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formMaxMargin}
                    onChange={(e) => setFormMaxMargin(parseFloat(e.target.value) || 0)}
                    className="mt-1 border-yellow-200"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Apply To</Label>
                <Select
                  value={formPriceField}
                  onChange={(e) => setFormPriceField(e.target.value as any)}
                  className="mt-1 w-full"
                >
                  <option value="all">All Price Fields</option>
                  <option value="priceA">Price A Only</option>
                  <option value="priceB">Price B Only</option>
                  <option value="priceM">Price M Only</option>
                </Select>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <Button onClick={saveRule} className="w-full">
                  {isEditing ? 'Update Rule' : 'Create Rule'}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={resetForm} className="w-full">
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Monitor View */
        <>
          {/* Quick Actions */}
          {(summary.belowMin > 0 || summary.aboveMax > 0) && (
            <Card className="border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium text-amber-800">
                      {summary.belowMin + summary.aboveMax} items need attention
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {summary.belowMin > 0 && (
                      <Button 
                        onClick={() => autoFixMargins('below-min')}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                      >
                        Fix {summary.belowMin} Below Min
                      </Button>
                    )}
                    {summary.aboveMax > 0 && (
                      <Button 
                        onClick={() => autoFixMargins('above-max')}
                        className="bg-yellow-600 hover:bg-yellow-700"
                        disabled={loading}
                      >
                        Fix {summary.aboveMax} Above Max
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monitor Table */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Margin Monitor</CardTitle>
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
                      className="pl-9 w-40"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                    className="w-36"
                  >
                    <option value="all">All Status</option>
                    <option value="compliant">Compliant</option>
                    <option value="below-min">Below Min</option>
                    <option value="above-max">Above Max</option>
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
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price A</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-blue-50">Margin A</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price B</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-green-50">Margin B</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price M</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Margin M</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center">
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
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${
                          item.status === 'below-min' ? 'bg-red-50/50' :
                          item.status === 'above-max' ? 'bg-yellow-50/50' : ''
                        }`}>
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">{item.partNo}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm max-w-[150px] truncate">{item.description || '-'}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${item.cost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">${item.priceA.toFixed(2)}</td>
                          <td className={`px-4 py-3 text-right text-sm font-bold bg-blue-50/50 ${
                            item.marginA < 15 ? 'text-red-600' : item.marginA > 100 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.marginA.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">${item.priceB.toFixed(2)}</td>
                          <td className={`px-4 py-3 text-right text-sm font-bold bg-green-50/50 ${
                            item.marginB < 15 ? 'text-red-600' : item.marginB > 100 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.marginB.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">${item.priceM.toFixed(2)}</td>
                          <td className={`px-4 py-3 text-right text-sm font-bold bg-yellow-50/50 ${
                            item.marginM < 15 ? 'text-red-600' : item.marginM > 100 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.marginM.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === 'compliant' ? 'bg-green-100 text-green-700' :
                              item.status === 'below-min' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.status === 'compliant' ? 'OK' : item.status === 'below-min' ? 'Low' : 'High'}
                            </span>
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredItems.length)} of {filteredItems.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded">{page} / {totalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

