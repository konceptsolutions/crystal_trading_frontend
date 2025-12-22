'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface PriceStructure {
  id?: string;
  customerId?: string;
  customerName: string;
  customerType: 'retail' | 'wholesale' | 'market' | 'distributor';
  discountPercentage: number;
  creditLimit: number;
  creditDays: number;
  priceCategory: 'A' | 'B' | 'M'; // A=Retail, B=Wholesale, M=Market
  specialDiscount: number;
  minOrderValue: number;
  status: 'active' | 'inactive';
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

export default function CustomerPriceStructure() {
  const [priceStructures, setPriceStructures] = useState<PriceStructure[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<PriceStructure | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  const [formData, setFormData] = useState<PriceStructure>({
    customerName: '',
    customerType: 'retail',
    discountPercentage: 0,
    creditLimit: 0,
    creditDays: 30,
    priceCategory: 'A',
    specialDiscount: 0,
    minOrderValue: 0,
    status: 'active',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    notes: '',
  });

  // Bulk update form
  const [bulkFormData, setBulkFormData] = useState({
    customerType: 'retail' as 'retail' | 'wholesale' | 'market' | 'distributor',
    discountPercentage: 0,
    priceCategory: 'A' as 'A' | 'B' | 'M',
    creditDays: 30,
  });

  useEffect(() => {
    fetchPriceStructures();
    fetchCustomers();
  }, []);

  const fetchPriceStructures = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customer-price-structures');
      setPriceStructures(response.data.priceStructures || []);
    } catch (error: any) {
      console.error('Failed to fetch price structures:', error);
      // Set demo data for development
      setPriceStructures([
        {
          id: '1',
          customerName: 'ABC Trading Co.',
          customerType: 'wholesale',
          discountPercentage: 15,
          creditLimit: 500000,
          creditDays: 45,
          priceCategory: 'B',
          specialDiscount: 2,
          minOrderValue: 10000,
          status: 'active',
          effectiveFrom: '2025-01-01',
        },
        {
          id: '2',
          customerName: 'XYZ Retailers',
          customerType: 'retail',
          discountPercentage: 5,
          creditLimit: 50000,
          creditDays: 15,
          priceCategory: 'A',
          specialDiscount: 0,
          minOrderValue: 1000,
          status: 'active',
          effectiveFrom: '2025-01-01',
        },
        {
          id: '3',
          customerName: 'Market Masters Ltd.',
          customerType: 'market',
          discountPercentage: 20,
          creditLimit: 1000000,
          creditDays: 60,
          priceCategory: 'M',
          specialDiscount: 5,
          minOrderValue: 50000,
          status: 'active',
          effectiveFrom: '2025-01-01',
        },
        {
          id: '4',
          customerName: 'Regional Distributors',
          customerType: 'distributor',
          discountPercentage: 25,
          creditLimit: 2000000,
          creditDays: 90,
          priceCategory: 'M',
          specialDiscount: 7,
          minOrderValue: 100000,
          status: 'active',
          effectiveFrom: '2025-01-01',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedStructure?.id) {
        await api.put(`/customer-price-structures/${selectedStructure.id}`, formData);
      } else {
        await api.post('/customer-price-structures', formData);
      }
      resetForm();
      fetchPriceStructures();
    } catch (error: any) {
      console.error('Failed to save price structure:', error);
      alert(error.response?.data?.error || 'Failed to save price structure');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price structure?')) return;
    try {
      setLoading(true);
      await api.delete(`/customer-price-structures/${id}`);
      fetchPriceStructures();
    } catch (error: any) {
      console.error('Failed to delete price structure:', error);
      alert(error.response?.data?.error || 'Failed to delete price structure');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Update all ${bulkFormData.customerType} customers with these settings?`)) return;
    try {
      setLoading(true);
      await api.post('/customer-price-structures/bulk-update', bulkFormData);
      setShowBulkUpdate(false);
      fetchPriceStructures();
    } catch (error: any) {
      console.error('Failed to bulk update:', error);
      alert(error.response?.data?.error || 'Failed to bulk update');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerType: 'retail',
      discountPercentage: 0,
      creditLimit: 0,
      creditDays: 30,
      priceCategory: 'A',
      specialDiscount: 0,
      minOrderValue: 0,
      status: 'active',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      notes: '',
    });
    setSelectedStructure(null);
    setShowForm(false);
  };

  const handleEdit = (structure: PriceStructure) => {
    setSelectedStructure(structure);
    setFormData(structure);
    setShowForm(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'retail':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'wholesale':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'market':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'distributor':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriceCategoryLabel = (category: string) => {
    switch (category) {
      case 'A':
        return 'Price A (Retail)';
      case 'B':
        return 'Price B (Wholesale)';
      case 'M':
        return 'Price M (Market)';
      default:
        return category;
    }
  };

  const filteredStructures = priceStructures.filter((s) => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.customerType === filterType;
    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: priceStructures.length,
    retail: priceStructures.filter(s => s.customerType === 'retail').length,
    wholesale: priceStructures.filter(s => s.customerType === 'wholesale').length,
    market: priceStructures.filter(s => s.customerType === 'market').length,
    distributor: priceStructures.filter(s => s.customerType === 'distributor').length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-xl font-bold text-gray-700">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Retail</p>
                <p className="text-xl font-bold text-blue-700">{stats.retail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Wholesale</p>
                <p className="text-xl font-bold text-green-700">{stats.wholesale}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Market</p>
                <p className="text-xl font-bold text-purple-700">{stats.market}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-orange-100 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-primary-600 font-medium">Distributor</p>
                <p className="text-xl font-bold text-primary-700">{stats.distributor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="market">Market</option>
            <option value="distributor">Distributor</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkUpdate(true)}
            className="border-primary-300 text-primary-600 hover:bg-primary-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Bulk Update
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            + Add Price Structure
          </Button>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Bulk Update Price Structure</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkUpdate(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-800">Bulk Update Warning</p>
                    <p className="text-sm text-yellow-700">This will update all customers of the selected type with the new settings.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                  <select
                    value={bulkFormData.customerType}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, customerType: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="market">Market</option>
                    <option value="distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Category</label>
                  <select
                    value={bulkFormData.priceCategory}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, priceCategory: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="A">Price A (Retail)</option>
                    <option value="B">Price B (Wholesale)</option>
                    <option value="M">Price M (Market)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                  <Input
                    type="number"
                    value={bulkFormData.discountPercentage}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit Days</label>
                  <Input
                    type="number"
                    value={bulkFormData.creditDays}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, creditDays: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600" disabled={loading}>
                  {loading ? 'Updating...' : 'Apply to All'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBulkUpdate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle>{selectedStructure ? 'Edit Price Structure' : 'New Customer Price Structure'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name or select from list"
                    required
                    list="customers-list"
                  />
                  <datalist id="customers-list">
                    {customers.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type *</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      let priceCategory: 'A' | 'B' | 'M' = 'A';
                      let discount = 0;
                      let creditDays = 30;
                      
                      if (type === 'wholesale') {
                        priceCategory = 'B';
                        discount = 10;
                        creditDays = 45;
                      } else if (type === 'market' || type === 'distributor') {
                        priceCategory = 'M';
                        discount = type === 'distributor' ? 20 : 15;
                        creditDays = type === 'distributor' ? 90 : 60;
                      }
                      
                      setFormData({
                        ...formData,
                        customerType: type,
                        priceCategory,
                        discountPercentage: discount,
                        creditDays,
                      });
                    }}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="retail">Retail Customer</option>
                    <option value="wholesale">Wholesale Customer</option>
                    <option value="market">Market Customer</option>
                    <option value="distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Category *</label>
                  <select
                    value={formData.priceCategory}
                    onChange={(e) => setFormData({ ...formData, priceCategory: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="A">Price A (Retail)</option>
                    <option value="B">Price B (Wholesale)</option>
                    <option value="M">Price M (Market)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Standard Discount %</label>
                  <Input
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Discount %</label>
                  <Input
                    type="number"
                    value={formData.specialDiscount}
                    onChange={(e) => setFormData({ ...formData, specialDiscount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
                  <Input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit Days</label>
                  <Input
                    type="number"
                    value={formData.creditDays}
                    onChange={(e) => setFormData({ ...formData, creditDays: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Order Value</label>
                  <Input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective From *</label>
                  <Input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective To</label>
                  <Input
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Additional notes or special terms..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600" disabled={loading}>
                  {loading ? 'Saving...' : selectedStructure ? 'Update' : 'Create'} Price Structure
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Customer Price Structures ({filteredStructures.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export
              </Button>
              <Button variant="outline" size="sm" className="text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : filteredStructures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-lg font-medium">No price structures found</p>
              <p className="text-sm">Add a new price structure to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Price Category</TableHead>
                    <TableHead className="font-semibold text-right">Discount %</TableHead>
                    <TableHead className="font-semibold text-right">Credit Limit</TableHead>
                    <TableHead className="font-semibold text-center">Credit Days</TableHead>
                    <TableHead className="font-semibold text-right">Min Order</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStructures.map((structure) => (
                    <TableRow key={structure.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{structure.customerName}</TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(structure.customerType)}`}>
                          {structure.customerType.charAt(0).toUpperCase() + structure.customerType.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {getPriceCategoryLabel(structure.priceCategory)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">{structure.discountPercentage}%</span>
                        {structure.specialDiscount > 0 && (
                          <span className="text-xs text-primary-600 ml-1">(+{structure.specialDiscount}%)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rs. {structure.creditLimit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                          {structure.creditDays} days
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        Rs. {structure.minOrderValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          structure.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {structure.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(structure)}
                            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => structure.id && handleDelete(structure.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

