'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Part } from './PartForm';

interface PartsTableProps {
  onSelectPart: (part: Part) => void;
  selectedPartId?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

interface PartWithStock extends Part {
  stock?: {
    quantity: number;
  };
}

export default function PartsTable({ onSelectPart, selectedPartId, refreshTrigger }: PartsTableProps) {
  const [parts, setParts] = useState<PartWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadParts();
  }, [page, search, refreshTrigger]);

  const loadParts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) {
        params.append('search', search);
      }
      const response = await api.get(`/parts?${params.toString()}`);
      setParts(response.data.parts || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(response.data.pagination?.total || 0);
    } catch (error: any) {
      // Suppress repeated connection errors - they're already handled by api interceptor
      if (!error.message?.includes('Backend server is not running')) {
        console.error('Failed to load parts:', error);
      }
      // Clear parts on error to show empty state
      setParts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRowClick = (part: PartWithStock) => {
    onSelectPart(part);
  };

  return (
    <Card className="h-full bg-white border border-gray-200 shadow-medium rounded-lg overflow-hidden flex flex-col">
      <CardHeader className="bg-white border-b border-gray-200 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Parts List</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">Browse and search inventory parts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search parts..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Part No</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">Brand</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-left">UOM</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Cost</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Price</TableHead>
                <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-sm text-gray-500">No parts found</p>
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((part) => (
                  <TableRow
                    key={part.id}
                    onClick={() => handleRowClick(part)}
                    className={`cursor-pointer transition-all border-b border-gray-100 ${
                      selectedPartId === part.id
                        ? 'bg-primary-50 hover:bg-primary-100 border-l-4 border-l-primary-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <TableCell className="font-semibold text-gray-900 py-4 px-6">
                      {part.partNo}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6">
                      {part.brand || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6">
                      {part.uom || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                      {part.cost !== undefined && part.cost !== null
                        ? `$${part.cost.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                      {part.priceA !== undefined && part.priceA !== null
                        ? `$${part.priceA.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-4 px-6 text-right font-medium">
                      {part.stock?.quantity !== undefined
                        ? part.stock.quantity
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <div className="text-sm text-gray-600 font-medium">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} parts
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-gray-300"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-gray-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

