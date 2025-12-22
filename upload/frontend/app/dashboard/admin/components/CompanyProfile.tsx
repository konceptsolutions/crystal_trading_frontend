'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompanyInfo {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  taxId: string;
  registrationNo: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  logo?: string;
}

interface SystemSettings {
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiry: number;
  twoFactorAuth: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
}

interface InvoiceSettings {
  prefix: string;
  startNumber: number;
  termsAndConditions: string;
  paymentTerms: string;
  bankDetails: string;
  footerText: string;
  showLogo: boolean;
  showSignature: boolean;
}

export default function CompanyProfile() {
  const [activeSection, setActiveSection] = useState<'company' | 'system' | 'invoice' | 'notifications'>('company');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'CTC Auto Parts',
    legalName: 'CTC Trading Company (Pvt) Ltd.',
    email: 'info@ctcautoparts.com',
    phone: '+92 42 1234567',
    fax: '+92 42 1234568',
    website: 'www.ctcautoparts.com',
    address: '123 Industrial Area, Main Boulevard',
    city: 'Lahore',
    state: 'Punjab',
    country: 'Pakistan',
    zipCode: '54000',
    taxId: 'NTN-1234567-8',
    registrationNo: 'REG-2020-12345',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: 'July',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    twoFactorAuth: false,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    debugMode: false,
  });

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    prefix: 'INV',
    startNumber: 1001,
    termsAndConditions: '1. Payment is due within 30 days.\n2. Goods once sold cannot be returned.\n3. All disputes subject to local jurisdiction.',
    paymentTerms: 'Net 30',
    bankDetails: 'Bank: ABC Bank\nAccount: 1234567890\nIBAN: PK12ABCD1234567890123456',
    footerText: 'Thank you for your business!',
    showLogo: true,
    showSignature: true,
  });

  const handleSaveCompany = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess('Company information saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const handleSaveSystem = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('System settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const handleSaveInvoice = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Invoice settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const sections = [
    { id: 'company', label: 'Company Info', icon: '🏢' },
    { id: 'system', label: 'System Settings', icon: '⚙️' },
    { id: 'invoice', label: 'Invoice Settings', icon: '📄' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

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
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Company Information */}
          {activeSection === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Manage your company's basic information and branding</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Logo Upload */}
                <div className="flex items-center gap-6 pb-6 border-b mb-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    {companyInfo.logo ? (
                      <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Company Logo</h3>
                    <p className="text-sm text-gray-500 mb-2">PNG, JPG up to 2MB. Recommended: 200x200px</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Upload Logo</Button>
                      {companyInfo.logo && <Button size="sm" variant="ghost" className="text-red-500">Remove</Button>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      value={companyInfo.legalName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, legalName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fax">Fax Number</Label>
                    <Input
                      id="fax"
                      value={companyInfo.fax}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, fax: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={companyInfo.state}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <select
                      id="country"
                      value={companyInfo.country}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Pakistan">Pakistan</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={companyInfo.zipCode}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, zipCode: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID (NTN)</Label>
                    <Input
                      id="taxId"
                      value={companyInfo.taxId}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationNo">Registration Number</Label>
                    <Input
                      id="registrationNo"
                      value={companyInfo.registrationNo}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNo: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="border-t mt-6 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        value={companyInfo.currency}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, currency: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="PKR">PKR - Pakistani Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={companyInfo.timezone}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, timezone: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Asia/Karachi">Asia/Karachi (PKT +5)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                        <option value="Asia/Riyadh">Asia/Riyadh (AST +3)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="America/New_York">America/New York (EST/EDT)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
                      <select
                        id="fiscalYear"
                        value={companyInfo.fiscalYearStart}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, fiscalYearStart: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <Button onClick={handleSaveCompany} disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Settings */}
          {activeSection === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system behavior and security settings</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Security Settings */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="120"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto logout after inactivity</p>
                    </div>
                    <div>
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={systemSettings.maxLoginAttempts}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maxLoginAttempts: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Before account lockout</p>
                    </div>
                    <div>
                      <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                      <Input
                        id="passwordExpiry"
                        type="number"
                        min="30"
                        max="365"
                        value={systemSettings.passwordExpiry}
                        onChange={(e) => setSystemSettings({ ...systemSettings, passwordExpiry: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Force password change after</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Require 2FA for all users</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({ ...systemSettings, twoFactorAuth: !systemSettings.twoFactorAuth })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.twoFactorAuth ? 'bg-primary-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backup Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    Backup Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Automatic Backups</p>
                        <p className="text-sm text-gray-500">Enable scheduled backups</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({ ...systemSettings, autoBackup: !systemSettings.autoBackup })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.autoBackup ? 'bg-primary-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.autoBackup ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div>
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <select
                        id="backupFrequency"
                        value={systemSettings.backupFrequency}
                        onChange={(e) => setSystemSettings({ ...systemSettings, backupFrequency: e.target.value })}
                        disabled={!systemSettings.autoBackup}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        <option value="hourly">Every Hour</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* System Mode */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    System Mode
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`flex items-center justify-between p-4 rounded-lg ${systemSettings.maintenanceMode ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                      <div>
                        <p className="font-medium text-gray-900">Maintenance Mode</p>
                        <p className="text-sm text-gray-500">Restrict access to admins only</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.maintenanceMode ? 'bg-yellow-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-lg ${systemSettings.debugMode ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <div>
                        <p className="font-medium text-gray-900">Debug Mode</p>
                        <p className="text-sm text-gray-500">Enable detailed error logging</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({ ...systemSettings, debugMode: !systemSettings.debugMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.debugMode ? 'bg-red-500' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.debugMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <Button onClick={handleSaveSystem} disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Settings */}
          {activeSection === 'invoice' && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>Configure invoice numbering, templates, and default values</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      value={invoiceSettings.prefix}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })}
                      className="mt-1"
                      placeholder="e.g., INV"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startNumber">Starting Number</Label>
                    <Input
                      id="startNumber"
                      type="number"
                      value={invoiceSettings.startNumber}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, startNumber: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                    <select
                      id="paymentTerms"
                      value={invoiceSettings.paymentTerms}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, paymentTerms: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 7">Net 7</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={invoiceSettings.showLogo}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showLogo: e.target.checked })}
                        className="w-4 h-4 text-primary-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Show Logo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={invoiceSettings.showSignature}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showSignature: e.target.checked })}
                        className="w-4 h-4 text-primary-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Show Signature</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bankDetails">Bank Details</Label>
                  <textarea
                    id="bankDetails"
                    value={invoiceSettings.bankDetails}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, bankDetails: e.target.value })}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter bank account details for payment"
                  />
                </div>

                <div>
                  <Label htmlFor="termsConditions">Terms & Conditions</Label>
                  <textarea
                    id="termsConditions"
                    value={invoiceSettings.termsAndConditions}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                    rows={4}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter default terms and conditions"
                  />
                </div>

                <div>
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={invoiceSettings.footerText}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., Thank you for your business!"
                  />
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <Button onClick={handleSaveInvoice} disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email and SMS notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Email Notifications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Notifications
                    </h3>
                    <button
                      onClick={() => setSystemSettings({ ...systemSettings, emailNotifications: !systemSettings.emailNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.emailNotifications ? 'bg-primary-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-3 pl-7">
                    {['Order confirmations', 'Invoice reminders', 'Low stock alerts', 'System updates', 'User activity alerts'].map((item, i) => (
                      <label key={i} className={`flex items-center gap-3 ${!systemSettings.emailNotifications ? 'opacity-50' : ''}`}>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-500 rounded" disabled={!systemSettings.emailNotifications} />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* SMS Notifications */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      SMS Notifications
                    </h3>
                    <button
                      onClick={() => setSystemSettings({ ...systemSettings, smsNotifications: !systemSettings.smsNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.smsNotifications ? 'bg-primary-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-3 pl-7">
                    {['Critical alerts only', 'Payment received', 'Order status updates'].map((item, i) => (
                      <label key={i} className={`flex items-center gap-3 ${!systemSettings.smsNotifications ? 'opacity-50' : ''}`}>
                        <input type="checkbox" defaultChecked={i === 0} className="w-4 h-4 text-primary-500 rounded" disabled={!systemSettings.smsNotifications} />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <Button onClick={handleSaveSystem} disabled={loading} className="bg-primary-500 hover:bg-primary-600">
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

