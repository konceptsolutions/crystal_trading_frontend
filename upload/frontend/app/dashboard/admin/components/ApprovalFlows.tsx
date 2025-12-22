'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApprovalStep {
  id: string;
  order: number;
  role: string;
  userId?: string;
  userName?: string;
  action: 'approve' | 'review' | 'notify';
  isRequired: boolean;
}

interface ApprovalFlow {
  id: string;
  name: string;
  description: string;
  module: string;
  trigger: string;
  condition?: string;
  steps: ApprovalStep[];
  status: 'active' | 'inactive';
  createdAt: string;
}

interface PendingApproval {
  id: string;
  flowName: string;
  documentType: string;
  documentNo: string;
  requestedBy: string;
  requestedAt: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'approved' | 'rejected';
  amount?: number;
}

export default function ApprovalFlows() {
  const [activeView, setActiveView] = useState<'flows' | 'pending'>('flows');
  const [showForm, setShowForm] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [flows, setFlows] = useState<ApprovalFlow[]>([
    {
      id: '1',
      name: 'Purchase Order Approval',
      description: 'Approval workflow for purchase orders above threshold',
      module: 'purchase',
      trigger: 'create',
      condition: 'amount > 50000',
      steps: [
        { id: '1', order: 1, role: 'manager', action: 'review', isRequired: true },
        { id: '2', order: 2, role: 'accountant', action: 'approve', isRequired: true },
        { id: '3', order: 3, role: 'admin', action: 'approve', isRequired: true },
      ],
      status: 'active',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Sales Invoice Approval',
      description: 'Approval for sales invoices with special discounts',
      module: 'sales',
      trigger: 'create',
      condition: 'discount > 15%',
      steps: [
        { id: '1', order: 1, role: 'manager', action: 'approve', isRequired: true },
      ],
      status: 'active',
      createdAt: '2024-02-20',
    },
    {
      id: '3',
      name: 'Inventory Adjustment',
      description: 'Approval for inventory write-offs and adjustments',
      module: 'inventory',
      trigger: 'adjust',
      steps: [
        { id: '1', order: 1, role: 'manager', action: 'review', isRequired: true },
        { id: '2', order: 2, role: 'accountant', action: 'approve', isRequired: false },
      ],
      status: 'active',
      createdAt: '2024-03-10',
    },
    {
      id: '4',
      name: 'Customer Credit Limit',
      description: 'Approval for customer credit limit changes',
      module: 'customers',
      trigger: 'update',
      condition: 'creditLimit > 100000',
      steps: [
        { id: '1', order: 1, role: 'manager', action: 'approve', isRequired: true },
        { id: '2', order: 2, role: 'admin', action: 'approve', isRequired: true },
      ],
      status: 'inactive',
      createdAt: '2024-04-05',
    },
  ]);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    { id: '1', flowName: 'Purchase Order Approval', documentType: 'Purchase Order', documentNo: 'PO-2024-001', requestedBy: 'John Doe', requestedAt: '2024-12-10 09:30', currentStep: 2, totalSteps: 3, status: 'pending', amount: 75000 },
    { id: '2', flowName: 'Sales Invoice Approval', documentType: 'Sales Invoice', documentNo: 'INV-2024-125', requestedBy: 'Jane Smith', requestedAt: '2024-12-10 11:15', currentStep: 1, totalSteps: 1, status: 'pending', amount: 45000 },
    { id: '3', flowName: 'Inventory Adjustment', documentType: 'Adjustment', documentNo: 'ADJ-2024-015', requestedBy: 'Mike Johnson', requestedAt: '2024-12-09 14:45', currentStep: 1, totalSteps: 2, status: 'pending' },
    { id: '4', flowName: 'Purchase Order Approval', documentType: 'Purchase Order', documentNo: 'PO-2024-002', requestedBy: 'Sarah Wilson', requestedAt: '2024-12-08 16:20', currentStep: 3, totalSteps: 3, status: 'approved', amount: 120000 },
  ]);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    module: string;
    trigger: string;
    condition: string;
    steps: ApprovalStep[];
    status: 'active' | 'inactive';
  }>({
    name: '',
    description: '',
    module: 'purchase',
    trigger: 'create',
    condition: '',
    steps: [{ id: '1', order: 1, role: 'manager', action: 'approve', isRequired: true }],
    status: 'active',
  });

  const moduleOptions = [
    { value: 'purchase', label: 'Purchase Orders' },
    { value: 'sales', label: 'Sales' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'customers', label: 'Customers' },
    { value: 'suppliers', label: 'Suppliers' },
    { value: 'accounts', label: 'Accounts' },
  ];

  const triggerOptions = [
    { value: 'create', label: 'On Create' },
    { value: 'update', label: 'On Update' },
    { value: 'delete', label: 'On Delete' },
    { value: 'adjust', label: 'On Adjustment' },
    { value: 'submit', label: 'On Submit' },
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'staff', label: 'Staff' },
  ];

  const handleAddStep = () => {
    const newStep: ApprovalStep = {
      id: String(Date.now()),
      order: formData.steps.length + 1,
      role: 'manager',
      action: 'approve',
      isRequired: true,
    };
    setFormData({ ...formData, steps: [...formData.steps, newStep] });
  };

  const handleRemoveStep = (stepId: string) => {
    const newSteps = formData.steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 }));
    setFormData({ ...formData, steps: newSteps });
  };

  const handleStepChange = (stepId: string, field: keyof ApprovalStep, value: any) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s => s.id === stepId ? { ...s, [field]: value } : s),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFlow) {
      setFlows(prev => prev.map(f => f.id === selectedFlow.id ? { ...f, ...formData, steps: formData.steps } : f));
      setSuccess('Approval flow updated successfully');
    } else {
      const newFlow: ApprovalFlow = {
        id: String(Date.now()),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setFlows(prev => [...prev, newFlow]);
      setSuccess('Approval flow created successfully');
    }
    
    setShowForm(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditFlow = (flow: ApprovalFlow) => {
    setSelectedFlow(flow);
    setFormData({
      name: flow.name,
      description: flow.description,
      module: flow.module,
      trigger: flow.trigger,
      condition: flow.condition || '',
      steps: [...flow.steps],
      status: flow.status,
    });
    setShowForm(true);
  };

  const handleToggleStatus = (flowId: string) => {
    setFlows(prev => prev.map(f => f.id === flowId ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f));
  };

  const handleApprovalAction = (approvalId: string, action: 'approve' | 'reject') => {
    setPendingApprovals(prev => prev.map(a => 
      a.id === approvalId 
        ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } 
        : a
    ));
    setSuccess(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setSelectedFlow(null);
    setFormData({
      name: '',
      description: '',
      module: 'purchase',
      trigger: 'create',
      condition: '',
      steps: [{ id: '1', order: 1, role: 'manager', action: 'approve', isRequired: true }],
      status: 'active',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('flows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'flows' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Approval Flows
          </button>
          <button
            onClick={() => setActiveView('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeView === 'pending' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Pending Approvals
            {pendingApprovals.filter(a => a.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingApprovals.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
        {activeView === 'flows' && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary-500 hover:bg-primary-600 text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Flow
          </Button>
        )}
      </div>

      {/* Flows View */}
      {activeView === 'flows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {flows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(flow.status)}`}>
                        {flow.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(flow.id)}
                      className={`p-2 rounded-lg transition-colors ${flow.status === 'active' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                      title={flow.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                    <button onClick={() => handleEditFlow(flow)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{flow.description}</p>
                
                {/* Flow Steps */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">APPROVAL STEPS</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {flow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${step.action === 'approve' ? 'bg-green-100 text-green-700' : step.action === 'review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {step.role} ({step.action})
                        </span>
                        {index < flow.steps.length - 1 && (
                          <svg className="w-4 h-4 mx-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flow Details */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Module: {moduleOptions.find(m => m.value === flow.module)?.label}</span>
                  <span>Trigger: {triggerOptions.find(t => t.value === flow.trigger)?.label}</span>
                </div>
                {flow.condition && (
                  <p className="text-xs text-gray-500 mt-1">Condition: {flow.condition}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Approvals View */}
      {activeView === 'pending' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Flow</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Requested By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{approval.documentNo}</p>
                          <p className="text-xs text-gray-500">{approval.documentType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{approval.flowName}</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{approval.requestedBy}</p>
                          <p className="text-xs text-gray-500">{approval.requestedAt}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {approval.amount ? `Rs ${approval.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${(approval.currentStep / approval.totalSteps) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{approval.currentStep}/{approval.totalSteps}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                          {approval.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {approval.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => handleApprovalAction(approval.id, 'approve')} className="bg-green-500 hover:bg-green-600 text-white text-xs px-3">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleApprovalAction(approval.id, 'reject')} className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-3">
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flow Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedFlow ? 'Edit Approval Flow' : 'Create Approval Flow'}</CardTitle>
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="flowName">Flow Name *</Label>
                  <Input id="flowName" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1" placeholder="e.g., Purchase Order Approval" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1" placeholder="Brief description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="module">Module *</Label>
                    <select id="module" value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {moduleOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="trigger">Trigger *</Label>
                    <select id="trigger" value={formData.trigger} onChange={(e) => setFormData({ ...formData, trigger: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {triggerOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="condition">Condition (Optional)</Label>
                  <Input id="condition" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="mt-1" placeholder="e.g., amount > 50000" />
                </div>

                {/* Approval Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Approval Steps</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddStep} className="text-primary-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Step
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-medium">{index + 1}</span>
                        <select value={step.role} onChange={(e) => handleStepChange(step.id, 'role', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <select value={step.action} onChange={(e) => handleStepChange(step.id, 'action', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option value="approve">Approve</option>
                          <option value="review">Review</option>
                          <option value="notify">Notify</option>
                        </select>
                        <label className="flex items-center gap-1 text-sm">
                          <input type="checkbox" checked={step.isRequired} onChange={(e) => handleStepChange(step.id, 'isRequired', e.target.checked)} className="w-4 h-4 text-primary-500 rounded" />
                          Required
                        </label>
                        {formData.steps.length > 1 && (
                          <button type="button" onClick={() => handleRemoveStep(step.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="submit" className="flex-1 bg-primary-500 hover:bg-primary-600">
                    {selectedFlow ? 'Update Flow' : 'Create Flow'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

