'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';

interface InventoryItem {
  id: string;
  quantity: number;
  item: {
    id: string;
    machine_part_oem_part: {
      oem_part_number: {
        number1: string;
        number2: string | null;
      };
      machine_part: {
        name: string;
        unit: {
          name: string;
        };
      };
    };
    brand: {
      name: string;
    };
    machine_model: {
      name: string;
    };
  };
  store: {
    name: string;
    store_type: {
      name: string;
    };
  };
  racks: {
    rack_number: string;
  };
  shelves: {
    shelf_number: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

export default function InventoryStockPage() {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchInventoryData();
  }, [page, limit]);

  // Fetch sub-categories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
      setSelectedSubCategory('');
      setSelectedItem('');
      setItems([]);
    } else {
      setSubCategories([]);
      setItems([]);
      setSelectedSubCategory('');
      setSelectedItem('');
    }
  }, [selectedCategory]);

  // Fetch items when sub-category changes
  useEffect(() => {
    if (selectedSubCategory) {
      fetchItems(selectedCategory, selectedSubCategory);
      setSelectedItem('');
    } else {
      setItems([]);
      setSelectedItem('');
    }
  }, [selectedSubCategory]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/parts-management/getCategoriesDropDown');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSubCategories = async (categoryId: string) => {
    try {
      const response = await api.get(`/parts-management/getSubCategoriesByCategory?category_id=${categoryId}`);
      setSubCategories(response.data.subcategories || []);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
      setSubCategories([]);
    }
  };

  const fetchItems = async (categoryId: string, subCategoryId: string) => {
    try {
      const response = await api.get(`/parts-management/getItemOemDropDown?category_id=${categoryId}&sub_category_id=${subCategoryId}`);
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setItems([]);
    }
  };

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        records: limit.toString(),
        pageNo: page.toString(),
        colName: 'id',
        sort: 'desc',
      });

      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedSubCategory) params.append('sub_category_id', selectedSubCategory);
      if (selectedItem) params.append('item_id', selectedItem);

      const response = await api.get(`/parts-management/getItemsInventory?${params.toString()}`);
      
      if (response.data.itemsInventory) {
        setInventoryData(response.data.itemsInventory.data || []);
        setTotal(response.data.itemsInventory.total || 0);
        setTotalPages(Math.ceil((response.data.itemsInventory.total || 0) / limit));
      }
    } catch (error: any) {
      console.error('Failed to fetch inventory data:', error);
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchInventoryData();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(inventoryData.map((item) => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handlePrintReport = () => {
    // Generate PDF report
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Stock Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Inventory Stock Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>OEM/ Part No</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Uom</th>
                <th>Qty</th>
                <th>Store</th>
                <th>Racks</th>
                <th>Shelf</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryData.map((item, index) => `
                <tr>
                  <td>${(page - 1) * limit + index + 1}</td>
                  <td>${item.item.machine_part_oem_part.oem_part_number.number1}${item.item.machine_part_oem_part.oem_part_number.number2 ? '/' + item.item.machine_part_oem_part.oem_part_number.number2 : ''}</td>
                  <td>${item.item.machine_part_oem_part.machine_part.name}</td>
                  <td>${item.item.brand.name}</td>
                  <td>${item.item.machine_model.name}</td>
                  <td>${item.item.machine_part_oem_part.machine_part.unit.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.store.name}</td>
                  <td>${item.racks.rack_number}</td>
                  <td>${item.shelves.shelf_number}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintExcel = () => {
    // Create CSV content
    const headers = ['Sr. No', 'OEM/ Part No', 'Name', 'Brand', 'Model', 'Uom', 'Qty', 'Store', 'Racks', 'Shelf'];
    const rows = inventoryData.map((item, index) => [
      (page - 1) * limit + index + 1,
      `${item.item.machine_part_oem_part.oem_part_number.number1}${item.item.machine_part_oem_part.oem_part_number.number2 ? '/' + item.item.machine_part_oem_part.oem_part_number.number2 : ''}`,
      item.item.machine_part_oem_part.machine_part.name,
      item.item.brand.name,
      item.item.machine_model.name,
      item.item.machine_part_oem_part.machine_part.unit.name,
      item.quantity,
      item.store.name,
      item.racks.rack_number,
      item.shelves.shelf_number,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-stock-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Stock</h1>
        </div>

        {/* Filters */}
        <Card className="mb-4 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full"
                >
                  <option value="">Select...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                <Select
                  value={selectedSubCategory}
                  onChange={(e) => {
                    setSelectedSubCategory(e.target.value);
                    setPage(1);
                  }}
                  disabled={!selectedCategory}
                  className="w-full"
                >
                  <option value="">Select...</option>
                  {subCategories.map((subCat) => (
                    <option key={subCat.id} value={subCat.id.toString()}>
                      {subCat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                <Select
                  value={selectedItem}
                  onChange={(e) => {
                    setSelectedItem(e.target.value);
                    setPage(1);
                  }}
                  disabled={!selectedCategory}
                  className="w-full"
                >
                  <option value="">Select...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 h-10"
                >
                  Search
                </Button>
                <Button
                  onClick={handlePrintReport}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 h-10"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Report
                </Button>
                <Button
                  onClick={handlePrintExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-10"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Print Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={inventoryData.length > 0 && selectedRows.size === inventoryData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </TableHead>
                  <TableHead className="w-20">Sr. No</TableHead>
                  <TableHead>OEM/ Part No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Uom</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Racks</TableHead>
                  <TableHead>Shelf</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading inventory data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No inventory stock found.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryData.map((item, index) => (
                    <TableRow 
                      key={item.id} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.id)}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{startIndex + index}</TableCell>
                      <TableCell>
                        {item.item.machine_part_oem_part.oem_part_number.number1}
                        {item.item.machine_part_oem_part.oem_part_number.number2 
                          ? `/${item.item.machine_part_oem_part.oem_part_number.number2}` 
                          : ''}
                      </TableCell>
                      <TableCell>{item.item.machine_part_oem_part.machine_part.name}</TableCell>
                      <TableCell>{item.item.brand.name}</TableCell>
                      <TableCell>{item.item.machine_model.name}</TableCell>
                      <TableCell>{item.item.machine_part_oem_part.machine_part.unit.name}</TableCell>
                      <TableCell className="font-semibold">{item.quantity}</TableCell>
                      <TableCell>{item.store.name}</TableCell>
                      <TableCell>{item.racks.rack_number}</TableCell>
                      <TableCell>{item.shelves.shelf_number}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex} to {endIndex} of {total} Records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="h-8 px-3"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 px-3"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                disabled
              >
                {page}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 px-3"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                className="h-8 px-3"
              >
                Last
              </Button>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-2 h-8 px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Copyright © 2025 - Koncept Solutions</p>
        <p className="mt-1">Sparepart360 Theme</p>
      </div>
    </div>
  );
}