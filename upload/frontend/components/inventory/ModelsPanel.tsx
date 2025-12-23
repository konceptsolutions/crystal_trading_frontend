'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export interface PartModel {
  id: string;
  partId: string;
  modelNo: string;
  qtyUsed: number | undefined;
  tab: 'P1' | 'P2';
}

interface ModelsPanelProps {
  partId?: string;
  partName?: string;
  stockQuantity?: number;
  models?: PartModel[];
  onModelsChange?: (models: PartModel[]) => void;
}

export default function ModelsPanel({ 
  partId, 
  partName, 
  stockQuantity: initialStockQuantity = 0,
  models = [
    { id: '', partId: '', modelNo: '', qtyUsed: undefined, tab: 'P1' }
  ],
  onModelsChange
}: ModelsPanelProps) {
  const [stockQuantity, setStockQuantity] = useState<number>(initialStockQuantity);
  const [loading, setLoading] = useState(false);
  const previousPartIdRef = useRef<string | undefined>(undefined);
  const modelsLoadedRef = useRef<boolean>(false);

  // Load models only when partId changes
  // ModelsPanel ALWAYS displays models from props - this effect only loads from API when partId changes AND models prop is empty
  useEffect(() => {
    const partIdChanged = previousPartIdRef.current !== partId;
    
    // Reset loaded flag when partId changes
    if (partIdChanged) {
      modelsLoadedRef.current = false;
      previousPartIdRef.current = partId;
    }

    // If no partId, reset to empty
    if (!partId) {
      if (onModelsChange && partIdChanged) {
        onModelsChange([
          { id: '', partId: '', modelNo: '', qtyUsed: undefined, tab: 'P1' }
        ]);
      }
      setStockQuantity(0);
      modelsLoadedRef.current = true;
      return;
    }

    // Only load from API if partId changed AND models prop doesn't have valid data
    // Check if models prop already has valid data (not just default empty model)
    const hasValidModelsFromProps = models && models.length > 0 && 
      models.some((m: PartModel) => m.modelNo && m.modelNo.trim() && m.partId === partId);
    
    console.log('ModelsPanel: useEffect check:', {
      partIdChanged,
      hasValidModelsFromProps,
      modelsCount: models?.length || 0,
      models: models,
      partId
    });
    
    // If partId changed but we already have valid models from props, don't load from API
    // This prevents overwriting models that were set by handleSelectPart
    if (partIdChanged && !hasValidModelsFromProps) {
      console.log('ModelsPanel: partId changed and no valid models from props, loading from API');
      // Load models from API when partId changes
      const loadModels = async () => {
        setLoading(true);
        try {
          // Fetch part with models and stock
          const partResponse = await api.get(`/parts/${partId}`);
          const part = partResponse.data?.part;
          const existingModels = part?.models || [];
          
          // Show at least 1 row
          const modelsToShow = existingModels.length > 0 ? existingModels.map((model: any) => ({
            id: model.id || '',
            partId: partId,
            modelNo: model.modelNo || '',
            qtyUsed: model.qtyUsed ?? undefined,
            tab: model.tab || 'P1'
          })) : [
            { id: '', partId: partId, modelNo: '', qtyUsed: undefined, tab: 'P1' }
          ];
          
          console.log('ModelsPanel: Loaded models from API:', modelsToShow);
          if (onModelsChange) {
            onModelsChange(modelsToShow);
          }
          setStockQuantity(part?.stock?.quantity ?? 0);
          modelsLoadedRef.current = true;
        } catch (error) {
          console.error('Failed to load models:', error);
          // Show empty row even on error
          if (onModelsChange) {
            onModelsChange([
              { id: '', partId: partId || '', modelNo: '', qtyUsed: undefined, tab: 'P1' }
            ]);
          }
          setStockQuantity(0);
          modelsLoadedRef.current = true;
        } finally {
          setLoading(false);
        }
      };

      loadModels();
    } else if (partIdChanged && hasValidModelsFromProps) {
      console.log('ModelsPanel: partId changed but valid models from props, using props:', models);
      // Update stock quantity only
      const updateStock = async () => {
        try {
          const partResponse = await api.get(`/parts/${partId}`);
          const part = partResponse.data?.part;
          setStockQuantity(part?.stock?.quantity ?? 0);
        } catch (error) {
          console.error('Failed to load stock:', error);
        }
      };
      updateStock();
      modelsLoadedRef.current = true;
    }
    // If partId hasn't changed, ModelsPanel will display models from props (via render)
  }, [partId]); // Only depend on partId - models prop is handled by render

  // Log when models prop changes to help debug
  useEffect(() => {
    console.log('ModelsPanel: Models prop changed:', {
      partId,
      modelsCount: models?.length || 0,
      models: models,
      hasValidModels: models?.some(m => m.modelNo && m.modelNo.trim())
    });
  }, [models, partId]);

  // Model management functions
  const addModel = () => {
    if (onModelsChange) {
      onModelsChange([
        ...models,
        { id: '', partId: partId || '', modelNo: '', qtyUsed: undefined, tab: 'P1' }
      ]);
    }
  };

  const updateModel = (index: number, field: keyof PartModel, value: any) => {
    if (onModelsChange) {
      const updatedModels = models.map((model, i) => 
        i === index ? { ...model, [field]: value } : model
      );
      console.log('ModelsPanel: Updating model:', {
        index,
        field,
        value,
        before: models[index],
        after: updatedModels[index],
        totalModels: updatedModels.length
      });
      onModelsChange(updatedModels);
    }
  };

  const removeModel = (index: number) => {
    if (onModelsChange) {
      if (models.length > 1) {
        // If we have more than 1 model, remove the selected one
        const filteredModels = models.filter((_, i) => i !== index);
        onModelsChange(filteredModels);
      } else {
        // If we have only 1, just clear the content but keep the row
        const clearedModels = models.map((model, i) => 
          i === index 
            ? { ...model, modelNo: '', qtyUsed: undefined }
            : model
        );
        onModelsChange(clearedModels);
      }
    }
  };


  return (
    <Card className="h-full bg-white border border-gray-200 shadow-medium rounded-lg overflow-hidden flex flex-col">
      <CardHeader className="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-0.5 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <div className="flex-1">
            <CardTitle className="text-sm font-semibold text-gray-900">Model and its Quantity used</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">View part model associations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addModel}
              className="flex items-center justify-center gap-2 px-4 py-2 h-9 text-sm font-semibold whitespace-nowrap border-primary-500 text-primary-600 bg-white hover:bg-primary-50 hover:border-primary-600 hover:text-primary-700 active:bg-primary-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add More</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-1 overflow-y-auto scrollbar-hide scroll-smooth bg-white" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="text-center py-4">
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="h-8 px-2 text-xs font-semibold text-gray-700">Model</TableHead>
                  <TableHead className="h-8 px-2 text-xs font-semibold text-gray-700 text-right">Qty. Used</TableHead>
                  <TableHead className="h-8 px-2 text-xs font-semibold text-gray-700 text-center w-12">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models && models.length > 0 ? (
                  models.map((model, index) => {
                    // IMPORTANT: keep key stable while typing (do NOT include modelNo)
                    const rowKey = model.id && model.id.trim().length > 0 ? model.id : `new-${index}`;
                    return (
                      <TableRow key={rowKey} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="px-0.5 py-0.5">
                          <Input
                            value={model.modelNo || ''}
                            onChange={(e) => updateModel(index, 'modelNo', e.target.value)}
                            placeholder="Enter model number"
                            className="h-7 text-xs border-gray-200 focus:border-primary-400 px-1.5 py-0.5"
                          />
                        </TableCell>
                        <TableCell className="px-0.5 py-0.5">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min="1"
                              value={model.qtyUsed ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateModel(index, 'qtyUsed', value === '' ? undefined : parseInt(value) || undefined);
                              }}
                              className="h-7 w-16 text-xs text-right border-gray-200 focus:border-primary-400 px-1.5 py-0.5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                              placeholder=""
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-0.5 py-0.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModel(index)}
                            className="h-7 w-7 p-0 bg-white border-2 border-red-500 hover:bg-red-50 hover:border-red-600 active:bg-red-100 inline-flex items-center justify-center rounded-md transition-colors"
                            title={models.length > 1 ? 'Remove row' : 'Clear row'}
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ minWidth: '20px', minHeight: '20px' }}>
                              <line x1="6" y1="6" x2="18" y2="18" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round"/>
                              <line x1="18" y1="6" x2="6" y2="18" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round"/>
                            </svg>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="px-2 py-4 text-center text-gray-500 text-xs">
                      No models added yet. Enter a model number above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
