'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import api from '@/lib/api';

export interface Supplier {
  id?: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  contactPerson?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  status: 'A' | 'I';
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    purchaseOrders: number;
  };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Show form when switching to manage tab
  useEffect(() => {
    if (activeTab === 'manage') {
      setShowForm(true);
    }
  }, [activeTab]);

  const [formData, setFormData] = useState<Supplier>({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    contactPerson: '',
    taxId: '',
    paymentTerms: '',
    notes: '',
    status: 'A',
  });

  useEffect(() => {
    fetchSuppliers();
  }, [page, pageSize, statusFilter, searchTerm, searchField]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        fetchSuppliers();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchField, statusFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      if (searchTerm) {
        params.append('search', searchTerm);
        if (searchField !== 'all') {
          params.append('searchField', searchField);
        }
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await api.get(`/suppliers?${params.toString()}`);
      setSuppliers(response.data.suppliers || []);
      setTotal(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch suppliers');
      setSuppliers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      if (selectedSupplier?.id) {
        const response = await api.put(`/suppliers/${selectedSupplier.id}`, formData);
        setSuccess('Supplier updated successfully');
        setSelectedSupplier(response.data.supplier);
      } else {
        const response = await api.post('/suppliers', formData);
        setSuccess('Supplier created successfully');
        setSelectedSupplier(response.data.supplier);
      }
      
      resetForm();
      fetchSuppliers();
      setTimeout(() => {
        setActiveTab('suppliers');
        setPage(1);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      zipCode: supplier.zipCode || '',
      contactPerson: supplier.contactPerson || '',
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || '',
      status: supplier.status,
    });
    setShowForm(true);
    setActiveTab('manage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.delete(`/suppliers/${id}`);
      setSuccess('Supplier deleted successfully');
      if (selectedSupplier?.id === id) {
        resetForm();
        setShowForm(false);
      }
      // If we're on the last page and it becomes empty, go to previous page
      if (suppliers.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchSuppliers();
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete supplier');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      contactPerson: '',
      taxId: '',
      paymentTerms: '',
      notes: '',
      status: 'A',
    });
    setSelectedSupplier(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStartRecord = () => {
    return total === 0 ? 0 : (page - 1) * pageSize + 1;
  };

  const getEndRecord = () => {
    return Math.min(page * pageSize, total);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .slide-in {
          animation: slideIn 0.4s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Supplier Management</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage your suppliers for purchase orders</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setActiveTab('manage');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          responsive={true}
          size="default"
          className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300"
        >
          + New Supplier
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-sm animate-fade-in">
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md shadow-sm animate-fade-in">
          {success}
        </div>
      )}

      {/* Tabs */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 gap-2">
                <TabsTrigger value="suppliers" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Suppliers
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Suppliers
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers" className="mt-0">
              <div className="px-6 pb-6">
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <div className="space-y-4">
                      <CardTitle>Suppliers</CardTitle>
                      
                      {/* Filters and Search */}
                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                        {/* Status Filter */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Active/Inactive</label>
                          <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            size="sm"
                            responsive={true}
                          >
                            <option value="all">All</option>
                            <option value="A">Active</option>
                            <option value="I">Inactive</option>
                          </Select>
                        </div>

                        {/* Search Field Selection */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap sm:hidden">Search Field</label>
                          <Select
                            value={searchField}
                            onChange={(e) => setSearchField(e.target.value)}
                            size="sm"
                            responsive={true}
                          >
                            <option value="all">All Fields</option>
                            <option value="name">Name</option>
                            <option value="code">Code</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="address">Address</option>
                            <option value="contactPerson">Contact Person</option>
                          </Select>
                        </div>

                        {/* Search Input */}
                        <div className="flex-1 min-w-[200px]">
                          <Input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="sm"
                            responsive={true}
                            fullWidth={true}
                          />
                        </div>

                        {/* Search Button */}
                        <Button
                          onClick={() => fetchSuppliers()}
                          size="sm"
                          responsive={true}
                          className="w-full sm:w-auto"
                        >
                          Search
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading && !suppliers.length ? (
                      <div className="text-center py-12 text-gray-500">Loading suppliers...</div>
                    ) : suppliers.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        {searchTerm || statusFilter !== 'all' ? 'No suppliers found matching your criteria.' : 'No suppliers found. Create one to get started.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" className="rounded border-gray-300" />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.map((supplier, index) => (
                              <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <input type="checkbox" className="rounded border-gray-300" />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {(page - 1) * pageSize + index + 1}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {supplier.contactPerson || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {supplier.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                                  {supplier.address ? `${supplier.address}${supplier.city ? `, ${supplier.city}` : ''}` : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {supplier.email || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {supplier.taxId || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {supplier.phone || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    supplier.status === 'A'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      supplier.status === 'A' ? 'bg-green-500' : 'bg-gray-500'
                                    }`}></span>
                                    {supplier.status === 'A' ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(supplier)}
                                      className="h-8 w-8 p-0 hover:bg-primary-50 hover:text-primary-600"
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => supplier.id && handleDelete(supplier.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-gray-100"
                                      title="More options"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                      </svg>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {suppliers.length > 0 && (
                      <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing <span className="font-medium">{getStartRecord()}</span> to{' '}
                          <span className="font-medium">{getEndRecord()}</span> of{' '}
                          <span className="font-medium">{total}</span> Records
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setPage(1);
                            }}
                            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              disabled={page === 1}
                              className="px-3 py-1.5"
                            >
                              First
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(page - 1)}
                              disabled={page === 1}
                              className="px-3 py-1.5"
                            >
                              Prev
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(page + 1)}
                              disabled={page >= totalPages}
                              className="px-3 py-1.5"
                            >
                              Next
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={page >= totalPages}
                              className="px-3 py-1.5"
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Manage Suppliers Tab */}
            <TabsContent value="manage" className="mt-0">
              <div className="px-6 pb-6">
                {showForm ? (
                  <Card className="shadow-lg border-2 border-primary-200 animate-fade-in">
                    <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                          {selectedSupplier ? 'Edit Supplier' : 'Create New Supplier'}
                        </CardTitle>
                        <Button variant="ghost" onClick={() => { resetForm(); setActiveTab('suppliers'); }}>
                          ✕
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="code" className="text-sm font-medium">Supplier Code *</Label>
                          <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="SUP-001"
                            required
                            responsive={true}
                            fullWidth={true}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium">Supplier Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter supplier name"
                            required
                            responsive={true}
                            fullWidth={true}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="supplier@example.com"
                            responsive={true}
                            fullWidth={true}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 234 567 8900"
                            responsive={true}
                            fullWidth={true}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactPerson">Contact Person</Label>
                          <Input
                            id="contactPerson"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                            placeholder="Contact person name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="taxId">Tax ID</Label>
                          <Input
                            id="taxId"
                            value={formData.taxId}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            placeholder="Tax identification number"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              placeholder="Street address"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="City"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              placeholder="State or Province"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              placeholder="Country"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">Zip/Postal Code</Label>
                            <Input
                              id="zipCode"
                              value={formData.zipCode}
                              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                              placeholder="Zip code"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="paymentTerms">Payment Terms</Label>
                            <Input
                              id="paymentTerms"
                              value={formData.paymentTerms}
                              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                              placeholder="e.g., Net 30, COD, etc."
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <select
                              id="status"
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'A' | 'I' })}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="A">Active</option>
                              <option value="I">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes about the supplier..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button type="submit" disabled={loading} className="flex-1 bg-primary-500 hover:bg-primary-600">
                          {loading ? 'Saving...' : selectedSupplier ? 'Update Supplier' : 'Create Supplier'}
                        </Button>
                        {selectedSupplier && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              resetForm();
                              setActiveTab('suppliers');
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-lg">
                    <CardContent className="p-12 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Ready to add a supplier?</h3>
                        <p className="text-gray-500">Click "New Supplier" button to get started</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

