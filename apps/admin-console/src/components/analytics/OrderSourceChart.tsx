import React, { useState } from 'react';
import type { DistributionSlice } from '@bqm/types';
import { rupees } from '../../api';

interface Props {
  slices?: DistributionSlice[];
}

export default function OrderSourceChart({ slices = [] }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showRevenueToggle, setShowRevenueToggle] = useState<boolean>(false);

  const safeSlices = Array.isArray(slices) ? slices : [];
  const inStore = safeSlices.find((s) => s.key === 'in-store' || s.key === 'billing-desk') || {
    key: 'in-store',
    label: 'In-Store POS',
    count: 0,
    revenue: 0,
    percentage: 0,
  };
  const online = safeSlices.find((s) => s.key === 'online') || {
    key: 'online',
    label: 'Online Store',
    count: 0,
    revenue: 0,
    percentage: 0,
  };

  const totalOrders = (inStore.count || 0) + (online.count || 0);
  const totalRevenue = (inStore.revenue || 0) + (online.revenue || 0);

  const inStoreCount = inStore.count || 0;
  const onlineCount = online.count || 0;
  const inStoreRev = inStore.revenue || 0;
  const onlineRev = online.revenue || 0;

  const inStorePct = totalOrders > 0 ? Number(((inStoreCount / totalOrders) * 100).toFixed(1)) : 0;
  const onlinePct = totalOrders > 0 ? Number(((onlineCount / totalOrders) * 100).toFixed(1)) : 0;

  const inStoreRevPct = totalRevenue > 0 ? Number(((inStoreRev / totalRevenue) * 100).toFixed(1)) : 0;
  const onlineRevPct = totalRevenue > 0 ? Number(((onlineRev / totalRevenue) * 100).toFixed(1)) : 0;

  // Maximum value for scaling the 2 bars
  const maxMetric = showRevenueToggle
    ? Math.max(inStoreRev, onlineRev, 100)
    : Math.max(inStoreCount, onlineCount, 1);

  const inStoreVal = showRevenueToggle ? inStoreRev : inStoreCount;
  const onlineVal = showRevenueToggle ? onlineRev : onlineCount;

  const inStoreHeight = maxMetric > 0 ? (inStoreVal === 0 ? 4 : Math.max(16, Math.round((inStoreVal / maxMetric) * 90))) : 4;
  const onlineHeight = maxMetric > 0 ? (onlineVal === 0 ? 4 : Math.max(16, Math.round((onlineVal / maxMetric) * 90))) : 4;

  const channels = [
    {
      key: 'in-store',
      label: 'In-Store POS',
      sublabel: 'Walk-in Desk',
      orders: inStoreCount,
      revenue: inStoreRev,
      percentage: inStorePct,
      revPercentage: inStoreRevPct,
      heightPct: inStoreHeight,
      color: '#205C38',
      hoverColor: '#123B26',
    },
    {
      key: 'online',
      label: 'Online Store',
      sublabel: 'Web Storefront',
      orders: onlineCount,
      revenue: onlineRev,
      percentage: onlinePct,
      revPercentage: onlineRevPct,
      heightPct: onlineHeight,
      color: '#A8C66C',
      hoverColor: '#7DA33E',
    },
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px 20px',
          borderBottom: '1px solid #F0F4F0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#123B26', letterSpacing: '-0.01em' }}>
              Order Source Distribution
            </div>
            <div style={{ fontSize: 11.5, color: '#557258', marginTop: 2 }}>
              In-Store POS vs Online Store breakdown
            </div>
          </div>

          {/* Toggle: Orders / Revenue */}
          <div
            style={{
              display: 'inline-flex',
              background: '#F7F5E8',
              borderRadius: 7,
              padding: 2,
              border: '1px solid #E8DFC8',
              gap: 2,
              alignSelf: 'flex-start',
            }}
          >
            <button
              onClick={() => setShowRevenueToggle(false)}
              style={{
                border: 'none',
                padding: '4px 11px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: !showRevenueToggle ? 700 : 500,
                background: !showRevenueToggle ? '#123B26' : 'transparent',
                color: !showRevenueToggle ? '#ffffff' : '#205C38',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Orders ({totalOrders})
            </button>
            <button
              onClick={() => setShowRevenueToggle(true)}
              style={{
                border: 'none',
                padding: '4px 11px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: showRevenueToggle ? 700 : 500,
                background: showRevenueToggle ? '#123B26' : 'transparent',
                color: showRevenueToggle ? '#ffffff' : '#205C38',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Revenue (Rs.)
            </button>
          </div>
        </div>
      </div>

      {/* Chart Body */}
      <div
        style={{
          padding: '16px 20px 12px 20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {totalOrders === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
            No orders recorded in this date range.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Bars */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                padding: '0 16px',
                position: 'relative',
                minHeight: 150,
              }}
            >
              {/* Grid lines */}
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${100 - pct}%`,
                    borderTop: '1px dashed #E8EFE8',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {channels.map((ch) => {
                const isHovered = hoveredKey === ch.key;
                const val = showRevenueToggle ? ch.revenue : ch.orders;
                const pct = showRevenueToggle ? ch.revPercentage : ch.percentage;
                const valueText = showRevenueToggle ? rupees(ch.revenue) : `${ch.orders}`;

                return (
                  <div
                    key={ch.key}
                    onMouseEnter={() => setHoveredKey(ch.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                      cursor: 'default',
                      zIndex: 2,
                      minWidth: 70,
                    }}
                  >
                    {/* Value label above bar */}
                    <div
                      style={{
                        marginBottom: 6,
                        textAlign: 'center',
                        transition: 'transform 0.15s ease',
                        transform: isHovered ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#123B26' }}>
                        {valueText}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#557258',
                          marginTop: 1,
                        }}
                      >
                        {pct}%
                      </div>
                    </div>

                    {/* Bar */}
                    <div
                      style={{
                        width: 56,
                        height: `${ch.heightPct}%`,
                        minHeight: val === 0 ? 4 : 16,
                        background: isHovered ? ch.hoverColor : ch.color,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        transition: 'all 0.2s ease',
                        boxShadow: isHovered ? `0 4px 14px ${ch.color}55` : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Baseline */}
            <div style={{ height: 2, background: '#DCE8C8', borderRadius: 1, margin: '0 4px' }} />

            {/* Channel labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                paddingTop: 10,
              }}
            >
              {channels.map((ch) => (
                <div key={ch.key + '-label'} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: ch.color,
                      display: 'inline-block',
                      marginRight: 5,
                      verticalAlign: 'middle',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#123B26', verticalAlign: 'middle' }}>
                    {ch.label}
                  </span>
                  <div style={{ fontSize: 10.5, color: '#557258', marginTop: 1 }}>{ch.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div
        style={{
          background: '#F7F5E8',
          borderTop: '1px solid #E8DFC8',
          padding: '10px 20px',
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
        }}
      >
        <div style={{ fontSize: 11.5, color: '#557258', textAlign: 'center', lineHeight: 1.4 }}>
          {totalOrders > 0
            ? inStoreCount >= onlineCount
              ? `In-Store leads: ${inStoreCount} orders (${inStorePct}%) vs ${onlineCount} online (${onlinePct}%)`
              : `Online leads: ${onlineCount} orders (${onlinePct}%) vs ${inStoreCount} in-store (${inStorePct}%)`
            : 'Track in-store vs online order channel volume'}
        </div>
      </div>
    </div>
  );
}
