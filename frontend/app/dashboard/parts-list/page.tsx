'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AnimatedSelect from '@/components/ui/animated-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { Part } from '@/components/inventory/PartForm';
import { Kit } from '@/components/inventory/KitForm';
import PartForm from '@/components/inventory/PartForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PartWithStock extends Part {
  stock?: {
    quantity: number;
  };
}

const STATUS_OPTIONS = ['A', 'N'];
const GRADE_OPTIONS = ['A', 'B', 'C', 'D'];
const ORIGIN_OPTIONS = ['USA', 'CHINA', 'JAPAN', 'GERMANY', 'INDIA', 'OTHER'];

export default function PartsListPage() {
  const [activeTab, setActiveTab] = useState<'parts' | 'kits'>('parts');
  
  // Parts state
  const [parts, setParts] = useState<PartWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Kits state
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [kitSearchTerm, setKitSearchTerm] = useState('');
  
  // Filters
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  
  // Edit/Delete states
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);
  
  // Get unique values for filter dropdowns
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (activeTab === 'parts') {
      loadParts();
    }
  }, [page, debouncedSearch, brandFilter, categoryFilter, statusFilter, originFilter, gradeFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'parts') {
      loadFilterOptions();
    } else if (activeTab === 'kits') {
      loadKits();
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab === 'kits') {
      loadKits();
    }
  }, [kitSearchTerm]);

  const loadFilterOptions = async () => {
    try {
      const response = await api.get('/parts?limit=1000');
      const allParts = response.data.parts;
      
      const brands = Array.from(new Set(allParts.map((p: Part) => p.brand).filter(Boolean))).sort() as string[];
      const categories = Array.from(new Set(allParts.map((p: Part) => p.mainCategory).filter(Boolean))).sort() as string[];
      
      setAvailableBrands(brands);
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadParts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (brandFilter) params.append('brand', brandFilter);
      if (categoryFilter) params.append('mainCategory', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (originFilter) params.append('origin', originFilter);
      if (gradeFilter) params.append('grade', gradeFilter);
      
      const response = await api.get(`/parts?${params.toString()}`);
      setParts(response.data.parts || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (error: any) {
      if (!error.message?.includes('Backend server is not running')) {
        console.error('Failed to load parts:', error);
      }
      setParts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEdit = (part: PartWithStock) => {
    setEditingPart(part);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (partId: string) => {
    if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      return;
    }

    setDeletingPartId(partId);
    try {
      await api.delete(`/parts/${partId}`);
      loadParts();
      loadFilterOptions();
    } catch (error) {
      console.error('Failed to delete part:', error);
      alert('Failed to delete part. Please try again.');
    } finally {
      setDeletingPartId(null);
    }
  };

  const handleSavePart = (part: Part) => {
    setIsEditDialogOpen(false);
    setEditingPart(null);
    loadParts();
    loadFilterOptions();
  };

  const handleDeletePart = (id: string) => {
    handleDelete(id);
  };

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setBrandFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setOriginFilter('');
    setGradeFilter('');
    setPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => 
    debouncedSearch || brandFilter || categoryFilter || statusFilter || originFilter || gradeFilter,
    [debouncedSearch, brandFilter, categoryFilter, statusFilter, originFilter, gradeFilter]
  );

  const loadKits = async () => {
    setKitsLoading(true);
    try {
      const response = await api.get('/kits');
      setKits(response.data.kits || []);
    } catch (error: any) {
      if (!error.message?.includes('Backend server is not running')) {
        console.error('Failed to load kits:', error);
      }
      setKits([]);
    } finally {
      setKitsLoading(false);
    }
  };

  const filteredKits = kits.filter(kit =>
    kit.kitNo.toLowerCase().includes(kitSearchTerm.toLowerCase()) ||
    kit.name.toLowerCase().includes(kitSearchTerm.toLowerCase()) ||
    kit.description?.toLowerCase().includes(kitSearchTerm.toLowerCase())
  );

  const handleDeleteKit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kit?')) {
      return;
    }
    try {
      await api.delete(`/kits/${id}`);
      loadKits();
    } catch (error) {
      console.error('Failed to delete kit:', error);
      alert('Failed to delete kit. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parts & Kits List</h1>
              <p className="text-sm text-gray-500 mt-1">Search, filter, and manage all inventory parts and kits</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('parts')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'parts'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Parts List
            </button>
            <button
              onClick={() => setActiveTab('kits')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'kits'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Kits List
            </button>
          </div>
        </div>

        {/* Parts List Content */}
        {activeTab === 'parts' && (
          <>
        {/* Search and Filters Card */}
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-semibold text-gray-900">Search & Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    placeholder="Search by Part No, Master Part No, Description, or Brand..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11 pl-10 transition-all duration-200"
                  />
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-gray-300 h-11 px-4 hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <AnimatedSelect
                  label="Brand"
                  value={brandFilter}
                  onChange={(value) => {
                    setBrandFilter(value);
                    setPage(1);
                  }}
                  placeholder="All Brands"
                  options={[
                    { value: '', label: 'All Brands' },
                    ...availableBrands.map((brand) => ({
                      value: brand,
                      label: brand,
                    })),
                  ]}
                />

                <AnimatedSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={(value) => {
                    setCategoryFilter(value);
                    setPage(1);
                  }}
                  placeholder="All Categories"
                  options={[
                    { value: '', label: 'All Categories' },
                    ...availableCategories.map((category) => ({
                      value: category,
                      label: category,
                    })),
                  ]}
                />

                <AnimatedSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                  placeholder="All Status"
                  options={[
                    { value: '', label: 'All Status' },
                    ...STATUS_OPTIONS.map((status) => ({
                      value: status,
                      label: status === 'A' ? 'Active' : 'Inactive',
                    })),
                  ]}
                />

                <AnimatedSelect
                  label="Origin"
                  value={originFilter}
                  onChange={(value) => {
                    setOriginFilter(value);
                    setPage(1);
                  }}
                  placeholder="All Origins"
                  options={[
                    { value: '', label: 'All Origins' },
                    ...ORIGIN_OPTIONS.map((origin) => ({
                      value: origin,
                      label: origin,
                    })),
                  ]}
                />

                <AnimatedSelect
                  label="Grade"
                  value={gradeFilter}
                  onChange={(value) => {
                    setGradeFilter(value);
                    setPage(1);
                  }}
                  placeholder="All Grades"
                  options={[
                    { value: '', label: 'All Grades' },
                    ...GRADE_OPTIONS.map((grade) => ({
                      value: grade,
                      label: grade,
                    })),
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parts Table Card */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Parts List</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {total} part{total !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Part No</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Brand</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Description</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Category</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Cost</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Price A</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-gray-500">Loading parts...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : parts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm text-gray-500">No parts found</p>
                          {hasActiveFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                              className="mt-2"
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    parts.map((part, index) => (
                      <TableRow
                        key={part.id}
                        className="border-b border-gray-100 hover:bg-primary-50/50 transition-all duration-200 ease-in-out hover:shadow-sm"
                      >
                        <TableCell className="font-semibold text-gray-900 py-4 px-6">
                          {part.partNo}
                        </TableCell>
                        <TableCell className="text-gray-700 py-4 px-6">
                          {part.brand || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-4 px-6 max-w-xs truncate" title={part.description || ''}>
                          {part.description || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-4 px-6">
                          {part.mainCategory || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                          {part.cost !== undefined && part.cost !== null
                            ? `$${part.cost.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                          {part.priceA !== undefined && part.priceA !== null
                            ? `$${part.priceA.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (part.stock?.quantity || 0) > (part.reOrderLevel || 0)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {part.stock?.quantity !== undefined ? part.stock.quantity : 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            part.status === 'A'
                              ? 'bg-primary-100 text-primary-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {part.status === 'A' ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(part)}
                              className="border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 h-8 px-3 transition-all duration-200"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => part.id && handleDelete(part.id)}
                              disabled={deletingPartId === part.id}
                              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 h-8 px-3 disabled:opacity-50 transition-all duration-200"
                            >
                              {deletingPartId === part.id ? (
                                <>
                                  <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600 font-medium">
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} parts
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-300"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-gray-300"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}

        {/* Kits List Content */}
        {activeTab === 'kits' && (
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">All Kits</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{kits.length} kit{kits.length !== 1 ? 's' : ''} found</p>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                      type="text"
                      placeholder="Search kits..."
                      value={kitSearchTerm}
                      onChange={(e) => setKitSearchTerm(e.target.value)}
                      className="w-full pl-10 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {kitsLoading ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Loading kits...</span>
                  </div>
                </div>
              ) : filteredKits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {kitSearchTerm ? 'No kits found matching your search.' : 'No kits found. Create one to get started.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredKits.map((kit) => (
                    <div
                      key={kit.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-primary-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{kit.name}</h3>
                            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                              {kit.kitNo}
                            </span>
                            {kit.status === 'I' && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          {kit.description && (
                            <p className="text-sm text-gray-600 mb-2">{kit.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              <strong>Items:</strong> {kit.items?.length || 0}
                            </span>
                            {kit.totalCost && (
                              <span>
                                <strong>Total Cost:</strong> ${kit.totalCost.toFixed(2)}
                              </span>
                            )}
                            {kit.price && (
                              <span>
                                <strong>Price:</strong> ${kit.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {kit.items && kit.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Kit Contents:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {kit.items.map((item, index) => (
                                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                    <div className="font-medium">
                                      {item.part?.partNo || 'Unknown Part'}
                                    </div>
                                    <div className="text-gray-600">
                                      Qty: {item.quantity} × ${item.part?.cost || 0} = ${((item.part?.cost || 0) * item.quantity).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/dashboard/kits`}
                            className="border-primary-300 text-primary-700 hover:bg-primary-50"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => kit.id && handleDeleteKit(kit.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Part</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update part information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {editingPart && (
              <PartForm
                part={editingPart}
                onSave={handleSavePart}
                onDelete={handleDeletePart}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

