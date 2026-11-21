import React, { useState } from 'react';
import type { DistributionSlice } from '@bqm/types';
import { rupees } from '../../api';

interface Props {
  title: string;
  subtitle?: string;
  slices?: DistributionSlice[];
  colors?: string[];
  totalLabel?: string;
  showRevenue?: boolean;
}

export default function DonutChart({
  title,
  subtitle,
  slices = [],
  colors = ['#123B26', '#205C38', '#A8C66C', '#DCE8C8'],
  totalLabel = 'Total Orders',
  showRevenue = false,
}: Props) {
  const [metric, setMetric] = useState<'count' | 'revenue'>('count');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const safeSlices = Array.isArray(slices) ? slices : [];
  const totalCount = safeSlices.reduce((sum, s) => sum + (s.count || 0), 0);
  const totalRev = safeSlices.reduce((sum, s) => sum + (s.revenue || 0), 0);

  const activeMetricTotal = metric === 'revenue' && showRevenue ? totalRev : totalCount;

  // SVG parameters
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Build stroke-dasharray segments
  let cumulativePct = 0;
  const segments = safeSlices.map((slice, i) => {
    const val = metric === 'revenue' && showRevenue ? (slice.revenue || 0) : (slice.count || 0);
    const pct = activeMetricTotal > 0 ? val / activeMetricTotal : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePct * circumference;
    cumulativePct += pct;
    const color = colors[i % colors.length];

    return {
      slice,
      color,
      pct,
      val,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeHoveredSlice = hoveredKey ? safeSlices.find((s) => s.key === hoveredKey) : null;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header with Title & Optional Metric Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
            {title}
          </h4>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#557258', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>

        {showRevenue ? (
          <div
            style={{
              display: 'inline-flex',
              background: '#F7F5E8',
              borderRadius: 8,
              padding: 2,
              border: '1px solid #E8DFC8',
              gap: 2,
            }}
          >
            <button
              onClick={() => setMetric('count')}
              style={{
                border: 'none',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: metric === 'count' ? 700 : 500,
                background: metric === 'count' ? '#123B26' : 'transparent',
                color: metric === 'count' ? '#ffffff' : '#205C38',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Orders ({totalCount})
            </button>
            <button
              onClick={() => setMetric('revenue')}
              style={{
                border: 'none',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: metric === 'revenue' ? 700 : 500,
                background: metric === 'revenue' ? '#123B26' : 'transparent',
                color: metric === 'revenue' ? '#ffffff' : '#205C38',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Revenue (₹)
            </button>
          </div>
        ) : (
          <span
            style={{
              fontSize: 11,
              color: '#205C38',
              background: '#F7F5E8',
              padding: '3px 9px',
              borderRadius: 6,
              fontWeight: 700,
              border: '1px solid #E8DFC8',
            }}
          >
            {totalCount} Total
          </span>
        )}
      </div>

      {/* 2. Donut Visual + Legend Area */}
      {totalCount === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#68826D', fontSize: 13 }}>
          No orders recorded in this date range.
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, margin: '10px 0' }}>
          {/* Donut SVG with Center Metric */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#F7F5E8"
                strokeWidth={strokeWidth}
              />
              {/* Slices */}
              {segments.map((seg) => {
                const isHovered = hoveredKey === seg.slice.key;
                return (
                  <circle
                    key={seg.slice.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{
                      transition: 'stroke-width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                      cursor: 'pointer',
                      opacity: hoveredKey === null || isHovered ? 1 : 0.65,
                    }}
                    onMouseEnter={() => setHoveredKey(seg.slice.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })}
            </svg>

            {/* Center Stat Display */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: '#123B26', lineHeight: 1.1 }}>
                {activeHoveredSlice
                  ? metric === 'revenue' && showRevenue
                    ? rupees(activeHoveredSlice.revenue || 0)
                    : activeHoveredSlice.count
                  : metric === 'revenue' && showRevenue
                  ? rupees(totalRev)
                  : totalCount}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: '#557258',
                  marginTop: 3,
                  textAlign: 'center',
                  maxWidth: 90,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeHoveredSlice ? activeHoveredSlice.label : totalLabel}
              </span>
            </div>
          </div>

          {/* Clean Legend Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
            {safeSlices.map((slice, i) => {
              const color = colors[i % colors.length];
              const isHovered = hoveredKey === slice.key;
              const val = metric === 'revenue' && showRevenue ? (slice.revenue || 0) : (slice.count || 0);
              const share = activeMetricTotal > 0 ? ((val / activeMetricTotal) * 100).toFixed(1) : '0';

              return (
                <div
                  key={slice.key}
                  onMouseEnter={() => setHoveredKey(slice.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: isHovered ? '#F7F5E8' : '#FAFBF8',
                    border: `1px solid ${isHovered ? '#DCE8C8' : '#F0F4F0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: '#123B26',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {slice.label}
                      </div>
                      {showRevenue && slice.revenue !== undefined && slice.revenue > 0 && (
                        <div style={{ fontSize: 11, color: '#205C38', fontWeight: 600 }}>
                          {rupees(slice.revenue)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#123B26', whiteSpace: 'nowrap' }}>
                      {share}%
                    </div>
                    <div style={{ fontSize: 11, color: '#557258', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {slice.count} {slice.count === 1 ? 'order' : 'orders'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
