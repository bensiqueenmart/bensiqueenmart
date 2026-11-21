import React from 'react';
import { calculateDateRange, type DatePreset, type DateRangeState } from './types';

interface Props {
  range: DateRangeState;
  onChange: (newRange: DateRangeState) => void;
  loading: boolean;
  onRefresh: () => void;
  onDownloadPdf?: () => void;
  onExportCsv?: () => void;
}

export default function DateRangePicker({
  range,
  onChange,
  loading,
  onRefresh,
  onDownloadPdf,
  onExportCsv,
}: Props) {
  const presets: Array<{ id: DatePreset; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'last7', label: 'Last 7 Days' },
    { id: 'last30', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div
      className="date-picker-bar"
      style={{
        background: '#fff',
        border: '1px solid #DCE8C8',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Date Presets and Pickers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#123B26' }}>
          Period:
        </span>

        <div style={{ display: 'inline-flex', background: '#F7F5E8', borderRadius: 8, padding: 3, border: '1px solid #E8DFC8' }}>
          {presets.map((p) => {
            const active = range.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id !== 'custom') {
                    onChange(calculateDateRange(p.id));
                  } else {
                    onChange({ ...range, preset: 'custom' });
                  }
                }}
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
                {p.label}
              </button>
            );
          })}
        </div>

        {range.preset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
            <input
              type="date"
              value={range.startDate}
              onChange={(e) => {
                const newStart = e.target.value;
                onChange(calculateDateRange('custom', newStart, range.endDate));
              }}
              style={{
                padding: '5px 8px',
                border: '1px solid #c2d1c2',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fafbfa',
              }}
            />
            <span style={{ color: '#68826d', fontSize: 11 }}>to</span>
            <input
              type="date"
              value={range.endDate}
              min={range.startDate}
              onChange={(e) => {
                const newEnd = e.target.value;
                onChange(calculateDateRange('custom', range.startDate, newEnd));
              }}
              style={{
                padding: '5px 8px',
                border: '1px solid #c2d1c2',
                borderRadius: 6,
                fontSize: 12,
                color: '#123B26',
                background: '#fafbfa',
              }}
            />
          </div>
        )}

        <span
          style={{
            fontSize: 11,
            background: '#DCE8C8',
            color: '#123B26',
            padding: '3px 8px',
            borderRadius: 6,
            fontWeight: 600,
          }}
          title="All dates respect store local IST timezone"
        >
          IST (UTC+5:30)
        </span>
      </div>

      {/* Action Buttons: Refresh, Download PDF, Export CSV */}
      <div className="date-picker-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#F7F5E8',
            color: '#123B26',
            border: '1px solid #E8DFC8',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          title="Reload latest data from database"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>

        {onDownloadPdf && (
          <button
            onClick={onDownloadPdf}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#205C38',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
            title="Download multi-page PDF sales report"
          >
            📄 PDF Report
          </button>
        )}

        {onExportCsv && (
          <button
            onClick={onExportCsv}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#123B26',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
            title="Export filtered orders to CSV"
          >
            📥 Export CSV
          </button>
        )}
      </div>
    </div>
  );
}
