'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnimatedSelect from '@/components/ui/animated-select';
import api from '@/lib/api';
import { Part } from './PartForm';

export interface PartWithStock extends Part {
  stock?: {
    quantity: number;
  };
}

export interface Kit {
  id?: string;
  kitNo: string;
  name: string;
  description?: string;
  totalCost?: number;
  price?: number;
  status: 'A' | 'I';
  items?: KitItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KitItem {
  id?: string;
  partId: string;
  part?: PartWithStock;
  quantity: number;
}

interface KitFormProps {
  kit?: Kit | null;
  onSave: (kit: Kit) => void;
  onDelete?: (id: string) => void;
}

export default function KitForm({ kit, onSave, onDelete }: KitFormProps) {
  const [formData, setFormData] = useState({
    kitNo: '',
    name: '',
    description: '',
    price: undefined as number | undefined,
    status: 'A' as 'A' | 'I',
  });
  const [items, setItems] = useState<KitItem[]>([]);
  const [availableParts, setAvailableParts] = useState<PartWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState<{ [key: number]: string }>({});
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchParts();
    if (kit) {
      setFormData({
        kitNo: kit.kitNo,
        name: kit.name,
        description: kit.description || '',
        price: kit.price,
        status: kit.status,
      });
      setItems(kit.items || []);
    } else {
      resetForm();
    }
  }, [kit]);

  const fetchParts = async () => {
    try {
      const response = await api.get('/parts?limit=1000&status=A');
      const parts = response.data.parts || [];
      // Debug: Log first few parts to check stock data
      if (parts.length > 0) {
        console.log('KitForm: Sample parts with stock:', parts.slice(0, 3).map((p: any) => ({
          partNo: p.partNo,
          stock: p.stock,
          cost: p.cost,
          priceA: p.priceA
        })));
      }
      setAvailableParts(parts);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      kitNo: '',
      name: '',
      description: '',
      price: undefined,
      status: 'A',
    });
    setItems([]);
    setError('');
  };

  const addItem = () => {
    setItems([...items, { partId: '', quantity: 1 }]);
    // Clear stock error for new item
    setStockError({});
  };

  const removeItem = (index: number) => {
    setRemovingIndex(index);
    // Wait for animation to complete before removing
    setTimeout(() => {
      setItems(items.filter((_, i) => i !== index));
      setRemovingIndex(null);
      // Clear stock error for removed item
      const newStockError = { ...stockError };
      delete newStockError[index];
      setStockError(newStockError);
    }, 250);
  };

  const updateItem = (index: number, field: keyof KitItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Validate stock when part or quantity changes
    if (field === 'partId' || field === 'quantity') {
      validateItemStock(updated, index);
    }
    
    setItems(updated);
  };

  const validateItemStock = (itemsList: KitItem[], index: number) => {
    const item = itemsList[index];
    const errors = { ...stockError };
    
    if (item.partId && item.quantity > 0) {
      const selectedPart = availableParts.find(p => p.id === item.partId);
      if (selectedPart) {
        const availableStock = selectedPart.stock?.quantity || 0;
        
        // Check if part is already used in other items in this kit
        const usedInOtherItems = itemsList
          .filter((it, idx) => idx !== index && it.partId === item.partId)
          .reduce((sum, it) => sum + it.quantity, 0);
        
        const totalNeeded = usedInOtherItems + item.quantity;
        
        if (totalNeeded > availableStock) {
          errors[index] = `Item not available in stock. Available: ${availableStock}, Needed: ${totalNeeded}`;
        } else {
          delete errors[index];
        }
      } else {
        errors[index] = 'Part not found';
      }
    } else {
      delete errors[index];
    }
    
    setStockError(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Please add at least one item to the kit');
      return;
    }

    if (items.length < 1) {
      setError('Kit must have at least one item');
      return;
    }

    // Validate all items have partId
    if (items.some(item => !item.partId)) {
      setError('Please select a part for all items');
      return;
    }

    // Validate stock availability for all items
    const stockValidationErrors: string[] = [];
    items.forEach((item, index) => {
      const selectedPart = availableParts.find(p => p.id === item.partId);
      if (selectedPart) {
        const availableStock = selectedPart.stock?.quantity || 0;
        const totalNeeded = items
          .filter(it => it.partId === item.partId)
          .reduce((sum, it) => sum + it.quantity, 0);
        
        if (totalNeeded > availableStock) {
          stockValidationErrors.push(
            `${selectedPart.partNo}: Available stock is ${availableStock}, but ${totalNeeded} is needed`
          );
        }
      }
    });

    if (stockValidationErrors.length > 0) {
      setError(`Stock not available:\n${stockValidationErrors.join('\n')}`);
      return;
    }

    try {
      setLoading(true);
      const kitData = {
        ...formData,
        items: items.map(item => ({
          partId: item.partId,
          quantity: item.quantity,
        })),
      };

      if (kit?.id) {
        const response = await api.put(`/kits/${kit.id}`, kitData);
        onSave(response.data.kit);
      } else {
        const response = await api.post('/kits', kitData);
        onSave(response.data.kit);
        resetForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save kit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!kit?.id || !onDelete) return;
    if (!confirm('Are you sure you want to delete this kit?')) return;

    try {
      setLoading(true);
      await api.delete(`/kits/${kit.id}`);
      onDelete(kit.id);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete kit');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredParts = (searchTerm: string) => {
    if (!searchTerm) return availableParts;
    return availableParts.filter(part =>
      part.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{kit ? 'Edit Kit' : 'Create New Kit'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 whitespace-pre-line">
                  {typeof error === 'object' ? JSON.stringify(error) : error}
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
            <div className="min-w-0">
              <Label htmlFor="kitNo">Kit Number *</Label>
              <Input
                id="kitNo"
                value={formData.kitNo}
                onChange={(e) => setFormData({ ...formData, kitNo: e.target.value })}
                placeholder="KIT-001"
                required
                className="w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor="name">Kit Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter kit name"
                required
                className="w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor="price">Selling Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
                className="w-full"
              />
            </div>

            <div className="min-w-0">
              <AnimatedSelect
                label="Status"
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as 'A' | 'I' })}
                options={[
                  { value: 'A', label: 'Active' },
                  { value: 'I', label: 'Inactive' },
                ]}
                placeholder="Select status"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Kit Items ({items.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </Button>
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">No items added yet</p>
                    <p className="text-xs text-gray-500">Click "Add Item" to start building your kit</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-visible pr-2">
              {items.map((item, index) => (
                <div
                  key={`item-${index}-${item.partId || 'new'}`}
                  className={`kit-item-card border rounded-lg bg-white shadow-sm overflow-visible ${
                    removingIndex === index ? 'kit-item-exit' : 'kit-item-enter'
                  }`}
                  style={{ 
                    animationDelay: removingIndex === index ? '0s' : `${Math.min(index * 0.03, 0.3)}s` 
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Item {index + 1}</h4>
                          <p className="text-xs text-gray-500">Select part and quantity</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-2">
                    <div>
                      <AnimatedSelect
                        label="Part *"
                        value={item.partId}
                        onChange={(value) => updateItem(index, 'partId', value)}
                        options={[
                          { value: '', label: 'Select part' },
                          ...availableParts.map((part) => {
                            // Get stock quantity - handle null/undefined stock records
                            const stockQty = part.stock?.quantity ?? 0;
                            const hasStock = stockQty > 0;
                            const cost = part.cost || 0;
                            const priceA = part.priceA || 0;
                            const priceB = part.priceB || 0;
                            const priceM = part.priceM || 0;
                            
                            // Build label with stock and price information
                            const stockInfo = hasStock 
                              ? `Stock: ${stockQty}` 
                              : `Stock: ${stockQty} (Out of Stock)`;
                            
                            // Build price information
                            const priceParts: string[] = [];
                            if (cost > 0) priceParts.push(`Cost: Rs ${cost.toFixed(2)}`);
                            if (priceA > 0) priceParts.push(`Price A: Rs ${priceA.toFixed(2)}`);
                            if (priceB > 0) priceParts.push(`Price B: Rs ${priceB.toFixed(2)}`);
                            if (priceM > 0) priceParts.push(`Price M: Rs ${priceM.toFixed(2)}`);
                            
                            const priceInfo = priceParts.length > 0 ? ` | ${priceParts.join(', ')}` : '';
                            
                            const label = `${part.partNo} - ${part.description || 'No description'} | ${stockInfo}${priceInfo}`;
                            
                            return {
                              value: part.id || '',
                              label,
                            };
                          }),
                        ]}
                        placeholder="Select part"
                        className="text-sm"
                      />
                    </div>

                    {stockError[index] && (
                      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-md mb-3 animate-fadeIn">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">{stockError[index]}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className={`text-sm ${stockError[index] ? 'border-red-500' : ''}`}
                        required
                      />
                      {item.partId && (() => {
                        const selectedPart = availableParts.find(p => p.id === item.partId);
                        if (selectedPart) {
                          const availableStock = selectedPart.stock?.quantity || 0;
                          const usedInOtherItems = items
                            .filter((it, idx) => idx !== index && it.partId === item.partId)
                            .reduce((sum, it) => sum + it.quantity, 0);
                          const remainingStock = availableStock - usedInOtherItems;
                          return (
                            <p className={`text-xs mt-1 ${remainingStock < item.quantity ? 'text-red-600' : 'text-gray-500'}`}>
                              Available: {remainingStock} | Total needed: {usedInOtherItems + item.quantity}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {item.partId && (() => {
                      const selectedPart = availableParts.find(p => p.id === item.partId);
                      return selectedPart && (
                        <div className="mt-3 bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Part Details</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 ${
                              (selectedPart.stock?.quantity || 0) > 0 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Stock: {selectedPart.stock?.quantity || 0}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <p className="text-xs text-gray-500 mb-1">Unit Cost</p>
                              <p className="text-sm font-semibold text-gray-900">Rs {(selectedPart.cost || 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-primary-50 p-2 rounded border border-primary-200">
                              <p className="text-xs text-primary-600 mb-1">Total Cost</p>
                              <p className="text-sm font-bold text-primary-700">Rs {((selectedPart.cost || 0) * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : kit ? 'Update Kit' : 'Create Kit'}
            </Button>
            {kit && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
            {kit && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

