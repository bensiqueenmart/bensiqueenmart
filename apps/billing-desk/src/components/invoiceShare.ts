import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Order } from '@bqm/types';
import { rupees } from '../api';

/**
 * Billing-desk copy of the admin-console invoice export — kept identical on
 * purpose so both terminals produce the same invoice.
 * Invoice export for the Orders tab: Download (PDF file) and Copy image
 * (PNG on the clipboard, paste straight into any WhatsApp chat).
 * Both render from the same offscreen invoice sheet.
 */

export function buildShareMessage(order: Order): string {
  const name = order.customerData?.customerName?.trim();
  const count = order.orderItems?.length ?? 0;
  const paid = order.status === 'confirmed';
  const greeting = name ? `Hi ${name}! ` : 'Hi! ';
  return (
    `${greeting}Here's your invoice ${order.orderNo} ` +
    `(${count} ${count === 1 ? 'item' : 'items'}, ${rupees(order.totalPrice)}) ` +
    `from Bensi Queen. Payment status: ${paid ? 'Paid' : 'Not received yet'}. ` +
    `Thank you for shopping with us!`
  );
}

async function renderInvoiceCanvas(elementId: string): Promise<HTMLCanvasElement> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Invoice element #${elementId} not found`);

  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts are best-effort for capture */
    }
  }

  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
  });
}

async function renderSinglePagePdf(elementId: string): Promise<Blob> {
  const canvas = await renderInvoiceCanvas(elementId);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const imgH = (canvas.height * pageW) / canvas.width;

  if (imgH <= pageH) {
    // Fits: full-bleed single page.
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
  } else {
    // Overflow: shrink-to-fit so the invoice is ALWAYS exactly one page.
    const drawH = pageH;
    const drawW = (drawH * canvas.width) / canvas.height;
    const x = (pageW - drawW) / 2;
    pdf.addImage(imgData, 'JPEG', x, 0, drawW, drawH);
  }

  return pdf.output('blob') as Blob;
}

/** Render the invoice PDF and trigger a plain file download. Never fails silently. */
export async function downloadInvoicePdf(order: Order, elementId: string): Promise<{ ok: true } | { ok: false; note: string }> {
  let blob: Blob;
  try {
    blob = await renderSinglePagePdf(elementId);
  } catch (err) {
    console.error('Invoice render failed:', err);
    return { ok: false, note: 'Could not build the invoice. Please try again.' };
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bensi-Queen-Invoice-${order.orderNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true };
  } catch (err) {
    console.error('Invoice download failed:', err);
    return { ok: false, note: 'Could not download the invoice. Please try again.' };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/**
 * Render the invoice as a PNG and write it to the clipboard alongside the
 * message text, so the desk assistant can paste it straight into any chat
 * (Ctrl+V / Cmd+V). Needs a secure context + ClipboardItem image support
 * (Chrome/Edge desktop solid; Safari falls back to Download).
 */
export async function copyInvoiceImage(order: Order, elementId: string): Promise<{ ok: true } | { ok: false; note: string }> {
  const clip = navigator.clipboard as Clipboard | undefined;
  if (typeof ClipboardItem === 'undefined' || !clip || typeof clip.write !== 'function') {
    return { ok: false, note: 'Copy is not supported in this browser — use Download instead.' };
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = await renderInvoiceCanvas(elementId);
  } catch (err) {
    console.error('Invoice render failed:', err);
    return { ok: false, note: 'Could not build the invoice. Please try again.' };
  }

  const png = await canvasToBlob(canvas);
  if (!png) return { ok: false, note: 'Could not build the invoice image. Use Download instead.' };

  try {
    await clip.write([
      new ClipboardItem({
        'image/png': png,
        'text/plain': new Blob([buildShareMessage(order)], { type: 'text/plain' }),
      }),
    ]);
    return { ok: true };
  } catch (err) {
    console.error('Clipboard write failed:', err);
    return { ok: false, note: 'Copy was blocked — use Download instead.' };
  }
}
