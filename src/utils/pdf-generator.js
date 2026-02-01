import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { writeFileSync } from 'fs';

function cleanValue(value) {
  if (!value) return '';
  let str = String(value);
  // Remove b' prefix and trailing '
  str = str.replace(/^b'|'$/g, '');
  return str;
}

export async function generatePDFReport(queryResults, query, outputPath) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([842, 595]); // A4 landscape
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 40;
  let yPosition = height - margin;

  // Title
  page.drawText('Clinical Trial Query Report', {
    x: margin,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.6),
  });
  
  yPosition -= 30;

  // Date
  const date = new Date().toLocaleString();
  page.drawText(`Generated: ${date}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  yPosition -= 30;

  // Query
  page.drawText('Query:', {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
  });
  
  yPosition -= 18;
  
  const queryText = query.length > 100 ? query.substring(0, 100) + '...' : query;
  page.drawText(queryText, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
  });
  
  yPosition -= 30;

  // Results summary
  page.drawText(`Total Results: ${queryResults.length}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: boldFont,
  });
  
  yPosition -= 30;

  // Table
  if (queryResults.length > 0) {
    const headers = Object.keys(queryResults[0]).filter(h => h !== 'id').slice(0, 8);
    const colWidth = Math.min(100, (width - 2 * margin) / headers.length);
    
    // Headers
    headers.forEach((header, i) => {
      const headerText = header.length > 12 ? header.substring(0, 10) + '..' : header;
      page.drawText(headerText, {
        x: margin + (i * colWidth),
        y: yPosition,
        size: 9,
        font: boldFont,
      });
    });
    
    yPosition -= 20;

    // Rows - CLEAN THE DATA
    const maxRows = 20;
    queryResults.slice(0, maxRows).forEach((row) => {
      if (yPosition < margin + 20) {
        // Add new page if needed
        page = pdfDoc.addPage([842, 595]);
        yPosition = height - margin;
        
        // Repeat headers on new page
        headers.forEach((header, i) => {
          const headerText = header.length > 12 ? header.substring(0, 10) + '..' : header;
          page.drawText(headerText, {
            x: margin + (i * colWidth),
            y: yPosition,
            size: 9,
            font: boldFont,
          });
        });
        yPosition -= 20;
      }
      
      headers.forEach((header, colIndex) => {
        // CLEAN THE VALUE - remove b'...'
        let value = cleanValue(row[header]);
        value = value.length > 15 ? value.substring(0, 13) + '..' : value;
        
        page.drawText(value, {
          x: margin + (colIndex * colWidth),
          y: yPosition,
          size: 8,
          font: font,
        });
      });
      
      yPosition -= 15;
    });
    
    if (queryResults.length > maxRows) {
      yPosition -= 10;
      page.drawText(`... and ${queryResults.length - maxRows} more records`, {
        x: margin,
        y: yPosition,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync(outputPath, pdfBytes);
  
  return outputPath;
}
