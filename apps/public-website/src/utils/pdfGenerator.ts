import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generates and triggers download of a high-resolution, print-ready PDF
 * that preserves authentic Tamil Unicode glyphs and brand styling.
 */
export async function downloadOrderSummaryPdf(
  elementId: string,
  orderRef: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  // Ensure fonts and images are loaded
  if (document.fonts) {
    await document.fonts.ready;
  }

  // Create high-DPI canvas capture
  const canvas = await html2canvas(element, {
    scale: 2, // 2x retina scale for crisp text
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Additional pages if needed
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(`Bensi-Queen-Order-${orderRef}.pdf`);
}

