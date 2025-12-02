'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface ChallanItem {
  id?: string;
  partId?: string;
  partNo: string;
  description?: string;
  quantity: number;
  uom?: string;
}

export interface DeliveryChallan {
  id?: string;
  challanNo: string;
  invoiceId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryDate: string;
  deliveryAddress?: string;
  vehicleNo?: string;
  driverName?: string;
  status: 'draft' | 'dispatched' | 'delivered' | 'cancelled';
  items: ChallanItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DeliveryChallan() {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<DeliveryChallan>({
    challanNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryAddress: '',
    vehicleNo: '',
    driverName: '',
    status: 'draft',
    items: [],
    notes: '',
  });

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/delivery-challans');
      const challansData = response.data.challans || [];
      const transformedChallans = challansData.map((c: any) => ({
        ...c,
        deliveryDate: c.deliveryDate ? new Date(c.deliveryDate).toISOString().split('T')[0] : '',
        items: c.items || [],
      }));
      setChallans(transformedChallans);
    } catch (error: any) {
      console.error('Failed to fetch challans:', error);
      setChallans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      setLoading(true);
      if (selectedChallan?.id) {
        await api.put(`/delivery-challans/${selectedChallan.id}`, formData);
      } else {
        await api.post('/delivery-challans', formData);
      }
      resetForm();
      fetchChallans();
    } catch (error: any) {
      console.error('Failed to save challan:', error);
      alert(error.response?.data?.error || 'Failed to save challan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challan?')) return;
    try {
      setLoading(true);
      await api.delete(`/delivery-challans/${id}`);
      fetchChallans();
    } catch (error: any) {
      console.error('Failed to delete challan:', error);
      alert(error.response?.data?.error || 'Failed to delete challan');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/delivery-challans/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next challan number:', error);
      return 'DC-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      challanNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryAddress: '',
      vehicleNo: '',
      driverName: '',
      status: 'draft',
      items: [],
      notes: '',
    });
    setSelectedChallan(null);
    setShowForm(false);
  };

  const handleEdit = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setFormData(challan);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'dispatched':
        return 'bg-primary-100 text-primary-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredChallans = challans.filter(
    (c) =>
      c.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search challans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <Button
          onClick={async () => {
            await resetForm();
            setShowForm(true);
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          + New Challan
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <CardTitle>{selectedChallan ? 'Edit Challan' : 'New Delivery Challan'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Challan No</label>
                  <Input
                    value={formData.challanNo}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle No</label>
                  <Input
                    value={formData.vehicleNo}
                    onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name</label>
                  <Input
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                  <textarea
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600">
                  {selectedChallan ? 'Update' : 'Create'} Challan
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Challans ({filteredChallans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredChallans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No challans found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallans.map((challan) => (
                  <TableRow key={challan.id}>
                    <TableCell className="font-medium">{challan.challanNo}</TableCell>
                    <TableCell>{challan.customerName}</TableCell>
                    <TableCell>{new Date(challan.deliveryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{challan.vehicleNo || '-'}</TableCell>
                    <TableCell>{challan.driverName || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(challan.status)}`}>
                        {challan.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(challan)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => challan.id && handleDelete(challan.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

