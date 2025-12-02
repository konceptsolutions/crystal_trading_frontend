'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export interface SalesInquiry {
  id?: string;
  inquiryNo: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  inquiryDate: string;
  status: 'new' | 'contacted' | 'quoted' | 'converted' | 'lost';
  subject: string;
  description?: string;
  followUpDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SalesInquiry() {
  const [inquiries, setInquiries] = useState<SalesInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SalesInquiry>({
    inquiryNo: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    inquiryDate: new Date().toISOString().split('T')[0],
    status: 'new',
    subject: '',
    description: '',
    followUpDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales-inquiries');
      setInquiries(response.data.inquiries || []);
    } catch (error: any) {
      console.error('Failed to fetch inquiries:', error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedInquiry?.id) {
        await api.put(`/sales-inquiries/${selectedInquiry.id}`, formData);
      } else {
        await api.post('/sales-inquiries', formData);
      }
      resetForm();
      fetchInquiries();
    } catch (error: any) {
      console.error('Failed to save inquiry:', error);
      alert(error.response?.data?.error || 'Failed to save inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      setLoading(true);
      await api.delete(`/sales-inquiries/${id}`);
      fetchInquiries();
    } catch (error: any) {
      console.error('Failed to delete inquiry:', error);
      alert(error.response?.data?.error || 'Failed to delete inquiry');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const response = await api.get('/sales-inquiries/next-number');
      return response.data.nextNumber;
    } catch (error) {
      console.error('Failed to fetch next inquiry number:', error);
      return 'INQ-001';
    }
  };

  const resetForm = async () => {
    const nextNumber = await fetchNextNumber();
    setFormData({
      inquiryNo: nextNumber,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      inquiryDate: new Date().toISOString().split('T')[0],
      status: 'new',
      subject: '',
      description: '',
      followUpDate: '',
      notes: '',
    });
    setSelectedInquiry(null);
    setShowForm(false);
  };

  const handleEdit = (inquiry: SalesInquiry) => {
    setSelectedInquiry(inquiry);
    setFormData(inquiry);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-700';
      case 'quoted':
        return 'bg-primary-100 text-primary-700';
      case 'converted':
        return 'bg-green-100 text-green-700';
      case 'lost':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredInquiries = inquiries.filter(
    (inq) =>
      inq.inquiryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search inquiries..."
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
          + New Inquiry
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-primary-200">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-orange-50 border-b">
            <CardTitle>{selectedInquiry ? 'Edit Inquiry' : 'New Sales Inquiry'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inquiry No</label>
                  <Input
                    value={formData.inquiryNo}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inquiry Date</label>
                  <Input
                    type="date"
                    value={formData.inquiryDate}
                    onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-primary-500 hover:bg-primary-600">
                  {selectedInquiry ? 'Update' : 'Create'} Inquiry
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
          <CardTitle>Sales Inquiries ({filteredInquiries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No inquiries found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquiry No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.inquiryNo}</TableCell>
                    <TableCell>{inquiry.customerName}</TableCell>
                    <TableCell>{inquiry.subject}</TableCell>
                    <TableCell>{new Date(inquiry.inquiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(inquiry)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inquiry.id && handleDelete(inquiry.id)}
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

