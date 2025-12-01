'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface InventoryOverviewProps {
  data: Array<{ month: string; added: number; used: number }>;
  timeRange?: 'week' | 'month' | 'year';
}

export default function InventoryOverview({ data, timeRange = 'month' }: InventoryOverviewProps) {
  // Modern SaaS color palette
  const primary = '#ff6b35';
  const secondary = '#fb923c';
  const text = '#475569';
  const gridColor = '#e2e8f0';
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted and container has dimensions
  useEffect(() => {
    setMounted(true);
    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setMounted(true);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [timeRange]);

  // Ensure we have valid data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[380px] flex items-center justify-center text-slate-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ width: '100%' }}>
      <div 
        ref={containerRef}
        className="transition-opacity duration-500 ease-in-out"
        style={{ 
          width: '100%', 
          height: '380px', 
          minHeight: '380px',
          position: 'relative',
        }}
      >
        {mounted && (
          <ResponsiveContainer 
            width="100%" 
            height={380}
            minHeight={380}
            minWidth={0}
          >
          <ComposedChart 
            data={data} 
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            key={timeRange}
          >
            {/* Minimal grid - very low opacity */}
            <CartesianGrid
              strokeDasharray="2 4"
              stroke={gridColor}
              opacity={0.4}
              vertical={false}
            />

            {/* Y Axis - clean, no stretching */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: text, fontSize: 11, fontWeight: 500 }}
              padding={{ top: 20, bottom: 20 }}
              style={{
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums',
              }}
            />

            {/* X Axis - avoid overlapping and keep small */}
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: text, fontSize: 11, fontWeight: 500 }}
              padding={{ left: 10, right: 10 }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 4px 12px rgba(16,24,40,0.08)',
                backgroundColor: '#0f172a',
                padding: '8px 12px',
              }}
              itemStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}
              labelStyle={{ color: 'white', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}
            />

            {/* Legend hidden since we only have one line */}

            {/* Area underneath the "added" series - very subtle */}
            <Area
              type="monotone"
              dataKey="added"
              fill={primary}
              stroke="none"
              fillOpacity={0.08}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* Main 'added' line - sharp, no blur, slightly thicker */}
            <Line
              type="monotone"
              dataKey="added"
              stroke={primary}
              strokeWidth={2.5}
              dot={{ r: 3, stroke: primary, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 5, stroke: primary, strokeWidth: 2, fill: '#fff' }}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Small footer separator to match dashboard style */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: primary }} />
            <span className="text-xs font-medium">Parts Added</span>
          </div>
        </div>
      </div>
    </div>
  );
}

