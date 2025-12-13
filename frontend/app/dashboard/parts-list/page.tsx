'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AnimatedSelect from '@/components/ui/animated-select';
import AutocompleteInput from '@/components/ui/autocomplete-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { Part } from '@/components/inventory/PartForm';
import { Kit } from '@/components/inventory/KitForm';
import PartForm from '@/components/inventory/PartForm';
import KitForm from '@/components/inventory/KitForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PartWithStock extends Part {
  stock?: {
    quantity: number;
  };
}


export default function PartsListPage() {
  const [activeTab, setActiveTab] = useState<'parts' | 'kits'>('parts');
  
  // Parts state
  const [parts, setParts] = useState<PartWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  
  // Kits state
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [kitSearchTerm, setKitSearchTerm] = useState('');
  
  // Filters - Updated order as requested
  const [masterPartNoFilter, setMasterPartNoFilter] = useState('');
  const [partNoFilter, setPartNoFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  
  // Edit/Delete/Create states
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isCreatingPart, setIsCreatingPart] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [isCreatingKit, setIsCreatingKit] = useState(false);
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<PartWithStock | null>(null);
  
  // Get unique values for filter dropdowns
  const [availableMasterPartNos, setAvailableMasterPartNos] = useState<string[]>([]);
  const [availablePartNos, setAvailablePartNos] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [availableApplications, setAvailableApplications] = useState<string[]>([]);
  
  // Selection state
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (activeTab === 'parts') {
      loadParts();
      setSelectedParts(new Set()); // Clear selection when filters change
    }
  }, [debouncedSearch, masterPartNoFilter, partNoFilter, brandFilter, descriptionFilter, categoryFilter, subCategoryFilter, applicationFilter, activeTab]);

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
      // Load brands from brands API
      try {
        const brandsResponse = await api.get('/brands');
        const brands = brandsResponse.data.brands || [];
        const brandNames = Array.isArray(brands)
          ? brands.map((b: any) => (typeof b === 'string' ? b : b?.name)).filter(Boolean)
          : [];
        setAvailableBrands(brandNames);
      } catch (brandError) {
        console.error('Failed to load brands:', brandError);
        // Fallback to loading from parts if brands API fails
        const response = await api.get('/parts?limit=1000');
        const allParts = response.data.parts;
        const brands = Array.from(new Set(allParts.map((p: Part) => p.brand).filter(Boolean))).sort() as string[];
        setAvailableBrands(brands);
      }
      
      // Load master part numbers, part numbers, categories, subcategories, and applications from parts
      const response = await api.get('/parts?limit=10000');
      const allParts = response.data.parts || [];
      
      const masterPartNos = Array.from(new Set(allParts.map((p: Part) => p.masterPartNo).filter(Boolean))).sort() as string[];
      setAvailableMasterPartNos(masterPartNos);
      
      const partNos = Array.from(new Set(allParts.map((p: Part) => p.partNo).filter(Boolean))).sort() as string[];
      setAvailablePartNos(partNos);
      
      const categories = Array.from(new Set(allParts.map((p: Part) => p.mainCategory).filter(Boolean))).sort() as string[];
      setAvailableCategories(categories);
      
      const subCategories = Array.from(new Set(allParts.map((p: Part) => p.subCategory).filter(Boolean))).sort() as string[];
      setAvailableSubCategories(subCategories);
      
      const applications = Array.from(new Set(allParts.map((p: Part) => p.application).filter(Boolean))).sort() as string[];
      setAvailableApplications(applications);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadParts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '10000', // Load all parts
      });
      
      // Use debounced search for general search, or individual filters
      if (debouncedSearch && !masterPartNoFilter && !partNoFilter && !descriptionFilter) {
        params.append('search', debouncedSearch);
      }
      
      // Individual filters (priority over general search)
      if (masterPartNoFilter) params.append('masterPartNo', masterPartNoFilter);
      if (partNoFilter) params.append('partNo', partNoFilter);
      if (brandFilter) params.append('brand', brandFilter);
      if (descriptionFilter) params.append('description', descriptionFilter);
      if (categoryFilter) params.append('mainCategory', categoryFilter);
      if (subCategoryFilter) params.append('subCategory', subCategoryFilter);
      if (applicationFilter) params.append('application', applicationFilter);
      
      const response = await api.get(`/parts?${params.toString()}`);
      let allParts = response.data.parts || [];
      
      // Client-side filtering for fields not supported by API
      // Note: masterPartNoFilter is now handled by API, but keeping this for exact match if needed
      if (masterPartNoFilter) {
        allParts = allParts.filter((p: Part) => 
          p.masterPartNo === masterPartNoFilter
        );
      }
      if (partNoFilter) {
        allParts = allParts.filter((p: Part) => 
          p.partNo?.toLowerCase().includes(partNoFilter.toLowerCase())
        );
      }
      if (descriptionFilter) {
        allParts = allParts.filter((p: Part) => 
          p.description?.toLowerCase().includes(descriptionFilter.toLowerCase())
        );
      }
      if (subCategoryFilter) {
        allParts = allParts.filter((p: Part) => 
          p.subCategory?.toLowerCase().includes(subCategoryFilter.toLowerCase())
        );
      }
      if (applicationFilter) {
        allParts = allParts.filter((p: Part) => 
          p.application?.toLowerCase().includes(applicationFilter.toLowerCase())
        );
      }
      
      setParts(allParts);
      setTotal(allParts.length);
    } catch (error: any) {
      if (!error.message?.includes('Backend server is not running')) {
        console.error('Failed to load parts:', error);
      }
      setParts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (part: PartWithStock) => {
    setEditingPart(part);
    setIsCreatingPart(false);
    // Scroll to form section
    setTimeout(() => {
      const formSection = document.getElementById('part-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDeleteClick = (part: PartWithStock) => {
    setPartToDelete(part);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!partToDelete?.id) return;

    setDeletingPartId(partToDelete.id);
    setDeleteConfirmOpen(false);
    
    try {
      await api.delete(`/parts/${partToDelete.id}`);
      loadParts();
      loadFilterOptions();
      setPartToDelete(null);
    } catch (error) {
      console.error('Failed to delete part:', error);
      alert('Failed to delete part. Please try again.');
    } finally {
      setDeletingPartId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setPartToDelete(null);
  };

  const handleSavePart = (part: Part) => {
    setIsCreatingPart(false);
    setEditingPart(null);
    loadParts();
    loadFilterOptions();
  };

  const handleDeletePart = (id: string) => {
    const part = parts.find(p => p.id === id);
    if (part) {
      handleDeleteClick(part);
    }
  };

  const handleSaveKit = (kit: Kit) => {
    setIsCreatingKit(false);
    setEditingKit(null);
    loadKits();
    // Show success message or handle as needed
  };

  const handleDeleteKitFromForm = (id: string) => {
    handleDeleteKit(id);
  };

  const handleNewPart = () => {
    setEditingPart(null);
    setIsCreatingPart(true);
    // Scroll to form section
    setTimeout(() => {
      const formSection = document.getElementById('part-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelCreatePart = () => {
    setIsCreatingPart(false);
    setEditingPart(null);
  };

  const handleCancelEditPart = () => {
    setEditingPart(null);
  };

  const handleNewKit = () => {
    setEditingKit(null);
    setIsCreatingKit(true);
    // Scroll to form section
    setTimeout(() => {
      const formSection = document.getElementById('kit-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelCreateKit = () => {
    setIsCreatingKit(false);
    setEditingKit(null);
  };

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setMasterPartNoFilter('');
    setPartNoFilter('');
    setBrandFilter('');
    setDescriptionFilter('');
    setCategoryFilter('');
    setSubCategoryFilter('');
    setApplicationFilter('');
  }, []);

  const hasActiveFilters = useMemo(() => 
    debouncedSearch || masterPartNoFilter || partNoFilter || brandFilter || descriptionFilter || 
    categoryFilter || subCategoryFilter || applicationFilter,
    [debouncedSearch, masterPartNoFilter, partNoFilter, brandFilter, descriptionFilter, 
     categoryFilter, subCategoryFilter, applicationFilter]
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

  // Selection handlers
  const handleSelectPart = (partId: string) => {
    setSelectedParts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partId)) {
        newSet.delete(partId);
      } else {
        newSet.add(partId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedParts.size === parts.length && parts.length > 0) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(parts.map(p => p.id)));
    }
  };

  const handleSelectAllItems = () => {
    if (selectedParts.size === parts.length && parts.length > 0) {
      // If all are selected, uncheck all
      setSelectedParts(new Set());
    } else {
      // Otherwise, select all
      setSelectedParts(new Set(parts.map(p => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedParts(new Set());
  };

  // CSV Download function
  const handleDownloadCSV = () => {
    if (selectedParts.size === 0) {
      alert('Please select at least one item to download.');
      return;
    }

    const selectedPartsData = parts.filter(p => selectedParts.has(p.id));
    
    // CSV Headers
    const headers = [
      'Part No',
      'Master Part No',
      'Brand',
      'Description',
      'Category',
      'Sub Category',
      'Application',
      'Status',
      'Cost',
      'Price A',
      'Price B',
      'Price M',
      'Stock Quantity'
    ];

    // CSV Rows
    const rows = selectedPartsData.map(part => [
      part.partNo || '',
      part.masterPartNo || '',
      part.brand || '',
      part.description || '',
      part.mainCategory || '',
      part.subCategory || '',
      part.application || '',
      part.status === 'A' ? 'Active' : 'Inactive',
      part.cost?.toString() || '',
      part.priceA?.toString() || '',
      part.priceB?.toString() || '',
      part.priceM?.toString() || '',
      part.stock?.quantity?.toString() || '0'
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    if (selectedParts.size === 0) {
      alert('Please select at least one item to print.');
      return;
    }

    const selectedPartsData = parts.filter(p => selectedParts.has(p.id));
    
    // Create print window content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Parts List - Print</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .header-info {
              margin-bottom: 20px;
              text-align: right;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            Printed on: ${new Date().toLocaleString()}<br>
            Total Items: ${selectedPartsData.length}
          </div>
          <h1>Parts List</h1>
          <table>
            <thead>
              <tr>
                <th>Part No</th>
                <th>Master Part No</th>
                <th>Brand</th>
                <th>Description</th>
                <th>Category</th>
                <th>Sub Category</th>
                <th>Application</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              ${selectedPartsData.map(part => `
                <tr>
                  <td>${part.partNo || '-'}</td>
                  <td>${part.masterPartNo || '-'}</td>
                  <td>${part.brand || '-'}</td>
                  <td>${part.description || '-'}</td>
                  <td>${part.mainCategory || '-'}</td>
                  <td>${part.subCategory || '-'}</td>
                  <td>${part.application || '-'}</td>
                  <td>${part.status === 'A' ? 'Active' : 'Inactive'}</td>
                  <td>${part.cost ? `$${part.cost.toFixed(2)}` : '-'}</td>
                  <td>${part.stock?.quantity || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleEditKit = (kit: Kit) => {
    setEditingKit(kit);
    setIsCreatingKit(true);
    // Scroll to form section
    setTimeout(() => {
      const formSection = document.getElementById('kit-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
    <div className="bg-gray-50 p-3 sm:p-4 md:p-6 min-h-screen w-full">
      <div className="max-w-full mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Parts & Kits List</h1>
                <p className="text-sm text-gray-500 mt-1">Search, filter, and manage all inventory parts and kits</p>
              </div>
            </div>
            <div className="flex gap-2">
              {activeTab === 'parts' ? (
                isCreatingPart || editingPart ? (
                  <Button
                    onClick={isCreatingPart ? handleCancelCreatePart : handleCancelEditPart}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    onClick={handleNewPart}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    + New Part
                  </Button>
                )
              ) : activeTab === 'kits' ? (
                isCreatingKit ? (
                  <Button
                    onClick={handleCancelCreateKit}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    onClick={handleNewKit}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    + New Kit
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('parts');
                setIsCreatingPart(false);
                setIsCreatingKit(false);
                setSelectedParts(new Set()); // Clear selection when switching tabs
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'parts'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Parts List
            </button>
            <button
              onClick={() => {
                setActiveTab('kits');
                setIsCreatingPart(false);
                setIsCreatingKit(false);
                setSelectedParts(new Set()); // Clear selection when switching tabs
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
        {/* Create New Part Form - Shows when creating, hides filters and table */}
        {isCreatingPart && (
          <Card id="part-form-section" className="mb-6 bg-white border-2 border-primary-200 shadow-lg rounded-xl">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">Create New Part</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelCreatePart}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕ Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PartForm
                part={null}
                onSave={handleSavePart}
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Part Form - Shows when editing, hides filters and table */}
        {editingPart && !isCreatingPart && (
          <Card id="part-form-section" className="mb-6 bg-white border-2 border-primary-200 shadow-lg rounded-xl">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">Edit Part</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEditPart}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕ Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PartForm
                part={editingPart}
                onSave={handleSavePart}
                onDelete={handleDeletePart}
              />
            </CardContent>
          </Card>
        )}

        {/* Search and Filters Card - Hidden when creating or editing */}
        {!isCreatingPart && !editingPart && (
        <Card className="mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Search & Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllItems}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-3"
                >
                  {selectedParts.size === parts.length && parts.length > 0 ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Unselect All
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Select All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  disabled={selectedParts.size === 0}
                  className={`h-9 px-3 ${
                    selectedParts.size === 0
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50 blur-[0.5px]'
                      : 'border-primary-300 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={selectedParts.size === 0}
                  className={`h-9 px-3 ${
                    selectedParts.size === 0
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50 blur-[0.5px]'
                      : 'border-primary-300 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </Button>
              </div>
            </div>
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
                    placeholder="Quick search across all fields..."
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

              {/* Filter Row - Updated order as requested */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {/* 1. Master Part No */}
                <AutocompleteInput
                  id="masterPartNoFilter"
                  label="Master Part No"
                  value={masterPartNoFilter}
                  onChange={(value) => setMasterPartNoFilter(value)}
                  options={availableMasterPartNos}
                  placeholder="Type to search or enter new"
                />

                {/* 2. Part No */}
                <AutocompleteInput
                  id="partNoFilter"
                  label="Part No"
                  value={partNoFilter}
                  onChange={(value) => setPartNoFilter(value)}
                  options={availablePartNos}
                  placeholder="Type to search or enter new"
                />

                {/* 3. Brand */}
                <AutocompleteInput
                  id="brandFilter"
                  label="Brand"
                  value={brandFilter}
                  onChange={(value) => setBrandFilter(value)}
                  options={availableBrands}
                  placeholder="Type to search or enter new"
                />

                {/* 4. Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <Input
                    placeholder="Filter by Description..."
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                    className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-10"
                  />
                </div>

                {/* 5. Category */}
                <AnimatedSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={(value) => {
                    setCategoryFilter(value);
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

                {/* 6. Sub Category */}
                <AnimatedSelect
                  label="Sub Category"
                  value={subCategoryFilter}
                  onChange={(value) => {
                    setSubCategoryFilter(value);
                  }}
                  placeholder="All Sub Categories"
                  options={[
                    { value: '', label: 'All Sub Categories' },
                    ...availableSubCategories.map((subCat) => ({
                      value: subCat,
                      label: subCat,
                    })),
                  ]}
                />

                {/* 7. Application */}
                <AnimatedSelect
                  label="Application"
                  value={applicationFilter}
                  onChange={(value) => {
                    setApplicationFilter(value);
                  }}
                  placeholder="All Applications"
                  options={[
                    { value: '', label: 'All Applications' },
                    ...availableApplications.map((app) => ({
                      value: app,
                      label: app,
                    })),
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Parts Table Card - Hidden when creating or editing */}
        {!isCreatingPart && !editingPart && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-gray-200 bg-gray-50 py-3 px-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Parts List</CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {total} part{total !== 1 ? 's' : ''} found
                  {selectedParts.size > 0 && (
                    <span className="ml-2 text-primary-600 font-semibold">
                      • {selectedParts.size} selected
                    </span>
                  )}
                </p>
              </div>
              {selectedParts.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-primary-700 hover:text-primary-900 hover:bg-primary-100 h-8 px-3"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <div className="w-full overflow-x-auto overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', maxHeight: 'calc(100vh - 400px)' }}>
              <Table className="min-w-full" style={{ minWidth: '1200px', width: 'max-content' }}>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedParts.size === parts.length && parts.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left hidden lg:table-cell">Master Part No</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left">Part No</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left hidden md:table-cell">Brand</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left">Description</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left hidden lg:table-cell">Category</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left hidden xl:table-cell">Sub Category</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-left hidden xl:table-cell">Application</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-center">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-center hidden md:table-cell">Images</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-2 px-2 text-center min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12">
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
                      <TableCell colSpan={11} className="text-center py-12">
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
                        className={`border-b border-gray-100 hover:bg-primary-50/50 transition-all duration-200 ease-in-out hover:shadow-sm ${
                          selectedParts.has(part.id) ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        <TableCell className="text-center py-2 px-2">
                          <input
                            type="checkbox"
                            checked={selectedParts.has(part.id)}
                            onChange={() => handleSelectPart(part.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 py-2 px-2 hidden lg:table-cell">
                          {part.masterPartNo || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 py-2 px-2">
                          {part.partNo}
                        </TableCell>
                        <TableCell className="text-gray-700 py-2 px-2 hidden md:table-cell">
                          {part.brand || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-2 px-2 truncate" title={part.description || ''}>
                          {part.description || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-2 px-2 hidden lg:table-cell">
                          {part.mainCategory || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-2 px-2 hidden xl:table-cell">
                          {part.subCategory || '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 py-2 px-2 hidden xl:table-cell">
                          {part.application || '-'}
                        </TableCell>
                        <TableCell className="text-center py-2 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            part.status === 'A'
                              ? 'bg-primary-100 text-primary-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {part.status === 'A' ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2 px-2 hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {part.imageUrl1 && (
                              <div className="relative group">
                                <img 
                                  src={part.imageUrl1} 
                                  alt="Part image 1" 
                                  className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => window.open(part.imageUrl1, '_blank')}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            {part.imageUrl2 && (
                              <div className="relative group">
                                <img 
                                  src={part.imageUrl2} 
                                  alt="Part image 2" 
                                  className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => window.open(part.imageUrl2, '_blank')}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            {!part.imageUrl1 && !part.imageUrl2 && (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2 px-2">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(part)}
                              className="border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 h-8 w-8 !p-0 transition-all duration-200"
                              title="Edit part"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(part)}
                              disabled={deletingPartId === part.id}
                              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 h-8 w-8 !p-0 disabled:opacity-50 transition-all duration-200"
                              title="Delete part"
                            >
                              {deletingPartId === part.id ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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

            {/* Total Count */}
            <div className="flex items-center justify-between px-2 py-2 bg-gray-50 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                Showing {parts.length} of {total} part{total !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>
        )}
          </>
        )}

        {/* Kits List Content */}
        {activeTab === 'kits' && (
          <>
        {/* Create/Edit Kit Form - Shows when creating/editing, hides list */}
        {isCreatingKit && (
          <Card id="kit-form-section" className="mb-6 bg-white border-2 border-primary-200 shadow-lg rounded-xl">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {editingKit ? 'Edit Kit' : 'Create New Kit'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelCreateKit}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕ Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <KitForm
                kit={editingKit}
                onSave={handleSaveKit}
                onDelete={editingKit?.id ? handleDeleteKitFromForm : undefined}
              />
            </CardContent>
          </Card>
        )}

        {/* Kits List - Hidden when creating/editing */}
        {!isCreatingKit && (
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
                      className="pl-10 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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
                            onClick={() => handleEditKit(kit)}
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
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md w-[95%] max-w-md mx-auto">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto sm:mx-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                    Delete Part
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1">
                    Are you sure you want to delete this part?
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {partToDelete && (
              <div className="my-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[80px]">Part No:</span>
                    <span className="text-xs sm:text-sm text-gray-900 font-semibold break-words">{partToDelete.partNo}</span>
                  </div>
                  {partToDelete.masterPartNo && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[80px]">Master Part No:</span>
                      <span className="text-xs sm:text-sm text-gray-900 break-words">{partToDelete.masterPartNo}</span>
                    </div>
                  )}
                  {partToDelete.description && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[80px]">Description:</span>
                      <span className="text-xs sm:text-sm text-gray-900 flex-1 break-words">{partToDelete.description}</span>
                    </div>
                  )}
                  {partToDelete.brand && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[80px]">Brand:</span>
                      <span className="text-xs sm:text-sm text-gray-900 break-words">{partToDelete.brand}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-red-800 font-medium text-center sm:text-left">
                ⚠️ This action cannot be undone. The part will be permanently deleted from the system.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={deletingPartId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deletingPartId !== null}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingPartId === partToDelete?.id ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Part
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
}
