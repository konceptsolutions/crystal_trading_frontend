'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AutocompleteInput from '@/components/ui/autocomplete-input';
import api from '@/lib/api';

export interface PartModel {
  id?: string;
  modelNo: string;
  qtyUsed: number;
  tab?: string;
}

export interface Part {
  id?: string;
  partNo: string;
  masterPartNo?: string;
  brand?: string;
  description?: string;
  mainCategory?: string;
  subCategory?: string;
  application?: string;
  hsCode?: string;
  uom?: string;
  weight?: number;
  reOrderLevel?: number;
  cost?: number;
  priceA?: number;
  priceB?: number;
  priceM?: number;
  rackNo?: string;
  origin?: string;
  grade?: string;
  status?: string;
  smc?: string;
  size?: string;
  remarks?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  models?: PartModel[];
}

interface PartFormProps {
  part?: Part | null;
  onSave: (part: Part) => void;
  onDelete?: (id: string) => void;
  models?: PartModel[];
}

const UOM_OPTIONS = ['NOS', 'PCS', 'SET', 'KG', 'LTR', 'MTR', 'BOX', 'PKT'];
const GRADE_OPTIONS = ['A', 'B', 'C', 'D'];
const STATUS_OPTIONS = ['A', 'N'];
const ORIGIN_OPTIONS = ['USA', 'CHINA', 'JAPAN', 'GERMANY', 'INDIA', 'OTHER'];

const STORAGE_KEY = 'partFormDraft_v1';

export default function PartForm({ part, onSave, onDelete, models = [] }: PartFormProps) {
  const [formData, setFormData] = useState<Part>({
    partNo: '',
    masterPartNo: '',
    brand: '',
    description: '',
    mainCategory: '',
    subCategory: '',
    application: '',
    hsCode: '',
    uom: 'NOS',
    weight: undefined,
    reOrderLevel: 0,
    cost: undefined,
    priceA: undefined,
    priceB: undefined,
    priceM: undefined,
    rackNo: '',
    origin: '',
    grade: 'B',
    status: 'A',
    smc: '',
    size: '',
    remarks: '',
    imageUrl1: undefined,
    imageUrl2: undefined,
    models: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Options for autocomplete fields
  const [masterPartNoOptions, setMasterPartNoOptions] = useState<string[]>([]);
  const [masterPartNoLoading, setMasterPartNoLoading] = useState(false);
  const [partNoOptions, setPartNoOptions] = useState<string[]>([]);
  const [partNoLoading, setPartNoLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [applicationOptions, setApplicationOptions] = useState<string[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

  // Load draft from localStorage when creating a new part
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (part) {
      setFormData({
        ...part,
        models: part.models || []
      });
      setError(''); // Clear any previous errors when part changes
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Part;
        setFormData({
          partNo: parsed.partNo || '',
          masterPartNo: parsed.masterPartNo || '',
          brand: parsed.brand || '',
          description: parsed.description || '',
          mainCategory: parsed.mainCategory || '',
          subCategory: parsed.subCategory || '',
          application: parsed.application || '',
          hsCode: parsed.hsCode || '',
          uom: parsed.uom || 'NOS',
          weight: parsed.weight,
          reOrderLevel: parsed.reOrderLevel ?? 0,
          cost: parsed.cost,
          priceA: parsed.priceA,
          priceB: parsed.priceB,
          priceM: parsed.priceM,
          rackNo: parsed.rackNo || '',
          origin: parsed.origin || '',
          grade: parsed.grade || 'B',
          status: parsed.status || 'A',
          smc: parsed.smc || '',
          size: parsed.size || '',
          remarks: parsed.remarks || '',
          imageUrl1: parsed.imageUrl1,
          imageUrl2: parsed.imageUrl2,
          models: parsed.models || [],
        });
      } catch {
        // If parsing fails, fall back to default empty form
        setFormData({
          partNo: '',
          masterPartNo: '',
          brand: '',
          description: '',
          mainCategory: '',
          subCategory: '',
          application: '',
          hsCode: '',
          uom: 'NOS',
          weight: undefined,
          reOrderLevel: 0,
          cost: undefined,
          priceA: undefined,
          priceB: undefined,
          priceM: undefined,
          rackNo: '',
          origin: '',
          grade: 'B',
          status: 'A',
          smc: '',
          size: '',
          remarks: '',
          imageUrl1: undefined,
          imageUrl2: undefined,
          models: [],
        });
      }
    } else {
      setFormData({
        partNo: '',
        masterPartNo: '',
        brand: '',
        description: '',
        mainCategory: '',
        subCategory: '',
        application: '',
        hsCode: '',
        uom: 'NOS',
        weight: undefined,
        reOrderLevel: 0,
        cost: undefined,
        priceA: undefined,
        priceB: undefined,
        priceM: undefined,
        rackNo: '',
        origin: '',
        grade: 'B',
        status: 'A',
        smc: '',
        size: '',
        remarks: '',
        imageUrl1: undefined,
        imageUrl2: undefined,
        models: [],
      });
      setError(''); // Clear errors when part is cleared
    }
  }, [part]);

  // Persist draft to localStorage while creating a new part
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (part?.id) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, part]);

  // Load options for autocomplete fields
  useEffect(() => {
    loadOptions();
  }, []);

  // Load subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategoryId) {
      loadSubCategories(selectedMainCategoryId);
    } else {
      setSubCategoryOptions([]);
      setSelectedSubCategoryId(null);
      setApplicationOptions([]);
    }
  }, [selectedMainCategoryId]);

  // Load applications when sub-category changes
  useEffect(() => {
    if (selectedSubCategoryId) {
      loadApplications(selectedSubCategoryId);
    } else {
      setApplicationOptions([]);
    }
  }, [selectedSubCategoryId]);

  // Load part numbers when master part number changes
  useEffect(() => {
    // Clear options first
    setPartNoOptions([]);
    
    if (formData.masterPartNo && formData.masterPartNo.trim() !== '') {
      // Store the value to avoid undefined issues in setTimeout
      const masterPartNoValue = formData.masterPartNo.trim();
      // Small delay to ensure master part number is fully set
      const timer = setTimeout(() => {
        loadPartNumbersByMasterPartNo(masterPartNoValue);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [formData.masterPartNo]);


  const loadOptions = async () => {
    try {
      // Load all brands (similar to categories)
      const brandsRes = await api.get('/brands?status=A');
      const brands = brandsRes.data.brands || [];
      // Backward-compatible: support both old API (string[]) and new API (Brand[])
      const brandNames = Array.isArray(brands)
        ? brands
            .map((b: any) => (typeof b === 'string' ? b : b?.name))
            .filter(Boolean)
        : [];
      setBrandOptions(brandNames);

      // Load main categories
      const categoriesRes = await api.get('/categories?type=main&status=A');
      const mainCategories = (categoriesRes.data.categories || [])
        .map((cat: any) => cat.name)
        .filter((name: string) => name);
      setCategoryOptions(mainCategories);

      // Applications will be loaded when sub-category is selected

      // Load master part numbers from parts (same approach as parts-list page)
      setMasterPartNoLoading(true);
      try {
        console.log('🔄 Loading master part numbers...');
        const response = await api.get('/parts?limit=10000');
        console.log('📦 API Response:', response.data);
        const allParts = response.data.parts || [];
        console.log('📋 All parts count:', allParts.length);
        
        const masterPartNos = Array.from(
          new Set(allParts.map((p: Part) => p.masterPartNo).filter(Boolean))
        ).sort() as string[];
        
        console.log('✅ Master Part Nos loaded:', masterPartNos.length, 'unique values');
        if (masterPartNos.length > 0) {
          console.log('📝 Sample:', masterPartNos.slice(0, 5));
        }
        setMasterPartNoOptions(masterPartNos);
      } catch (error: any) {
        console.error('❌ Failed to load master part numbers:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setMasterPartNoOptions([]);
      } finally {
        setMasterPartNoLoading(false);
        console.log('🏁 Finished loading master part numbers');
      }
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadSubCategories = async (parentId: string) => {
    try {
      const response = await api.get(`/categories?type=sub&parentId=${parentId}&status=A`);
      const subCategories = (response.data.categories || [])
        .map((cat: any) => cat.name)
        .filter((name: string) => name);
      setSubCategoryOptions(subCategories);
      // Reset sub-category ID when categories change
      setSelectedSubCategoryId(null);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setSubCategoryOptions([]);
      setSelectedSubCategoryId(null);
    }
  };

  const loadApplications = async (subCategoryId: string) => {
    try {
      const response = await api.get(`/applications?subCategoryId=${subCategoryId}&status=A`);
      const applications = response.data.applications || [];
      setApplicationOptions(applications);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setApplicationOptions([]);
    }
  };

  const loadPartNumbersByMasterPartNo = async (masterPartNo: string) => {
    if (!masterPartNo || masterPartNo.trim() === '') {
      setPartNoOptions([]);
      return;
    }
    
    setPartNoLoading(true);
    try {
      // Fetch all parts
      const response = await api.get(`/parts?limit=10000`);
      const allParts = response.data.parts || [];
      
      // Normalize the master part number for comparison
      const masterPartNoNormalized = masterPartNo.trim().toLowerCase();
      
      // Filter parts that have EXACT match with the selected master part number (case-insensitive)
      const filteredParts = allParts.filter((p: Part) => {
        if (!p.masterPartNo) return false;
        const partMasterPartNo = String(p.masterPartNo).trim().toLowerCase();
        return partMasterPartNo === masterPartNoNormalized;
      });
      
      // Extract unique part numbers ONLY from filtered parts
      const partNos = Array.from(
        new Set(filteredParts.map((p: Part) => p.partNo).filter(Boolean))
      ).sort() as string[];
      
      console.log('🔍 Filtering Part Numbers:');
      console.log('  Master Part No:', masterPartNo);
      console.log('  Normalized:', masterPartNoNormalized);
      console.log('  Total parts in DB:', allParts.length);
      console.log('  Parts with exact match:', filteredParts.length);
      console.log('  Matching part numbers:', partNos);
      
      // Verify each part number belongs to the correct master part
      filteredParts.forEach((p: Part) => {
        if (p.masterPartNo && p.partNo) {
          console.log(`  ✓ ${p.partNo} -> ${p.masterPartNo}`);
        }
      });
      
      setPartNoOptions(partNos);
    } catch (error: any) {
      console.error('❌ Failed to load part numbers:', error);
      setPartNoOptions([]);
    } finally {
      setPartNoLoading(false);
    }
  };


  // Find main category ID when main category name changes
  useEffect(() => {
    if (formData.mainCategory) {
      findMainCategoryId(formData.mainCategory);
    } else {
      setSelectedMainCategoryId(null);
      setSelectedSubCategoryId(null);
    }
  }, [formData.mainCategory]);

  // Find sub-category ID when sub-category name changes
  useEffect(() => {
    if (formData.subCategory && selectedMainCategoryId) {
      findSubCategoryId(formData.subCategory, selectedMainCategoryId);
    } else {
      setSelectedSubCategoryId(null);
    }
  }, [formData.subCategory, selectedMainCategoryId]);

  const findMainCategoryId = async (categoryName: string) => {
    try {
      const response = await api.get(`/categories?type=main&status=A`);
      const category = (response.data.categories || []).find(
        (cat: any) => cat.name === categoryName
      );
      if (category) {
        setSelectedMainCategoryId(category.id);
      } else {
        setSelectedMainCategoryId(null);
      }
    } catch (error) {
      console.error('Failed to find category ID:', error);
    }
  };

  const findSubCategoryId = async (subCategoryName: string, parentId: string) => {
    try {
      const response = await api.get(`/categories?type=sub&parentId=${parentId}&status=A`);
      const subCategory = (response.data.categories || []).find(
        (cat: any) => cat.name === subCategoryName
      );
      if (subCategory) {
        setSelectedSubCategoryId(subCategory.id);
      } else {
        setSelectedSubCategoryId(null);
      }
    } catch (error) {
      console.error('Failed to find sub-category ID:', error);
    }
  };

  const handleAddBrand = async (brandName: string) => {
    // Require Part No before allowing brand creation from Part Entry
    // (same idea as Part No requiring Master Part #)
    if (!formData.partNo || formData.partNo.trim() === '') {
      throw new Error('Please enter Part No/SSP# first');
    }
    try {
      const response = await api.post('/brands', {
        name: brandName,
        status: 'A',
      });
      setBrandOptions((prev) => [...prev.filter((b) => b !== brandName), brandName].sort());
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add brand');
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    try {
      const response = await api.post('/categories', {
        name: categoryName,
        type: 'main',
        status: 'A',
      });
      setCategoryOptions((prev) => [...prev.filter((c) => c !== categoryName), categoryName].sort());
      // Set the new category ID
      setSelectedMainCategoryId(response.data.category.id);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add category');
    }
  };

  const handleAddSubCategory = async (subCategoryName: string) => {
    if (!selectedMainCategoryId) {
      throw new Error('Please select a category first');
    }
    try {
      await api.post('/categories', {
        name: subCategoryName,
        type: 'sub',
        parentId: selectedMainCategoryId,
        status: 'A',
      });
      setSubCategoryOptions((prev) => [...prev.filter((sc) => sc !== subCategoryName), subCategoryName].sort());
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add subcategory');
    }
  };

  const handleAddApplication = async (applicationName: string) => {
    if (!selectedSubCategoryId) {
      throw new Error('Please select a sub-category first before adding an application');
    }
    try {
      await api.post('/applications', { 
        name: applicationName,
        subCategoryId: selectedSubCategoryId,
      });
      setApplicationOptions((prev) => [...prev.filter((a) => a !== applicationName), applicationName].sort());
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add application');
    }
  };

  const handleChange = (field: keyof Part, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl1' | 'imageUrl2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    try {
      // Compress and convert to base64
      const compressedBase64 = await compressImage(file, 800, 0.7);
      handleChange(field, compressedBase64);
      setError(''); // Clear any previous errors
    } catch (error) {
      setError('Failed to process image. Please try another image.');
      console.error('Image compression error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.partNo || !formData.partNo.trim()) {
      setError('Part No/SSP# is required');
      return;
    }
    
    setLoading(true);

    try {
      // Clean up form data - convert empty strings to undefined for optional fields
      const cleanedData: any = {
        partNo: formData.partNo.trim(),
        masterPartNo: formData.masterPartNo?.trim() || undefined,
        brand: formData.brand?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        mainCategory: formData.mainCategory?.trim() || undefined,
        subCategory: formData.subCategory?.trim() || undefined,
        application: formData.application?.trim() || undefined,
        hsCode: formData.hsCode?.trim() || undefined,
        uom: formData.uom || undefined,
        weight: formData.weight || undefined,
        reOrderLevel: formData.reOrderLevel || 0,
        cost: formData.cost || undefined,
        priceA: formData.priceA || undefined,
        priceB: formData.priceB || undefined,
        priceM: formData.priceM || undefined,
        rackNo: formData.rackNo?.trim() || undefined,
        origin: formData.origin || undefined,
        grade: formData.grade || undefined,
        status: formData.status || 'A',
        smc: formData.smc?.trim() || undefined,
        size: formData.size?.trim() || undefined,
        remarks: formData.remarks?.trim() || undefined,
        imageUrl1: formData.imageUrl1 || undefined,
        imageUrl2: formData.imageUrl2 || undefined,
        models: (models || [])
          .filter(model => model.modelNo && model.modelNo.trim()) // Only include models with valid model numbers
          .map(model => ({
            modelNo: model.modelNo.trim(),
            qtyUsed: model.qtyUsed || 1,
            tab: model.tab || 'P1'
          })),
      };

      if (part?.id) {
        // Update
        const response = await api.put(`/parts/${part.id}`, cleanedData);
        onSave(response.data.part);
      } else {
        // Create
        const response = await api.post('/parts', cleanedData);
        onSave(response.data.part);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      let errorMessage = 'Failed to save part';
      
      // Handle 413 Payload Too Large error
      if (err.response?.status === 413) {
        errorMessage = 'Image file is too large. Please use smaller images or compress them.';
      } else if (err.response?.data?.error) {
        if (Array.isArray(err.response.data.error)) {
          // Zod validation errors
          errorMessage = err.response.data.error.map((e: any) => 
            `${e.path?.join('.')}: ${e.message}`
          ).join(', ');
        } else {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!part?.id || !onDelete) return;
    
    if (confirm('Are you sure you want to delete this part?')) {
      setLoading(true);
      setError('');
      try {
        await api.delete(`/parts/${part.id}`);
        // Clear form and call onDelete callback
        setFormData({
          partNo: '',
          masterPartNo: '',
          brand: '',
          description: '',
          mainCategory: '',
          subCategory: '',
          application: '',
          hsCode: '',
          uom: 'NOS',
          weight: undefined,
          reOrderLevel: 0,
          cost: undefined,
          priceA: undefined,
          priceB: undefined,
          priceM: undefined,
          rackNo: '',
          origin: '',
          grade: 'B',
          status: 'A',
          smc: '',
          size: '',
          remarks: '',
          imageUrl1: undefined,
          imageUrl2: undefined,
          models: [],
        });
        onDelete(part.id);
      } catch (err: any) {
        console.error('Delete error:', err);
        setError(err.response?.data?.error || 'Failed to delete part');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNew = () => {
    const emptyState: Part = {
      partNo: '',
      masterPartNo: '',
      brand: '',
      description: '',
      mainCategory: '',
      subCategory: '',
      application: '',
      hsCode: '',
      uom: 'NOS',
      weight: undefined,
      reOrderLevel: 0,
      cost: undefined,
      priceA: undefined,
      priceB: undefined,
      priceM: undefined,
      rackNo: '',
      origin: '',
      grade: 'B',
      status: 'A',
      smc: '',
      size: '',
      remarks: '',
      models: [],
    };

    setFormData(emptyState);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
    }
    setError('');
  };

  return (
    <Card className="h-full bg-white border border-gray-200 shadow-medium rounded-lg overflow-hidden flex flex-col">
      <CardHeader className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {part?.id ? 'Edit Part' : 'Create New Part'}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                {part?.id ? `Editing: ${part.partNo}` : 'Add a new inventory part'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNew}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            >
              New
            </Button>
            {part?.id && onDelete && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-white flex-1 overflow-y-auto scroll-smooth scrollbar-visible" style={{ scrollBehavior: 'smooth' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r-md shadow-soft flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {typeof error === 'object' ? JSON.stringify(error) : error}
              </div>
            </div>
          )}

          {/* Part Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="h-1 w-1 rounded-full bg-primary-500"></div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Part Information
              </h3>
            </div>
            {/* First Line: Master Part No, Part No/SSP#, Brand */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <AutocompleteInput
                  id="masterPartNo"
                  label="Master Part #"
                  value={formData.masterPartNo || ''}
                  onChange={(value) => handleChange('masterPartNo', value)}
                  options={masterPartNoOptions}
                  placeholder={masterPartNoLoading ? "Loading options..." : "Type to search or enter new"}
                />
              </div>
              <div>
                <AutocompleteInput
                  id="partNo"
                  label="Part No/SSP#"
                  value={formData.partNo}
                  onChange={(value) => handleChange('partNo', value)}
                  options={partNoOptions}
                  placeholder={partNoLoading ? "Loading options..." : formData.masterPartNo ? "Type to search or enter new" : "Select master part number first"}
                  required={true}
                  disabled={!formData.masterPartNo || formData.masterPartNo.trim() === ''}
                />
              </div>
              <div className="space-y-2">
                <AutocompleteInput
                  id="brand"
                  label="Brand"
                  value={formData.brand || ''}
                  onChange={(value) => handleChange('brand', value)}
                  onAddNew={handleAddBrand}
                  options={brandOptions}
                  placeholder={
                    !formData.partNo || formData.partNo.trim() === ''
                      ? 'Enter Part No/SSP# first'
                      : 'Type to search or press Enter to add new'
                  }
                  disabled={!formData.partNo || formData.partNo.trim() === ''}
                />
              </div>
            </div>
            {/* Second Line: Description (full width, expandable) */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 min-h-[60px] resize-y"
                placeholder="Enter part description"
                rows={2}
              />
            </div>
          </div>

          {/* Classification Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AutocompleteInput
                id="mainCategory"
                label="Category"
                value={formData.mainCategory || ''}
                onChange={(value) => handleChange('mainCategory', value)}
                onAddNew={handleAddCategory}
                options={categoryOptions}
                placeholder="Type to search or press Enter to add new"
              />
              <AutocompleteInput
                id="subCategory"
                label="Sub Category"
                value={formData.subCategory || ''}
                onChange={(value) => handleChange('subCategory', value)}
                onAddNew={handleAddSubCategory}
                options={subCategoryOptions}
                placeholder={selectedMainCategoryId ? "Type to search or press Enter to add new" : "Select category first"}
                disabled={!selectedMainCategoryId}
              />
              <AutocompleteInput
                id="application"
                label="Application"
                value={formData.application || ''}
                onChange={(value) => handleChange('application', value)}
                onAddNew={handleAddApplication}
                options={applicationOptions}
                placeholder={selectedSubCategoryId ? "Type to search or press Enter to add new" : "Please select a sub-category first"}
                disabled={!selectedSubCategoryId || !formData.subCategory || formData.subCategory.trim() === ''}
              />
            </div>
          </div>

          {/* Specifications Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="hsCode" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">HS Code</Label>
                <Input
                  id="hsCode"
                  value={formData.hsCode || ''}
                  onChange={(e) => handleChange('hsCode', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="Enter HS code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uom" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">UOM (A-Z)</Label>
                <Select
                  id="uom"
                  value={formData.uom || 'NOS'}
                  onChange={(e) => handleChange('uom', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                >
                  {UOM_OPTIONS.map((uom) => (
                    <option key={uom} value={uom}>
                      {uom}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Weight (Kg)</Label>
                <Input
                  id="weight"
                  type="text"
                  value={formData.weight || ''}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="LxHxW"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="reOrderLevel" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Re-Order Level</Label>
                <Input
                  id="reOrderLevel"
                  type="number"
                  value={formData.reOrderLevel || 0}
                  onChange={(e) => handleChange('reOrderLevel', parseInt(e.target.value) || 0)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => handleChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="priceA" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Price-A</Label>
                <Input
                  id="priceA"
                  type="number"
                  step="0.01"
                  value={formData.priceA || ''}
                  onChange={(e) => handleChange('priceA', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceB" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Price-B</Label>
                <Input
                  id="priceB"
                  type="number"
                  step="0.01"
                  value={formData.priceB || ''}
                  onChange={(e) => handleChange('priceB', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceM" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Price-M</Label>
                <Input
                  id="priceM"
                  type="number"
                  step="0.01"
                  value={formData.priceM || ''}
                  onChange={(e) => handleChange('priceM', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Location & Status Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="rackNo" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Rack No</Label>
                <Input
                  id="rackNo"
                  value={formData.rackNo || ''}
                  onChange={(e) => handleChange('rackNo', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="Enter rack number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Origin</Label>
                <Select
                  id="origin"
                  value={formData.origin || ''}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                >
                  <option value="">Select Origin</option>
                  {ORIGIN_OPTIONS.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Grade (A/B/C/D)</Label>
                <Select
                  id="grade"
                  value={formData.grade || 'B'}
                  onChange={(e) => handleChange('grade', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                >
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Status (A/N)</Label>
                <Select
                  id="status"
                  value={formData.status || 'A'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smc" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">SMC</Label>
                <Input
                  id="smc"
                  value={formData.smc || ''}
                  onChange={(e) => handleChange('smc', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="Enter SMC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Size</Label>
                <Input
                  id="size"
                  value={formData.size || ''}
                  onChange={(e) => handleChange('size', e.target.value)}
                  className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
                  placeholder="Enter size"
                />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="imageUrl1" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">
                  Image P1
                </Label>
                <div className="space-y-2">
                  {formData.imageUrl1 ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={formData.imageUrl1} 
                          alt="Product P1" 
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('image-upload-p1') as HTMLInputElement;
                            input?.click();
                          }}
                          className="flex-1 border-gray-300 text-xs"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange('imageUrl1', undefined)}
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        id="image-upload-p1"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'imageUrl1')}
                      />
                      <div className="space-y-2">
                        <div className="mx-auto w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('image-upload-p1') as HTMLInputElement;
                            input?.click();
                          }}
                          className="border-gray-300 text-xs"
                        >
                          Upload Image P1
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl2" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">
                  Image P2
                </Label>
                <div className="space-y-2">
                  {formData.imageUrl2 ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={formData.imageUrl2} 
                          alt="Product P2" 
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('image-upload-p2') as HTMLInputElement;
                            input?.click();
                          }}
                          className="flex-1 border-gray-300 text-xs"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange('imageUrl2', undefined)}
                          className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        id="image-upload-p2"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'imageUrl2')}
                      />
                      <div className="space-y-2">
                        <div className="mx-auto w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('image-upload-p2') as HTMLInputElement;
                            input?.click();
                          }}
                          className="border-gray-300 text-xs"
                        >
                          Upload Image P2
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-semibold text-gray-700 block h-5 flex items-center">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                rows={4}
                className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                placeholder="Enter any additional remarks or notes..."
              />
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 shadow-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {part?.id ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Update Part
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Save Part
                    </>
                  )}
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

