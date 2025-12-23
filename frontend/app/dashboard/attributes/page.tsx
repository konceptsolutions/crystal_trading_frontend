'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  subcategories?: Category[];
}

interface Brand {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AttributesPage() {
  const { showToast } = useToast();
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryStatus, setSelectedCategoryStatus] = useState('');
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'main',
    parentId: '',
    description: '',
    status: 'A',
  });

  // Subcategories state
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<Category | null>(null);
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [subCategoryFormData, setSubCategoryFormData] = useState({
    name: '',
    parentId: '',
    description: '',
    status: 'A',
  });

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [selectedBrandStatus, setSelectedBrandStatus] = useState('');
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    status: 'A',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'subcategory' | 'brand'; id: string; name: string } | null>(null);

  useEffect(() => {
    loadCategories();
    loadMainCategories();
    loadSubCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    } else {
      loadSubCategories();
    }
  }, [selectedMainCategory]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories?type=main');
      setCategories(response.data.categories || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadMainCategories = async () => {
    try {
      const response = await api.get('/categories?type=main');
      setMainCategories(response.data.categories || []);
    } catch (err: any) {
      console.error('Failed to load main categories:', err);
    }
  };

  const loadSubCategories = async (parentId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'sub' });
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

  const loadBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/brands');
      const brands = response.data.brands || [];
      setBrands(brands);
    } catch (err: any) {
      console.error('Failed to load brands:', err);
      setError(err.response?.data?.error || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, categoryFormData);
        setSuccess('Category updated successfully');
        showToast(`Category "${categoryFormData.name}" updated successfully`, 'success');
      } else {
        await api.post('/categories', categoryFormData);
        setSuccess('Category created successfully');
        showToast(`Category "${categoryFormData.name}" added successfully`, 'success');
      }
      resetCategoryForm();
      loadCategories();
      loadMainCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save category');
      showToast(err.response?.data?.error || 'Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      type: category.type,
      parentId: category.parentId || '',
      description: category.description || '',
      status: category.status,
    });
    setShowCategoryForm(true);
  };

  const handleCategoryDelete = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (category) {
      setItemToDelete({ type: 'category', id, name: category.name });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      setDeleteDialogOpen(false);
      
      if (itemToDelete.type === 'category') {
        await api.delete(`/categories/${itemToDelete.id}`);
        setSuccess('Category deleted successfully');
        showToast(`Category "${itemToDelete.name}" deleted successfully`, 'success');
        loadCategories();
        loadMainCategories();
      } else if (itemToDelete.type === 'subcategory') {
        await api.delete(`/categories/${itemToDelete.id}`);
        setSuccess('Subcategory deleted successfully');
        showToast(`Subcategory "${itemToDelete.name}" deleted successfully`, 'success');
        loadSubCategories(selectedMainCategory || undefined);
      } else if (itemToDelete.type === 'brand') {
        await api.delete(`/brands/${itemToDelete.id}`);
        setSuccess('Brand deleted successfully');
        showToast(`Brand "${itemToDelete.name}" deleted successfully`, 'success');
        loadBrands();
      }
      
      setItemToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || `Failed to delete ${itemToDelete.type}`;
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setItemToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      type: 'main',
      parentId: '',
      description: '',
      status: 'A',
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  // Subcategory handlers
  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subCategoryFormData.parentId) {
      setError('Please select a main category');
      showToast('Please select a main category', 'error');
      return;
    }

    try {
      setLoading(true);
      const data = {
        name: subCategoryFormData.name,
        type: 'sub',
        parentId: subCategoryFormData.parentId,
        description: subCategoryFormData.description,
        status: subCategoryFormData.status,
      };

      if (editingSubCategory) {
        await api.put(`/categories/${editingSubCategory.id}`, data);
        setSuccess('Subcategory updated successfully');
        showToast(`Subcategory "${subCategoryFormData.name}" updated successfully`, 'success');
      } else {
        await api.post('/categories', data);
        setSuccess('Subcategory created successfully');
        showToast(`Subcategory "${subCategoryFormData.name}" added successfully`, 'success');
      }
      resetSubCategoryForm();
      loadSubCategories(selectedMainCategory || undefined);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save subcategory');
      showToast(err.response?.data?.error || 'Failed to save subcategory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategoryEdit = (subCategory: Category) => {
    setEditingSubCategory(subCategory);
    setSubCategoryFormData({
      name: subCategory.name,
      parentId: subCategory.parentId || '',
      description: subCategory.description || '',
      status: subCategory.status,
    });
    setShowSubCategoryForm(true);
  };

  const handleSubCategoryDelete = (id: string) => {
    const subCategory = subCategories.find(subCat => subCat.id === id);
    if (subCategory) {
      setItemToDelete({ type: 'subcategory', id, name: subCategory.name });
      setDeleteDialogOpen(true);
    }
  };

  const resetSubCategoryForm = () => {
    setSubCategoryFormData({
      name: '',
      parentId: '',
      description: '',
      status: 'A',
    });
    setEditingSubCategory(null);
    setShowSubCategoryForm(false);
  };

  // Brand handlers
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!brandFormData.name.trim()) {
      setError('Brand name is required');
      showToast('Brand name is required', 'error');
      return;
    }

    try {
      setLoading(true);

      if (editingBrand) {
        await api.put(`/brands/${editingBrand.id}`, brandFormData);
        setSuccess('Brand updated successfully');
        showToast(`Brand "${brandFormData.name}" updated successfully`, 'success');
      } else {
        await api.post('/brands', brandFormData);
        setSuccess('Brand created successfully');
        showToast(`Brand "${brandFormData.name}" added successfully`, 'success');
      }
      resetBrandForm();
      loadBrands();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to save brand:', err);
      setError(err.response?.data?.error || 'Failed to save brand');
      showToast(err.response?.data?.error || 'Failed to save brand', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name,
      status: brand.status,
    });
    setShowBrandForm(true);
  };

  const handleBrandDelete = (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (brand) {
      setItemToDelete({ type: 'brand', id, name: brand.name });
      setDeleteDialogOpen(true);
    }
  };

  const resetBrandForm = () => {
    setBrandFormData({
      name: '',
      status: 'A',
    });
    setEditingBrand(null);
    setShowBrandForm(false);
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(categorySearchTerm.toLowerCase()));
    const matchesStatus = !selectedCategoryStatus || cat.status === selectedCategoryStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredSubCategories = subCategories.filter((subCat) => {
    const matchesSearch = subCat.name.toLowerCase().includes(subCategorySearchTerm.toLowerCase()) ||
      (subCat.description && subCat.description.toLowerCase().includes(subCategorySearchTerm.toLowerCase()));
    const matchesCategory = !selectedMainCategory || subCat.parentId === selectedMainCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase());
    const matchesStatus = !selectedBrandStatus || brand.status === selectedBrandStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attributes</h1>
        <p className="text-sm text-gray-500">Manage categories, subcategories, and brands for inventory organization</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: Categories */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Categories List</h2>
              <p className="text-sm text-gray-500">Manage main categories</p>
            </div>
            <Button
              onClick={() => {
                resetCategoryForm();
                setShowCategoryForm(true);
              }}
              className="bg-primary-500 hover:bg-primary-600"
            >
              + Add New Category
            </Button>
          </div>

          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name *</Label>
                    <Input
                      id="categoryName"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryStatus">Status</Label>
                    <Select
                      id="categoryStatus"
                      value={categoryFormData.status}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, status: e.target.value })}
                    >
                      <option value="A">Active</option>
                      <option value="I">Inactive</option>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                      {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetCategoryForm}>
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
                <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={selectedCategoryStatus}
                    onChange={(e) => setSelectedCategoryStatus(e.target.value)}
                    className="min-w-[150px]"
                  >
                    <option value="">All Status</option>
                    <option value="A">Active</option>
                    <option value="I">Inactive</option>
                  </Select>
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !categories.length ? (
                <div className="text-center py-12">Loading categories...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {categorySearchTerm ? 'No categories found matching your search.' : 'No categories found. Create one to get started.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              category.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {category.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                            {category.subcategories && category.subcategories.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {category.subcategories.length} subcategor{category.subcategories.length !== 1 ? 'ies' : 'y'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryEdit(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryDelete(category.id)}
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

        {/* Middle: Subcategories */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Subcategories List</h2>
              <p className="text-sm text-gray-500">Manage subcategories under main categories</p>
            </div>
            <Button
              onClick={() => {
                resetSubCategoryForm();
                setShowSubCategoryForm(true);
              }}
              className="bg-primary-500 hover:bg-primary-600"
            >
              + Add New Subcategory
            </Button>
          </div>

          {showSubCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingSubCategory ? 'Edit Subcategory' : 'Create New Subcategory'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subCategoryParentId">Main Category *</Label>
                    <Select
                      id="subCategoryParentId"
                      value={subCategoryFormData.parentId}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, parentId: e.target.value })}
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
                    <Label htmlFor="subCategoryName">Subcategory Name *</Label>
                    <Input
                      id="subCategoryName"
                      value={subCategoryFormData.name}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subCategoryDescription">Description</Label>
                    <Textarea
                      id="subCategoryDescription"
                      value={subCategoryFormData.description}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subCategoryStatus">Status</Label>
                    <Select
                      id="subCategoryStatus"
                      value={subCategoryFormData.status}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, status: e.target.value })}
                    >
                      <option value="A">Active</option>
                      <option value="I">Inactive</option>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                      {loading ? 'Saving...' : editingSubCategory ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetSubCategoryForm}>
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
                    className="min-w-[150px]"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="text"
                    placeholder="Search subcategories..."
                    value={subCategorySearchTerm}
                    onChange={(e) => setSubCategorySearchTerm(e.target.value)}
                    className="w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !subCategories.length ? (
                <div className="text-center py-12">Loading subcategories...</div>
              ) : filteredSubCategories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {subCategorySearchTerm || selectedMainCategory
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
                            onClick={() => handleSubCategoryEdit(subCategory)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubCategoryDelete(subCategory.id)}
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

        {/* Right: Brands */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Brands List</h2>
              <p className="text-sm text-gray-500">Manage product brands</p>
            </div>
            <Button
              onClick={() => {
                resetBrandForm();
                setShowBrandForm(true);
              }}
              className="bg-primary-500 hover:bg-primary-600"
            >
              + Add New Brand
            </Button>
          </div>

          {showBrandForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingBrand ? 'Edit Brand' : 'Create New Brand'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBrandSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="brandName">Brand Name *</Label>
                    <Input
                      id="brandName"
                      value={brandFormData.name}
                      onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                      required
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brandStatus">Status</Label>
                    <Select
                      id="brandStatus"
                      value={brandFormData.status}
                      onChange={(e) => setBrandFormData({ ...brandFormData, status: e.target.value })}
                    >
                      <option value="A">Active</option>
                      <option value="I">Inactive</option>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                      {loading ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetBrandForm}>
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
                <CardTitle>All Brands ({filteredBrands.length})</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={selectedBrandStatus}
                    onChange={(e) => setSelectedBrandStatus(e.target.value)}
                    className="min-w-[150px]"
                  >
                    <option value="">All Status</option>
                    <option value="A">Active</option>
                    <option value="I">Inactive</option>
                  </Select>
                  <Input
                    type="text"
                    placeholder="Search brands..."
                    value={brandSearchTerm}
                    onChange={(e) => setBrandSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !brands.length ? (
                <div className="text-center py-12">Loading brands...</div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {brandSearchTerm || selectedBrandStatus ? 'No brands found matching your filters.' : 'No brands found. Create one to get started.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{brand.name}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              brand.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {brand.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(brand.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBrandEdit(brand)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBrandDelete(brand.id)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                  Delete {itemToDelete?.type === 'category' ? 'Category' : itemToDelete?.type === 'subcategory' ? 'Subcategory' : 'Brand'}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1">
                  Are you sure you want to delete this {itemToDelete?.type === 'category' ? 'category' : itemToDelete?.type === 'subcategory' ? 'subcategory' : 'brand'}? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {itemToDelete && (
            <div className="my-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[80px]">Name:</span>
                  <span className="text-xs sm:text-sm text-gray-900 font-semibold break-words">{itemToDelete.name}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={loading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

