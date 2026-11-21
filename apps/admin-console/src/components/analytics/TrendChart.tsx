import React, { useState } from 'react';
import type { TrendPoint } from '@bqm/types';
import { rupees } from '../../api';

interface Props {
  points: TrendPoint[];
}

export default function TrendChart({ points }: Props) {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
  const [showPrior, setShowPrior] = useState<boolean>(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #d8e2d8', borderRadius: 12, padding: 24, textAlign: 'center', color: '#888' }}>
        No trend data available for this range.
      </div>
    );
  }

  // Dimensions
  const width = 800;
  const height = 240;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getVal = (pt: TrendPoint, isPrior = false) => {
    if (metric === 'revenue') {
      return isPrior ? pt.priorRevenue || 0 : pt.revenue || 0;
    }
    return isPrior ? pt.priorOrdersCount || 0 : pt.ordersCount || 0;
  };

  const currVals = points.map((p) => getVal(p, false));
  const priorVals = points.map((p) => getVal(p, true));

  const allVals = showPrior ? [...currVals, ...priorVals] : currVals;
  const maxVal = Math.max(...allVals, metric === 'revenue' ? 100 : 5);
  const minVal = 0;

  const n = points.length;
  const getX = (i: number) => {
    if (n === 1) return padLeft + chartW / 2;
    return padLeft + (i / (n - 1)) * chartW;
  };
  const getY = (val: number) => {
    return padTop + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
  };

  // Build SVG path strings
  let currPath = '';
  let currArea = '';
  let priorPath = '';

  points.forEach((pt, i) => {
    const x = getX(i);
    const y = getY(getVal(pt, false));
    if (i === 0) {
      currPath += `M ${x} ${y}`;
      currArea += `M ${x} ${padTop + chartH} L ${x} ${y}`;
    } else {
      currPath += ` L ${x} ${y}`;
      currArea += ` L ${x} ${y}`;
    }
    if (i === points.length - 1) {
      currArea += ` L ${x} ${padTop + chartH} Z`;
    }

    if (showPrior) {
      const py = getY(getVal(pt, true));
      if (i === 0) {
        priorPath += `M ${x} ${py}`;
      } else {
        priorPath += ` L ${x} ${py}`;
      }
    }
  });

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => minVal + pct * (maxVal - minVal));

  // Active hover point
  const hoveredPoint = hoverIdx !== null && hoverIdx >= 0 && hoverIdx < points.length ? points[hoverIdx] : null;

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
      {/* Header with metric toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Sales &amp; Orders Trend
          </h4>
          <span style={{ fontSize: 12, color: '#557258', marginTop: 2, display: 'inline-block' }}>
            Performance trajectory across the selected period
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Prior period toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#445d47', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showPrior}
              onChange={(e) => setShowPrior(e.target.checked)}
              style={{ accentColor: '#123B26' }}
            />
            Compare with previous period
          </label>

          {/* Metric switch */}
          <div style={{ display: 'inline-flex', background: '#F7F5E8', padding: 2, borderRadius: 8, border: '1px solid #E8DFC8', gap: 2 }}>
            <button
              onClick={() => setMetric('revenue')}
              style={{
                border: 'none',
                padding: '4px 11px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: metric === 'revenue' ? 700 : 500,
                background: metric === 'revenue' ? '#123B26' : 'transparent',
                color: metric === 'revenue' ? '#fff' : '#205C38',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Revenue (₹)
            </button>
            <button
              onClick={() => setMetric('orders')}
              style={{
                border: 'none',
                padding: '4px 11px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: metric === 'orders' ? 700 : 500,
                background: metric === 'orders' ? '#123B26' : 'transparent',
                color: metric === 'orders' ? '#fff' : '#205C38',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Order Count
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: 500 }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#205C38" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#205C38" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-ticks */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            const label = metric === 'revenue' ? `₹${Math.round(tickVal)}` : String(Math.round(tickVal));
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#edf2ed" strokeDasharray="3 3" />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#68826D" fontSize="10" fontFamily="sans-serif">
                  {label}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {currArea && <path d={currArea} fill="url(#trendGrad)" />}

          {/* Prior period line (dashed) */}
          {showPrior && priorPath && (
            <path
              d={priorPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current period main line */}
          {currPath && (
            <path
              d={currPath}
              fill="none"
              stroke="#205C38"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points & hover triggers */}
          {points.map((pt, i) => {
            const x = getX(i);
            const y = getY(getVal(pt, false));
            const isHovered = hoverIdx === i;

            return (
              <g key={i}>
                {/* Data point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3}
                  fill={isHovered ? '#205C38' : '#ffffff'}
                  stroke="#205C38"
                  strokeWidth="2"
                />

                {/* X-axis label (show subset if many points) */}
                {(points.length <= 15 || i % Math.ceil(points.length / 10) === 0 || i === points.length - 1) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fill="#68826D"
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    {pt.label}
                  </text>
                )}

                {/* Invisible hover bar */}
                <rect
                  x={x - (chartW / (n || 1)) / 2}
                  y={padTop}
                  width={chartW / (n || 1)}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Hover guideline */}
          {hoveredPoint && hoverIdx !== null && (
            <line
              x1={getX(hoverIdx)}
              y1={padTop}
              x2={getX(hoverIdx)}
              y2={padTop + chartH}
              stroke="#205C38"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && hoverIdx !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(85, Math.max(15, (getX(hoverIdx) / width) * 100))}%`,
              top: '12%',
              transform: 'translateX(-50%)',
              background: '#123B26',
              border: '1px solid #205C38',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              zIndex: 10,
              minWidth: 140,
            }}
          >
            <div style={{ fontWeight: 600, borderBottom: '1px solid #205C38', paddingBottom: 4, marginBottom: 4 }}>
              {hoveredPoint.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#DCE8C8' }}>Current {metric === 'revenue' ? 'Revenue' : 'Orders'}:</span>
              <span style={{ fontWeight: 700, color: '#A8C66C' }}>
                {metric === 'revenue' ? rupees(hoveredPoint.revenue) : `${hoveredPoint.ordersCount} orders`}
              </span>
            </div>
            {showPrior && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 2, color: '#cbd5e1' }}>
                <span>Prior:</span>
                <span>
                  {metric === 'revenue' ? rupees(hoveredPoint.priorRevenue || 0) : `${hoveredPoint.priorOrdersCount || 0} orders`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10, fontSize: 12, color: '#557258' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 14, height: 3, background: '#205C38', borderRadius: 2 }}></span>
          <span>Selected Period ({metric === 'revenue' ? 'Revenue' : 'Orders'})</span>
        </div>
        {showPrior && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, borderTop: '2px dashed #94a3b8' }}></span>
            <span>Previous Equivalent Period</span>
          </div>
        )}
      </div>
    </div>
  );
}
