import React, { useEffect, useState, useCallback } from 'react';
import type { Order, OrderHistoryQuery, OrderStatus, PaginatedOrdersResponse } from '@bqm/types';
import { deleteOrder, getExportOrdersUrl, listHistoricalOrders, patchOrder, rupees, formatSafeDateTime } from '../../api';
import OrderDetailsModal from './OrderDetailsModal';
import { Check, Download, Undo2, X } from 'lucide-react';

interface Props {
  initialStartIso?: string;
  initialEndIso?: string;
  onError: (msg: string) => void;
}

export default function OrderHistorySection({ initialStartIso, initialEndIso, onError }: Props) {
  const [ordersData, setOrdersData] = useState<PaginatedOrdersResponse>({
    orders: [],
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters state
  const [source, setSource] = useState<'all' | 'in-store' | 'online'>('all');
  const [status, setStatus] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalPrice'>('createdAt');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [applyDateFilter, setApplyDateFilter] = useState(true);

  // Desk-action state (ported from the old Orders Desk — same endpoints, same semantics).
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<{ id: string; orderNo: string; status: string } | null>(null);
  const [restoreChoice, setRestoreChoice] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query: OrderHistoryQuery = {
        page,
        limit: 15,
        source,
        status,
        search: debouncedSearch,
        sortBy,
        sortDir,
      };

      if (applyDateFilter && initialStartIso && initialEndIso) {
        query.startDate = initialStartIso;
        query.endDate = initialEndIso;
      }

      const res = await listHistoricalOrders(query);
      setOrdersData(res);
    } catch (err) {
      onError(`Failed to load order history: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [page, source, status, debouncedSearch, sortBy, sortDir, applyDateFilter, initialStartIso, initialEndIso, onError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const applyStatus = async (target: Order, status: OrderStatus) => {
    setBusy(true);
    try {
      const result = await patchOrder(target.id, { status });
      setMissing(result.missingProducts ?? []);
      setSelectedOrder((sel) => (sel && sel.id === result.order.id ? result.order : sel));
      await fetchOrders();
    } catch (err) {
      onError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (target: Order) => {
    setRestoreChoice(true);
    setDeleting({ id: target.id, orderNo: target.orderNo, status: target.status });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      // Unconfirmed orders hold no stock, so the choice only matters when confirmed.
      const result = await deleteOrder(deleting.id, deleting.status === 'confirmed' && restoreChoice);
      setMissing(result.missingProducts ?? []);
      if (selectedOrder && selectedOrder.id === deleting.id) setSelectedOrder(null);
      setDeleting(null);
      // If that was the last row on this page, step back so the list isn't left empty.
      if (ordersData.orders.length <= 1 && page > 1) setPage(page - 1);
      else await fetchOrders();
    } catch (err) {
      onError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = () => {
    const query: OrderHistoryQuery = {
      source,
      status,
      search: debouncedSearch,
      sortBy,
      sortDir,
    };
    if (applyDateFilter && initialStartIso && initialEndIso) {
      query.startDate = initialStartIso;
      query.endDate = initialEndIso;
    }
    const url = getExportOrdersUrl(query);
    window.open(url, '_blank');
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    color: '#123B26',
    background: '#F7F5E8',
    borderBottom: '1px solid #DCE8C8',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid #edf2ed',
    color: '#1a2e1d',
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DCE8C8',
        borderRadius: 14,
        padding: '22px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Title & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 16, color: '#123B26', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Complete Order History
            </h4>
            <span style={{ fontSize: 11, background: '#F7F5E8', color: '#205C38', padding: '3px 9px', borderRadius: 6, fontWeight: 700, border: '1px solid #E8DFC8' }}>
              {ordersData.total} {ordersData.total === 1 ? 'Order' : 'Orders'} Total
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#557258', marginTop: 2, display: 'inline-block' }}>
            Search, filter, view details, and export historical customer receipts
          </span>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#F7F5E8',
            border: '1px solid #E8DFC8',
            color: '#123B26',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#123B26';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F7F5E8';
            e.currentTarget.style.color = '#123B26';
          }}
          title="Export currently filtered orders to CSV"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {missing.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#92400E' }}>
          ℹ Deleted products skipped ({missing.join(', ')}) — movement recorded, stock write skipped.
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          background: '#F7F5E8',
          border: '1px solid #E8DFC8',
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by Order ID, Name, Mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 220px',
            padding: '7px 12px',
            border: '1px solid #c8d8c8',
            borderRadius: 6,
            fontSize: 13,
            color: '#163b22',
            background: '#fff',
          }}
        />

        {/* Source Filter */}
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value as any);
            setPage(1);
          }}
          style={{
            padding: '7px 10px',
            border: '1px solid #c8d8c8',
            borderRadius: 6,
            fontSize: 12,
            color: '#163b22',
            background: '#fff',
          }}
        >
          <option value="all">All Channels</option>
          <option value="in-store">In-Store (POS)</option>
          <option value="online">Online Orders</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
          style={{
            padding: '7px 10px',
            border: '1px solid #c8d8c8',
            borderRadius: 6,
            fontSize: 12,
            color: '#163b22',
            background: '#fff',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed Only</option>
          <option value="unconfirmed">Unconfirmed / Draft</option>
        </select>

        {/* Sort dropdown */}
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split('-');
            setSortBy(by as any);
            setSortDir(dir as any);
            setPage(1);
          }}
          style={{
            padding: '7px 10px',
            border: '1px solid #c8d8c8',
            borderRadius: 6,
            fontSize: 12,
            color: '#163b22',
            background: '#fff',
          }}
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="totalPrice-desc">Highest Value First</option>
          <option value="totalPrice-asc">Lowest Value First</option>
        </select>

        {/* Apply Dashboard Date Range Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3b523f', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={applyDateFilter}
            onChange={(e) => {
              setApplyDateFilter(e.target.checked);
              setPage(1);
            }}
            style={{ accentColor: '#163b22' }}
          />
          Match Dashboard Date
        </label>
      </div>

      {/* Orders Table */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2ece2' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Date &amp; Time</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Channel</th>
              <th style={thStyle}>Items</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#68826d' }}>
                  Loading orders…
                </td>
              </tr>
            ) : ordersData.orders.length > 0 ? (
              ordersData.orders.map((o) => {
                const isConfirmed = o.status === 'confirmed';
                const itemsCount = o.orderItems?.length || 0;
                const itemsPreview = (o.orderItems || [])
                  .slice(0, 2)
                  .map((it) => it.name)
                  .join(', ') + (itemsCount > 2 ? ` +${itemsCount - 2} more` : '');

                return (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: '1px solid #edf2ed',
                      transition: 'background 0.12s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f6fbf6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, color: '#163b22' }}>
                      {o.orderNo}
                    </td>
                    <td style={{ ...tdStyle, color: '#556957', whiteSpace: 'nowrap' }}>
                      {formatSafeDateTime(o.createdAt)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#163b22' }}>
                        {o.customerData?.customerName || 'Walk-in'}
                      </div>
                      {o.customerData?.mobile && (
                        <div style={{ fontSize: 11, color: '#68826d' }}>{o.customerData.mobile}</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontWeight: 500,
                          background: o.source === 'online' ? '#e0f2fe' : '#fef3c7',
                          color: o.source === 'online' ? '#0369a1' : '#92400e',
                        }}
                      >
                        {o.source === 'online' ? 'Online' : 'In-Store'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#384d3c' }}>{itemsPreview || '0 items'}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#163b22' }}>
                      {rupees(o.totalPrice)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          background: isConfirmed ? '#dcfce7' : '#fee2e2',
                          color: isConfirmed ? '#166534' : '#991b1b',
                        }}
                      >
                        {isConfirmed ? 'Confirmed' : 'Unconfirmed'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={busy}
                          title={isConfirmed ? 'Mark unconfirmed (restores stock)' : 'Confirm (deducts stock)'}
                          onClick={() => applyStatus(o, isConfirmed ? 'unconfirmed' : 'confirmed')}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isConfirmed ? '#FFFBEB' : '#E6F4EA',
                            color: isConfirmed ? '#92400E' : '#137333',
                            cursor: busy ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isConfirmed ? <Undo2 size={12} /> : <Check size={12} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(o);
                          }}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            fontSize: 12,
                            background: '#fff',
                            color: '#163b22',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          View
                        </button>
                        <button
                          disabled={busy}
                          title="Delete order"
                          onClick={() => requestDelete(o)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #FCA5A5',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: busy ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: 28, textAlign: 'center', color: '#888' }}>
                  No historical orders found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          gap: 12,
          fontSize: 13,
          color: '#556957',
        }}
      >
        <div>
          Showing page <strong>{ordersData.page}</strong> of <strong>{ordersData.totalPages}</strong> (
          {ordersData.total} total orders)
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={ordersData.page <= 1 || loading}
            style={{
              padding: '5px 12px',
              border: '1px solid #c8d8c8',
              borderRadius: 6,
              background: '#fff',
              fontSize: 12,
              cursor: ordersData.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: ordersData.page <= 1 ? 0.5 : 1,
            }}
          >
            ← Previous
          </button>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 10px',
              fontSize: 12,
              fontWeight: 600,
              color: '#163b22',
            }}
          >
            {ordersData.page} / {ordersData.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(ordersData.totalPages, p + 1))}
            disabled={ordersData.page >= ordersData.totalPages || loading}
            style={{
              padding: '5px 12px',
              border: '1px solid #c8d8c8',
              borderRadius: 6,
              background: '#fff',
              fontSize: 12,
              cursor: ordersData.page >= ordersData.totalPages ? 'not-allowed' : 'pointer',
              opacity: ordersData.page >= ordersData.totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal (ported from the old Orders Desk) */}
      {deleting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 59, 38, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
          onClick={() => { if (!busy) setDeleting(null); }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #DCE8C8',
              borderRadius: 14,
              maxWidth: 440,
              width: '90%',
              padding: 22,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#123B26', marginBottom: 6 }}>
              Delete order <code>{deleting.orderNo}</code>?
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14, lineHeight: 1.4 }}>
              This will permanently delete the order. This cannot be undone.
            </div>
            {deleting.status === 'confirmed' && (
              <div style={{ background: '#F8FAF8', border: '1px solid #E2ECE2', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="radio" checked={restoreChoice} onChange={() => setRestoreChoice(true)} style={{ accentColor: '#123B26', marginTop: 2 }} />
                  <div>
                    <strong style={{ color: '#123B26' }}>Restore stock quantities</strong>
                    <div style={{ fontSize: 11.5, color: '#68826D', marginTop: 1 }}>
                      Adds back the deducted inventory items as a cancellation movement.
                    </div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" checked={!restoreChoice} onChange={() => setRestoreChoice(false)} style={{ accentColor: '#123B26', marginTop: 2 }} />
                  <div>
                    <strong style={{ color: '#123B26' }}>Do not restore stock</strong>
                    <div style={{ fontSize: 11.5, color: '#68826D', marginTop: 1 }}>
                      Leaves inventory levels as-is.
                    </div>
                  </div>
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                disabled={busy}
                onClick={() => setDeleting(null)}
                style={{ padding: '8px 16px', border: '1px solid #DCE8C8', borderRadius: 6, background: '#fff', color: '#123B26', fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                Keep order
              </button>
              <button
                disabled={busy}
                onClick={confirmDelete}
                style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                {busy ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          busy={busy}
          onSetStatus={(s) => applyStatus(selectedOrder, s)}
          onDeleteRequest={() => requestDelete(selectedOrder)}
        />
      )}
    </div>
  );
}

