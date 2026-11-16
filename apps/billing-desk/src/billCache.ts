import type { Order } from '@bqm/types';
import type { DraftLine } from './components/BillPanel';

/**
 * Parked-bill slot: the one working bill on this terminal.
 * Survives tab switches, refreshes, and app restarts via localStorage.
 * The server order is the source of truth for status; the lines snapshot
 * preserves UI-only fields (packSize, unitPrice, locked) the server
 * doesn't know about. NaN line values serialize as null and restore as
 * NaN (red-invalid empty fields) — the existing bill validation covers it.
 */
const KEY = 'bqm.current-bill.v1';

export interface ParkedBill {
  order: Order | null;
  lines: DraftLine[];
  customerName: string;
  mobile: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const numOrNaN = (v: unknown): number => (typeof v === 'number' ? v : NaN);

function sanitizeLines(raw: unknown): DraftLine[] {
  if (!Array.isArray(raw)) return [];
  const out: DraftLine[] = [];
  for (const e of raw) {
    if (!isRecord(e) || typeof e.slug !== 'string' || typeof e.key !== 'string') continue;
    out.push({
      key: e.key,
      kind: e.kind === 'combo' ? 'combo' : 'product',
      slug: e.slug,
      name: typeof e.name === 'string' ? e.name : e.slug,
      step: typeof e.step === 'number' && e.step > 0 ? e.step : 1,
      quantity: numOrNaN(e.quantity),
      price: numOrNaN(e.price),
      ...(typeof e.packSize === 'number' ? { packSize: e.packSize } : {}),
      unit: typeof e.unit === 'string' ? e.unit : '',
      ...(typeof e.unitPrice === 'number' ? { unitPrice: e.unitPrice } : {}),
      ...(typeof e.locked === 'boolean' ? { locked: e.locked } : {}),
    });
  }
  return out;
}

export function loadBill(): ParkedBill | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1) return null;
    const order = isRecord(data.order) && typeof data.order.id === 'string'
      ? (data.order as unknown as Order)
      : null;
    return {
      order,
      lines: sanitizeLines(data.lines),
      customerName: typeof data.customerName === 'string' ? data.customerName : '',
      mobile: typeof data.mobile === 'string' ? data.mobile : '',
    };
  } catch {
    return null; // corrupt or unavailable — start fresh, app keeps working
  }
}

export function saveBill(bill: ParkedBill): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, ...bill }));
  } catch {
    // private mode etc. — app keeps working in memory
  }
}

export function clearBill(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
