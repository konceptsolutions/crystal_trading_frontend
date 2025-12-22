'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

export default function InventoryStock() {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
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
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      console.log('Fetching inventory with params:', params.toString());
      const response = await api.get(`/parts-management/getItemsInventory?${params.toString()}`);
      console.log('Inventory response:', response.data);
      
      if (response.data && response.data.itemsInventory) {
        // Backend already filters zero quantity items, but ensure we don't show any
        const filteredData = (response.data.itemsInventory.data || []).filter(
          (item: InventoryItem) => item.quantity > 0
        );
        setInventoryData(filteredData);
        // Use backend total count for pagination
        setTotal(response.data.itemsInventory.total || filteredData.length);
        setTotalPages(Math.ceil((response.data.itemsInventory.total || filteredData.length) / limit));
      } else {
        console.warn('Unexpected response structure:', response.data);
        setInventoryData([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Failed to fetch inventory data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setInventoryData([]);
      setTotal(0);
      setTotalPages(1);
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
    // Only print selected rows
    if (selectedRows.size === 0) {
      alert('Please select at least one item to print.');
      return;
    }

    // Filter selected items
    const selectedItems = inventoryData.filter(item => selectedRows.has(item.id));
    
    if (selectedItems.length === 0) {
      alert('No items selected for printing.');
      return;
    }

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
            .summary { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Inventory Stock Report</h1>
          <div class="summary">
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Selected Items:</strong> ${selectedItems.length}</p>
          </div>
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
              ${selectedItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
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
    // Only export selected rows
    if (selectedRows.size === 0) {
      alert('Please select at least one item to export.');
      return;
    }

    // Filter selected items
    const selectedItems = inventoryData.filter(item => selectedRows.has(item.id));
    
    if (selectedItems.length === 0) {
      alert('No items selected for export.');
      return;
    }

    // Create CSV content
    const headers = ['Sr. No', 'OEM/ Part No', 'Name', 'Brand', 'Model', 'Uom', 'Qty', 'Store', 'Racks', 'Shelf'];
    const rows = selectedItems.map((item, index) => [
      index + 1,
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
    link.setAttribute('download', `inventory-stock-selected-${selectedItems.length}-items-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="space-y-3 sm:space-y-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Inventory Stock</h2>
      </div>

      {/* Filters */}
      <Card className="shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm"
              >
                <option value="">Select...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Sub Category</label>
              <Select
                value={selectedSubCategory}
                onChange={(e) => {
                  setSelectedSubCategory(e.target.value);
                  setPage(1);
                }}
                disabled={!selectedCategory}
                className="w-full text-sm"
              >
                <option value="">Select...</option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.name}>
                    {subCat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Item</label>
              <Select
                value={selectedItem}
                onChange={(e) => {
                  setSelectedItem(e.target.value);
                  setPage(1);
                }}
                disabled={!selectedCategory}
                className="w-full text-sm"
              >
                <option value="">Select...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Button
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 h-9 sm:h-10 text-sm sm:text-base flex-1 sm:flex-initial transition-all duration-200"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">🔍</span>
            </Button>
            <Button
              onClick={handlePrintReport}
              disabled={selectedRows.size === 0}
              className={`px-3 sm:px-4 py-2 h-9 sm:h-10 text-xs sm:text-sm ${
                selectedRows.size === 0
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              } transition-all duration-200`}
              title={selectedRows.size === 0 ? 'Please select items to print' : `Print ${selectedRows.size} selected item(s)`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print Report {selectedRows.size > 0 && `(${selectedRows.size})`}</span>
              <span className="sm:hidden">{selectedRows.size > 0 && selectedRows.size}</span>
            </Button>
            <Button
              onClick={handlePrintExcel}
              disabled={selectedRows.size === 0}
              className={`px-3 sm:px-4 py-2 h-9 sm:h-10 text-xs sm:text-sm ${
                selectedRows.size === 0
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } transition-all duration-200`}
              title={selectedRows.size === 0 ? 'Please select items to export' : `Export ${selectedRows.size} selected item(s) to Excel`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Print Excel {selectedRows.size > 0 && `(${selectedRows.size})`}</span>
              <span className="sm:hidden">{selectedRows.size > 0 && selectedRows.size}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10 sm:w-12 px-2 sm:px-4">
                    <input
                      type="checkbox"
                      checked={inventoryData.length > 0 && selectedRows.size === inventoryData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 transition-all"
                    />
                  </TableHead>
                  <TableHead className="w-16 sm:w-20 px-2 sm:px-4 text-xs sm:text-sm">Sr. No</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm min-w-[120px]">OEM/ Part No</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm min-w-[150px]">Name</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Brand</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">Model</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Uom</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Qty</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">Store</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden xl:table-cell">Racks</TableHead>
                  <TableHead className="px-2 sm:px-4 text-xs sm:text-sm hidden xl:table-cell">Shelf</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 sm:py-12 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm sm:text-base">Loading inventory data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                      No inventory stock found.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryData.map((item, index) => (
                    <TableRow 
                      key={item.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50 transition-colors duration-150`}
                    >
                      <TableCell className="px-2 sm:px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.id)}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 transition-all"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4">{startIndex + index}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                        <span className="font-medium">{item.item.machine_part_oem_part.oem_part_number.number1}</span>
                        {item.item.machine_part_oem_part.oem_part_number.number2 
                          ? `/${item.item.machine_part_oem_part.oem_part_number.number2}` 
                          : ''}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 max-w-[150px] truncate" title={item.item.machine_part_oem_part.machine_part.name}>
                        {item.item.machine_part_oem_part.machine_part.name}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">{item.item.brand.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">{item.item.machine_model.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">{item.item.machine_part_oem_part.machine_part.unit.name}</TableCell>
                      <TableCell className="font-semibold text-xs sm:text-sm px-2 sm:px-4">{item.quantity}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">{item.store.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden xl:table-cell">{item.racks.rack_number}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden xl:table-cell">{item.shelves.shelf_number}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              Showing {startIndex} to {endIndex} of {total} Records
            </div>
            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm transition-all duration-200"
              >
                <span className="hidden sm:inline">First</span>
                <span className="sm:hidden">«</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm transition-all duration-200"
              >
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">‹</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm bg-purple-600 text-white border-purple-600 hover:bg-purple-700 transition-all duration-200"
                disabled
              >
                {page}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm transition-all duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm transition-all duration-200"
              >
                <span className="hidden sm:inline">Last</span>
                <span className="sm:hidden">»</span>
              </Button>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-1 sm:ml-2 h-7 sm:h-8 px-1 sm:px-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
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
    </div>
  );
}