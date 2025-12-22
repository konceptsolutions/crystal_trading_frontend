'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

export interface ModelWithPart {
  id: string;
  modelNo: string;
  qtyUsed: number;
  tab: 'P1' | 'P2';
  partId: string;
  part: {
    id: string;
    partNo: string;
    description?: string;
    brand?: string;
    mainCategory?: string;
    stock?: {
      quantity: number;
    };
  };
}

interface ModelsTableProps {
  refreshTrigger?: number;
}

export default function ModelsTable({ refreshTrigger = 0 }: ModelsTableProps) {
  const [models, setModels] = useState<ModelWithPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadModels();
  }, [page, debouncedSearch, refreshTrigger]);

  const loadModels = async () => {
    setLoading(true);
    try {
      // Use dedicated models API endpoint
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const response = await api.get(`/models?${params.toString()}`);
      const modelsData = response.data.models || [];
      const pagination = response.data.pagination || { total: 0, totalPages: 1 };

      // Transform backend response to match component interface
      const transformedModels: ModelWithPart[] = modelsData.map((model: any) => ({
        id: model.id,
        modelNo: model.modelNo,
        qtyUsed: model.qtyUsed,
        tab: model.tab,
        partId: model.partId,
        part: {
          id: model.part?.id || '',
          partNo: model.part?.partNo || '',
          description: model.part?.description || '',
          brand: model.part?.brand || '',
          mainCategory: model.part?.mainCategory || '',
          stock: model.part?.stock || null
        }
      }));

      setModels(transformedModels);
      setTotalPages(pagination.totalPages || 1);
      setTotal(pagination.total || 0);
    } catch (error: any) {
      console.error('Failed to load models:', error);
      setModels([]);
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

  const startEdit = (model: ModelWithPart) => {
    setEditingRow(model.id);
    setEditData({
      modelNo: model.modelNo,
      qtyUsed: model.qtyUsed,
      tab: model.tab || 'P1' // Keep for backend compatibility
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditData({});
    setError('');
  };

  const saveModel = async (modelId: string, partId: string) => {
    setSaving(modelId);
    setError('');
    
    try {
      // Get all existing models for this part
      const partResponse = await api.get(`/parts/${partId}`);
      const existingModels = partResponse.data?.part?.models || [];
      
      // Update the specific model
      const updatedModels = existingModels.map((m: any) => 
        m.id === modelId 
          ? {
              modelNo: editData.modelNo,
              qtyUsed: parseInt(editData.qtyUsed) || 1,
              tab: editData.tab
            }
          : {
              modelNo: m.modelNo,
              qtyUsed: m.qtyUsed,
              tab: m.tab
            }
      );

      // Save updated models
      await api.put(`/parts/${partId}`, { models: updatedModels });
      
      // Reload models data
      await loadModels();
      
      setEditingRow(null);
      setEditData({});
    } catch (err: any) {
      console.error('Save model error:', err);
      setError(err.response?.data?.error || 'Failed to save model');
    } finally {
      setSaving(null);
    }
  };

  const deleteModel = async (modelId: string, partId: string) => {
    if (!confirm('Are you sure you want to delete this model association?')) {
      return;
    }

    setSaving(modelId);
    setError('');
    
    try {
      // Get all existing models for this part
      const partResponse = await api.get(`/parts/${partId}`);
      const existingModels = partResponse.data?.part?.models || [];
      
      // Remove the specific model
      const filteredModels = existingModels
        .filter((m: any) => m.id !== modelId)
        .map((m: any) => ({
          modelNo: m.modelNo,
          qtyUsed: m.qtyUsed,
          tab: m.tab
        }));

      // Save updated models (without the deleted one)
      await api.put(`/parts/${partId}`, { models: filteredModels });
      
      // Reload models data
      await loadModels();
    } catch (err: any) {
      console.error('Delete model error:', err);
      setError(err.response?.data?.error || 'Failed to delete model');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Models List</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {total} model{total !== 1 ? 's' : ''} found - Click Edit to modify model details
            </p>
          </div>
          <div className="w-64">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="Search by Model No, Part No..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Model No</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Part No</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Part Description</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Brand</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Category</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Qty Used</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Stock</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-500">Loading models...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">No models found</p>
                      {debouncedSearch && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch('')}
                          className="mt-2"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow
                    key={model.id}
                    className={`border-b border-gray-100 transition-all duration-200 ease-in-out ${
                      editingRow === model.id 
                        ? 'bg-blue-50 shadow-md' 
                        : 'hover:bg-primary-50/50 hover:shadow-sm'
                    }`}
                  >
                    <TableCell className="font-semibold text-gray-900 py-4 px-6">
                      {editingRow === model.id ? (
                        <Input
                          value={editData.modelNo || ''}
                          onChange={(e) => setEditData((prev: any) => ({ ...prev, modelNo: e.target.value }))}
                          className="h-8 text-sm"
                          placeholder="Model No"
                        />
                      ) : (
                        model.modelNo
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6">
                      {model.part.partNo}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6 max-w-xs truncate" title={model.part.description || ''}>
                      {model.part.description || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6">
                      {model.part.brand || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6">
                      {model.part.mainCategory || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                      {editingRow === model.id ? (
                        <Input
                          type="number"
                          min="1"
                          value={editData.qtyUsed || ''}
                          onChange={(e) => setEditData((prev: any) => ({ ...prev, qtyUsed: e.target.value }))}
                          className="h-8 text-sm w-20"
                          placeholder="Qty"
                        />
                      ) : (
                        model.qtyUsed
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (model.part.stock?.quantity || 0) > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {model.part.stock?.quantity !== undefined ? model.part.stock.quantity : 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <div className="flex justify-center gap-2">
                        {editingRow === model.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveModel(model.id, model.partId)}
                              disabled={saving === model.id}
                              className="h-8 text-xs bg-green-500 hover:bg-green-600 text-white"
                            >
                              {saving === model.id ? '...' : '✓'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={saving === model.id}
                              className="h-8 text-xs border-gray-300"
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(model)}
                              disabled={editingRow !== null || saving !== null}
                              className="h-8 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteModel(model.id, model.partId)}
                              disabled={editingRow !== null || saving !== null}
                              className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </>
                        )}
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
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} models
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
  );
}

