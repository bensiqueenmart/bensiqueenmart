import { jsPDF } from 'jspdf';
import type { SalesAnalyticsResponse } from '@bqm/types';

/**
 * Sanitizes any string to pure 7-bit printable ASCII (32-126).
 * Strips out Tamil / non-Latin characters, unencoded symbols, mojibake,
 * and converts common unicode punctuation into standard ASCII equivalents.
 */
function cleanAscii(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '-')
    .replace(/₹/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, '') // strip all characters outside standard printable ASCII
    .replace(/\s+/g, ' ')
    .trim();
}

export function generatePdfReport(data: SalesAnalyticsResponse): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 50) {
      doc.addPage();
      y = margin;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFillColor(18, 59, 38); // #123B26
    doc.rect(margin, y, contentWidth, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(cleanAscii('BENSI QUEEN MART - SALES PERFORMANCE REPORT'), margin + 10, y + 16);
    y += 34;
  };

  // --- Page 1: Main Branded Header ---
  doc.setFillColor(18, 59, 38); // Dark Green #123B26
  doc.rect(margin, y, contentWidth, 68, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(cleanAscii('BENSI QUEEN MART'), margin + 16, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(220, 232, 200); // Soft Sage
  doc.text(cleanAscii('Executive Sales Analytics & Performance Report'), margin + 16, y + 46);

  doc.setFontSize(9);
  doc.setTextColor(247, 245, 232); // Cream
  let reportDateStr = '';
  try {
    const now = new Date();
    const dStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const tStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    reportDateStr = `${dStr} ${tStr}`;
  } catch {
    reportDateStr = new Date().toISOString().slice(0, 16);
  }
  doc.text(cleanAscii(`Generated on: ${reportDateStr} (IST)`), margin + 16, y + 60);

  y += 82;

  // Period Banner
  doc.setFillColor(247, 245, 232); // #F7F5E8
  doc.setDrawColor(220, 232, 200); // #DCE8C8
  doc.rect(margin, y, contentWidth, 30, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 38);
  let startStr = '';
  let endStr = '';
  try {
    startStr = new Date(data.dateRange.startDate).toLocaleDateString('en-GB');
    endStr = new Date(data.dateRange.endDate).toLocaleDateString('en-GB');
  } catch {
    startStr = String(data.dateRange.startDate).slice(0, 10);
    endStr = String(data.dateRange.endDate).slice(0, 10);
  }
  doc.text(cleanAscii(`Reporting Period: ${startStr} to ${endStr}`), margin + 12, y + 19);

  y += 44;

  // --- KPI Summary Cards ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 59, 38);
  doc.text(cleanAscii('KEY PERFORMANCE INDICATORS'), margin, y);
  y += 10;

  const cardW = (contentWidth - 30) / 4;
  const cardH = 54;
  const kpiData = [
    { title: 'TOTAL SALES', val: cleanAscii(`Rs. ${data.kpis.totalRevenue.toFixed(2)}`), sub: 'Confirmed revenue' },
    { title: 'TOTAL ORDERS', val: cleanAscii(String(data.kpis.totalConfirmedOrders)), sub: cleanAscii(`${data.kpis.totalUnconfirmedOrders} unconfirmed`) },
    {
      title: 'PRODUCTS SOLD',
      val: cleanAscii(`${data.kpis.totalPacketsSold > 0 ? data.kpis.totalPacketsSold + ' pkts ' : ''}${data.kpis.totalLooseQuantitySold > 0 ? (data.kpis.totalLooseQuantitySold >= 1000 ? (data.kpis.totalLooseQuantitySold / 1000).toFixed(1) + 'kg' : data.kpis.totalLooseQuantitySold + 'g') : ''}`.trim() || '0 items'),
      sub: cleanAscii(`${data.kpis.totalLineItemsSold} item lines`),
    },
    { title: 'AVG ORDER VALUE', val: cleanAscii(`Rs. ${data.kpis.averageOrderValue.toFixed(2)}`), sub: 'Per confirmed order' },
  ];

  kpiData.forEach((kpi, idx) => {
    const cx = margin + idx * (cardW + 10);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 232, 200);
    doc.rect(cx, y, cardW, cardH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(32, 92, 56);
    doc.text(kpi.title, cx + 8, y + 14);

    doc.setFontSize(14);
    doc.setTextColor(18, 59, 38);
    doc.text(kpi.val, cx + 8, y + 33);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(104, 130, 109);
    doc.text(kpi.sub, cx + 8, y + 46);
  });

  y += cardH + 24;

  // --- Distributions Summary ---
  checkPageBreak(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 59, 38);
  doc.text(cleanAscii('CHANNEL & STATUS DISTRIBUTIONS'), margin, y);
  y += 12;

  const halfW = (contentWidth - 12) / 2;

  // Source box
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(220, 232, 200);
  doc.rect(margin, y, halfW, 70, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 38);
  doc.text(cleanAscii('Order Source Split'), margin + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 60, 45);
  let distY = y + 34;
  data.sourceDistribution.forEach((s) => {
    const line = cleanAscii(`- ${s.label}: ${s.count} orders (${s.percentage}%) - Rs. ${(s.revenue || 0).toFixed(2)}`);
    doc.text(line, margin + 12, distY);
    distY += 16;
  });

  // Status box
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(220, 232, 200);
  doc.rect(margin + halfW + 12, y, halfW, 70, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 59, 38);
  doc.text(cleanAscii('Order Status Split'), margin + halfW + 24, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 60, 45);
  distY = y + 34;
  data.statusDistribution.forEach((s) => {
    const line = cleanAscii(`- ${s.label}: ${s.count} orders (${s.percentage}%)`);
    doc.text(line, margin + halfW + 24, distY);
    distY += 16;
  });

  y += 86;

  // --- All 35 Products Table ---
  checkPageBreak(160);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 59, 38);
  doc.text(cleanAscii(`ALL ${data.productSales.length} PRODUCTS PERFORMANCE BREAKDOWN`), margin, y);
  y += 12;

  // Table header
  const thH = 20;
  doc.setFillColor(32, 92, 56);
  doc.rect(margin, y, contentWidth, thH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 6, y + 14);
  doc.text('Product Name & Category', margin + 28, y + 14);
  doc.text('Quantity Sold', margin + 250, y + 14);
  doc.text('Orders', margin + 370, y + 14);
  doc.text('Sales (Rs.)', margin + 435, y + 14);
  doc.text('Share', margin + 490, y + 14);

  y += thH;

  data.productSales.forEach((p, idx) => {
    checkPageBreak(20);

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 248);
    doc.rect(margin, y, contentWidth, 18, 'F');

    doc.setFont('helvetica', p.totalRevenue > 0 ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(p.totalRevenue > 0 ? 18 : 120, p.totalRevenue > 0 ? 59 : 130, p.totalRevenue > 0 ? 38 : 120);

    doc.text(String(idx + 1), margin + 6, y + 12);

    // Clean English product name without Unicode Tamil characters that cause mojibake
    const prodTitle = cleanAscii(p.category && p.category !== 'General' ? `${p.name} [${p.category}]` : p.name);
    doc.text(prodTitle.slice(0, 48), margin + 28, y + 12);

    const qtyText = cleanAscii(p.quantityDisplay);
    doc.text(qtyText.slice(0, 30), margin + 250, y + 12);

    doc.text(cleanAscii(String(p.ordersCount)), margin + 375, y + 12);
    doc.text(cleanAscii(p.totalRevenue.toFixed(2)), margin + 435, y + 12);
    doc.text(cleanAscii(p.percentOfTotalSales > 0 ? `${p.percentOfTotalSales}%` : '-'), margin + 490, y + 12);

    y += 18;
  });

  // --- Combos Section (if any) ---
  if (data.comboSales && data.comboSales.length > 0) {
    y += 16;
    checkPageBreak(80);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(18, 59, 38);
    doc.text(cleanAscii('COMBO PACKAGES SALES ANALYSIS'), margin, y);
    y += 10;

    data.comboSales.forEach((c) => {
      checkPageBreak(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 45, 35);
      const comboText = cleanAscii(`- ${c.name}: ${c.unitsSold} units sold across ${c.ordersCount} orders - Rs. ${c.totalRevenue.toFixed(2)} (${c.percentOfTotalSales}%)`);
      doc.text(comboText, margin + 10, y + 12);
      y += 16;
    });
  }

  // --- Recent Orders Section ---
  if (data.recentOrdersPreview && data.recentOrdersPreview.length > 0) {
    y += 16;
    checkPageBreak(120);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(18, 59, 38);
    doc.text(cleanAscii('RECENT ORDERS AUDIT SUMMARY'), margin, y);
    y += 10;

    data.recentOrdersPreview.forEach((o) => {
      checkPageBreak(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 50, 45);
      let dateShort = '';
      try {
        const od = new Date(o.createdAt);
        const dStr = od.toLocaleDateString('en-GB');
        const tStr = od.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        dateShort = `${dStr} ${tStr}`;
      } catch {
        dateShort = String(o.createdAt).slice(0, 16);
      }
      const orderLine = cleanAscii(`[${o.orderNo}] ${dateShort} | ${o.customerName} | ${o.source} | ${o.status.toUpperCase()} | Rs. ${o.totalPrice.toFixed(2)}`);
      doc.text(orderLine, margin + 10, y + 12);
      y += 16;
    });
  }

  // Page Numbers Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 140, 125);
    const footerText = cleanAscii(`Bensi Queen Mart Confidential Business Intelligence - Page ${p} of ${totalPages}`);
    doc.text(footerText, margin, pageHeight - 20);
  }

  // Download PDF
  const cleanFilename = `BQM-Sales-Report-${cleanAscii(startStr).replace(/[^a-zA-Z0-9]/g, '-')}-to-${cleanAscii(endStr).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  doc.save(cleanFilename);
}
