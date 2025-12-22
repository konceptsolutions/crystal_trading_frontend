'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import InventoryOverview from '@/components/charts/InventoryOverview';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalParts: number;
  totalCategories: number;
  totalKits: number;
  totalSuppliers: number;
  totalPurchaseOrders: number;
  lowStockItems: number;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  supplier?: {
    name: string;
  };
  supplierName: string;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  totalAmount: number;
  orderDate: string;
  expectedDate?: string;
  items: Array<{
    part?: {
      partNo: string;
      description?: string;
    };
    partNo: string;
    description?: string;
    quantity: number;
  }>;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1500 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const startValue = 0;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (value - startValue) * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value); // Ensure final value is set
      }
    };
    
    if (value === 0) {
      setCount(0);
    } else {
      requestAnimationFrame(animate);
    }
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}</span>;
};

type SparklinePoint = { x: number; y: number };

// Enhanced Professional Sparkline Chart Component - Always Visible
const SparklineChart = ({ data, color = 'primary' }: { data: number[]; color?: string }) => {
  // Debug: Log data on mount/update
  useEffect(() => {
    console.log(`SparklineChart [${color}]:`, { data, dataLength: data?.length, isValid: Array.isArray(data) });
  }, [data, color]);

  // Color mapping
  const colorMap: Record<string, { main: string; gradient: string[] }> = {
    primary: { 
      main: '#ff6b35', 
      gradient: ['#ff6b35', '#ff8c5a', '#ffa880']
    },
    green: { 
      main: '#10b981', 
      gradient: ['#10b981', '#34d399', '#6ee7b7']
    },
    blue: { 
      main: '#3b82f6', 
      gradient: ['#3b82f6', '#60a5fa', '#93c5fd']
    },
    purple: { 
      main: '#8b5cf6', 
      gradient: ['#8b5cf6', '#a78bfa', '#c4b5fd']
    },
  };
  
  const colors = colorMap[color] || colorMap.primary;
  
  // Process data - always ensure we have valid data
  const processedData = useMemo(() => {
    let validData: number[] = [];
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      validData = [10, 15, 12, 18, 20, 22, 25];
    } else {
      validData = data.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
      if (validData.length === 0) {
        validData = [10, 15, 12, 18, 20, 22, 25];
      } else if (validData.length === 1) {
        validData = [validData[0] * 0.8, validData[0] * 0.9, validData[0], validData[0] * 1.1, validData[0] * 1.05, validData[0] * 1.15, validData[0] * 1.2];
      } else if (validData.length < 7) {
        const interpolated: number[] = [];
        for (let i = 0; i < 7; i++) {
          const t = i / 6;
          const index = t * (validData.length - 1);
          const lower = Math.floor(index);
          const upper = Math.min(Math.ceil(index), validData.length - 1);
          const fraction = index - lower;
          const value = validData[lower] + (validData[upper] - validData[lower]) * fraction;
          interpolated.push(value);
        }
        validData = interpolated;
      }
    }

    if (validData.length < 2) {
      validData = [validData[0] || 10, validData[0] || 15];
    }

    return validData;
  }, [data]);

  // Calculate chart paths
  const chartPaths = useMemo(() => {
    const max = Math.max(...processedData);
    const min = Math.min(...processedData);
    const range = max - min || 1;
    
    // Add subtle variation if data is too flat
    const enhancedData = processedData.map((value, index) => {
      if (range === 0 && processedData.length > 1) {
        const variation = Math.sin((index / processedData.length) * Math.PI * 2) * 0.3;
        return value + variation;
      }
      return value;
    });
    
    // Create points
    const points: SparklinePoint[] = enhancedData.map((value, index) => {
      const x = (index / (enhancedData.length - 1 || 1)) * 100;
      const normalizedValue = range > 0 ? (value - min) / range : 0.5;
      const y = 100 - (normalizedValue * 70) - 15;
      return { x, y };
    });
    
    // Create smooth path
    const createPath = (points: SparklinePoint[]): string => {
      if (points.length < 2) return `M 0,50 L 100,50`;
      if (points.length === 2) {
        return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
      }
      
      let path = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        const tension = 0.5;
        const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
        const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
        const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
        const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
        
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      return path;
    };
    
    const smoothPath = createPath(points);
    return {
      smoothPath,
      areaPath: `${smoothPath} L 100,100 L 0,100 Z`,
    };
  }, [processedData]);

  // Unique IDs per instance
  const [instanceId] = useState(() => Math.random().toString(36).substr(2, 9));
  const gradientId = `spark-grad-${color}-${instanceId}`;
  const lineGradientId = `spark-line-${color}-${instanceId}`;

  // Ensure we always have valid paths
  const finalPaths = chartPaths.smoothPath && chartPaths.smoothPath.length > 10 
    ? chartPaths 
    : { 
        smoothPath: "M 0,50 Q 25,30 50,40 T 100,45",
        areaPath: "M 0,50 Q 25,30 50,40 T 100,45 L 100,100 L 0,100 Z"
      };

  return (
    <div 
      className="w-full relative"
      style={{ 
        height: '56px', 
        minHeight: '56px',
        width: '100%',
        overflow: 'visible',
        position: 'relative'
      }}
    >
      <svg 
        width="100%" 
        height="56" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        style={{ 
          display: 'block',
          width: '100%',
          height: '56px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.main} stopOpacity="0.25" />
            <stop offset="50%" stopColor={colors.main} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors.main} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="50%" stopColor={colors.gradient[1]} />
            <stop offset="100%" stopColor={colors.gradient[2]} />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={finalPaths.areaPath}
          fill={`url(#${gradientId})`}
        />
        {/* Main line */}
        <path
          d={finalPaths.smoothPath}
          fill="none"
          stroke={`url(#${lineGradientId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Highlight */}
        <path
          d={finalPaths.smoothPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// Old AreaChart component - replaced with Recharts InventoryOverview component
// Keeping for reference but not used
const _AreaChart = ({ data, labels, partsUsedData }: { data: number[]; labels: string[]; partsUsedData?: number[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Calculate min/max from both datasets
  const allData = partsUsedData ? [...data, ...partsUsedData] : data;
  const dataMax = Math.max(...allData);
  const dataMin = Math.min(...allData);
  const max = Math.ceil(dataMax * 1.1);
  const min = Math.max(0, Math.floor(dataMin * 0.9));
  const range = max - min || 1;
  
  // Modern spacing - generous padding for clean edges
  const height = 320;
  const width = 100;
  const topPadding = 24;
  const rightPadding = 12;
  const leftPadding = 20; // Space for Y-axis labels
  const bottomPadding = 36; // Space for X-axis labels
  
  // Calculate chart area dimensions
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;
  const chartStartX = leftPadding;
  const chartStartY = topPadding;
  const chartEndY = height - bottomPadding;
  
  type ChartPoint = { x: number; y: number; value: number; index: number };

  const points: ChartPoint[] = data.map((value, index) => {
    const x = chartStartX + (index / (data.length - 1 || 1)) * chartWidth;
    const y = chartEndY - ((value - min) / range) * chartHeight;
    return { x, y, value, index };
  });
  
  const partsUsedPoints: ChartPoint[] = partsUsedData?.map((value, index) => {
    const x = chartStartX + (index / (partsUsedData.length - 1 || 1)) * chartWidth;
    const y = chartEndY - ((value - min) / range) * chartHeight;
    return { x, y, value, index };
  }) || [];
  
  // Create smooth bezier curve path using Catmull-Rom spline approximation
  const createSmoothPath = (points: ChartPoint[]) => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Calculate control points for smooth curve
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    return path;
  };
  
  const smoothPath = createSmoothPath(points);
  const partsUsedPath = partsUsedData ? createSmoothPath(partsUsedPoints) : '';
  const areaPath = `${smoothPath} L ${width - rightPadding},${chartEndY} L ${chartStartX},${chartEndY} Z`;
  
  // Calculate Y-axis labels (5 evenly spaced values) - clean formatting
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps }, (_, i) => {
    const value = min + (i / (yAxisSteps - 1)) * (max - min);
    return Math.round(value);
  }).reverse();
  
  return (
    <div className="relative w-full" style={{ height: '420px', minHeight: '420px' }} key={`chart-${data.join('-')}`}>
      <svg 
        className="w-full h-full" 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        style={{ 
          overflow: 'visible', 
          width: '100%', 
          height: '100%',
          shapeRendering: 'geometricPrecision',
          textRendering: 'geometricPrecision',
          fontSmooth: 'always',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        <defs>
          {/* Clean, subtle gradient - no exaggeration */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
          </linearGradient>
          {/* Subtle shadow for depth - no blurry glow */}
          <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#ff6b35" floodOpacity="0.15"/>
          </filter>
        </defs>
        
        {/* Minimal grid lines - very low opacity */}
        {yAxisLabels.map((labelValue, i) => {
          const yPercent = i / (yAxisSteps - 1);
          const yPos = chartStartY + (yPercent * chartHeight);
          return (
            <g key={i}>
              <line
                x1={chartStartX}
                y1={yPos}
                x2={width - rightPadding}
                y2={yPos}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                strokeDasharray="2,4"
                opacity="0.4"
                className="transition-opacity duration-300"
              />
              {/* Sharp Y-axis labels - no stretching */}
              <text
                x={chartStartX - 10}
                y={yPos + 3.5}
                fontSize="10"
                fill="#475569"
                textAnchor="end"
                fontWeight="500"
                fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                style={{ 
                  letterSpacing: '0',
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {labelValue}
              </text>
            </g>
          );
        })}
        
        {/* Area fill with animation */}
        <path 
          d={areaPath} 
          fill="url(#areaGradient)" 
          className="transition-all duration-1000 ease-out"
          style={{
            animation: 'fadeInArea 1s ease-out',
          }}
        />
        
        {/* Parts Used line - thin, sharp, dashed */}
        {partsUsedData && partsUsedPath && (
          <path
            d={partsUsedPath}
            fill="none"
            stroke="#fb923c"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,3"
            className="transition-all duration-1000 ease-out"
            style={{ opacity: 0.7 }}
          />
        )}
        
        {/* Parts Added line - thin, sharp, clean */}
        <path
          d={smoothPath}
          fill="none"
          stroke="#ff6b35"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#subtleShadow)"
          className="transition-all duration-1000 ease-out"
          style={{
            animation: 'drawLine 1.5s ease-out',
          }}
        />
        
        {/* Minimal data points - thin, sharp, properly aligned */}
        {points.map((point) => {
          const isHovered = hoveredIndex === point.index;
          const isSelected = selectedIndex === point.index;
          const radius = isHovered || isSelected ? 3.5 : 2.5;
          const partsUsedPoint = partsUsedPoints[point.index];
          
          return (
            <g key={point.index}>
              {/* Parts Used data point - small and clean */}
              {partsUsedPoint && (
                <g
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(point.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedIndex(selectedIndex === point.index ? null : point.index)}
                >
                  {(isHovered || isSelected) && (
                    <circle
                      cx={partsUsedPoint.x}
                      cy={partsUsedPoint.y}
                      r={radius + 1.5}
                      fill="#fb923c"
                      opacity="0.12"
                      className="transition-all duration-200"
                    />
                  )}
                  <circle
                    cx={partsUsedPoint.x}
                    cy={partsUsedPoint.y}
                    r={isHovered || isSelected ? 3 : 2.5}
                    fill="white"
                    stroke="#fb923c"
                    strokeWidth={isHovered || isSelected ? "2" : "1.5"}
                    className="transition-all duration-200"
                  />
                </g>
              )}
              
              {/* Parts Added data point - small and clean */}
              <g
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(point.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedIndex(selectedIndex === point.index ? null : point.index)}
              >
                {(isHovered || isSelected) && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={radius + 2}
                    fill="#ff6b35"
                    opacity="0.12"
                    className="transition-all duration-200"
                  />
                )}
                
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill="white"
                  stroke="#ff6b35"
                  strokeWidth={isHovered || isSelected ? "2.5" : "2"}
                  className="transition-all duration-200"
                />
                
                {/* Clean, minimal tooltip */}
                {(isHovered || isSelected) && (
                  <g>
                    <rect
                      x={point.x - 26}
                      y={point.y - 52}
                      width="52"
                      height={partsUsedPoint ? "36" : "22"}
                      rx="5"
                      fill="#0f172a"
                      opacity="0.95"
                      stroke="#1e293b"
                      strokeWidth="0.5"
                      className="transition-all duration-200"
                    />
                    <polygon
                      points={`${point.x - 4},${point.y - 16} ${point.x + 4},${point.y - 16} ${point.x},${point.y - 10}`}
                      fill="#0f172a"
                      opacity="0.95"
                    />
                    <text
                      x={point.x}
                      y={point.y - 38}
                      fontSize="8.5"
                      fill="#94a3b8"
                      textAnchor="middle"
                      fontWeight="500"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                    >
                      Added
                    </text>
                    <text
                      x={point.x}
                      y={point.y - 26}
                      fontSize="11"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="600"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      style={{ fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {point.value}
                    </text>
                    {partsUsedPoint && (
                      <>
                        <text
                          x={point.x}
                          y={point.y - 12}
                          fontSize="8.5"
                          fill="#94a3b8"
                          textAnchor="middle"
                          fontWeight="500"
                          fontFamily="ui-sans-serif, system-ui, sans-serif"
                        >
                          Used
                        </text>
                        <text
                          x={point.x}
                          y={point.y}
                          fontSize="11"
                          fill="#fb923c"
                          textAnchor="middle"
                          fontWeight="600"
                          fontFamily="ui-sans-serif, system-ui, sans-serif"
                          style={{ fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {partsUsedPoint.value}
                        </text>
                      </>
                    )}
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Evenly spaced X-axis labels - clean and readable */}
      <div className="absolute bottom-4 left-0 right-0" style={{ 
        paddingLeft: `calc(${leftPadding}% + 0.5rem)`, 
        paddingRight: `calc(${rightPadding}% + 0.5rem)`,
      }}>
        {labels.map((label, index) => {
          const labelPosition = (index / (labels.length - 1 || 1)) * 100;
          const isActive = hoveredIndex === index || selectedIndex === index;
          return (
            <span 
              key={index}
              className={`absolute transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-primary-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
              style={{ 
                left: `${labelPosition}%`,
                transform: `translateX(-50%)`,
                fontSize: '11px',
                fontWeight: isActive ? '600' : '500',
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '0',
                lineHeight: '1.4',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeInArea {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes drawLine {
          from {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ data, colors, size = 120 }: { 
  data: { label: string; value: number; color: string }[]; 
  colors: string[];
  size?: number;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 40;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {data.map((item, index) => {
          const percentage = item.value / total;
          const dashLength = circumference * percentage;
          const offset = currentOffset;
          currentOffset += dashLength;
          
          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                animation: `donutFill 1s ease-out ${index * 0.2}s both`,
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{total}</span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const max = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">{item.label}</span>
            <span className="text-gray-900 font-semibold">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
                animation: `barGrow 1s ease-out ${index * 0.1}s both`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ 
  icon, 
  label, 
  description,
  onClick, 
  color = 'primary',
  badge
}: { 
  icon: React.ReactNode; 
  label: string; 
  description: string;
  onClick: () => void;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'gray';
  badge?: string;
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 group-hover:bg-primary-100',
    green: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
  };
  
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{label}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">{description}</span>
      </div>
      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

// Activity Item Component
const ActivityItem = ({ 
  icon, 
  title, 
  description, 
  time, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  time: string; 
  color: string;
}) => (
  <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
      <p className="text-xs text-gray-500 truncate">{description}</p>
    </div>
    <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalParts: 0,
    totalCategories: 0,
    totalKits: 0,
    totalSuppliers: 0,
    totalPurchaseOrders: 0,
    lowStockItems: 0,
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sparklineData, setSparklineData] = useState<{
    parts: number[];
    categories: number[];
    kits: number[];
    suppliers: number[];
  }>({
    parts: [10, 15, 12, 18, 20, 22, 25],
    categories: [5, 8, 6, 10, 12, 15, 18],
    kits: [2, 3, 2, 4, 5, 6, 7],
    suppliers: [8, 10, 9, 12, 14, 16, 18],
  });
  const [percentageChanges, setPercentageChanges] = useState({
    parts: 12,
    categories: 12,
    kits: 12,
    suppliers: 12,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats from the new stats endpoint
      const statsRes = await api.get('/stats').catch(() => null);
      
      // Also fetch purchase orders for the order status chart
      const ordersRes = await api.get('/purchase-orders').catch(() => ({ data: { purchaseOrders: [] } }));

      if (statsRes?.data) {
        const { stats, sparklines } = statsRes.data;
        setStats({
          totalParts: stats.totalParts || 0,
          totalCategories: stats.totalCategories || 0,
          totalKits: stats.totalKits || 0,
          totalSuppliers: stats.totalSuppliers || 0,
          totalPurchaseOrders: stats.totalPurchaseOrders || 0,
          lowStockItems: 0,
        });
        
        // Update percentage changes
        setPercentageChanges({
          parts: stats.partsChange || 0,
          categories: stats.categoriesChange || 0,
          kits: stats.kitsChange || 0,
          suppliers: stats.suppliersChange || 0,
        });

        // Update sparkline data if available - ensure arrays are valid
        if (sparklines) {
          const validateArray = (arr: any, fallback: number[]): number[] => {
            if (Array.isArray(arr) && arr.length > 0 && arr.every((v: any) => typeof v === 'number' && !isNaN(v))) {
              return arr;
            }
            return fallback;
          };
          
          setSparklineData({
            parts: validateArray(sparklines.parts, [10, 15, 12, 18, 20, 22, 25]),
            categories: validateArray(sparklines.categories, [5, 8, 6, 10, 12, 15, 18]),
            kits: validateArray(sparklines.kits, [2, 3, 2, 4, 5, 6, 7]),
            suppliers: validateArray(sparklines.suppliers, [8, 10, 9, 12, 14, 16, 18]),
          });
        }
      } else {
        // Fallback to individual API calls if stats endpoint fails
        const [partsRes, categoriesRes, kitsRes, suppliersRes] = await Promise.all([
          api.get('/parts?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
          api.get('/categories').catch(() => ({ data: { categories: [] } })),
          api.get('/kits').catch(() => ({ data: { kits: [] } })),
          api.get('/suppliers').catch(() => ({ data: { suppliers: [] } })),
        ]);

        setStats({
          totalParts: partsRes.data.pagination?.total || partsRes.data.total || 0,
          totalCategories: categoriesRes.data?.categories?.length || (Array.isArray(categoriesRes.data) ? categoriesRes.data.length : 0),
          totalKits: kitsRes.data?.kits?.length || (Array.isArray(kitsRes.data) ? kitsRes.data.length : 0),
          totalSuppliers: suppliersRes.data?.suppliers?.length || (Array.isArray(suppliersRes.data) ? suppliersRes.data.length : 0),
          totalPurchaseOrders: ordersRes.data?.purchaseOrders?.length || (Array.isArray(ordersRes.data) ? ordersRes.data.length : 0),
          lowStockItems: 0,
        });
      }

      if (ordersRes.data.purchaseOrders && ordersRes.data.purchaseOrders.length > 0) {
        setPurchaseOrders(ordersRes.data.purchaseOrders.slice(0, 20));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data with time range support - formatted for Recharts
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [isChartTransitioning, setIsChartTransitioning] = useState(false);
  
  const chartData = useMemo(() => {
    if (timeRange === 'week') {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const added = [12, 18, 15, 22, 20, 25, 28];
      const used = [8, 12, 10, 15, 14, 18, 20];
      return labels.map((month, index) => ({
        month,
        added: added[index],
        used: used[index],
      }));
    } else if (timeRange === 'month') {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const added = [35, 52, 41, 68, 55, 73, 62, 85, 78, 92, 88, 105];
      const used = [28, 38, 32, 45, 42, 55, 48, 62, 58, 68, 65, 75];
      return labels.map((month, index) => ({
        month,
        added: added[index],
        used: used[index],
      }));
    } else {
      const labels = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'];
      const added = [420, 580, 650, 720, 680, 750, 820, 890, 950, 1020, 1100, 1250];
      const used = [350, 480, 540, 600, 570, 630, 680, 740, 790, 850, 920, 1050];
      return labels.map((month, index) => ({
        month,
        added: added[index],
        used: used[index],
      }));
    }
  }, [timeRange]);
  
  const orderStatusData = useMemo(() => {
    const draft = purchaseOrders.filter(po => po.status === 'draft').length || 3;
    const pending = purchaseOrders.filter(po => po.status === 'pending').length || 5;
    const approved = purchaseOrders.filter(po => po.status === 'approved').length || 8;
    const received = purchaseOrders.filter(po => po.status === 'received').length || 12;
    
    return [
      { label: 'Draft', value: draft, color: '#94a3b8' },
      { label: 'Pending', value: pending, color: '#fbbf24' },
      { label: 'Approved', value: approved, color: '#ff6b35' },
      { label: 'Received', value: received, color: '#10b981' },
    ];
  }, [purchaseOrders]);

  const inventoryData = useMemo(() => [
    { label: 'Parts', value: stats.totalParts || 156, color: '#ff6b35' },
    { label: 'Categories', value: stats.totalCategories || 24, color: '#3b82f6' },
    { label: 'Kits', value: stats.totalKits || 18, color: '#8b5cf6' },
    { label: 'Suppliers', value: stats.totalSuppliers || 32, color: '#10b981' },
  ], [stats]);

  const recentActivities = [
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, title: 'New Purchase Order', description: 'PO-2024-0089 created', time: '2m ago', color: 'bg-primary-100 text-primary-600' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, title: 'Part Updated', description: 'SKU-1234 stock adjusted', time: '15m ago', color: 'bg-blue-100 text-blue-600' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Order Received', description: 'PO-2024-0087 marked complete', time: '1h ago', color: 'bg-emerald-100 text-emerald-600' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, title: 'Low Stock Alert', description: '3 items below threshold', time: '3h ago', color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8">
      {/* Header Section */}
      <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500">Here's what's happening with your inventory today.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button
              onClick={() => router.push('/dashboard/purchase-orders?action=create')}
              className="w-full sm:w-auto"
              responsive={true}
              size="default"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Order</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards - Clean SaaS Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {[
          { label: 'Total Parts', value: stats.totalParts, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, color: 'primary', sparkData: sparklineData.parts, change: percentageChanges.parts },
          { label: 'Categories', value: stats.totalCategories, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, color: 'blue', sparkData: sparklineData.categories, change: percentageChanges.categories },
          { label: 'Active Kits', value: stats.totalKits, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, color: 'purple', sparkData: sparklineData.kits, change: percentageChanges.kits },
          { label: 'Suppliers', value: stats.totalSuppliers, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, color: 'green', sparkData: sparklineData.suppliers, change: percentageChanges.suppliers },
        ].map((stat, index) => {
          const colorMap: Record<string, { bg: string; icon: string; text: string; badge: string }> = {
            primary: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-700', badge: 'bg-orange-100' },
            blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700', badge: 'bg-blue-100' },
            purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700', badge: 'bg-purple-100' },
            green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700', badge: 'bg-emerald-100' },
          };
          const colors = colorMap[stat.color];
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 border border-slate-200/60 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4 sm:mb-5">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon} group-hover:scale-105 transition-transform`}>
                  {stat.icon}
                </div>
                <span className={`text-[10px] sm:text-xs font-semibold ${colors.text} ${colors.badge} px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              </div>
              <div className="mb-3 sm:mb-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1" style={{ 
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em'
                }}>
                  <AnimatedCounter value={stat.value} />
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
              <div className="mt-4" style={{ height: '56px', minHeight: '56px', width: '100%', position: 'relative' }}>
                <SparklineChart data={stat.sparkData || []} color={stat.color === 'green' ? 'green' : stat.color === 'blue' ? 'blue' : stat.color === 'purple' ? 'purple' : 'primary'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Inventory Overview</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {timeRange === 'week' ? 'Weekly inventory movement' : timeRange === 'month' ? 'Monthly inventory movement' : 'Yearly inventory movement'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              <Button 
                onClick={() => {
                  setIsChartTransitioning(true);
                  setTimeout(() => {
                    setTimeRange('week');
                    setTimeout(() => setIsChartTransitioning(false), 50);
                  }, 200);
                }}
                variant="ghost"
                size="sm"
                className={`flex-1 sm:flex-none transition-all duration-200 ${
                  timeRange === 'week' 
                    ? 'bg-white text-primary-600 shadow-sm border-2 border-primary-500 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-600' 
                    : 'text-gray-600 hover:bg-white hover:text-primary-600 hover:shadow-sm'
                }`}
              >
                Week
              </Button>
              <Button 
                onClick={() => {
                  setIsChartTransitioning(true);
                  setTimeout(() => {
                    setTimeRange('month');
                    setTimeout(() => setIsChartTransitioning(false), 50);
                  }, 200);
                }}
                variant="ghost"
                size="sm"
                className={`flex-1 sm:flex-none transition-all duration-200 ${
                  timeRange === 'month' 
                    ? 'bg-white text-primary-600 shadow-sm border-2 border-primary-500 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-600' 
                    : 'text-gray-600 hover:bg-white hover:text-primary-600 hover:shadow-sm'
                }`}
              >
                Month
              </Button>
              <Button 
                onClick={() => {
                  setIsChartTransitioning(true);
                  setTimeout(() => {
                    setTimeRange('year');
                    setTimeout(() => setIsChartTransitioning(false), 50);
                  }, 200);
                }}
                variant="ghost"
                size="sm"
                className={`flex-1 sm:flex-none transition-all duration-200 ${
                  timeRange === 'year' 
                    ? 'bg-white text-primary-600 shadow-sm border-2 border-primary-500 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-600' 
                    : 'text-gray-600 hover:bg-white hover:text-primary-600 hover:shadow-sm'
                }`}
              >
                Year
              </Button>
            </div>
          </div>
          <div 
            key={timeRange} 
            className={`w-full transition-opacity duration-300 ease-in-out ${
              isChartTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <InventoryOverview data={chartData} timeRange={timeRange} />
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-soft">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
            <p className="text-sm text-gray-500">Current purchase orders</p>
          </div>
          <div className="flex justify-center mb-6">
            <DonutChart data={orderStatusData} colors={['#94a3b8', '#fbbf24', '#ff6b35', '#10b981']} size={140} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {orderStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Quick Actions */}
        <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-soft">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">Frequently used shortcuts</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionButton
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              label="Add New Part"
              description="Create a new inventory item"
              onClick={() => router.push('/dashboard/parts')}
              color="primary"
            />
            <QuickActionButton
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              label="Create Purchase Order"
              description="Start a new procurement"
              onClick={() => router.push('/dashboard/purchase-orders?action=create')}
              color="blue"
              badge="New"
            />
            <QuickActionButton
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              label="Manage Kits"
              description="View and edit kit assemblies"
              onClick={() => router.push('/dashboard/kits')}
              color="purple"
            />
            <QuickActionButton
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
              label="Sales & Invoices"
              description="Manage sales transactions"
              onClick={() => router.push('/dashboard/sales')}
              color="green"
            />
            <QuickActionButton
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              label="View Suppliers"
              description="Manage vendor relationships"
              onClick={() => router.push('/dashboard/suppliers')}
              color="gray"
            />
            <QuickActionButton
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              label="View Reports"
              description="Analytics and insights"
              onClick={() => router.push('/dashboard/parts-list')}
              color="gray"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest updates</p>
            </div>
            <button className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-1">
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Distribution */}
      <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Inventory Distribution</h3>
            <p className="text-sm text-gray-500">Items by category</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/categories')}
            className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            Manage Categories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="max-w-2xl">
          <BarChart data={inventoryData} />
        </div>
      </div>

      {/* Custom Styles for Animations */}
      <style jsx>{`
        @keyframes donutFill {
          from {
            stroke-dasharray: 0 251.2;
          }
        }
        @keyframes barGrow {
          from {
            width: 0;
          }
        }
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
