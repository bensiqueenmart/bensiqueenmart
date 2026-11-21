import React from 'react';
import type { SalesKPIs } from '@bqm/types';
import { rupees } from '../../api';
import { CreditCard, IndianRupee, Package, Scale, TriangleAlert } from 'lucide-react';

interface Props {
  kpis?: SalesKPIs;
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null || pct === undefined) {
    return <span style={{ fontSize: 11, color: '#889988' }}>— vs prior</span>;
  }
  const isPos = pct > 0;
  const isZero = pct === 0;
  const color = isPos ? '#123B26' : isZero ? '#557258' : '#991B1B';
  const bg = isPos ? '#DCE8C8' : isZero ? '#F7F5E8' : '#FEE2E2';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        background: bg,
        color: color,
      }}
      title="Versus equivalent prior period"
    >
      {isPos ? '▲' : isZero ? '•' : '▼'} {isPos ? '+' : ''}{pct}%
    </span>
  );
}

export default function KpiRow({ kpis }: Props) {
  const safeKpis = kpis || {
    totalRevenue: 0,
    totalConfirmedOrders: 0,
    totalUnconfirmedOrders: 0,
    averageOrderValue: 0,
    totalLooseQuantitySold: 0,
    totalPacketsSold: 0,
    totalLineItemsSold: 0,
    bestSellingProduct: null,
    revenueChangePct: null,
    ordersChangePct: null,
    aovChangePct: null,
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #DCE8C8',
    borderRadius: 14,
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  // Clean Quantity Sold formatting (no awkward decimals like 120.0000)
  const pktsPart = safeKpis.totalPacketsSold > 0 ? `${safeKpis.totalPacketsSold} pkts` : '';
  let loosePart = '';
  if (safeKpis.totalLooseQuantitySold > 0) {
    if (safeKpis.totalLooseQuantitySold >= 1000) {
      const kgVal = parseFloat((safeKpis.totalLooseQuantitySold / 1000).toFixed(2));
      loosePart = `${kgVal} kg`;
    } else {
      const gVal = parseFloat(safeKpis.totalLooseQuantitySold.toFixed(1));
      loosePart = `${gVal} g`;
    }
  }
  const cleanQuantityText = [pktsPart, loosePart].filter(Boolean).join(' + ') || '0 items';

  return (
    <div
      className="kpi-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 16,
      }}
    >
      {/* 1. Total Sales Revenue */}
      <div style={cardStyle}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: '#F7F5E8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <IndianRupee size={13} color="#205C38" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Sales
              </span>
            </div>
            <TrendBadge pct={safeKpis.revenueChangePct} />
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: '#123B26', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {rupees(safeKpis.totalRevenue)}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: '#557258', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#205C38' }} />
          Confirmed completed sales
        </div>
      </div>

      {/* 2. Total Orders */}
      <div style={cardStyle}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: '#F7F5E8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <Package size={13} color="#205C38" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Orders
              </span>
            </div>
            <TrendBadge pct={safeKpis.ordersChangePct} />
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: '#123B26', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {safeKpis.totalConfirmedOrders}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: '#557258', marginTop: 12 }}>
          {safeKpis.totalUnconfirmedOrders > 0 ? (
            <span style={{ color: '#B45309', fontWeight: 600 }}>
              <TriangleAlert size={12} style={{ verticalAlign: -1 }} /> {safeKpis.totalUnconfirmedOrders} pending unconfirmed
            </span>
          ) : (
            'All orders confirmed'
          )}
        </div>
      </div>

      {/* 3. Products Sold */}
      <div style={cardStyle}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: '#F7F5E8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <Scale size={13} color="#205C38" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Products Sold
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#205C38', background: '#F7F5E8', padding: '2px 7px', borderRadius: 6, fontWeight: 700, border: '1px solid #E8DFC8' }}>
              {safeKpis.totalLineItemsSold} lines
            </span>
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, color: '#123B26', lineHeight: 1.25 }}>
            {cleanQuantityText}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: '#557258', marginTop: 12 }}>
          Units sold (loose wt. &amp; pack counts)
        </div>
      </div>

      {/* 4. Average Order Value */}
      <div style={cardStyle}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: '#F7F5E8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <CreditCard size={13} color="#205C38" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#205C38', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Avg Order Value
              </span>
            </div>
            <TrendBadge pct={safeKpis.aovChangePct} />
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: '#123B26', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {rupees(safeKpis.averageOrderValue)}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: '#557258', marginTop: 12 }}>
          Revenue per confirmed transaction
        </div>
      </div>
    </div>
  );
}
