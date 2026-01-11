import jsPDF from 'jspdf';
import { MontserratFonts } from './montserratFonts';

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
    putOnlyUsedFonts: true,
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 0;

  // ============================================
  // MONTSERRAT FONT REGISTRATION
  // ============================================
  // Register Montserrat font family with jsPDF
  pdf.addFileToVFS('Montserrat-Regular.ttf', MontserratFonts.regular);
  pdf.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

  pdf.addFileToVFS('Montserrat-Bold.ttf', MontserratFonts.bold);
  pdf.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');

  pdf.addFileToVFS('Montserrat-Italic.ttf', MontserratFonts.italic);
  pdf.addFont('Montserrat-Italic.ttf', 'Montserrat', 'italic');

  pdf.addFileToVFS('Montserrat-BoldItalic.ttf', MontserratFonts.boldItalic);
  pdf.addFont('Montserrat-BoldItalic.ttf', 'Montserrat', 'bolditalic');

  // ============================================
  // MASTER FONT CONFIGURATION
  // ============================================
  // Change font family here to apply globally across the entire PDF
  const FONT_FAMILY = {
    base: 'Montserrat',
  };

  const COLORS = {
    pageBackground: [18, 18, 18] as [number, number, number],    // Dark background #121212
    cardBackground: [30, 30, 30] as [number, number, number],     // Dark card #1E1E1E
    accent: [133, 76, 230] as [number, number, number],           // Purple accent #854CE6 (PhonePe-like)
    headingText: [255, 255, 255] as [number, number, number],     // White text
    bodyText: [200, 200, 200] as [number, number, number],        // Light gray text
    labelGray: [150, 150, 150] as [number, number, number],       // Gray labels
    positive: [34, 197, 94] as [number, number, number],          // Green for profit
    negative: [239, 68, 68] as [number, number, number],          // Red for loss
    divider: [60, 60, 60] as [number, number, number],            // Dark divider
  };

  const addPageNumber = () => {
    const pageCount = (pdf as any).internal.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.labelGray);
    pdf.text(`Page: ${pageCount}`, pageWidth - 10, pageHeight - 2, { align: 'center' });
  };

  const drawPageBackground = () => {
    pdf.setFillColor(...COLORS.pageBackground);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  drawPageBackground();

  pdf.setFillColor(...COLORS.accent);
  pdf.rect(0, 0, pageWidth, 3, 'F');

  pdf.setTextColor(...COLORS.headingText);
  pdf.setFontSize(24);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text('AI-Powered Trading Analysis Report', pageWidth / 2, 20, { align: 'center' });

  yPosition = 30;

  pdf.setFillColor(...COLORS.cardBackground);
  pdf.roundedRect(margin, yPosition, contentWidth, 24, 8, 8, 'F');

  pdf.setTextColor(...COLORS.headingText);
  pdf.setFontSize(13);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text(cleanText(data.playerName), margin + 8, yPosition + 9);

  pdf.setFontSize(8);
  pdf.setFont(FONT_FAMILY.base, 'normal');
  pdf.setTextColor(...COLORS.labelGray);
  const ageLabel = data.playerAge < 20 ? 'Young Learner' : data.playerAge < 30 ? 'Student Explorer' : 'Experienced Learner';
  pdf.text(`${ageLabel} • Age ${data.playerAge} • ${data.generatedDate}`, margin + 8, yPosition + 15);

  if (data.reportId) {
    pdf.setTextColor(...COLORS.accent);
    pdf.setFont(FONT_FAMILY.base, 'bold');
    pdf.setFontSize(7.5);
    pdf.text(`ID: ${data.reportId}`, margin + 8, yPosition + 20);
  }

  yPosition += 25;

  const cardHeight = 30;
  const cardSpacing = 6;
  const cardWidth = (contentWidth - 2 * cardSpacing) / 3;

  pdf.setFillColor(...COLORS.cardBackground);
  pdf.roundedRect(margin, yPosition, cardWidth, cardHeight, 8, 8, 'F');

  pdf.setTextColor(...COLORS.labelGray);
  pdf.setFontSize(9);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text('TOTAL MONEY', margin + cardWidth / 2, yPosition + 9, { align: 'center' });

  pdf.setTextColor(...COLORS.headingText);
  pdf.setFontSize(14);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text(`Rs.${formatNumber(data.finalNetworth)}`, margin + cardWidth / 2, yPosition + 20, { align: 'center' });

  const card2X = margin + cardWidth + cardSpacing;
  pdf.setFillColor(...COLORS.cardBackground);
  pdf.roundedRect(card2X, yPosition, cardWidth, cardHeight, 8, 8, 'F');

  pdf.setTextColor(...COLORS.labelGray);
  pdf.setFontSize(9);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text('GROWTH RATE', card2X + cardWidth / 2, yPosition + 9, { align: 'center' });

  pdf.setTextColor(...COLORS.headingText);
  pdf.setFontSize(14);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text(`${data.cagr.toFixed(2)}%`, card2X + cardWidth / 2, yPosition + 20, { align: 'center' });

  const card3X = margin + 2 * (cardWidth + cardSpacing);
  const isGrowth = data.profitLoss >= 0;

  pdf.setFillColor(...COLORS.cardBackground);
  pdf.roundedRect(card3X, yPosition, cardWidth, cardHeight, 8, 8, 'F');

  pdf.setTextColor(...COLORS.labelGray);
  pdf.setFontSize(9);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text('MONEY CHANGE', card3X + cardWidth / 2, yPosition + 9, { align: 'center' });

  pdf.setTextColor(...(isGrowth ? COLORS.positive : COLORS.negative));
  pdf.setFontSize(14);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  const plText = `${data.profitLoss >= 0 ? '+' : ''}Rs.${formatNumber(Math.abs(data.profitLoss))}`;
  pdf.text(plText, card3X + cardWidth / 2, yPosition + 20, { align: 'center' });

  yPosition += cardHeight + 10;

  pdf.setFillColor(...COLORS.divider);
  pdf.rect(margin, yPosition, contentWidth, 0.5, 'F');
  yPosition += 6;

  pdf.setTextColor(...COLORS.headingText);
  pdf.setFontSize(13);
  pdf.setFont(FONT_FAMILY.base, 'bold');
  pdf.text('Your Learning Insights', margin + 6, yPosition);

  yPosition += 3;

  pdf.setTextColor(...COLORS.bodyText);
  pdf.setFontSize(10);
  pdf.setFont(FONT_FAMILY.base, 'normal');

  const cleanedContent = cleanText(data.reportContent);
  const lines = cleanedContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (yPosition > pageHeight - 32) {
      addPageNumber();
      pdf.addPage();
      drawPageBackground();
      yPosition = margin + 14;
    }

    if (!line.trim()) {
      yPosition += 3;
      continue;
    }

    const sectionMatch = line.match(/^##\s+(\d+)\.\s+(.+?)(?:\s*:\s*\*\*(.+?)\*\*)?$/);
    if (sectionMatch) {
      yPosition += 6;

      // Ensure section heading has enough space (at least 20mm for heading + some content)
      const MIN_SPACE_FOR_SECTION = 20;
      if (yPosition + MIN_SPACE_FOR_SECTION > pageHeight - 32) {
        addPageNumber();
        pdf.addPage();
        drawPageBackground();
        yPosition = margin + 14;
      }

      pdf.setTextColor(...COLORS.headingText);
      pdf.setFontSize(12);
      pdf.setFont(FONT_FAMILY.base, 'bold');

      const fullSectionText = `${sectionMatch[1]}. ${sectionMatch[2]}`;
      pdf.text(fullSectionText, margin + 6, yPosition);

      if (sectionMatch[3]) {
        const titleWidth = pdf.getTextWidth(fullSectionText);
        pdf.setTextColor(...COLORS.bodyText);
        pdf.setFont(FONT_FAMILY.base, 'normal');
        pdf.setFontSize(10);
        pdf.text(`: ${sectionMatch[3]}`, margin + 6 + titleWidth + 2, yPosition);
      }

      yPosition += 8;
      continue;
    }

    if (line.startsWith('### ')) {
      yPosition += 4;

      // Ensure subsection heading has enough space (at least 15mm)
      const MIN_SPACE_FOR_SUBSECTION = 15;
      if (yPosition + MIN_SPACE_FOR_SUBSECTION > pageHeight - 32) {
        addPageNumber();
        pdf.addPage();
        drawPageBackground();
        yPosition = margin + 14;
      }

      pdf.setFontSize(10.5);
      pdf.setFont(FONT_FAMILY.base, 'bold');
      pdf.setTextColor(...COLORS.headingText);

      const text = line.replace('### ', '');
      pdf.text(cleanText(text), margin + 6, yPosition);

      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setFont(FONT_FAMILY.base, 'normal');
      pdf.setTextColor(...COLORS.bodyText);
      continue;
    }

    if (line.trim().startsWith('**') && line.trim().endsWith('**') && !line.includes(':')) {
      yPosition += 4;

      // Ensure bold heading has enough space (at least 12mm)
      const MIN_SPACE_FOR_BOLD_HEADING = 12;
      if (yPosition + MIN_SPACE_FOR_BOLD_HEADING > pageHeight - 32) {
        addPageNumber();
        pdf.addPage();
        drawPageBackground();
        yPosition = margin + 14;
      }

      pdf.setFontSize(11);
      pdf.setFont(FONT_FAMILY.base, 'bold');
      pdf.setTextColor(...COLORS.headingText);

      const text = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
      pdf.text(cleanText(text), margin + 6, yPosition);

      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setFont(FONT_FAMILY.base, 'normal');
      pdf.setTextColor(...COLORS.bodyText);
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      let text = line.trim().replace(/^[-*]\s*/, '');
      text = text.replace(/\*\*/g, '');

      const colonIndex = text.indexOf(':');
      let estimatedLines = 1;

      // Estimate bullet point height
      if (colonIndex > 0 && colonIndex < 50) {
        const label = text.substring(0, colonIndex + 1);
        const description = text.substring(colonIndex + 1).trim();
        const labelWidth = pdf.getTextWidth(cleanText(label));
        const wrappedDescEstimate = pdf.splitTextToSize(cleanText(description), contentWidth - 20 - labelWidth);
        estimatedLines = wrappedDescEstimate.length;
      } else {
        const wrappedTextEstimate = pdf.splitTextToSize(cleanText(text), contentWidth - 20);
        estimatedLines = wrappedTextEstimate.length;
      }

      const MIN_LINES_ON_PAGE = 3; // Minimum 3 lines before page break

      // If bullet would be orphaned (less than 3 lines fit), move entire bullet to next page
      if (yPosition + (MIN_LINES_ON_PAGE * 6) > pageHeight - 32 && estimatedLines > MIN_LINES_ON_PAGE) {
        addPageNumber();
        pdf.addPage();
        drawPageBackground();
        yPosition = margin + 14;
      }

      pdf.setFillColor(...COLORS.accent);
      pdf.circle(margin + 9, yPosition - 1, 1.2, 'F');

      if (colonIndex > 0 && colonIndex < 50) {
        const label = text.substring(0, colonIndex + 1);
        const description = text.substring(colonIndex + 1).trim();

        pdf.setFont(FONT_FAMILY.base, 'bold');
        pdf.setTextColor(...COLORS.headingText);
        pdf.setFontSize(10);
        pdf.text(cleanText(label), margin + 13, yPosition);

        const labelWidth = pdf.getTextWidth(cleanText(label));

        pdf.setFont(FONT_FAMILY.base, 'normal');
        pdf.setTextColor(...COLORS.bodyText);
        pdf.setFontSize(10);
        const wrappedDesc = pdf.splitTextToSize(cleanText(description), contentWidth - 20 - labelWidth);

        if (wrappedDesc.length > 0 && wrappedDesc[0].trim()) {
          pdf.text(wrappedDesc[0], margin + 13 + labelWidth + 2, yPosition);
        }
        yPosition += 6;

        for (let j = 1; j < wrappedDesc.length; j++) {
          if (yPosition > pageHeight - 32) {
            addPageNumber();
            pdf.addPage();
            drawPageBackground();
            yPosition = margin + 14;
          }
          pdf.setFont(FONT_FAMILY.base, 'normal');
          pdf.setTextColor(...COLORS.bodyText);
          pdf.text(wrappedDesc[j], margin + 13, yPosition);
          yPosition += 6;
        }
      } else {
        pdf.setFont(FONT_FAMILY.base, 'normal');
        pdf.setTextColor(...COLORS.bodyText);
        pdf.setFontSize(10);

        const wrappedText = pdf.splitTextToSize(cleanText(text), contentWidth - 20);
        for (let j = 0; j < wrappedText.length; j++) {
          if (yPosition > pageHeight - 32) {
            addPageNumber();
            pdf.addPage();
            drawPageBackground();
            yPosition = margin + 14;
          }
          pdf.setFont(FONT_FAMILY.base, 'normal');
          pdf.setTextColor(...COLORS.bodyText);
          pdf.text(wrappedText[j], margin + 13, yPosition);
          yPosition += 6;
        }
      }

      continue;
    }

    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch && !line.includes('**')) {
      const num = numberedMatch[1];
      let text = numberedMatch[2].replace(/\*\*/g, '');

      // Estimate numbered item height
      const wrappedTextEstimate = pdf.splitTextToSize(cleanText(text), contentWidth - 20);
      const estimatedLines = wrappedTextEstimate.length;
      const MIN_LINES_ON_PAGE = 3;

      // If numbered item would be orphaned, move entire item to next page
      if (yPosition + (MIN_LINES_ON_PAGE * 6) > pageHeight - 32 && estimatedLines > MIN_LINES_ON_PAGE) {
        addPageNumber();
        pdf.addPage();
        drawPageBackground();
        yPosition = margin + 14;
      }

      pdf.setFillColor(...COLORS.accent);
      pdf.circle(margin + 9.5, yPosition - 1, 2, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8.5);
      pdf.setFont(FONT_FAMILY.base, 'bold');
      pdf.text(num, margin + 9.5, yPosition + 0.8, { align: 'center' });

      pdf.setFont(FONT_FAMILY.base, 'normal');
      pdf.setTextColor(...COLORS.bodyText);
      pdf.setFontSize(10);

      const wrappedText = pdf.splitTextToSize(cleanText(text), contentWidth - 20);
      for (let j = 0; j < wrappedText.length; j++) {
        if (yPosition > pageHeight - 32) {
          addPageNumber();
          pdf.addPage();
          drawPageBackground();
          yPosition = margin + 14;
        }
        pdf.setFont(FONT_FAMILY.base, 'normal');
        pdf.setTextColor(...COLORS.bodyText);
        pdf.text(wrappedText[j], margin + 14, yPosition);
        yPosition += 6;
      }

      continue;
    }

    if (line.trim().startsWith('> ')) {
      const quoteText = line.trim().replace(/^>\s*/, '');

      const wrappedQuote = pdf.splitTextToSize(cleanText(quoteText), contentWidth - 18);
      const quoteHeight = wrappedQuote.length * 6 + 8;

      if (yPosition + quoteHeight > pageHeight - 32) {
        addPageNumber();
        pdf.addPage();
        drawPageBackground();
        yPosition = margin + 14;
      }

      pdf.setFillColor(40, 40, 40);
      pdf.roundedRect(margin + 6, yPosition - 2, contentWidth - 6, quoteHeight, 6, 6, 'F');

      pdf.setFillColor(...COLORS.accent);
      pdf.rect(margin + 6, yPosition - 2, 3, quoteHeight, 'F');

      pdf.setTextColor(...COLORS.accent);
      pdf.setFont(FONT_FAMILY.base, 'italic');
      pdf.setFontSize(9.5);

      let quoteY = yPosition + 3;
      for (const quoteLine of wrappedQuote) {
        pdf.text(quoteLine, margin + 12, quoteY);
        quoteY += 6;
      }

      yPosition += quoteHeight + 4;
      pdf.setFontSize(10);
      pdf.setFont(FONT_FAMILY.base, 'normal');
      pdf.setTextColor(...COLORS.bodyText);
      continue;
    }

    pdf.setTextColor(...COLORS.bodyText);
    pdf.setFontSize(10);

    const processedLine = cleanText(line);

    if (processedLine.includes('**') || processedLine.includes('*')) {
      const lineSegments: Array<{ text: string; style: 'normal' | 'bold' | 'italic'; x: number }> = [];
      let xPosition = margin + 6;

      let currentText = processedLine;
      let i = 0;

      while (i < currentText.length) {
        if (currentText.substr(i, 2) === '**') {
          const endIdx = currentText.indexOf('**', i + 2);
          if (endIdx !== -1) {
            const boldText = currentText.substring(i + 2, endIdx);

            const words = boldText.split(' ');
            for (let w = 0; w < words.length; w++) {
              const word = words[w] + (w < words.length - 1 ? ' ' : '');
              pdf.setFont(FONT_FAMILY.base, 'bold');
              const wordWidth = pdf.getTextWidth(word);

              if (xPosition + wordWidth > pageWidth - margin && lineSegments.length > 0) {
                for (const seg of lineSegments) {
                  pdf.setFont(FONT_FAMILY.base, seg.style);
                  pdf.setTextColor(...COLORS.bodyText);
                  pdf.text(seg.text, seg.x, yPosition);
                }
                yPosition += 6;
                if (yPosition > pageHeight - 32) {
                  addPageNumber();
                  pdf.addPage();
                  drawPageBackground();
                  yPosition = margin + 14;
                }
                xPosition = margin + 6;
                lineSegments.length = 0;
              }

              lineSegments.push({ text: word, style: 'bold', x: xPosition });
              xPosition += wordWidth;
            }

            i = endIdx + 2;
            continue;
          }
        }

        if (currentText[i] === '*' && currentText[i + 1] !== '*') {
          const endIdx = currentText.indexOf('*', i + 1);
          if (endIdx !== -1 && currentText[endIdx + 1] !== '*') {
            const italicText = currentText.substring(i + 1, endIdx);

            const words = italicText.split(' ');
            for (let w = 0; w < words.length; w++) {
              const word = words[w] + (w < words.length - 1 ? ' ' : '');
              pdf.setFont(FONT_FAMILY.base, 'italic');
              const wordWidth = pdf.getTextWidth(word);

              if (xPosition + wordWidth > pageWidth - margin && lineSegments.length > 0) {
                for (const seg of lineSegments) {
                  pdf.setFont(FONT_FAMILY.base, seg.style);
                  pdf.setTextColor(...COLORS.bodyText);
                  pdf.text(seg.text, seg.x, yPosition);
                }
                yPosition += 6;
                if (yPosition > pageHeight - 32) {
                  addPageNumber();
                  pdf.addPage();
                  drawPageBackground();
                  yPosition = margin + 14;
                }
                xPosition = margin + 6;
                lineSegments.length = 0;
              }

              lineSegments.push({ text: word, style: 'italic', x: xPosition });
              xPosition += wordWidth;
            }

            i = endIdx + 1;
            continue;
          }
        }

        let nextMarker = currentText.length;
        const nextBold = currentText.indexOf('**', i);
        const nextItalic = currentText.indexOf('*', i);

        if (nextBold !== -1 && nextBold < nextMarker) nextMarker = nextBold;
        if (nextItalic !== -1 && nextItalic < nextMarker && (nextBold === -1 || nextItalic < nextBold)) nextMarker = nextItalic;

        if (nextMarker > i) {
          const plainText = currentText.substring(i, nextMarker);

          const words = plainText.split(' ');
          for (let w = 0; w < words.length; w++) {
            const word = words[w] + (w < words.length - 1 ? ' ' : '');
            pdf.setFont(FONT_FAMILY.base, 'normal');
            const wordWidth = pdf.getTextWidth(word);

            if (xPosition + wordWidth > pageWidth - margin && lineSegments.length > 0) {
              for (const seg of lineSegments) {
                pdf.setFont(FONT_FAMILY.base, seg.style);
                pdf.text(seg.text, seg.x, yPosition);
              }
              yPosition += 6;
              if (yPosition > pageHeight - 32) {
                addPageNumber();
                pdf.addPage();
                drawPageBackground();
                pdf.setFillColor(...COLORS.cardBackground);
                // pdf.rect(margin, margin + 8, contentWidth, pageHeight - 2 * margin - 30, 'F');
                yPosition = margin + 14;
              }
              xPosition = margin + 6;
              lineSegments.length = 0;
            }

            lineSegments.push({ text: word, style: 'normal', x: xPosition });
            xPosition += wordWidth;
          }

          i = nextMarker;
        } else {
          i++;
        }
      }

      if (lineSegments.length > 0) {
        for (const seg of lineSegments) {
          pdf.setFont(FONT_FAMILY.base, seg.style);
          pdf.setTextColor(...COLORS.bodyText);
          pdf.text(seg.text, seg.x, yPosition);
        }
        yPosition += 6;
      }
    } else {
      pdf.setFont(FONT_FAMILY.base, 'normal');
      pdf.setTextColor(...COLORS.bodyText);
      const wrappedText = pdf.splitTextToSize(processedLine, contentWidth - 12);

      for (let j = 0; j < wrappedText.length; j++) {
        if (yPosition > pageHeight - 32) {
          addPageNumber();
          pdf.addPage();
          drawPageBackground();
          yPosition = margin + 14;
        }
        pdf.setTextColor(...COLORS.bodyText);
        pdf.text(wrappedText[j], margin + 6, yPosition);
        yPosition += 6;
      }
    }
  }

  addPageNumber();

  const footerY = pageHeight - 16;

  pdf.setFillColor(...COLORS.accent);
  pdf.setGState(pdf.GState({ opacity: 0.3 }));
  pdf.rect(0, footerY, pageWidth, 1, 'F');
  pdf.setGState(pdf.GState({ opacity: 1 }));

  pdf.setFontSize(8.5);
  pdf.setTextColor(...COLORS.accent);
  pdf.setFont(FONT_FAMILY.base, 'italic');
  pdf.text('UNDERSTANDING TRADING PATTERNS AND DECISION-MAKING USING AI INSIGHTS', pageWidth / 2, footerY + 5, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setTextColor(...COLORS.labelGray);
  pdf.setFont(FONT_FAMILY.base, 'italic');
  pdf.text('BullRun Analysis Report Exclusively Developed by 10xTechClub', pageWidth / 2, footerY + 10, { align: 'center' });

  const filename = `LearningJourney_${data.playerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

function cleanText(text: string): string {
  return text
    .replace(/₹/g, 'Rs.')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/🎓|🎯|🌱|💰|📊|📚|🏦|💸|💡|✅|🔄|📄|⭐|🎮|🎁|🚀|✨/g, '')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/•/g, '-')
    .trim();
}

function formatNumber(num: number): string {
  const absNum = Math.abs(num);

  if (absNum >= 10000000) {
    return (absNum / 10000000).toFixed(2) + 'Cr';
  } else if (absNum >= 100000) {
    return (absNum / 100000).toFixed(2) + 'L';
  } else if (absNum >= 1000) {
    return (absNum / 1000).toFixed(2) + 'K';
  }
  return absNum.toLocaleString('en-IN');
}
