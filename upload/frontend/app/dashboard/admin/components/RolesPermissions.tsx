'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
}

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'parts', name: 'Parts Management', icon: '⚙️' },
  { id: 'inventory', name: 'Inventory', icon: '📦' },
  { id: 'sales', name: 'Sales', icon: '🛒' },
  { id: 'purchase', name: 'Purchase Orders', icon: '📋' },
  { id: 'customers', name: 'Customers', icon: '👥' },
  { id: 'suppliers', name: 'Suppliers', icon: '🏭' },
  { id: 'reports', name: 'Reports', icon: '📈' },
  { id: 'accounts', name: 'Accounts', icon: '💰' },
  { id: 'admin', name: 'Administration', icon: '🔧' },
];

const PERMISSIONS: Permission[] = [
  { id: 'view', name: 'View', description: 'Can view records', module: 'all' },
  { id: 'create', name: 'Create', description: 'Can create new records', module: 'all' },
  { id: 'edit', name: 'Edit', description: 'Can edit existing records', module: 'all' },
  { id: 'delete', name: 'Delete', description: 'Can delete records', module: 'all' },
  { id: 'export', name: 'Export', description: 'Can export data', module: 'all' },
  { id: 'approve', name: 'Approve', description: 'Can approve workflows', module: 'all' },
];

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      color: 'purple',
      permissions: MODULES.flatMap(m => PERMISSIONS.map(p => `${m.id}_${p.id}`)),
      usersCount: 1,
      isSystem: true,
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Can manage operations and approve workflows',
      color: 'blue',
      permissions: ['dashboard_view', 'parts_view', 'parts_create', 'parts_edit', 'inventory_view', 'inventory_create', 'inventory_edit', 'sales_view', 'sales_create', 'sales_edit', 'sales_approve', 'customers_view', 'customers_create', 'customers_edit', 'reports_view', 'reports_export'],
      usersCount: 3,
      isSystem: false,
    },
    {
      id: '3',
      name: 'Sales Staff',
      description: 'Can manage sales and customer interactions',
      color: 'green',
      permissions: ['dashboard_view', 'sales_view', 'sales_create', 'sales_edit', 'customers_view', 'customers_create', 'customers_edit', 'inventory_view'],
      usersCount: 5,
      isSystem: false,
    },
    {
      id: '4',
      name: 'Inventory Staff',
      description: 'Can manage inventory and stock',
      color: 'orange',
      permissions: ['dashboard_view', 'inventory_view', 'inventory_create', 'inventory_edit', 'parts_view', 'parts_create', 'parts_edit'],
      usersCount: 4,
      isSystem: false,
    },
    {
      id: '5',
      name: 'Accountant',
      description: 'Can manage financial records',
      color: 'yellow',
      permissions: ['dashboard_view', 'accounts_view', 'accounts_create', 'accounts_edit', 'reports_view', 'reports_export', 'sales_view', 'purchase_view'],
      usersCount: 2,
      isSystem: false,
    },
    {
      id: '6',
      name: 'Viewer',
      description: 'Read-only access to view data',
      color: 'gray',
      permissions: MODULES.map(m => `${m.id}_view`),
      usersCount: 3,
      isSystem: false,
    },
  ]);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: [] as string[],
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const colorOptions = [
    { value: 'purple', bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    { value: 'blue', bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    { value: 'green', bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
    { value: 'orange', bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
    { value: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
    { value: 'red', bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
    { value: 'gray', bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' },
  ];

  const getColorClasses = (color: string) => {
    const found = colorOptions.find(c => c.value === color);
    return found || colorOptions[0];
  };

  const handlePermissionToggle = (permKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  const handleModuleToggleAll = (moduleId: string, checked: boolean) => {
    const modulePerms = PERMISSIONS.map(p => `${moduleId}_${p.id}`);
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? Array.from(new Set([...prev.permissions, ...modulePerms]))
        : prev.permissions.filter(p => !modulePerms.includes(p)),
    }));
  };

  const isModuleFullySelected = (moduleId: string) => {
    const modulePerms = PERMISSIONS.map(p => `${moduleId}_${p.id}`);
    return modulePerms.every(p => formData.permissions.includes(p));
  };

  const isModulePartiallySelected = (moduleId: string) => {
    const modulePerms = PERMISSIONS.map(p => `${moduleId}_${p.id}`);
    const selected = modulePerms.filter(p => formData.permissions.includes(p));
    return selected.length > 0 && selected.length < modulePerms.length;
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: [...role.permissions],
    });
    setShowForm(true);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      permissions: [],
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole) {
      setRoles(prev => prev.map(r => 
        r.id === selectedRole.id
          ? { ...r, name: formData.name, description: formData.description, color: formData.color, permissions: formData.permissions }
          : r
      ));
      setSuccess('Role updated successfully');
    } else {
      const newRole: Role = {
        id: String(Date.now()),
        name: formData.name,
        description: formData.description,
        color: formData.color,
        permissions: formData.permissions,
        usersCount: 0,
        isSystem: false,
      };
      setRoles(prev => [...prev, newRole]);
      setSuccess('Role created successfully');
    }
    
    setShowForm(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      setError('Cannot delete system roles');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    setRoles(prev => prev.filter(r => r.id !== roleId));
    setSuccess('Role deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Roles</h2>
          <p className="text-sm text-gray-500">Manage user roles and their permissions</p>
        </div>
        <Button onClick={handleCreateRole} className="bg-primary-500 hover:bg-primary-600 text-white">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const colorClass = getColorClasses(role.color);
          return (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colorClass.bg} rounded-lg flex items-center justify-center`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          System Role
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">{role.usersCount} users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="text-sm text-gray-600">{role.permissions.length} permissions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedRole ? 'Edit Role' : 'Create New Role'}</CardTitle>
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roleName">Role Name *</Label>
                      <Input
                        id="roleName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={selectedRole?.isSystem}
                        className="mt-1"
                        placeholder="e.g., Sales Manager"
                      />
                    </div>
                    <div>
                      <Label>Role Color</Label>
                      <div className="flex items-center gap-2 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: color.value })}
                            className={`w-8 h-8 rounded-full ${color.bg} transition-transform ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1"
                      placeholder="Brief description of this role"
                    />
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Permissions Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Module</th>
                          {PERMISSIONS.map((perm) => (
                            <th key={perm.id} className="text-center px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                              {perm.name}
                            </th>
                          ))}
                          <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">All</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULES.map((module) => (
                          <tr key={module.id} className="hover:bg-gray-50 border-b">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{module.icon}</span>
                                <span className="font-medium text-gray-900">{module.name}</span>
                              </div>
                            </td>
                            {PERMISSIONS.map((perm) => {
                              const permKey = `${module.id}_${perm.id}`;
                              return (
                                <td key={permKey} className="text-center px-3 py-3">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permKey)}
                                    onChange={() => handlePermissionToggle(permKey)}
                                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                              );
                            })}
                            <td className="text-center px-3 py-3">
                              <input
                                type="checkbox"
                                checked={isModuleFullySelected(module.id)}
                                ref={(el) => {
                                  if (el) el.indeterminate = isModulePartiallySelected(module.id);
                                }}
                                onChange={(e) => handleModuleToggleAll(module.id, e.target.checked)}
                                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {formData.permissions.length} permissions selected
                  </p>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary-500 hover:bg-primary-600">
                      {selectedRole ? 'Update Role' : 'Create Role'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

