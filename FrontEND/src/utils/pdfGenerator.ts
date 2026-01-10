import jsPDF from 'jspdf';

interface ReportData {
  playerName: string;
  playerAge: number;
  finalNetworth: number;
  cagr: number;
  profitLoss: number;
  reportContent: string;
  generatedDate: string;
  reportId?: string;
}

export function generateReportPDF(data: ReportData): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 0;

  // Add page numbers
  const addPageNumber = () => {
    const pageCount = (pdf as any).internal.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // ===== HEADER SECTION =====
  // Dark background gradient effect
  pdf.setFillColor(31, 41, 55); // Dark gray-blue
  pdf.rect(0, 0, pageWidth, 55, 'F');

  // Title
  pdf.setTextColor(52, 211, 153); // Teal-green from UI
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AI Trading Performance Report', margin, 20);

  yPosition = 35;

  // ===== PLAYER INFO CARD =====
  // White card with subtle shadow effect
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, yPosition, contentWidth, 32, 3, 3, 'F');
  
  // Purple accent bar (matching UI)
  pdf.setFillColor(147, 51, 234);
  pdf.rect(margin, yPosition, 4, 32, 'F');

  // Player name
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cleanText(data.playerName), margin + 8, yPosition + 10);
  
  // Age subtitle
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128); // Gray-500
  const ageLabel = data.playerAge < 5 ? '(Early Learner)' : data.playerAge < 15 ? '(Developing)' : '(Experienced)';
  pdf.text(`Age: ${data.playerAge} ${ageLabel}`, margin + 8, yPosition + 17);
  
  // Date and ID
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175); // Gray-400
  pdf.text(`Generated: ${data.generatedDate}`, margin + 8, yPosition + 23);
  
  if (data.reportId) {
    pdf.setTextColor(147, 51, 234); // Purple
    pdf.setFont('helvetica', 'bold');
    pdf.text(`ID: ${data.reportId}`, margin + 8, yPosition + 28);
  }

  yPosition += 40;

  // ===== PERFORMANCE METRICS CARDS =====
  const cardHeight = 35;
  const cardSpacing = 4;
  const cardWidth = (contentWidth - 2 * cardSpacing) / 3;

  // Card 1: Final Networth (Teal-Green matching UI)
  pdf.setFillColor(52, 211, 153);
  pdf.roundedRect(margin, yPosition, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('FINAL NETWORTH', margin + cardWidth / 2, yPosition + 10, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Rs. ${formatNumber(data.finalNetworth)}`, margin + cardWidth / 2, yPosition + 22, { align: 'center' });

  // Card 2: CAGR (Blue matching UI)
  pdf.setFillColor(59, 130, 246);
  pdf.roundedRect(margin + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CAGR', margin + cardWidth + cardSpacing + cardWidth / 2, yPosition + 10, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.cagr.toFixed(2)}%`, margin + cardWidth + cardSpacing + cardWidth / 2, yPosition + 22, { align: 'center' });

  // Card 3: Profit/Loss (Green/Red)
  const isProfitable = data.profitLoss >= 0;
  if (isProfitable) {
    pdf.setFillColor(34, 197, 94); // Green
  } else {
    pdf.setFillColor(239, 68, 68); // Red
  }
  pdf.roundedRect(margin + 2 * (cardWidth + cardSpacing), yPosition, cardWidth, cardHeight, 4, 4, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PROFIT/LOSS', margin + 2 * (cardWidth + cardSpacing) + cardWidth / 2, yPosition + 10, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const plText = `${data.profitLoss >= 0 ? '+' : ''}Rs. ${formatNumber(Math.abs(data.profitLoss))}`;
  pdf.text(plText, margin + 2 * (cardWidth + cardSpacing) + cardWidth / 2, yPosition + 22, { align: 'center' });

  yPosition += cardHeight + 15;

  // ===== MAIN CONTENT SECTION =====
  // Light background for content area
  pdf.setFillColor(249, 250, 251);
  pdf.rect(0, yPosition - 5, pageWidth, pageHeight - yPosition + 5, 'F');

  // Main title banner
  pdf.setFillColor(31, 41, 55);
  pdf.rect(margin - 5, yPosition, contentWidth + 10, 15, 'F');
  
  pdf.setTextColor(52, 211, 153); // Teal
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TRADING PERFORMANCE & FINANCIAL DISCIPLINE REPORT', margin, yPosition + 10);
  
  yPosition += 22;

  // Summary info section
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, yPosition, contentWidth, 28, 3, 3, 'F');
  
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Player:`, margin + 5, yPosition + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${cleanText(data.playerName)} (Age: ${data.playerAge})`, margin + 20, yPosition + 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Report ID:`, margin + 5, yPosition + 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(147, 51, 234);
  pdf.text(`${data.reportId || 'N/A'}`, margin + 25, yPosition + 14);
  
  pdf.setTextColor(30, 30, 30);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Final Networth:`, margin + 5, yPosition + 20);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Rs.${formatNumber(data.finalNetworth)}`, margin + 32, yPosition + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total Profit/Loss:`, margin + 85, yPosition + 20);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.profitLoss >= 0 ? '+' : ''}Rs.${formatNumber(Math.abs(data.profitLoss))}`, margin + 116, yPosition + 20);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`CAGR:`, margin + 5, yPosition + 26);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.cagr.toFixed(2)}%`, margin + 18, yPosition + 26);

  yPosition += 35;

  // ===== REPORT CONTENT =====
  pdf.setTextColor(40, 40, 40);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const cleanedContent = cleanText(data.reportContent);
  const lines = cleanedContent.split('\n');

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render it
        if (codeBlockLines.length > 0) {
          yPosition += 2;

          const codeHeight = codeBlockLines.length * 4.5 + 6;

          if (yPosition + codeHeight > pageHeight - 30) {
            addPageNumber();
            pdf.addPage();
          // ===== MAIN CONTENT SECTION =====
          // Dark background for content area (match UI)
          pdf.setFillColor(26, 26, 46); // #00326b
          pdf.rect(0, yPosition - 5, pageWidth, pageHeight - yPosition + 5, 'F');
            yPosition = margin;
          }

          // Code block background
          pdf.setFillColor(31, 41, 55); // Dark background
          pdf.roundedRect(margin, yPosition - 2, contentWidth, codeHeight, 2, 2, 'F');

          // Render code lines
          pdf.setTextColor(156, 203, 175); // Light green monospace color
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(8);

          let codeY = yPosition + 3;
          for (const codeLine of codeBlockLines) {
            pdf.text(codeLine, margin + 3, codeY);
            codeY += 4.5;
          }

          yPosition += codeHeight + 3;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(40, 40, 40);

          codeBlockLines = [];
        }
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Page overflow check
    if (yPosition > pageHeight - 30) {
      addPageNumber();
      pdf.addPage();
      // Continue light background
      pdf.setFillColor(26, 26, 46); // #03649c
      pdf.rect(0, 0, pageWidth, pageHeight, 'F'); 
      yPosition = margin;
    }

    if (!line.trim()) {
      yPosition += 3;
      continue;
    }

    // Horizontal dividers
    if (line.trim() === '---' || line.trim() === '___' || line.trim() === '***') {
      pdf.setDrawColor(209, 213, 219);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 15, yPosition + 2, pageWidth - margin - 15, yPosition + 2);
      yPosition += 7;
      continue;
    }

    // Section numbers (# 1., # 2., etc.)
    const sectionMatch = line.match(/^#?\s*(\d+)\.\s*(.+?):\s*\*\*(.+?)\*\*/);
    if (sectionMatch) {
      yPosition += 3;
      
      // Section card background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPosition - 2, contentWidth, 18, 3, 3, 'F');
      
      // Number circle (matching UI purple)
      pdf.setFillColor(147, 51, 234);
      pdf.circle(margin + 8, yPosition + 6, 5, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(sectionMatch[1], margin + 8, yPosition + 8, { align: 'center' });
      
      // Section title
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const sectionTitle = `${sectionMatch[2]}:`;
      pdf.text(sectionTitle, margin + 16, yPosition + 7);
      
      // Highlighted classification
      pdf.setTextColor(52, 211, 153); // Teal
      pdf.setFont('helvetica', 'bold');
      pdf.text(sectionMatch[3], margin + 16 + pdf.getTextWidth(sectionTitle) + 2, yPosition + 7);
      
      yPosition += 22;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      continue;
    }

    // Main headers (full line bold)
    if (line.trim().startsWith('**') && line.trim().endsWith('**') && line.length < 100 && !line.includes('Analyst Note')) {
      yPosition += 2;
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(147, 51, 234); // Purple
      const text = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
      pdf.text(cleanText(text), margin, yPosition);
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      continue;
    }

    // Subsection headers (###)
    if (line.startsWith('### ')) {
      yPosition += 2;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246); // Blue
      const text = line.replace('### ', '');
      pdf.text(cleanText(text), margin, yPosition);
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      continue;
    }

    // Block quotes
    if (line.trim().startsWith('> ')) {
      yPosition += 2;
      const quoteText = line.trim().replace(/^>\s*/, '');

      // Quote background
      pdf.setFillColor(241, 245, 249); // Light blue-gray
      pdf.setDrawColor(59, 130, 246); // Blue border
      pdf.setLineWidth(1);

      const wrappedQuote = pdf.splitTextToSize(cleanText(quoteText), contentWidth - 10);
      const quoteHeight = wrappedQuote.length * 5 + 4;

      if (yPosition + quoteHeight > pageHeight - 30) {
        addPageNumber();
        pdf.addPage();
        pdf.setFillColor(249, 250, 251);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        yPosition = margin;
      }

      pdf.roundedRect(margin, yPosition - 2, contentWidth, quoteHeight, 2, 2, 'FD');

      pdf.setTextColor(71, 85, 105); // Slate-600
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);

      let quoteY = yPosition + 2;
      for (const quoteLine of wrappedQuote) {
        pdf.text(quoteLine, margin + 5, quoteY);
        quoteY += 5;
      }

      yPosition += quoteHeight + 3;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      continue;
    }

    // Numbered list items (not section headers)
    const numberedListMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch && !line.includes('**')) {
      const num = numberedListMatch[1];
      let text = numberedListMatch[2];

      // Remove bold markers
      text = text.replace(/\*\*/g, '');

      // Number badge (purple accent)
      pdf.setFillColor(147, 51, 234);
      pdf.circle(margin + 3, yPosition - 0.5, 1.8, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(num, margin + 3, yPosition + 0.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(10);
      const wrappedText = pdf.splitTextToSize(cleanText(text), contentWidth - 14);
      for (let i = 0; i < wrappedText.length; i++) {
        if (yPosition > pageHeight - 30) {
          addPageNumber();
          pdf.addPage();
          pdf.setFillColor(249, 250, 251);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          yPosition = margin;
        }
        pdf.text(wrappedText[i], margin + 8, yPosition);
        yPosition += 5;
      }
      yPosition += 2;
      continue;
    }

    // Bullet points with modern styling
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
      let text = line.trim().replace(/^[-*•]\s*/, '');

      // Remove bold markers from bullet text
      text = text.replace(/\*\*/g, '');

      // Bullet circle (teal accent)
      pdf.setFillColor(52, 211, 153);
      pdf.circle(margin + 3, yPosition - 0.5, 1.5, 'F');

      const colonIndex = text.indexOf(':');

      if (colonIndex > 0 && colonIndex < 60) {
        const label = text.substring(0, colonIndex + 1);
        const description = text.substring(colonIndex + 1).trim();

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text(cleanText(label), margin + 7, yPosition);
        const labelWidth = pdf.getTextWidth(cleanText(label));

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81); // Gray-700
        const wrappedDesc = pdf.splitTextToSize(cleanText(description), contentWidth - 14 - labelWidth);

        if (wrappedDesc.length > 0) {
          pdf.text(wrappedDesc[0], margin + 7 + labelWidth + 1, yPosition);
          yPosition += 5;

          for (let i = 1; i < wrappedDesc.length; i++) {
            if (yPosition > pageHeight - 30) {
              addPageNumber();
              pdf.addPage();
              pdf.setFillColor(249, 250, 251);
              pdf.rect(0, 0, pageWidth, pageHeight, 'F');
              yPosition = margin;
            }
            pdf.text(wrappedDesc[i], margin + 7, yPosition);
            yPosition += 5;
          }
        }
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        const wrappedText = pdf.splitTextToSize(cleanText(text), contentWidth - 14);
        for (let i = 0; i < wrappedText.length; i++) {
          if (yPosition > pageHeight - 30) {
            addPageNumber();
            pdf.addPage();
            pdf.setFillColor(249, 250, 251);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            yPosition = margin;
          }
          pdf.text(wrappedText[i], margin + 7, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 2;
      continue;
    }

    // Handle markdown tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Check if it's a table separator line
      if (line.match(/^\|[\s:-]+\|/)) {
        yPosition += 2;
        continue;
      }

      // Parse table row
      const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());

      if (cells.length > 0) {
        yPosition += 1;
        const cellWidth = contentWidth / cells.length;
        let xPos = margin;

        // Check if this is a header row (check if next line is separator)
        const isHeader = lineIndex + 1 < lines.length && lines[lineIndex + 1].match(/^\|[\s:-]+\|/);

        for (const cell of cells) {
          if (isHeader) {
            pdf.setFillColor(147, 51, 234); // Purple header
            pdf.rect(xPos, yPosition - 3, cellWidth, 8, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
          } else {
            pdf.setDrawColor(209, 213, 219);
            pdf.setLineWidth(0.2);
            pdf.rect(xPos, yPosition - 3, cellWidth, 8);
            pdf.setTextColor(55, 65, 81);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
          }

          const cellText = cleanText(cell);
          pdf.text(cellText, xPos + 2, yPosition + 2);
          xPos += cellWidth;
        }

        yPosition += 8;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        continue;
      }
    }

    // Handle **Analyst Note:** special formatting
    if (line.startsWith('**Analyst Note:**')) {
      yPosition += 3;
      pdf.setFillColor(254, 243, 199); // Light yellow
      const noteHeight = 12;
      pdf.roundedRect(margin, yPosition - 2, contentWidth, noteHeight, 2, 2, 'F');
      
      pdf.setTextColor(146, 64, 14); // Amber-800
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analyst Note:', margin + 3, yPosition + 3);
      
      const noteText = line.replace('**Analyst Note:**', '').replace(/^\*/, '').replace(/\*$/, '').trim();
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(120, 53, 15);
      const wrappedNote = pdf.splitTextToSize(cleanText(noteText), contentWidth - 6);
      let noteY = yPosition + 8;
      for (const noteLine of wrappedNote) {
        pdf.text(noteLine, margin + 3, noteY);
        noteY += 4;
      }
      yPosition += noteHeight + 3;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      continue;
    }

    // Regular paragraph text (handle inline formatting)
    const processedLine = cleanText(line);

    // Check if line contains inline formatting (bold or code)
    if (processedLine.includes('**') || processedLine.includes('`')) {
      // Split by both bold and code patterns
      const parts = processedLine.split(/(\*\*.*?\*\*|`.*?`)/g);
      let xPos = margin;

      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(10);

      for (const part of parts) {
        if (!part) continue;

        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold text
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 30, 30);
          const boldText = part.replace(/^\*\*/, '').replace(/\*\*$/, '');

          const boldWidth = pdf.getTextWidth(boldText);
          if (xPos + boldWidth > pageWidth - margin) {
            yPosition += 5;
            xPos = margin;
            if (yPosition > pageHeight - 30) {
              addPageNumber();
              pdf.addPage();
              pdf.setFillColor(249, 250, 251);
              pdf.rect(0, 0, pageWidth, pageHeight, 'F');
              yPosition = margin;
            }
          }

          pdf.text(boldText, xPos, yPosition);
          xPos += boldWidth;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          // Inline code
          const codeText = part.replace(/^`/, '').replace(/`$/, '');

          pdf.setFont('courier', 'normal');
          pdf.setFontSize(9);
          const codeWidth = pdf.getTextWidth(codeText);

          if (xPos + codeWidth + 4 > pageWidth - margin) {
            yPosition += 5;
            xPos = margin;
            if (yPosition > pageHeight - 30) {
              addPageNumber();
              pdf.addPage();
              pdf.setFillColor(249, 250, 251);
              pdf.rect(0, 0, pageWidth, pageHeight, 'F');
              yPosition = margin;
            }
          }

          // Code background
          pdf.setFillColor(241, 245, 249);
          pdf.roundedRect(xPos, yPosition - 3, codeWidth + 2, 4.5, 1, 1, 'F');

          pdf.setTextColor(239, 68, 68); // Red code text
          pdf.text(codeText, xPos + 1, yPosition);

          xPos += codeWidth + 4;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
        } else {
          // Normal text
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81);

          const words = part.split(' ');
          for (let w = 0; w < words.length; w++) {
            const word = words[w] + (w < words.length - 1 ? ' ' : '');
            const wordWidth = pdf.getTextWidth(word);

            if (xPos + wordWidth > pageWidth - margin) {
              yPosition += 5;
              xPos = margin;
              if (yPosition > pageHeight - 30) {
                addPageNumber();
                pdf.addPage();
                pdf.setFillColor(249, 250, 251);
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                yPosition = margin;
              }
            }

            pdf.text(word, xPos, yPosition);
            xPos += wordWidth;
          }
        }
      }
      yPosition += 6;
    } else {
      // Simple paragraph without inline formatting
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      const wrappedText = pdf.splitTextToSize(processedLine, contentWidth);
      for (let i = 0; i < wrappedText.length; i++) {
        if (yPosition > pageHeight - 30) {
          addPageNumber();
          pdf.addPage();
          pdf.setFillColor(249, 250, 251);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          yPosition = margin;
        }
        pdf.text(wrappedText[i], margin, yPosition);
        yPosition += 5;
      }
      yPosition += 1;
    }
  }

  // Add final page number
  addPageNumber();

  // Modern Footer with accent
  const footerY = pageHeight - 12;

  // Dark footer background
  pdf.setFillColor(31, 41, 55);
  pdf.rect(0, footerY - 3, pageWidth, 15, 'F');

  // Teal accent line at top of footer
  pdf.setFillColor(52, 211, 153);
  pdf.rect(0, footerY - 3, pageWidth, 1, 'F');

  // Footer text
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Generated by BullRun Game', pageWidth / 2, footerY + 2, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AI-Powered Trading Performance Analysis', pageWidth / 2, footerY + 6, { align: 'center' });

  // Generate filename
  const filename = `TradingReport_${data.playerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

function cleanText(text: string): string {
  return text
    .replace(/₹/g, 'Rs.')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '');
}

function formatNumber(num: number): string {
  const absNum = Math.abs(num);

  if (absNum >= 10000000) {
    return (absNum / 10000000).toFixed(2) + ' Cr';
  } else if (absNum >= 100000) {
    return (absNum / 100000).toFixed(2) + ' L';
  } else if (absNum >= 1000) {
    return (absNum / 1000).toFixed(2) + 'K';
  }
  return absNum.toLocaleString('en-IN');
}