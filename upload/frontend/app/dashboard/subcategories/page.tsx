'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  description?: string;
  status: string;
  parent?: Category;
}

export default function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    description: '',
    status: 'A',
  });

  useEffect(() => {
    loadMainCategories();
    loadSubCategories();
  }, []);

  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    } else {
      loadSubCategories();
    }
  }, [selectedMainCategory]);

  const loadMainCategories = async () => {
    try {
      const response = await api.get('/categories?type=main&status=A');
      setMainCategories(response.data.categories || []);
    } catch (err: any) {
      console.error('Failed to load main categories:', err);
    }
  };

  const loadSubCategories = async (parentId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'sub', status: 'A' });
      if (parentId) {
        params.append('parentId', parentId);
      }
      const response = await api.get(`/categories?${params.toString()}`);
      setSubCategories(response.data.categories || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.parentId) {
      setError('Please select a main category');
      return;
    }

    try {
      setLoading(true);
      const data = {
        name: formData.name,
        type: 'sub',
        parentId: formData.parentId,
        description: formData.description,
        status: formData.status,
      };

      if (editingSubCategory) {
        await api.put(`/categories/${editingSubCategory.id}`, data);
        setSuccess('Subcategory updated successfully');
      } else {
        await api.post('/categories', data);
        setSuccess('Subcategory created successfully');
      }
      resetForm();
      loadSubCategories(selectedMainCategory || undefined);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subCategory: Category) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      parentId: subCategory.parentId || '',
      description: subCategory.description || '',
      status: subCategory.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/categories/${id}`);
      setSuccess('Subcategory deleted successfully');
      loadSubCategories(selectedMainCategory || undefined);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete subcategory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      parentId: '',
      description: '',
      status: 'A',
    });
    setEditingSubCategory(null);
    setShowForm(false);
  };

  const filteredSubCategories = subCategories.filter((subCat) =>
    subCat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sub Categories</h1>
          <p className="text-sm text-gray-500">Manage subcategories under main categories</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 hover:bg-primary-600"
        >
          + New Subcategory
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
        <Card>
          <CardHeader>
            <CardTitle>{editingSubCategory ? 'Edit Subcategory' : 'Create New Subcategory'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="parentId">Main Category *</Label>
                <Select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  required
                >
                  <option value="">Select a main category</option>
                  {mainCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Subcategory Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                  {loading ? 'Saving...' : editingSubCategory ? 'Update' : 'Create'}
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>All Subcategories ({filteredSubCategories.length})</CardTitle>
            <div className="flex gap-2">
              <Select
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value)}
                className="min-w-[200px]"
              >
                <option value="">All Main Categories</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <Input
                type="text"
                placeholder="Search subcategories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !subCategories.length ? (
            <div className="text-center py-12">Loading subcategories...</div>
          ) : filteredSubCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || selectedMainCategory
                ? 'No subcategories found matching your filters.'
                : 'No subcategories found. Create one to get started.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubCategories.map((subCategory) => (
                <div
                  key={subCategory.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{subCategory.name}</h3>
                        {subCategory.parent && (
                          <span className="text-sm text-gray-500">
                            (under {subCategory.parent.name})
                          </span>
                        )}
                      </div>
                      {subCategory.description && (
                        <p className="text-sm text-gray-600 mt-1">{subCategory.description}</p>
                      )}
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          subCategory.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {subCategory.status === 'A' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(subCategory)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(subCategory.id)}
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
  );
}
