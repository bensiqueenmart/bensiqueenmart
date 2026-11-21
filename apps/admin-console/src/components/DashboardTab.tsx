import React, { useEffect, useState, useCallback } from 'react';
import type { SalesAnalyticsResponse } from '@bqm/types';
import { getExportOrdersUrl, getSalesAnalytics } from '../api';
import { calculateDateRange, type DateRangeState } from './analytics/types';
import DateRangePicker from './analytics/DateRangePicker';
import KpiRow from './analytics/KpiRow';
import TrendChart from './analytics/TrendChart';
import DonutChart from './analytics/DonutChart';
import OrderSourceChart from './analytics/OrderSourceChart';
import AllProductsChart from './analytics/AllProductsChart';
import TopProductsRanking from './analytics/TopProductsRanking';
import ComboSalesSection from './analytics/ComboSalesSection';
import RecentOrdersPreview from './analytics/RecentOrdersPreview';
import ProductDrilldownModal from './analytics/ProductDrilldownModal';
import { generatePdfReport } from './analytics/generatePdfReport';

interface Props {
  onError: (m: string) => void;
  onNavigateToOrders: (startIso: string, endIso: string) => void;
}

export default function DashboardTab({ onError, onNavigateToOrders }: Props) {
  const [range, setRange] = useState<DateRangeState>(() => calculateDateRange('last30'));
  const [data, setData] = useState<SalesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const loadData = useCallback(
    async (r: DateRangeState) => {
      setLoading(true);
      try {
        const res = await getSalesAnalytics(r.startIso, r.endIso);
        setData(res);
      } catch (err) {
        onError(`Failed to load sales analytics: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    loadData(range);
  }, [range, loadData]);

  const handleDownloadPdf = () => {
    if (!data) return;
    try {
      generatePdfReport(data);
    } catch (err) {
      onError(`Failed to generate PDF report: ${String(err)}`);
    }
  };

  const handleExportCsv = () => {
    const url = getExportOrdersUrl({
      startDate: range.startIso,
      endDate: range.endIso,
    });
    window.open(url, '_blank');
  };

  return (
    <div
      className="dashboard-container"
      style={{
        maxWidth: 1380,
        margin: '0 auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box',
      }}
    >
      {/* Dashboard Title & Overview Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#123B26', letterSpacing: '-0.02em' }}>
            Sales Overview
          </h2>
          <div style={{ fontSize: 13, color: '#557258', marginTop: 3 }}>
            Track revenue, orders and product performance.
          </div>
        </div>
      </div>

      {/* Row 1: Unified Date Range Filter & Export Actions */}
      <DateRangePicker
        range={range}
        onChange={setRange}
        loading={loading}
        onRefresh={() => loadData(range)}
        onDownloadPdf={handleDownloadPdf}
        onExportCsv={handleExportCsv}
      />

      {loading && !data ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 50, textAlign: 'center', border: '1px solid #DCE8C8' }}>
          <p style={{ fontSize: 15, color: '#205C38', margin: 0, fontWeight: 600 }}>Loading sales analytics…</p>
        </div>
      ) : data ? (
        <>
          {/* Row 2: Four KPI Cards in a Single Horizontal Row */}
          <KpiRow kpis={data.kpis} />

          {/* Row 3: Sales Trend Graph (68%) + Order Source Bar Graph (32%) */}
          <div
            className="dashboard-row-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <TrendChart points={data.trend || []} />
            </div>

            <div style={{ minWidth: 0 }}>
              <OrderSourceChart slices={data.sourceDistribution || []} />
            </div>
          </div>

          {/* Row 4: Full-Width Product Sales Bar Graph (ALL 35 Products) */}
          <AllProductsChart
            products={data.productSales || []}
            onSelectProduct={(pId) => setSelectedProductId(pId)}
          />

          {/* Row 5: Best-Selling Products (Left) + Order Status & Combos (Right) */}
          <div
            className="dashboard-row-5"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            {/* Left: Top Products Ranking */}
            <div style={{ minWidth: 0 }}>
              <TopProductsRanking
                products={data.productSales || []}
                onSelectProduct={(pId) => setSelectedProductId(pId)}
              />
            </div>

            {/* Right: Order Status Distribution & Combo Analysis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <DonutChart
                title="Order Status Distribution"
                subtitle="Confirmed completed vs pending unconfirmed"
                slices={data.statusDistribution || []}
                colors={['#123B26', '#E8DFC8']}
                totalLabel="All Orders"
              />

              {data.comboSales && data.comboSales.length > 0 && (
                <ComboSalesSection combos={data.comboSales || []} />
              )}
            </div>
          </div>

          {/* Row 6: Recent Orders Activity Preview */}
          <RecentOrdersPreview
            recentOrders={data.recentOrdersPreview || []}
            onViewAllOrders={() => onNavigateToOrders(range.startIso, range.endIso)}
            onError={onError}
          />

          {/* Product Drilldown Modal */}
          {selectedProductId && (
            <ProductDrilldownModal
              productId={selectedProductId}
              startDate={range.startIso}
              endDate={range.endIso}
              onClose={() => setSelectedProductId(null)}
              onError={onError}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
