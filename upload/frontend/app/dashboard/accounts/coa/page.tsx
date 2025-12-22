'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CoaGroup {
  id: number;
  name: string;
  code: string;
  parent: string;
  isActive: boolean;
  subGroups?: CoaSubGroup[];
}

interface CoaSubGroup {
  id: number;
  name: string;
  code: string;
  type: string | null;
  isActive: boolean;
  coaGroupId: number;
  accounts?: CoaAccount[];
}

interface CoaAccount {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  isDefault: boolean;
  coaGroup: CoaGroup;
  coaSubGroup: CoaSubGroup;
  description?: string;
}

type TabType = 'groups' | 'subgroups' | 'accounts';

export default function CoaManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [loading, setLoading] = useState(false);
  
  // Groups
  const [groups, setGroups] = useState<CoaGroup[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CoaGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', code: '', parent: 'Assets' });

  // Sub-Groups
  const [subGroups, setSubGroups] = useState<CoaSubGroup[]>([]);
  const [subGroupDialogOpen, setSubGroupDialogOpen] = useState(false);
  const [selectedSubGroup, setSelectedSubGroup] = useState<CoaSubGroup | null>(null);
  const [subGroupForm, setSubGroupForm] = useState({ name: '', code: '', type: '', coaGroupId: '' });

  // Accounts
  const [accounts, setAccounts] = useState<CoaAccount[]>([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CoaAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', code: '', coaGroupId: '', coaSubGroupId: '', description: '' });
  const [availableSubGroups, setAvailableSubGroups] = useState<CoaSubGroup[]>([]);

  const parentOptions = ['Assets', 'Liabilities', 'Capital', 'Revenues', 'Expenses', 'Cost'];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (accountForm.coaGroupId) {
      fetchSubGroupsForGroup(parseInt(accountForm.coaGroupId));
    } else {
      setAvailableSubGroups([]);
    }
  }, [accountForm.coaGroupId]);

  const fetchSubGroupsForGroup = async (groupId: number) => {
    try {
      const response = await api.get('/accounts/coa-sub-groups', {
        params: { groupId },
      });
      setAvailableSubGroups(response.data.subGroups || []);
    } catch (error) {
      console.error('Failed to fetch sub-groups:', error);
      setAvailableSubGroups([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'groups') {
        const response = await api.get('/accounts/coa-groups');
        setGroups(response.data.groups || []);
      } else if (activeTab === 'subgroups') {
        const response = await api.get('/accounts/coa-sub-groups');
        setSubGroups(response.data.subGroups || []);
        const groupsRes = await api.get('/accounts/coa-groups');
        setGroups(groupsRes.data.groups || []);
      } else if (activeTab === 'accounts') {
        const response = await api.get('/accounts/coa-accounts');
        setAccounts(response.data.coaAccounts || []);
        const groupsRes = await api.get('/accounts/coa-groups');
        setGroups(groupsRes.data.groups || []);
      }
    } catch (error: any) {
      toast.error('Failed to fetch data', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedGroup) {
        // TODO: Add update endpoint if needed
        toast.error('Update functionality not yet implemented');
      } else {
        await api.post('/accounts/coa-groups', groupForm);
        toast.success('Group created successfully');
      }
      setGroupDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save group', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedSubGroup) {
        // TODO: Add update endpoint if needed
        toast.error('Update functionality not yet implemented');
      } else {
        await api.post('/accounts/coa-sub-groups', {
          ...subGroupForm,
          coaGroupId: parseInt(subGroupForm.coaGroupId),
        });
        toast.success('Sub-Group created successfully');
      }
      setSubGroupDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save sub-group', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedAccount) {
        await api.put(`/accounts/coa-accounts/${selectedAccount.id}`, {
          ...accountForm,
          coaGroupId: parseInt(accountForm.coaGroupId),
          coaSubGroupId: parseInt(accountForm.coaSubGroupId),
        });
        toast.success('Account updated successfully');
      } else {
        await api.post('/accounts/coa-accounts', {
          ...accountForm,
          coaGroupId: parseInt(accountForm.coaGroupId),
          coaSubGroupId: parseInt(accountForm.coaSubGroupId),
        });
        toast.success('Account created successfully');
      }
      setAccountDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save account', {
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (accountId: number) => {
    try {
      await api.patch(`/accounts/coa-accounts/toggle-status/${accountId}`);
      toast.success('Account status updated');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update status', {
        description: error.response?.data?.message || 'An error occurred',
      });
    }
  };

  const openAccountDialog = async (account?: CoaAccount) => {
    if (account) {
      setSelectedAccount(account);
      setAccountForm({
        name: account.name,
        code: account.code,
        coaGroupId: account.coaGroup.id.toString(),
        coaSubGroupId: account.coaSubGroup.id.toString(),
        description: account.description || '',
      });
    } else {
      setSelectedAccount(null);
      setAccountForm({ name: '', code: '', coaGroupId: '', coaSubGroupId: '', description: '' });
    }
    setAccountDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chart of Accounts</h1>
        <p className="text-gray-600">Manage your accounting structure</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'groups' as TabType, label: 'COA Groups', icon: '📁' },
            { id: 'subgroups' as TabType, label: 'Sub-Groups', icon: '📂' },
            { id: 'accounts' as TabType, label: 'Accounts', icon: '📄' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'text-[#ff6b35] border-b-2 border-[#ff6b35] bg-[#fff5f2]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">COA Groups</h2>
              <Button onClick={() => { setSelectedGroup(null); setGroupDialogOpen(true); }} className="bg-[#ff6b35] hover:bg-[#e55a2b]">
                Add Group
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-gray-500">Code: {group.code}</p>
                      <p className="text-sm text-gray-500">Parent: {group.parent}</p>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subgroups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Sub-Groups</h2>
              <Button onClick={() => { setSelectedSubGroup(null); setSubGroupDialogOpen(true); }} className="bg-[#ff6b35] hover:bg-[#e55a2b]">
                Add Sub-Group
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subGroups.map((sg) => (
                    <TableRow key={sg.id}>
                      <TableCell>{sg.code}</TableCell>
                      <TableCell>{sg.name}</TableCell>
                      <TableCell>{sg.type || '-'}</TableCell>
                      <TableCell>{groups.find(g => g.id === sg.coaGroupId)?.name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${sg.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {sg.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Accounts</h2>
              <Button onClick={() => openAccountDialog()} className="bg-[#ff6b35] hover:bg-[#e55a2b]">
                Add Account
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Sub-Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.coaGroup.name}</TableCell>
                        <TableCell>{account.coaSubGroup.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAccountDialog(account)}
                            >
                              Edit
                            </Button>
                            {!account.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(account.id)}
                              >
                                {account.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGroup ? 'Edit COA Group' : 'Create New COA Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="groupCode">Group Code *</Label>
              <Input
                id="groupCode"
                value={groupForm.code}
                onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="groupParent">Parent *</Label>
              <select
                id="groupParent"
                value={groupForm.parent}
                onChange={(e) => setGroupForm({ ...groupForm, parent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                {parentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#ff6b35] hover:bg-[#e55a2b]" disabled={loading}>
                {loading ? 'Saving...' : selectedGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Group Dialog */}
      <Dialog open={subGroupDialogOpen} onOpenChange={setSubGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubGroup ? 'Edit Sub-Group' : 'Create New Sub-Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubGroupSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subGroupName">Sub-Group Name *</Label>
              <Input
                id="subGroupName"
                value={subGroupForm.name}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="subGroupCode">Sub-Group Code *</Label>
              <Input
                id="subGroupCode"
                value={subGroupForm.code}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="subGroupCoaGroupId">COA Group *</Label>
              <select
                id="subGroupCoaGroupId"
                value={subGroupForm.coaGroupId}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, coaGroupId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subGroupType">Type (Optional)</Label>
              <Input
                id="subGroupType"
                value={subGroupForm.type}
                onChange={(e) => setSubGroupForm({ ...subGroupForm, type: e.target.value })}
                placeholder="cash, bank, inventory, etc."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#ff6b35] hover:bg-[#e55a2b]" disabled={loading}>
                {loading ? 'Saving...' : selectedSubGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Account' : 'Create New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Account Code *</Label>
              <Input
                id="code"
                value={accountForm.code}
                onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="coaGroupId">COA Group *</Label>
              <select
                id="coaGroupId"
                value={accountForm.coaGroupId}
                onChange={(e) => {
                  setAccountForm({ ...accountForm, coaGroupId: e.target.value, coaSubGroupId: '' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="coaSubGroupId">COA Sub-Group *</Label>
              <select
                id="coaSubGroupId"
                value={accountForm.coaSubGroupId}
                onChange={(e) => setAccountForm({ ...accountForm, coaSubGroupId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={!accountForm.coaGroupId}
              >
                <option value="">Select Sub-Group</option>
                {availableSubGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name} ({sg.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={accountForm.description}
                onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#ff6b35] hover:bg-[#e55a2b]" disabled={loading}>
                {loading ? 'Saving...' : selectedAccount ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

