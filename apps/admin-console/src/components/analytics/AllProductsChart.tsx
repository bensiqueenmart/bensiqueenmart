import React, { useState, useMemo } from 'react';
import type { ProductSalesStat } from '@bqm/types';
import { rupees } from '../../api';

interface Props {
  products?: ProductSalesStat[];
  onSelectProduct: (productId: string) => void;
}

type ViewLimit = 5 | 10 | 15 | 'all';
type TableSortOption = 'quantity-desc' | 'quantity-asc' | 'revenue-desc' | 'name-asc';
type TableFilterOption = 'all' | 'sales-only' | 'zero-only';

/** Strips non-ASCII characters from a string for clean UI display */
function cleanDisplay(str: string): string {
  return str.replace(/[^\x00-\x7F]/g, '').trim();
}

/** Formats clean quantity display without trailing zeros or awkward decimals */
function formatCleanQuantity(prod: ProductSalesStat): string {
  if (prod.totalRevenue === 0 && prod.ordersCount === 0) {
    return '0 sold';
  }

  if (prod.isQuantized) {
    const packs = prod.totalPacksCount || 0;
    if (packs === 0) return '0 pkts';
    if (prod.packBreakdown && prod.packBreakdown.length > 0) {
      const breakdownStr = prod.packBreakdown
        .filter((b) => b.count > 0)
        .map((b) => `${b.count}×${b.size}${prod.stockUnit || 'g'}`)
        .join(', ');
      return `${packs} ${packs === 1 ? 'pkt' : 'pkts'}${breakdownStr ? ` (${breakdownStr})` : ''}`;
    }
    return `${packs} ${packs === 1 ? 'pkt' : 'pkts'}`;
  }

  // Loose product (weight or volume)
  const qty = prod.totalLooseQuantity || 0;
  const unit = prod.stockUnit || 'g';

  if (unit === 'g' && qty >= 1000) {
    const kg = Number((qty / 1000).toFixed(2));
    return `${kg} kg`;
  }
  if (unit === 'ml' && qty >= 1000) {
    const l = Number((qty / 1000).toFixed(2));
    return `${l} L`;
  }
  return `${Number(qty.toFixed(2))} ${unit}`;
}

export default function AllProductsChart({ products = [], onSelectProduct }: Props) {
  // Chart controls: Top 10 by default as requested
  const [viewLimit, setViewLimit] = useState<ViewLimit>(10);

  // Table controls
  const [search, setSearch] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<TableFilterOption>('all');
  const [tableSort, setTableSort] = useState<TableSortOption>('quantity-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const safeProducts = Array.isArray(products) ? products : [];

  // Ranked products for the chart: sorted by quantity/revenue descending
  const rankedForChart = useMemo(() => {
    const sorted = [...safeProducts].sort((a, b) => {
      // Prioritize products with sales
      const aSales = a.totalRevenue > 0 || a.ordersCount > 0;
      const bSales = b.totalRevenue > 0 || b.ordersCount > 0;
      if (aSales && !bSales) return -1;
      if (!aSales && bSales) return 1;

      // Primary sort: revenue / quantity
      const aQty = a.isQuantized ? (a.totalPacksCount || 0) : (a.totalLooseQuantity || 0);
      const bQty = b.isQuantized ? (b.totalPacksCount || 0) : (b.totalLooseQuantity || 0);
      return b.totalRevenue - a.totalRevenue || bQty - aQty || a.name.localeCompare(b.name);
    });

    if (viewLimit === 'all') return sorted;
    return sorted.slice(0, viewLimit);
  }, [safeProducts, viewLimit]);

  // Max value for chart bar scaling
  const maxChartVal = useMemo(() => {
    const max = Math.max(...rankedForChart.map((p) => p.totalRevenue), 100);
    return max;
  }, [rankedForChart]);

  // Filtered and sorted products for the breakdown table
  const tableData = useMemo(() => {
    let list = [...safeProducts];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Zero-sales filter
    if (tableFilter === 'sales-only') {
      list = list.filter((p) => p.totalRevenue > 0 || p.ordersCount > 0);
    } else if (tableFilter === 'zero-only') {
      list = list.filter((p) => p.totalRevenue === 0 && p.ordersCount === 0);
    }

    // Sort
    list.sort((a, b) => {
      const aQty = a.isQuantized ? (a.totalPacksCount || 0) : (a.totalLooseQuantity || 0);
      const bQty = b.isQuantized ? (b.totalPacksCount || 0) : (b.totalLooseQuantity || 0);

      if (tableSort === 'quantity-desc') {
        return b.totalRevenue - a.totalRevenue || bQty - aQty || a.name.localeCompare(b.name);
      }
      if (tableSort === 'quantity-asc') {
        return a.totalRevenue - b.totalRevenue || aQty - bQty || a.name.localeCompare(b.name);
      }
      if (tableSort === 'revenue-desc') {
        return b.totalRevenue - a.totalRevenue || b.ordersCount - a.ordersCount || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [safeProducts, search, tableFilter, tableSort]);

  // Pagination for table
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));
  const paginatedTable = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * pageSize;
    return tableData.slice(start, start + pageSize);
  }, [tableData, currentPage, totalPages]);

  const activeSalesCount = safeProducts.filter((p) => p.totalRevenue > 0 || p.ordersCount > 0).length;
  const zeroSalesCount = safeProducts.length - activeSalesCount;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECTION 1: TOP PRODUCTS BAR CHART                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div>
        {/* Header & View Switcher */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Products Sold
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#F7F5E8',
                  color: '#205C38',
                  padding: '3px 9px',
                  borderRadius: 10,
                  border: '1px solid #E8DFC8',
                }}
              >
                {activeSalesCount} Active · {zeroSalesCount} Zero Sales
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: '#557258', marginTop: 3 }}>
              Top-selling products ranked by sales performance in the selected date range
            </div>
          </div>

          {/* Top 5 / Top 10 / Top 15 / All Selector */}
          <div
            style={{
              display: 'inline-flex',
              background: '#F7F5E8',
              borderRadius: 8,
              padding: 3,
              border: '1px solid #E8DFC8',
              gap: 2,
            }}
          >
            {(
              [
                { label: 'Top 5', val: 5 },
                { label: 'Top 10', val: 10 },
                { label: 'Top 15', val: 15 },
                { label: `All (${safeProducts.length})`, val: 'all' },
              ] as const
            ).map((opt) => {
              const active = viewLimit === opt.val;
              return (
                <button
                  key={String(opt.val)}
                  onClick={() => setViewLimit(opt.val)}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    background: active ? '#123B26' : 'transparent',
                    color: active ? '#fff' : '#205C38',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Bar Chart Container */}
        <div
          style={{
            maxHeight: viewLimit === 'all' ? 480 : 'none',
            overflowY: viewLimit === 'all' ? 'auto' : 'visible',
            paddingRight: viewLimit === 'all' ? 6 : 0,
            borderRadius: 10,
            border: '1px solid #edf2ed',
            background: '#fafbfa',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankedForChart.map((prod, idx) => {
              const hasSales = prod.totalRevenue > 0 || prod.ordersCount > 0;
              const barWidthPct = hasSales ? Math.max(3, (prod.totalRevenue / maxChartVal) * 100) : 0;
              const isTop = idx === 0 && hasSales;

              return (
                <div
                  key={prod.productId}
                  className="product-row-grid"
                  onClick={() => onSelectProduct(prod.productId)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '240px 1fr 180px',
                    alignItems: 'center',
                    gap: 14,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: hasSales ? '#fff' : '#f7f8f7',
                    border: hasSales ? (isTop ? '1px solid #c4dcbe' : '1px solid #e1e9e1') : '1px dashed #dce2dc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#205C38';
                    e.currentTarget.style.background = '#f2f8f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = hasSales
                      ? isTop
                        ? '#c4dcbe'
                        : '#e1e9e1'
                      : '#dce2dc';
                    e.currentTarget.style.background = hasSales ? '#fff' : '#f7f8f7';
                  }}
                  title={`Click to view full breakdown for ${prod.name}`}
                >
                  {/* Left: Rank + Product Name & Category */}
                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        fontSize: 10.5,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background:
                          idx === 0 && hasSales
                            ? '#123B26'
                            : idx === 1 && hasSales
                            ? '#205C38'
                            : idx === 2 && hasSales
                            ? '#487554'
                            : '#DCE8C8',
                        color: idx < 3 && hasSales ? '#fff' : '#123B26',
                      }}
                    >
                      {idx + 1}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: hasSales ? 700 : 500,
                          color: hasSales ? '#123B26' : '#718274',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {prod.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#68826d',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(() => { const tn = prod.tamilName ? cleanDisplay(prod.tamilName) : ''; return tn ? <span>{tn} · </span> : null; })()}
                        <span>{prod.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Minimal Bar Track */}
                  <div style={{ position: 'relative', width: '100%', height: 16, display: 'flex', alignItems: 'center' }}>
                    {hasSales ? (
                      <div
                        style={{
                          width: '100%',
                          height: 12,
                          background: '#e8efe8',
                          borderRadius: 6,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${barWidthPct}%`,
                            height: '100%',
                            background: isTop
                              ? 'linear-gradient(90deg, #123B26, #205C38)'
                              : 'linear-gradient(90deg, #205C38, #52895f)',
                            borderRadius: 6,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: 1,
                          borderBottom: '1px dashed #cdd6cd',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#9aa89b', fontStyle: 'italic', paddingLeft: 4 }}>
                          No sales recorded in this period
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Clean Quantity & Revenue */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: hasSales ? '#123B26' : '#94a3b8' }}>
                      {formatCleanQuantity(prod)}
                    </div>
                    {hasSales && (
                      <div style={{ fontSize: 11, color: '#205C38', fontWeight: 600, marginTop: 1 }}>
                        {rupees(prod.totalRevenue)} · {prod.ordersCount} {prod.ordersCount === 1 ? 'order' : 'orders'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {rankedForChart.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: '#888', fontSize: 13 }}>
                No product sales found for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECTION 2: PRODUCT SALES BREAKDOWN TABLE                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #edf2ed', paddingTop: 18 }}>
        {/* Table Title and Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: 15, color: '#123B26', fontWeight: 700 }}>
              Product Sales Breakdown
            </h4>
            <div style={{ fontSize: 11.5, color: '#68826d', marginTop: 2 }}>
              Detailed catalog table with unit breakdown, order counts and sales contribution
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #DCE8C8',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fafbfa',
                width: 160,
                outline: 'none',
              }}
            />

            {/* Filter Dropdown */}
            <select
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value as TableFilterOption);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 10px',
                border: '1px solid #DCE8C8',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Products ({safeProducts.length})</option>
              <option value="sales-only">With Sales ({activeSalesCount})</option>
              <option value="zero-only">Zero Sales ({zeroSalesCount})</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={tableSort}
              onChange={(e) => setTableSort(e.target.value as TableSortOption)}
              style={{
                padding: '6px 10px',
                border: '1px solid #DCE8C8',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <option value="quantity-desc">Highest Quantity Sold</option>
              <option value="quantity-asc">Lowest Quantity Sold</option>
              <option value="revenue-desc">Highest Revenue (₹)</option>
              <option value="name-asc">Alphabetical (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Structured Table */}
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #edf2ed' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F5E8', borderBottom: '1px solid #E8DFC8' }}>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38', width: 40 }}>#</th>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38' }}>Product</th>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38' }}>Type &amp; Unit</th>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38' }}>Quantity Sold</th>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38', textAlign: 'center' }}>Orders</th>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38', textAlign: 'right' }}>Total Sales</th>
                <th style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#205C38', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTable.map((prod, index) => {
                const hasSales = prod.totalRevenue > 0 || prod.ordersCount > 0;
                const globalIndex = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr
                    key={prod.productId}
                    onClick={() => onSelectProduct(prod.productId)}
                    style={{
                      borderBottom: '1px solid #edf2ed',
                      cursor: 'pointer',
                      background: hasSales ? '#fff' : '#fafbfa',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f8f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = hasSales ? '#fff' : '#fafbfa')}
                  >
                    <td style={{ padding: '10px 12px', color: '#68826d', fontWeight: 600, fontSize: 12 }}>
                      {globalIndex}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: hasSales ? '#123B26' : '#718274' }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#68826d', marginTop: 1 }}>
                        {(() => { const tn = prod.tamilName ? cleanDisplay(prod.tamilName) : ''; return tn ? <span>{tn} · </span> : null; })()}
                        <span>{prod.category}</span>
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          background: prod.isQuantized ? '#e0f2fe' : '#F7F5E8',
                          color: prod.isQuantized ? '#0369a1' : '#205C38',
                        }}
                      >
                        {prod.isQuantized ? `Packets (${prod.stockUnit})` : `Loose (${prod.stockUnit})`}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', fontWeight: 700, color: hasSales ? '#123B26' : '#94a3b8' }}>
                      {formatCleanQuantity(prod)}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'center', color: hasSales ? '#123B26' : '#94a3b8' }}>
                      {prod.ordersCount > 0 ? `${prod.ordersCount}` : '—'}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: hasSales ? '#123B26' : '#94a3b8' }}>
                      {hasSales ? rupees(prod.totalRevenue) : '₹0.00'}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(prod.productId);
                        }}
                        style={{
                          padding: '3px 9px',
                          border: '1px solid #DCE8C8',
                          borderRadius: 4,
                          fontSize: 11.5,
                          background: '#fff',
                          color: '#123B26',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedTable.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>
                    No products match the search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              fontSize: 12,
              color: '#557258',
            }}
          >
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, tableData.length)} of {tableData.length} products
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 6,
                  background: currentPage <= 1 ? '#fafbfa' : '#fff',
                  color: currentPage <= 1 ? '#aaa' : '#123B26',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Previous
              </button>

              <span style={{ padding: '4px 8px', fontWeight: 700, color: '#123B26' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #DCE8C8',
                  borderRadius: 6,
                  background: currentPage >= totalPages ? '#fafbfa' : '#fff',
                  color: currentPage >= totalPages ? '#aaa' : '#123B26',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
