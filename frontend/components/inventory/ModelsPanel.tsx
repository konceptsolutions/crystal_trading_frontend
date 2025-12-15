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
  qtyUsed: number;
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
    { id: '', partId: '', modelNo: '', qtyUsed: 1, tab: 'P1' }
  ],
  onModelsChange
}: ModelsPanelProps) {
  const [stockQuantity, setStockQuantity] = useState<number>(initialStockQuantity);
  const [loading, setLoading] = useState(false);
  const previousPartIdRef = useRef<string | undefined>(undefined);
  const modelsLoadedRef = useRef<boolean>(false);

  // Load models only when partId changes
  useEffect(() => {
    const partIdChanged = previousPartIdRef.current !== partId;
    
    // Reset loaded flag when partId changes
    if (partIdChanged) {
      modelsLoadedRef.current = false;
      previousPartIdRef.current = partId;
    }

    // If partId changed, we need to load models
    if (!partId) {
      // Always show 1 empty model row when no part selected
      if (onModelsChange && partIdChanged) {
        onModelsChange([
          { id: '', partId: '', modelNo: '', qtyUsed: 1, tab: 'P1' }
        ]);
      }
      setStockQuantity(0);
      modelsLoadedRef.current = true;
      return;
    }

    // Only load from API if partId changed
    // Models from props will be displayed automatically via the render
    // But if partId changed, we need to load fresh models from API
    if (partIdChanged) {
      // Load models from API when partId changes
      const loadModels = async () => {
        setLoading(true);
        try {
          // Fetch part with models and stock
          const partResponse = await api.get(`/parts/${partId}`);
          const part = partResponse.data?.part;
          const existingModels = part?.models || [];
          
          // Show at least 1 row
          const modelsToShow = existingModels.length > 0 ? [...existingModels] : [
            { id: '', partId: partId, modelNo: '', qtyUsed: 1, tab: 'P1' }
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
              { id: '', partId: partId || '', modelNo: '', qtyUsed: 1, tab: 'P1' }
            ]);
          }
          setStockQuantity(0);
          modelsLoadedRef.current = true;
        } finally {
          setLoading(false);
        }
      };

      loadModels();
    }
    // If partId hasn't changed, ModelsPanel will use models from props (which are displayed in render)
  }, [partId]); // Only depend on partId to prevent infinite loops

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
        { id: '', partId: partId || '', modelNo: '', qtyUsed: 1, tab: 'P1' }
      ]);
    }
  };

  const updateModel = (index: number, field: keyof PartModel, value: any) => {
    if (onModelsChange) {
      const updatedModels = models.map((model, i) => 
        i === index ? { ...model, [field]: value } : model
      );
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
            ? { ...model, modelNo: '', qtyUsed: 1 }
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
              className="flex items-center gap-1.5 px-3 py-2 h-8 text-xs font-medium border-primary-400 text-primary-600 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add More
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {models && models.length > 0 ? (
                  models.map((model, index) => (
                    <TableRow key={`${model.id || 'new'}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell className="px-2 py-1.5">
                        <Input
                          value={model.modelNo || ''}
                          onChange={(e) => updateModel(index, 'modelNo', e.target.value)}
                          placeholder="Enter model number"
                          className="h-7 text-xs border-gray-200 focus:border-primary-400"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModel(index)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete"
                            disabled={models.length <= 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={model.qtyUsed || 1}
                            onChange={(e) => updateModel(index, 'qtyUsed', parseInt(e.target.value) || 1)}
                            className="h-7 w-16 text-xs text-right border-gray-200 focus:border-primary-400"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="px-2 py-4 text-center text-gray-500 text-xs">
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
