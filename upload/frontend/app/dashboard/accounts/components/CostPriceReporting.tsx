'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CostPriceItem {
  id: string;
  partNo: string;
  partName: string;
  category: string;
  location: string;
  origin: string;
  quantity: number;
  purchaseCost: number;
  landingCost: number;
  totalCost: number;
  avgCostPerUnit: number;
  lastPurchaseDate: string;
  supplier: string;
}

interface LocationSummary {
  location: string;
  totalItems: number;
  totalCost: number;
  avgCostPerItem: number;
}

interface OriginSummary {
  origin: string;
  totalItems: number;
  totalCost: number;
  percentage: number;
}

export default function CostPriceReporting() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CostPriceItem[]>([]);
  const [locationSummary, setLocationSummary] = useState<LocationSummary[]>([]);
  const [originSummary, setOriginSummary] = useState<OriginSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeView, setActiveView] = useState<'items' | 'location' | 'origin'>('items');
  const [sortBy, setSortBy] = useState('partNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Demo data
  useEffect(() => {
    const demoItems: CostPriceItem[] = [
      { id: '1', partNo: 'ENG-001', partName: 'Engine Oil Filter', category: 'Engine Parts', location: 'Warehouse A', origin: 'Japan', quantity: 150, purchaseCost: 250, landingCost: 50, totalCost: 45000, avgCostPerUnit: 300, lastPurchaseDate: '2025-12-05', supplier: 'Toyota Parts Co.' },
      { id: '2', partNo: 'BRK-001', partName: 'Brake Pads Set', category: 'Brake System', location: 'Warehouse A', origin: 'Germany', quantity: 80, purchaseCost: 1500, landingCost: 200, totalCost: 136000, avgCostPerUnit: 1700, lastPurchaseDate: '2025-12-03', supplier: 'Bosch Auto' },
      { id: '3', partNo: 'SUS-001', partName: 'Shock Absorber', category: 'Suspension', location: 'Warehouse B', origin: 'Japan', quantity: 45, purchaseCost: 3500, landingCost: 500, totalCost: 180000, avgCostPerUnit: 4000, lastPurchaseDate: '2025-11-28', supplier: 'KYB Industries' },
      { id: '4', partNo: 'ELC-001', partName: 'Alternator', category: 'Electrical', location: 'Warehouse A', origin: 'China', quantity: 25, purchaseCost: 8000, landingCost: 1000, totalCost: 225000, avgCostPerUnit: 9000, lastPurchaseDate: '2025-12-01', supplier: 'Denso China' },
      { id: '5', partNo: 'ENG-002', partName: 'Air Filter', category: 'Engine Parts', location: 'Warehouse B', origin: 'Local', quantity: 200, purchaseCost: 350, landingCost: 0, totalCost: 70000, avgCostPerUnit: 350, lastPurchaseDate: '2025-12-08', supplier: 'Local Filters Ltd.' },
      { id: '6', partNo: 'BRK-002', partName: 'Brake Disc', category: 'Brake System', location: 'Warehouse A', origin: 'Germany', quantity: 60, purchaseCost: 4500, landingCost: 600, totalCost: 306000, avgCostPerUnit: 5100, lastPurchaseDate: '2025-11-25', supplier: 'Brembo' },
      { id: '7', partNo: 'TRN-001', partName: 'Transmission Oil', category: 'Transmission', location: 'Warehouse C', origin: 'USA', quantity: 100, purchaseCost: 800, landingCost: 150, totalCost: 95000, avgCostPerUnit: 950, lastPurchaseDate: '2025-12-07', supplier: 'Valvoline USA' },
      { id: '8', partNo: 'CLT-001', partName: 'Clutch Kit', category: 'Transmission', location: 'Warehouse B', origin: 'Japan', quantity: 35, purchaseCost: 12000, landingCost: 1500, totalCost: 472500, avgCostPerUnit: 13500, lastPurchaseDate: '2025-11-30', supplier: 'Exedy Japan' },
      { id: '9', partNo: 'RAD-001', partName: 'Radiator', category: 'Cooling System', location: 'Warehouse A', origin: 'China', quantity: 20, purchaseCost: 15000, landingCost: 2000, totalCost: 340000, avgCostPerUnit: 17000, lastPurchaseDate: '2025-12-02', supplier: 'Denso China' },
      { id: '10', partNo: 'STR-001', partName: 'Starter Motor', category: 'Electrical', location: 'Warehouse C', origin: 'Japan', quantity: 30, purchaseCost: 9500, landingCost: 1200, totalCost: 321000, avgCostPerUnit: 10700, lastPurchaseDate: '2025-11-22', supplier: 'Denso Japan' },
      { id: '11', partNo: 'WHL-001', partName: 'Wheel Bearing', category: 'Suspension', location: 'Warehouse B', origin: 'Germany', quantity: 90, purchaseCost: 2200, landingCost: 300, totalCost: 225000, avgCostPerUnit: 2500, lastPurchaseDate: '2025-12-04', supplier: 'SKF Germany' },
      { id: '12', partNo: 'OIL-001', partName: 'Engine Oil 5W-30', category: 'Lubricants', location: 'Warehouse C', origin: 'UAE', quantity: 250, purchaseCost: 450, landingCost: 80, totalCost: 132500, avgCostPerUnit: 530, lastPurchaseDate: '2025-12-09', supplier: 'Castrol UAE' },
    ];
    setItems(demoItems);

    // Calculate location summary
    const locationMap = new Map<string, { items: number; cost: number }>();
    demoItems.forEach(item => {
      const existing = locationMap.get(item.location) || { items: 0, cost: 0 };
      locationMap.set(item.location, {
        items: existing.items + item.quantity,
        cost: existing.cost + item.totalCost,
      });
    });
    const locSummary: LocationSummary[] = Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      totalItems: data.items,
      totalCost: data.cost,
      avgCostPerItem: data.cost / data.items,
    }));
    setLocationSummary(locSummary);

    // Calculate origin summary
    const totalCost = demoItems.reduce((sum, item) => sum + item.totalCost, 0);
    const originMap = new Map<string, { items: number; cost: number }>();
    demoItems.forEach(item => {
      const existing = originMap.get(item.origin) || { items: 0, cost: 0 };
      originMap.set(item.origin, {
        items: existing.items + item.quantity,
        cost: existing.cost + item.totalCost,
      });
    });
    const orgSummary: OriginSummary[] = Array.from(originMap.entries()).map(([origin, data]) => ({
      origin,
      totalItems: data.items,
      totalCost: data.cost,
      percentage: (data.cost / totalCost) * 100,
    }));
    setOriginSummary(orgSummary);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || item.location === filterLocation;
    const matchesOrigin = filterOrigin === 'all' || item.origin === filterOrigin;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesLocation && matchesOrigin && matchesCategory;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = a[sortBy as keyof CostPriceItem];
    const bValue = b[sortBy as keyof CostPriceItem];
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const totalInventoryCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const avgCostPerUnit = totalInventoryCost / totalQuantity;

  const locations = Array.from(new Set(items.map(item => item.location)));
  const origins = Array.from(new Set(items.map(item => item.origin)));
  const categories = Array.from(new Set(items.map(item => item.category)));

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getOriginColor = (origin: string) => {
    const colors: Record<string, string> = {
      'Japan': 'bg-red-100 text-red-700',
      'Germany': 'bg-yellow-100 text-yellow-700',
      'China': 'bg-orange-100 text-orange-700',
      'USA': 'bg-blue-100 text-blue-700',
      'Local': 'bg-green-100 text-green-700',
      'UAE': 'bg-purple-100 text-purple-700',
    };
    return colors[origin] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cost Price Reporting</h2>
            <p className="text-sm text-gray-500">Analyze costs by location & origin</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </Button>
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Total Inventory Cost</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalInventoryCost)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-700">{totalQuantity.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Avg Cost/Unit</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(avgCostPerUnit)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">SKU Count</p>
              <p className="text-2xl font-bold text-purple-700">{items.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'items' ? 'default' : 'outline'}
          onClick={() => setActiveView('items')}
          className={activeView === 'items' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          Item Details
        </Button>
        <Button
          variant={activeView === 'location' ? 'default' : 'outline'}
          onClick={() => setActiveView('location')}
          className={activeView === 'location' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          By Location
        </Button>
        <Button
          variant={activeView === 'origin' ? 'default' : 'outline'}
          onClick={() => setActiveView('origin')}
          className={activeView === 'origin' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          By Origin
        </Button>
      </div>

      {/* Items View */}
      {activeView === 'items' && (
        <>
          {/* Filters */}
          <Card className="bg-white shadow-soft">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
                  <div className="relative">
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search part no, name, supplier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <Label htmlFor="filter-location" className="text-sm font-medium mb-2 block">Location</Label>
                  <Select
                    id="filter-location"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-origin" className="text-sm font-medium mb-2 block">Origin</Label>
                  <Select
                    id="filter-origin"
                    value={filterOrigin}
                    onChange={(e) => setFilterOrigin(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All Origins</option>
                    {origins.map((org) => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-category" className="text-sm font-medium mb-2 block">Category</Label>
                  <Select
                    id="filter-category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="bg-white shadow-soft">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => { setSortBy('partNo'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        Part No.
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Part Name</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Location</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Origin</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Qty</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Purchase Cost</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Landing Cost</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Total Cost</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Avg/Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                          <p className="font-medium text-gray-600">No items found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-4 py-3 font-mono text-sm font-medium text-amber-600">
                            {item.partNo}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.partName}</p>
                              <p className="text-xs text-gray-500">{item.supplier}</p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm">{item.category}</TableCell>
                          <TableCell className="px-4 py-3 text-sm">{item.location}</TableCell>
                          <TableCell className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOriginColor(item.origin)}`}>
                              {item.origin}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="px-4 py-3 text-right">{formatCurrency(item.purchaseCost)}</TableCell>
                          <TableCell className="px-4 py-3 text-right">{formatCurrency(item.landingCost)}</TableCell>
                          <TableCell className="px-4 py-3 text-right font-semibold text-amber-600">{formatCurrency(item.totalCost)}</TableCell>
                          <TableCell className="px-4 py-3 text-right font-medium">{formatCurrency(item.avgCostPerUnit)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Location View */}
      {activeView === 'location' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Distribution by Location</h3>
              <div className="space-y-4">
                {locationSummary.map((loc) => {
                  const percentage = (loc.totalCost / totalInventoryCost) * 100;
                  return (
                    <div key={loc.location} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{loc.location}</span>
                        <span className="font-semibold text-amber-600">{formatCurrency(loc.totalCost)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-16 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                      <p className="text-xs text-gray-500">{loc.totalItems.toLocaleString()} items • Avg: {formatCurrency(loc.avgCostPerItem)}/unit</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">Location</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Items</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Total Cost</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Avg/Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationSummary.map((loc) => (
                    <TableRow key={loc.location}>
                      <TableCell className="font-medium">{loc.location}</TableCell>
                      <TableCell className="text-right">{loc.totalItems.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">{formatCurrency(loc.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loc.avgCostPerItem)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Origin View */}
      {activeView === 'origin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Distribution by Origin</h3>
              <div className="space-y-4">
                {originSummary.sort((a, b) => b.totalCost - a.totalCost).map((org) => (
                  <div key={org.origin} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOriginColor(org.origin)}`}>
                          {org.origin}
                        </span>
                      </div>
                      <span className="font-semibold text-amber-600">{formatCurrency(org.totalCost)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                          style={{ width: `${org.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">{org.percentage.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-gray-500">{org.totalItems.toLocaleString()} items</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Origin Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">Origin</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Items</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Total Cost</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {originSummary.sort((a, b) => b.totalCost - a.totalCost).map((org) => (
                    <TableRow key={org.origin}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOriginColor(org.origin)}`}>
                          {org.origin}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{org.totalItems.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">{formatCurrency(org.totalCost)}</TableCell>
                      <TableCell className="text-right">{org.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

