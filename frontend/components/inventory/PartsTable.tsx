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
      console.log('Parts API Response:', response.data);
      // Filter out inactive parts (only show active parts)
      const activeParts = (response.data.parts || []).filter((part: any) => part.status === 'A');
      setParts(activeParts);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotal(activeParts.length);
    } catch (error: any) {
      console.error('Failed to load parts - Full error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });
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
      <CardHeader className="bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-6 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full flex-shrink-0"></div>
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Parts List</CardTitle>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Browse and search inventory parts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search parts..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full sm:w-48 md:w-56 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-8 text-sm flex-shrink-0"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-white w-full max-w-full">
        <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-hide scroll-smooth w-full min-w-0" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollPadding: '0' }}>
          <Table className="w-full min-w-max">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900 py-1 px-2 text-left min-w-[120px]">Part No</TableHead>
                <TableHead className="font-semibold text-gray-900 py-1 px-2 text-left hidden sm:table-cell min-w-[80px]">Brand</TableHead>
                <TableHead className="font-semibold text-gray-900 py-1 px-2 text-left min-w-[60px]">UOM</TableHead>
                <TableHead className="font-semibold text-gray-900 py-1 px-2 text-right min-w-[80px]">Cost</TableHead>
                <TableHead className="font-semibold text-gray-900 py-1 px-2 text-right min-w-[80px]">Price</TableHead>
                <TableHead className="font-semibold text-gray-900 py-1 px-2 text-right min-w-[70px]">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs text-gray-500">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-xs text-gray-500">No parts found</p>
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
                    <TableCell className="font-semibold text-gray-900 py-1 px-2 truncate">
                      <span className="truncate block" title={part.partNo}>{part.partNo}</span>
                    </TableCell>
                    <TableCell className="text-gray-700 py-1 px-2 truncate hidden sm:table-cell">
                      <span className="truncate block" title={part.brand || '-'}>{part.brand || '-'}</span>
                    </TableCell>
                    <TableCell className="text-gray-700 py-1 px-2">
                      {part.uom || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-1 px-2 text-right font-medium">
                      {part.cost !== undefined && part.cost !== null
                        ? `Rs ${part.cost.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-1 px-2 text-right font-medium">
                      {part.priceA !== undefined && part.priceA !== null
                        ? `Rs ${part.priceA.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-1 px-2 text-right font-medium">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 w-full">
            <div className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} parts
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-gray-300 text-xs sm:text-sm px-3 sm:px-4"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-gray-300 text-xs sm:text-sm px-3 sm:px-4"
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

