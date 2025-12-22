'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KitForm, { Kit } from '@/components/inventory/KitForm';
import api from '@/lib/api';

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kits');
      setKits(response.data.kits);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch kits');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (kit: Kit) => {
    setSelectedKit(kit);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBreakKit = async (kit: Kit) => {
    if (!kit.id) return;
    
    const itemCount = kit.items?.length || 0;
    const confirmMessage = `Are you sure you want to break this kit?\n\n` +
      `Kit: ${kit.name} (${kit.kitNo})\n` +
      `Items: ${itemCount}\n\n` +
      `All ${itemCount} item${itemCount !== 1 ? 's' : ''} will be returned to inventory and the kit will be deleted permanently.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.post(`/kits/${kit.id}/break`);
      
      // Show detailed success message
      let successMsg = response.data.message || 'Kit broken successfully. All items have been returned to inventory.';
      if (response.data.returnedItems && response.data.returnedItems.length > 0) {
        const itemsList = response.data.returnedItems
          .map((item: any) => `  • ${item.partNo}: ${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`)
          .join('\n');
        successMsg += `\n\nReturned items:\n${itemsList}`;
      }
      
      setSuccess(successMsg);
      if (selectedKit?.id === kit.id) {
        setSelectedKit(null);
        setShowForm(false);
      }
      fetchKits();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to break kit');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kit?\n\nNote: Items will NOT be returned to inventory. Use "Break Kit" to return items to inventory.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/kits/${id}`);
      setSuccess('Kit deleted successfully');
      if (selectedKit?.id === id) {
        setSelectedKit(null);
        setShowForm(false);
      }
      fetchKits();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete kit');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (kit: Kit) => {
    setSuccess('Kit saved successfully');
    setSelectedKit(kit);
    fetchKits();
  };

  const handleNewKit = () => {
    setSelectedKit(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredKits = kits.filter(kit =>
    kit.kitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kit.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kit Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage product kits and bundles</p>
          </div>
        </div>
        <Button 
          onClick={handleNewKit} 
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Kit
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md whitespace-pre-line">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Success!</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
            <button
              onClick={() => setSuccess('')}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {selectedKit ? 'Edit Kit' : 'Create New Kit'}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedKit ? 'Update kit information' : 'Add a new kit to your inventory'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selectedKit && (
                  <Button 
                    onClick={handleNewKit} 
                    variant="outline"
                    className="border-primary-300 text-primary-700 hover:bg-primary-50"
                  >
                    New
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => { setShowForm(false); setSelectedKit(null); }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <KitForm
              kit={selectedKit}
              onSave={(kit) => {
                handleSave(kit);
                setShowForm(false);
              }}
              onDelete={(id) => {
                handleDelete(id);
                setShowForm(false);
              }}
            />
          </CardContent>
        </Card>
      )}

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !kits.length ? (
            <div className="text-center py-8 text-gray-500">Loading kits...</div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No kits found matching your search.' : 'No kits found. Create one to get started.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKits.map((kit) => (
                <div
                  key={kit.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                            <strong>Total Cost:</strong> Rs {kit.totalCost.toFixed(2)}
                          </span>
                        )}
                        {kit.price && (
                          <span>
                            <strong>Price:</strong> Rs {kit.price.toFixed(2)}
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
                                  Qty: {item.quantity} × Rs {item.part?.cost || 0} = Rs {((item.part?.cost || 0) * item.quantity).toFixed(2)}
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
                        onClick={() => handleEdit(kit)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBreakKit(kit)}
                        className="text-primary-600 hover:text-primary-700 border-primary-300 hover:bg-primary-50"
                        title="Break kit and return items to inventory"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Break Kit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => kit.id && handleDelete(kit.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete kit without returning items to inventory"
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
    </div>
  );
}

