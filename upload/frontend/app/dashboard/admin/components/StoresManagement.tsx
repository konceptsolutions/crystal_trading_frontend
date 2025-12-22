'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

type StoreType = { id: string; name: string };
type Store = {
  id: string;
  name: string;
  storeTypeId: string;
  storeType?: StoreType;
  description?: string | null;
  status: 'A' | 'I';
  _count?: { racks: number };
};

export default function StoresManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'A' | 'I'>('all');

  const [form, setForm] = useState({
    name: '',
    storeTypeId: '',
    description: '',
    status: 'A' as 'A' | 'I',
  });

  const loadStoreTypes = async () => {
    const res = await api.get('/store-types');
    setStoreTypes(res.data.storeTypes || []);
  };

  const loadStores = async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (search.trim()) params.append('search', search.trim());
    const res = await api.get(`/stores?${params.toString()}`);
    setStores(res.data.stores || []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadStoreTypes(), loadStores()]);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load stores');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadStores().catch(() => {});
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', storeTypeId: '', description: '', status: 'A' });
    setShowForm(false);
  };

  const canDelete = useMemo(() => (st: Store) => Number(st?._count?.racks || 0) === 0, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Store Management</h2>
          <p className="text-sm text-gray-500">Create stores and link them with racks and shelves</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 hover:bg-primary-600"
        >
          + Add New Store
        </Button>
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

      {showForm && (
        <Card className="shadow-lg border">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{editing ? 'Edit Store' : 'Create New Store'}</CardTitle>
              <Button variant="ghost" onClick={resetForm}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setSuccess('');
                if (!form.name.trim()) {
                  setError('Store name is required');
                  return;
                }
                if (!form.storeTypeId) {
                  setError('Store type is required');
                  return;
                }
                try {
                  setLoading(true);
                  if (editing) {
                    await api.put(`/stores/${editing.id}`, {
                      ...form,
                      name: form.name.trim(),
                      description: form.description.trim() || undefined,
                    });
                    setSuccess('Store updated successfully');
                  } else {
                    await api.post('/stores', {
                      ...form,
                      name: form.name.trim(),
                      description: form.description.trim() || undefined,
                    });
                    setSuccess('Store created successfully');
                  }
                  await loadStores();
                  setTimeout(() => setSuccess(''), 2500);
                  resetForm();
                } catch (err: any) {
                  setError(err?.response?.data?.error || 'Failed to save store');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-medium text-gray-700">Store Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Store" />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-medium text-gray-700">Store Type *</Label>
                  <Select value={form.storeTypeId} onChange={(e) => setForm({ ...form, storeTypeId: e.target.value })} className="w-full">
                    <option value="">Select type...</option>
                    {storeTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                  <div className="text-xs text-gray-500">Store types are auto-created the first time.</div>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full">
                    <option value="A">Active</option>
                    <option value="I">Inactive</option>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-y" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Stores List ({stores.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full sm:w-40">
                <option value="all">All</option>
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b">
                <tr className="text-gray-700">
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Racks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4">{s.storeType?.name || '-'}</td>
                    <td className="py-3 px-4">{s.status === 'A' ? 'Active' : 'Inactive'}</td>
                    <td className="py-3 px-4 text-right">{Number(s._count?.racks || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(s);
                            setForm({
                              name: s.name || '',
                              storeTypeId: s.storeTypeId || '',
                              description: (s.description || '') as any,
                              status: s.status || 'A',
                            });
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${canDelete(s) ? '' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={async () => {
                            if (!canDelete(s)) {
                              setError('Cannot delete store with racks. Delete racks first.');
                              return;
                            }
                            if (!confirm(`Delete store "${s.name}"?`)) return;
                            try {
                              setLoading(true);
                              await api.delete(`/stores/${s.id}`);
                              await loadStores();
                              setSuccess('Store deleted successfully');
                              setTimeout(() => setSuccess(''), 2000);
                            } catch (err: any) {
                              setError(err?.response?.data?.error || 'Failed to delete store');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={!canDelete(s) || loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!stores.length && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      No stores found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


