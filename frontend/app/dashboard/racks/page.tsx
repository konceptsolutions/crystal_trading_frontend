'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface Store {
  id: string;
  name: string;
  storeType?: {
    id: string;
    name: string;
  };
}

interface Rack {
  id: string;
  rackNumber: string;
  storeId: string;
  store?: Store;
  description?: string;
  status: 'A' | 'I';
  createdAt: string;
  updatedAt: string;
  _count?: {
    shelves: number;
  };
}

interface Shelf {
  id: string;
  shelfNumber: string;
  rackId: string;
  rack?: Rack;
  description?: string | null;
  status: 'A' | 'I';
  createdAt: string;
  updatedAt: string;
}

export default function RacksPage() {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showShelfForm, setShowShelfForm] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [shelfSearchTerm, setShelfSearchTerm] = useState('');
  const [shelfFormData, setShelfFormData] = useState({
    shelfNumber: '',
    rackId: '',
    description: '',
    status: 'A' as 'A' | 'I',
  });

  const [formData, setFormData] = useState({
    rackNumber: '',
    storeId: '',
    description: '',
    status: 'A' as 'A' | 'I',
  });

  useEffect(() => {
    loadRacks();
    loadStores();
    loadShelves();
  }, []);

  const loadRacks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/racks');
      setRacks(response.data.racks || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load racks');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const response = await api.get('/stores?status=A');
      setAvailableStores(response.data.stores || []);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const loadShelves = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shelves');
      setShelves(response.data.shelves || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load shelves');
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
      if (editingRack) {
        await api.put(`/racks/${editingRack.id}`, formData);
        setSuccess('Rack updated successfully');
      } else {
        await api.post('/racks', formData);
        setSuccess('Rack created successfully');
      }
      resetForm();
      loadRacks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save rack');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rack: Rack) => {
    setEditingRack(rack);
    setFormData({
      rackNumber: rack.rackNumber,
      storeId: rack.storeId,
      description: rack.description || '',
      status: rack.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rack?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/racks/${id}`);
      setSuccess('Rack deleted successfully');
      loadRacks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete rack');
    } finally {
      setLoading(false);
    }
  };

  const handleShelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      if (editingShelf) {
        await api.put(`/shelves/${editingShelf.id}`, shelfFormData);
        setSuccess('Shelf updated successfully');
      } else {
        await api.post('/shelves', shelfFormData);
        setSuccess('Shelf created successfully');
      }
      resetShelfForm();
      loadShelves();
      loadRacks(); // refresh shelf counts
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save shelf');
    } finally {
      setLoading(false);
    }
  };

  const handleShelfEdit = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setShelfFormData({
      shelfNumber: shelf.shelfNumber,
      rackId: shelf.rackId,
      description: (shelf.description || '') as any,
      status: shelf.status,
    });
    setShowShelfForm(true);
  };

  const handleShelfDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shelf?')) return;
    try {
      setLoading(true);
      await api.delete(`/shelves/${id}`);
      setSuccess('Shelf deleted successfully');
      loadShelves();
      loadRacks(); // refresh shelf counts
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete shelf');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rackNumber: '',
      storeId: '',
      description: '',
      status: 'A',
    });
    setEditingRack(null);
    setShowForm(false);
  };

  const resetShelfForm = () => {
    setShelfFormData({
      shelfNumber: '',
      rackId: '',
      description: '',
      status: 'A',
    });
    setEditingShelf(null);
    setShowShelfForm(false);
  };

  const filteredRacks = racks.filter((rack) =>
    rack.rackNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rack.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rack.store?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShelves = shelves.filter((shelf) => {
    const q = shelfSearchTerm.toLowerCase();
    const rackNo = shelf.rack?.rackNumber || '';
    const storeName = shelf.rack?.store?.name || '';
    return (
      shelf.shelfNumber.toLowerCase().includes(q) ||
      String(shelf.description || '').toLowerCase().includes(q) ||
      rackNo.toLowerCase().includes(q) ||
      storeName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Racks & Shelves</h1>
        <p className="text-sm text-gray-500">Manage racks and shelves for inventory organization</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md">
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Racks */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Racks List</h2>
              <p className="text-sm text-gray-500">Manage storage racks for inventory organization</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-primary-500 hover:bg-primary-600"
            >
              + Add New Rack
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingRack ? 'Edit Rack' : 'Create New Rack'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rackNumber">Code No *</Label>
                      <Input
                        id="rackNumber"
                        value={formData.rackNumber}
                        onChange={(e) => setFormData({ ...formData, rackNumber: e.target.value })}
                        placeholder="Enter rack number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeId">Store *</Label>
                      <Select
                        id="storeId"
                        value={formData.storeId}
                        onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                        required
                      >
                        <option value="">Select Store...</option>
                        {availableStores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter rack description..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'A' | 'I' })}
                      >
                        <option value="A">Active</option>
                        <option value="I">Inactive</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                      {loading ? 'Saving...' : editingRack ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>All Racks ({filteredRacks.length})</CardTitle>
                <Input
                  type="text"
                  placeholder="Search racks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading && !racks.length ? (
                <div className="text-center py-12">Loading racks...</div>
              ) : filteredRacks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm ? 'No racks found matching your search.' : 'No racks found. Create one to get started.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRacks.map((rack) => (
                    <div key={rack.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{rack.rackNumber}</h3>
                          <div className="mt-1 space-y-1">
                            {rack.description && <p className="text-sm text-gray-600">{rack.description}</p>}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">Store: {rack.store?.name || 'N/A'}</span>
                              {rack._count && rack._count.shelves > 0 && (
                                <span className="text-sm text-gray-500">
                                  {rack._count.shelves} shelf{rack._count.shelves !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                rack.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {rack.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(rack)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(rack.id)}
                            className="text-red-600 hover:text-red-700"
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

        {/* Right: Shelves */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Shelves List</h2>
              <p className="text-sm text-gray-500">Manage shelves inside racks</p>
            </div>
            <Button
              onClick={() => {
                resetShelfForm();
                setShowShelfForm(true);
              }}
              className="bg-primary-500 hover:bg-primary-600"
            >
              + Add New Shelf
            </Button>
          </div>

          {showShelfForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingShelf ? 'Edit Shelf' : 'Create New Shelf'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleShelfSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shelfNumber">Shelf No *</Label>
                      <Input
                        id="shelfNumber"
                        value={shelfFormData.shelfNumber}
                        onChange={(e) => setShelfFormData({ ...shelfFormData, shelfNumber: e.target.value })}
                        placeholder="Enter shelf number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="rackId">Rack *</Label>
                      <Select
                        id="rackId"
                        value={shelfFormData.rackId}
                        onChange={(e) => setShelfFormData({ ...shelfFormData, rackId: e.target.value })}
                        required
                      >
                        <option value="">Select Rack...</option>
                        {racks.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.rackNumber} ({r.store?.name || 'No Store'})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="shelfDesc">Description</Label>
                      <Textarea
                        id="shelfDesc"
                        value={shelfFormData.description}
                        onChange={(e) => setShelfFormData({ ...shelfFormData, description: e.target.value })}
                        placeholder="Enter shelf description..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shelfStatus">Status</Label>
                      <Select
                        id="shelfStatus"
                        value={shelfFormData.status}
                        onChange={(e) => setShelfFormData({ ...shelfFormData, status: e.target.value as 'A' | 'I' })}
                      >
                        <option value="A">Active</option>
                        <option value="I">Inactive</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                      {loading ? 'Saving...' : editingShelf ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetShelfForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>All Shelves ({filteredShelves.length})</CardTitle>
                <Input
                  type="text"
                  placeholder="Search shelves..."
                  value={shelfSearchTerm}
                  onChange={(e) => setShelfSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading && !shelves.length ? (
                <div className="text-center py-12">Loading shelves...</div>
              ) : filteredShelves.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {shelfSearchTerm ? 'No shelves found matching your search.' : 'No shelves found. Create one to get started.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredShelves.map((shelf) => (
                    <div key={shelf.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{shelf.shelfNumber}</h3>
                          <div className="mt-1 space-y-1">
                            {shelf.description && <p className="text-sm text-gray-600">{shelf.description}</p>}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">Rack: {shelf.rack?.rackNumber || 'N/A'}</span>
                              <span className="text-sm text-gray-500">Store: {shelf.rack?.store?.name || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                shelf.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {shelf.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleShelfEdit(shelf)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShelfDelete(shelf.id)}
                            className="text-red-600 hover:text-red-700"
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
      </div>
    </div>
  );
}
