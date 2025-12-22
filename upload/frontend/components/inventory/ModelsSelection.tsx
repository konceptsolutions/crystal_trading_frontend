'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

interface Part {
  id: string;
  partNo: string;
  masterPartNo?: string;
  description?: string;
  brand?: string;
}

interface Model {
  id: string;
  modelNo: string;
  qtyUsed: number;
  partId: string;
}

export default function ModelsSelection() {
  const [modelNumber, setModelNumber] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsSearch, setPartsSearch] = useState('');
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editModelNo, setEditModelNo] = useState('');
  const [editQtyUsed, setEditQtyUsed] = useState(1);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all parts
  useEffect(() => {
    loadParts();
  }, []);

  // Refresh parts list periodically to get updated data
  useEffect(() => {
    const interval = setInterval(() => {
      loadParts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Define loadModelsForPart function BEFORE useEffect hooks that use it
  const loadModelsForPart = useCallback(async (partId: string) => {
    setModelsLoading(true);
    try {
      console.log('ModelsSelection: Loading models for part:', partId);
      
      // Try to fetch from models endpoint first
      try {
        const response = await api.get(`/models/part/${partId}`);
        const modelsData = response.data.models || [];
        console.log('ModelsSelection: Loaded models from /models/part endpoint:', modelsData);
        setModels(modelsData);
      } catch (modelsError: any) {
        console.log('ModelsSelection: /models/part endpoint failed, trying fallback:', modelsError?.message);
        // Fallback: try to get models from part data
        try {
          const partResponse = await api.get(`/parts/${partId}`);
          const part = partResponse.data?.part;
          const modelsData = part?.models || [];
          console.log('ModelsSelection: Loaded models from /parts endpoint:', modelsData);
          setModels(modelsData);
        } catch (partError: any) {
          console.error('ModelsSelection: Failed to load models from both endpoints:', partError);
          setModels([]);
        }
      }
    } catch (error: any) {
      console.error('ModelsSelection: Unexpected error loading models:', error);
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  // Filter parts based on master part number and search
  useEffect(() => {
    let filtered = parts;

    // First filter by master part number if model number is entered
    if (modelNumber.trim() !== '') {
      filtered = filtered.filter(part => 
        part.masterPartNo?.toLowerCase() === modelNumber.trim().toLowerCase()
      );
    } else {
      // If no master part number, show no parts
      filtered = [];
    }

    // Then filter by search text if provided
    if (partsSearch.trim() !== '') {
      filtered = filtered.filter(part =>
        part.partNo.toLowerCase().includes(partsSearch.toLowerCase()) ||
        part.description?.toLowerCase().includes(partsSearch.toLowerCase()) ||
        part.brand?.toLowerCase().includes(partsSearch.toLowerCase())
      );
    }

    setFilteredParts(filtered);

    // Auto-show dropdown when master part number is entered and there are matching parts
    if (modelNumber.trim() !== '' && filtered.length > 0 && !selectedPartId) {
      setShowPartsDropdown(true);
    } else if (modelNumber.trim() === '') {
      setShowPartsDropdown(false);
    }
  }, [modelNumber, partsSearch, parts, selectedPartId]);

  // Load models when part is selected
  useEffect(() => {
    if (selectedPartId) {
      loadModelsForPart(selectedPartId);
    } else {
      setModels([]);
    }
  }, [selectedPartId, loadModelsForPart]);

  // Refresh models periodically when a part is selected
  useEffect(() => {
    if (!selectedPartId) return;

    const interval = setInterval(() => {
      loadModelsForPart(selectedPartId);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedPartId, loadModelsForPart]);

  // Clear selected part when model number changes
  useEffect(() => {
    if (modelNumber.trim() !== '') {
      // Clear selection if current part doesn't match the master part number
      if (selectedPartId) {
        const selectedPart = parts.find(p => p.id === selectedPartId);
        if (selectedPart && selectedPart.masterPartNo?.toLowerCase() !== modelNumber.trim().toLowerCase()) {
          setSelectedPartId('');
          setPartsSearch('');
          setModels([]);
        }
      }
    }
  }, [modelNumber, selectedPartId, parts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.parentElement?.contains(target)
      ) {
        setShowPartsDropdown(false);
      }
    };

    if (showPartsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPartsDropdown]);

  const loadParts = async () => {
    setPartsLoading(true);
    try {
      const response = await api.get('/parts?limit=1000');
      const partsData = response.data.parts || [];
      setParts(partsData);
      setFilteredParts(partsData);
    } catch (error) {
      console.error('Failed to load parts:', error);
      setParts([]);
      setFilteredParts([]);
    } finally {
      setPartsLoading(false);
    }
  };

  const handlePartSelect = (part: Part) => {
    setSelectedPartId(part.id);
    setPartsSearch(`${part.partNo}${part.description ? ` - ${part.description}` : ''}`);
    setShowPartsDropdown(false);
    setEditingModelId(null);
  };

  const handleEdit = (model: Model) => {
    setEditingModelId(model.id);
    setEditModelNo(model.modelNo);
    setEditQtyUsed(model.qtyUsed);
  };

  const handleCancelEdit = () => {
    setEditingModelId(null);
    setEditModelNo('');
    setEditQtyUsed(1);
  };

  const handleSaveEdit = async (modelId: string) => {
    if (!editModelNo.trim()) {
      alert('Model number is required');
      return;
    }

    setSaving(modelId);
    try {
      await api.put(`/models/${modelId}`, {
        modelNo: editModelNo.trim(),
        qtyUsed: editQtyUsed,
      });
      
      // Reload models
      if (selectedPartId) {
        await loadModelsForPart(selectedPartId);
      }
      setEditingModelId(null);
    } catch (error: any) {
      console.error('Failed to update model:', error);
      alert(error.response?.data?.error || 'Failed to update model');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    setDeleting(modelId);
    try {
      await api.delete(`/models/${modelId}`);
      
      // Reload models and parts list
      if (selectedPartId) {
        await loadModelsForPart(selectedPartId);
        await loadParts(); // Refresh parts list to get updated data
      }
    } catch (error: any) {
      console.error('Failed to delete model:', error);
      alert(error.response?.data?.error || 'Failed to delete model');
    } finally {
      setDeleting(null);
    }
  };

  const selectedPart = parts.find(p => p.id === selectedPartId);

  return (
    <div className="space-y-6">
      {/* Selection Form */}
      <Card className="bg-white border border-gray-200 shadow-medium rounded-lg">
        <CardHeader className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <CardTitle className="text-xl font-semibold text-gray-900">Model Selection</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Number Field */}
            <div className="space-y-2">
              <Label htmlFor="modelNumber" className="text-sm font-semibold text-gray-700">
                Master Part Number
              </Label>
              <Input
                id="modelNumber"
                value={modelNumber}
                onChange={(e) => {
                  setModelNumber(e.target.value);
                  // Clear selected part when master part number changes
                  if (selectedPartId) {
                    setSelectedPartId('');
                    setPartsSearch('');
                    setModels([]);
                  }
                }}
                placeholder="Enter master part number"
                className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
              />
              {modelNumber.trim() !== '' && (
                <p className="text-xs text-gray-500 mt-1">
                  Only parts with this master part number will be shown
                </p>
              )}
            </div>

            {/* Part No Field with Dropdown */}
            <div className="space-y-2 relative">
              <Label htmlFor="partNo" className="text-sm font-semibold text-gray-700">
                Part No <span className="text-red-500 font-bold">*</span>
              </Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="partNo"
                  value={partsSearch}
                  onChange={(e) => {
                    setPartsSearch(e.target.value);
                    if (modelNumber.trim() !== '' && filteredParts.length > 0) {
                      setShowPartsDropdown(true);
                    }
                    if (!e.target.value) {
                      setSelectedPartId('');
                    }
                  }}
                  onFocus={() => {
                    if (modelNumber.trim() !== '' && filteredParts.length > 0) {
                      setShowPartsDropdown(true);
                    }
                  }}
                  placeholder={modelNumber.trim() === '' ? "Enter master part number first" : "Search and select part..."}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  disabled={modelNumber.trim() === ''}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  }
                />
                {modelNumber.trim() !== '' && showPartsDropdown && filteredParts.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredParts.slice(0, 50).map((part) => (
                      <div
                        key={part.id}
                        onClick={() => handlePartSelect(part)}
                        className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{part.partNo}</div>
                        {part.description && (
                          <div className="text-sm text-gray-500 truncate">{part.description}</div>
                        )}
                        {part.brand && (
                          <div className="text-xs text-gray-400">Brand: {part.brand}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models List */}
      {selectedPartId && (
        <Card className="bg-white border border-gray-200 shadow-medium rounded-lg">
          <CardHeader className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Models for {selectedPart?.partNo}
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedPartId) {
                    loadModelsForPart(selectedPartId);
                    loadParts(); // Also refresh parts list
                  }
                }}
                disabled={modelsLoading}
                className="flex items-center gap-2 text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
            {selectedPart?.description && (
              <p className="text-sm text-gray-500 mt-2">{selectedPart.description}</p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {modelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-500">Loading models...</span>
                </div>
              </div>
            ) : models.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">No models found for this part</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3 px-6 text-left">Model</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-6 text-right">Qty. Used</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3 px-6 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900 py-3 px-6">
                          {editingModelId === model.id ? (
                            <Input
                              value={editModelNo}
                              onChange={(e) => setEditModelNo(e.target.value)}
                              className="h-8 text-sm border-gray-300 focus:border-primary-400"
                              placeholder="Enter model number"
                            />
                          ) : (
                            model.modelNo
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700 py-3 px-6 text-right font-medium">
                          {editingModelId === model.id ? (
                            <Input
                              type="number"
                              min="1"
                              value={editQtyUsed}
                              onChange={(e) => setEditQtyUsed(parseInt(e.target.value) || 1)}
                              className="h-8 w-20 text-sm text-right border-gray-300 focus:border-primary-400"
                            />
                          ) : (
                            model.qtyUsed
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700 py-3 px-6 text-center">
                          {editingModelId === model.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="xs"
                                variant="default"
                                onClick={() => handleSaveEdit(model.id)}
                                disabled={saving === model.id}
                                className="h-7 px-2 text-xs"
                              >
                                {saving === model.id ? (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={saving === model.id}
                                className="h-7 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleEdit(model)}
                                className="h-10 w-10 flex items-center justify-center rounded-lg text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(model.id)}
                                disabled={deleting === model.id}
                                className="h-10 w-10 flex items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                              >
                                {deleting === model.id ? (
                                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

