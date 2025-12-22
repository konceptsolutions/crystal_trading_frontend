'use client';

import ModelsSelection from '@/components/inventory/ModelsSelection';

export default function ModelsPage() {
  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Models Management</h1>
              <p className="text-sm text-gray-500 mt-1">Select a part to view its models and quantity used</p>
            </div>
          </div>
        </div>

        {/* Models Selection Component */}
        <ModelsSelection />
      </div>
    </div>
  );
}

