'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PartForm, { Part } from '@/components/inventory/PartForm';
import KitForm, { Kit } from '@/components/inventory/KitForm';
import ModelsPanel from '@/components/inventory/ModelsPanel';
import PartsTable from '@/components/inventory/PartsTable';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function PartsPage() {
  const [activeFormTab, setActiveFormTab] = useState<'part' | 'kit'>('part');
  const [activeListTab, setActiveListTab] = useState<'parts' | 'kits'>('parts');
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Resizable panel widths (in percentage)
  const [leftWidth, setLeftWidth] = useState(35); // Start with 35% for left panel
  const [middleWidth, setMiddleWidth] = useState(16.67); // ~2/12 = 16.67% (not used, kept for reference)
  const [rightWidth, setRightWidth] = useState(49); // Remaining space for right panel
  
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on desktop size
  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  // Shared models state between PartForm and ModelsPanel
  const [currentModels, setCurrentModels] = useState<any[]>([
    { id: '', partId: '', modelNo: '', qtyUsed: 1, tab: 'P1' }
  ]);
  
  // Kits list state
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [kitSearchTerm, setKitSearchTerm] = useState('');
  const [kitError, setKitError] = useState('');
  const [kitSuccess, setKitSuccess] = useState('');

  useEffect(() => {
    if (activeListTab === 'kits') {
      loadKits();
    }
  }, [activeListTab, kitSearchTerm]);

  const loadKits = async () => {
    setKitsLoading(true);
    try {
      const response = await api.get('/kits');
      setKits(response.data.kits || []);
    } catch (error: any) {
      if (!error.message?.includes('Backend server is not running')) {
        console.error('Failed to load kits:', error);
      }
      setKits([]);
    } finally {
      setKitsLoading(false);
    }
  };

  const filteredKits = kits.filter(kit =>
    kit.kitNo.toLowerCase().includes(kitSearchTerm.toLowerCase()) ||
    kit.name.toLowerCase().includes(kitSearchTerm.toLowerCase()) ||
    kit.description?.toLowerCase().includes(kitSearchTerm.toLowerCase())
  );

  const handleSelectPart = async (part: Part) => {
    setLoading(true);
    try {
      // Fetch full part details with models
      const response = await api.get(`/parts/${part.id}`);
      const fetchedPart = response.data.part;
      setSelectedPart(fetchedPart);
      setActiveFormTab('part');
      setSelectedKit(null);
      
      // Immediately sync models from the fetched part
      if (fetchedPart?.models && Array.isArray(fetchedPart.models) && fetchedPart.models.length > 0) {
        const modelsWithPartId = fetchedPart.models.map((model: any) => ({
          id: model.id || '',
          partId: fetchedPart.id,
          modelNo: model.modelNo || '',
          qtyUsed: model.qtyUsed || 1,
          tab: model.tab || 'P1'
        }));
        setCurrentModels(modelsWithPartId);
      } else {
        setCurrentModels([
          { id: '', partId: fetchedPart.id, modelNo: '', qtyUsed: 1, tab: 'P1' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load part details:', error);
      setSelectedPart(part);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePart = (part: Part) => {
    console.log('PartsPage: handleSavePart called with part:', part);
    console.log('PartsPage: Models in saved part:', part?.models);
    
    // Update selectedPart with the saved part (which includes models)
    setSelectedPart(part);
    
    // Immediately sync models from the saved part - this is critical for displaying saved models
    if (part?.models && Array.isArray(part.models) && part.models.length > 0) {
      const modelsWithPartId = part.models.map((model: any) => ({
        id: model.id || '',
        partId: part.id,
        modelNo: model.modelNo || '',
        qtyUsed: model.qtyUsed || 1,
        tab: model.tab || 'P1'
      }));
      console.log('PartsPage: Setting currentModels to:', modelsWithPartId);
      setCurrentModels(modelsWithPartId);
    } else {
      // If no models in response, check if we sent models - if so, keep currentModels
      // Otherwise reset to empty
      console.log('PartsPage: No models in saved part response');
      // Don't reset if user just entered models - they might not be in response yet
      // Only reset if we're sure there should be no models
    }
    
    // Trigger refresh of parts table
    setRefreshTrigger(prev => prev + 1);
  };

  // Reset models when selected part changes
  useEffect(() => {
    if (selectedPart?.id) {
      // Always sync models from selectedPart when partId or models change
      if (selectedPart?.models && Array.isArray(selectedPart.models) && selectedPart.models.length > 0) {
        // Load existing models from the selected part
        const modelsWithPartId = selectedPart.models.map((model: any) => ({
          id: model.id || '',
          partId: selectedPart.id,
          modelNo: model.modelNo || '',
          qtyUsed: model.qtyUsed || 1,
          tab: model.tab || 'P1'
        }));
        console.log('PartsPage: Syncing models from selectedPart:', modelsWithPartId);
        setCurrentModels(modelsWithPartId);
      } else {
        // Reset to empty model (only 1) if no models in selectedPart
        // But only if currentModels is empty or doesn't match
        const hasCurrentModels = currentModels.some(m => m.modelNo && m.modelNo.trim());
        if (!hasCurrentModels) {
          setCurrentModels([
            { id: '', partId: selectedPart.id, modelNo: '', qtyUsed: 1, tab: 'P1' }
          ]);
        }
      }
    } else {
      // No part selected, reset to empty
      setCurrentModels([
        { id: '', partId: '', modelNo: '', qtyUsed: 1, tab: 'P1' }
      ]);
    }
  }, [selectedPart?.id]); // Only depend on partId to prevent overwriting user input

  const handleDeletePart = (id: string) => {
    setSelectedPart(null);
    // Trigger refresh of parts table
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSaveKit = (kit: Kit) => {
    setSelectedKit(kit);
    setRefreshTrigger(prev => prev + 1);
    if (activeListTab === 'kits') {
      loadKits();
    }
  };

  const handleDeleteKit = (id: string) => {
    setSelectedKit(null);
    setRefreshTrigger(prev => prev + 1);
    if (activeListTab === 'kits') {
      loadKits();
    }
  };

  const handleBreakKitFromList = async (kit: Kit) => {
    if (!kit.id) return;
    
    const itemCount = kit.items?.length || 0;
    const confirmMessage = `Are you sure you want to break this kit?\n\n` +
      `Kit: ${kit.name} (${kit.kitNo})\n` +
      `Items: ${itemCount}\n\n` +
      `All ${itemCount} item${itemCount !== 1 ? 's' : ''} will be returned to inventory and the kit will be deleted permanently.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setKitsLoading(true);
      setKitError('');
      const response = await api.post(`/kits/${kit.id}/break`);
      
      // Show detailed success message
      let successMsg = response.data.message || 'Kit broken successfully. All items have been returned to inventory.';
      if (response.data.returnedItems && response.data.returnedItems.length > 0) {
        const itemsList = response.data.returnedItems
          .map((item: any) => `  • ${item.partNo}: ${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`)
          .join('\n');
        successMsg += `\n\nReturned items:\n${itemsList}`;
      }
      
      setKitSuccess(successMsg);
      if (selectedKit?.id === kit.id) {
        setSelectedKit(null);
      }
      loadKits();
      
      // Clear success message after 5 seconds
      setTimeout(() => setKitSuccess(''), 5000);
    } catch (err: any) {
      setKitError(err.response?.data?.error || err.response?.data?.message || 'Failed to break kit');
      setKitSuccess('');
    } finally {
      setKitsLoading(false);
    }
  };

  const handleDeleteKitFromList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kit?\n\nNote: Items will NOT be returned to inventory. Use "Break Kit" to return items to inventory.')) {
      return;
    }
    try {
      setKitsLoading(true);
      await api.delete(`/kits/${id}`);
      setKitSuccess('Kit deleted successfully');
      if (selectedKit?.id === id) {
        setSelectedKit(null);
      }
      loadKits();
      setTimeout(() => setKitSuccess(''), 3000);
    } catch (error: any) {
      setKitError(error.response?.data?.error || 'Failed to delete kit. Please try again.');
      setKitSuccess('');
    } finally {
      setKitsLoading(false);
    }
  };

  // Resize handlers
  const handleMouseDown = useCallback((side: 'left' | 'right') => {
    setIsResizing(side);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Models panel is fixed at 280px
    const modelsFixedWidth = 280;
    const availableWidth = containerWidth - modelsFixedWidth;
    const percentage = (mouseX / availableWidth) * 100;

    if (isResizing === 'left') {
      // Left handle: Only adjusts Part Entry panel
      // Models stays fixed at 280px, Parts List adjusts
      const minLeft = 25; // Minimum 25%
      const maxLeft = 45; // Maximum 45% (user requirement)
      const newLeftWidth = Math.max(minLeft, Math.min(maxLeft, percentage));
      
      // Parts List takes remaining space (will use flex-grow)
        setLeftWidth(newLeftWidth);
    } else if (isResizing === 'right') {
      // Right handle: Only adjusts Parts List panel
      // Models stays fixed at 280px, Part Entry adjusts
      const leftEdgePercent = (leftWidth / 100) * availableWidth;
      const mousePosition = mouseX;
      const newRightWidth = ((mousePosition - leftEdgePercent - modelsFixedWidth) / availableWidth) * 100;
      
      const minRight = 25; // Minimum 25%
      const maxRight = 60; // Maximum 60%
      const clampedRight = Math.max(minRight, Math.min(maxRight, newRightWidth));
      
      // Part Entry takes remaining space (but max 45%)
      const newLeftWidth = Math.min(45, 100 - clampedRight);
      
      // Ensure minimum sizes are maintained
      if (newLeftWidth >= 25 && clampedRight >= 25 && newLeftWidth <= 45) {
        setLeftWidth(newLeftWidth);
        setRightWidth(clampedRight);
      }
    }
  }, [isResizing, leftWidth, rightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col xl:flex-row p-2 sm:p-3 md:p-4 bg-gray-50 w-full scroll-smooth parts-page-container"
      style={{ 
        maxWidth: '100%', 
        boxSizing: 'border-box',
        height: isDesktop ? 'calc(100vh - 120px)' : 'auto',
        minHeight: isDesktop ? 'calc(100vh - 120px)' : '100vh',
        overflow: isDesktop ? 'hidden' : 'visible',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Left Panel - Part/Kit Form with Tabs */}
      <div 
        className="order-1 xl:order-1 flex flex-col overflow-hidden flex-shrink-0 w-full xl:w-auto mb-4 xl:mb-0 scroll-smooth"
        style={{ 
          flex: isDesktop ? `0 0 ${Math.min(45, leftWidth)}%` : 'none',
          height: isDesktop ? '100%' : 'auto',
          maxHeight: isDesktop ? '100%' : '80vh',
          maxWidth: isDesktop ? '45%' : '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollSnapAlign: isDesktop ? 'none' : 'start'
        }}
      >
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 flex flex-col overflow-hidden" style={{ height: isDesktop ? '100%' : 'auto', maxHeight: isDesktop ? '100%' : '80vh' }}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveFormTab('part');
                setActiveListTab('parts');
                setSelectedKit(null);
              }}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                activeFormTab === 'part'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Part Entry
            </button>
            <button
              onClick={() => {
                setActiveFormTab('kit');
                setActiveListTab('kits');
                setSelectedPart(null);
              }}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                activeFormTab === 'kit'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Create Kit
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-0 flex-1 flex flex-col min-h-0 tab-fade overflow-hidden">
            {activeFormTab === 'part' ? (
              <PartForm
                part={selectedPart}
                onSave={handleSavePart}
                onDelete={handleDeletePart}
                models={currentModels}
              />
            ) : (
              <KitForm
                kit={selectedKit}
                onSave={handleSaveKit}
                onDelete={handleDeleteKit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Resize Handle - Left (between Part Entry and Models) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          handleMouseDown('left');
        }}
        className="hidden xl:flex items-center justify-center w-4 h-full cursor-col-resize hover:bg-primary-100/50 transition-colors order-3 xl:order-2 flex-shrink-0 relative z-10"
        style={{ minWidth: '16px', maxWidth: '16px' }}
        title="Drag to resize"
      >
        <div className="w-0.5 h-12 bg-gray-300 hover:bg-primary-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
      </div>

      {/* Middle Panel - Models (Fixed Size, Not Resizable) */}
      <div 
        className="overflow-y-auto overflow-x-auto scroll-smooth order-3 xl:order-2 flex-shrink-0 w-full xl:w-[280px] mb-4 xl:mb-0"
        style={{ 
          width: isDesktop ? '280px' : '100%',
          height: isDesktop ? '100%' : 'auto',
          maxHeight: isDesktop ? '100%' : '60vh',
          minWidth: isDesktop ? '280px' : '0',
          maxWidth: isDesktop ? '280px' : '100%',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box',
          flexShrink: 0,
          scrollSnapAlign: isDesktop ? 'none' : 'start'
        }}
      >
        <ModelsPanel 
          key={`models-${selectedPart?.id || 'new'}-${currentModels.length}`}
          partId={selectedPart?.id} 
          partName={selectedPart?.partNo || selectedPart?.description || ''}
          stockQuantity={(selectedPart as any)?.stock?.quantity ?? 0}
          models={currentModels}
          onModelsChange={setCurrentModels}
        />
      </div>

      {/* Resize Handle - Right (between Models and Parts List) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          handleMouseDown('right');
        }}
        className="hidden xl:flex items-center justify-center w-4 h-full cursor-col-resize hover:bg-primary-100/50 transition-colors order-2 xl:order-3 flex-shrink-0 relative z-10"
        style={{ minWidth: '16px', maxWidth: '16px' }}
        title="Drag to resize"
      >
        <div className="w-0.5 h-12 bg-gray-300 hover:bg-primary-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
      </div>

      {/* Right Panel - Parts/Kits List with Tabs */}
      <div 
        className="overflow-hidden order-2 xl:order-3 flex flex-col min-w-0 w-full xl:w-auto scroll-smooth"
        style={{ 
          flex: isDesktop ? `1 1 0` : 'none',
          height: isDesktop ? '100%' : 'auto',
          maxHeight: isDesktop ? '100%' : '80vh',
          minWidth: 0,
          maxWidth: isDesktop ? 'none' : '100%',
          boxSizing: 'border-box',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollSnapAlign: isDesktop ? 'none' : 'start'
        }}
      >
        <Card className="bg-white border border-gray-200 shadow-medium rounded-lg overflow-hidden flex flex-col w-full min-w-0" style={{ height: isDesktop ? '100%' : 'auto', maxHeight: isDesktop ? '100%' : '80vh' }}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => setActiveListTab('parts')}
              className={`flex-1 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeListTab === 'parts'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Parts List
            </button>
            <button
              onClick={() => setActiveListTab('kits')}
              className={`flex-1 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeListTab === 'kits'
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Kits List
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto overflow-x-auto tab-fade scroll-smooth" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollPadding: '0' }}>
            {activeListTab === 'parts' ? (
              <PartsTable
                onSelectPart={handleSelectPart}
                selectedPartId={selectedPart?.id}
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <div className="p-4">
                {kitError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium">Error</p>
                        <p className="text-sm mt-1">{kitError}</p>
                      </div>
                      <button
                        onClick={() => setKitError('')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {kitSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md whitespace-pre-line">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium">Success!</p>
                        <p className="text-sm mt-1">{kitSuccess}</p>
                      </div>
                      <button
                        onClick={() => setKitSuccess('')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                      type="text"
                      placeholder="Search kits..."
                      value={kitSearchTerm}
                      onChange={(e) => setKitSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                {kitsLoading ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-500">Loading kits...</span>
                    </div>
                  </div>
                ) : filteredKits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm text-gray-500">
                        {kitSearchTerm ? 'No kits found matching your search.' : 'No kits found. Create one to get started.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredKits.map((kit) => (
                      <div
                        key={kit.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-primary-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedKit(kit);
                          setActiveFormTab('kit');
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{kit.name}</h3>
                              <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                                {kit.kitNo}
                              </span>
                              {kit.status === 'I' && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {kit.description && (
                              <p className="text-sm text-gray-600 mb-2">{kit.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                <strong>Items:</strong> {kit.items?.length || 0}
                              </span>
                              {kit.totalCost && (
                                <span>
                                  <strong>Total Cost:</strong> ${kit.totalCost.toFixed(2)}
                                </span>
                              )}
                              {kit.price && (
                                <span>
                                  <strong>Price:</strong> ${kit.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKit(kit);
                                setActiveFormTab('kit');
                              }}
                              className="border-primary-300 text-primary-700 hover:bg-primary-50"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBreakKitFromList(kit);
                              }}
                              disabled={kitsLoading}
                              className="border-primary-300 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                              title="Break kit and return items to inventory"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Break Kit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                kit.id && handleDeleteKitFromList(kit.id);
                              }}
                              disabled={kitsLoading}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              title="Delete kit without returning items to inventory"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
