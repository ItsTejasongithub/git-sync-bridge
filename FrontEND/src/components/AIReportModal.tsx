import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiReportApi } from '../services/aiReportApi';
import { generateReportPDF } from '../utils/pdfGenerator';
import { generateHTMLReportPDF } from '../utils/htmlToPdfGenerator';

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId: number | null;
  logUniqueId?: string | null;
  playerName?: string;
  playerAge?: number;
  finalNetworth?: number;
  cagr?: number;
  profitLoss?: number;
}

const markdownComponentStyles = {
  h1: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4ecca3',
    marginBottom: '16px',
    marginTop: '8px',
    borderBottom: '2px solid #4ecca3',
    paddingBottom: '12px',
  } as React.CSSProperties,
  h2: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4ecca3',
    marginTop: '20px',
    marginBottom: '12px',
  } as React.CSSProperties,
  h3: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#b0e0d6',
    marginTop: '16px',
    marginBottom: '10px',
  } as React.CSSProperties,
  p: {
    marginBottom: '14px',
    lineHeight: '1.8',
    color: '#e0e0e0',
  } as React.CSSProperties,
  ul: {
    marginLeft: '24px',
    marginBottom: '14px',
    color: '#e0e0e0',
  } as React.CSSProperties,
  ol: {
    marginLeft: '24px',
    marginBottom: '14px',
    color: '#e0e0e0',
  } as React.CSSProperties,
  li: {
    marginBottom: '8px',
    lineHeight: '1.6',
  } as React.CSSProperties,
  blockquote: {
    borderLeft: '4px solid #4ecca3',
    paddingLeft: '16px',
    marginLeft: '0',
    marginRight: '0',
    marginBottom: '14px',
    color: '#b0e0d6',
    fontStyle: 'italic',
  } as React.CSSProperties,
  hr: {
    borderColor: '#4ecca3',
    opacity: 0.3,
    margin: '20px 0',
  } as React.CSSProperties,
  code: {
    backgroundColor: '#0f3460',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#4ecca3',
    fontSize: '14px',
  } as React.CSSProperties,
  pre: {
    backgroundColor: '#0f3460',
    padding: '16px',
    borderRadius: '6px',
    overflowX: 'auto' as const,
    marginBottom: '14px',
  } as React.CSSProperties,
  strong: {
    fontWeight: 'bold',
    color: '#4ecca3',
  } as React.CSSProperties,
  em: {
    fontStyle: 'italic',
    color: '#b0e0d6',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '14px',
    overflow: 'auto',
  } as React.CSSProperties,
  thead: {
    backgroundColor: '#0f3460',
  } as React.CSSProperties,
  th: {
    border: '1px solid #4ecca3',
    padding: '10px',
    textAlign: 'left' as const,
    color: '#4ecca3',
    fontWeight: 'bold',
  } as React.CSSProperties,
  td: {
    border: '1px solid #4ecca380',
    padding: '10px',
    textAlign: 'left' as const,
    color: '#e0e0e0',
  } as React.CSSProperties,
  tr: {
    borderBottom: '1px solid #4ecca330',
  } as React.CSSProperties,
};

export const AIReportModal: React.FC<AIReportModalProps> = ({
  isOpen,
  onClose,
  logId,
  logUniqueId,
  playerName = 'Player',
  playerAge = 0,
  finalNetworth = 0,
  cagr = 0,
  profitLoss = 0
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const handleGenerateReport = async () => {
    if (logId === null || logId === undefined) {
      setError('No game log ID available');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await aiReportApi.generateReport({ logId, uniqueId: logUniqueId ?? undefined });
      if (response.success && response.report) {
        setReport(response.report);
      } else {
        setError(response.message || 'Failed to generate report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report || !reportContentRef.current) return;

    try {
      // Capture the beautiful UI as an image and convert to PDF
      await generateHTMLReportPDF(reportContentRef.current, {
        playerName,
        playerAge,
        finalNetworth,
        cagr,
        profitLoss,
        reportContent: report,
        reportId: logUniqueId || undefined,
        generatedDate: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
    } catch (error) {
      console.error('HTML-to-PDF failed, falling back to basic PDF generation:', error);

      // Fallback to basic PDF generation
      generateReportPDF({
        playerName,
        playerAge,
        finalNetworth,
        cagr,
        profitLoss,
        reportContent: report,
        reportId: logUniqueId || undefined,
        generatedDate: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '2px solid #4ecca3',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '900px',
          height: '90vh',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 30px',
            borderBottom: '1px solid #4ecca3',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h2 style={{ color: '#4ecca3', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
            AI Trading Performance Report
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#4ecca3',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '0',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: '30px',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: report ? 'flex-start' : 'center',
              justifyContent: report ? 'flex-start' : 'center',
            }}
          >
            {!report && !isLoading && !error && (
              <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                <p style={{ color: '#e0e0e0', marginBottom: '24px', fontSize: '16px', lineHeight: '1.6' }}>
                  Generate an AI-powered analysis of your trading performance and financial behavior.
                </p>
                <button
                  onClick={handleGenerateReport}
                  style={{
                    padding: '14px 36px',
                    backgroundColor: '#4ecca3',
                    color: '#1a1a2e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#3bb894';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#4ecca3';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  Generate My Report
                </button>
              </div>
            )}

            {isLoading && (
              <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #16213e',
                    borderTop: '5px solid #4ecca3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px',
                  }}
                />
                <p style={{ color: '#4ecca3', fontSize: '16px' }}>Analyzing your trading performance...</p>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#ff6b6b20',
                  border: '1px solid #ff6b6b',
                  borderRadius: '8px',
                  color: '#ff6b6b',
                  alignSelf: 'center',
                  maxWidth: '600px',
                  width: '100%',
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}

            {report && (
              <div style={{ width: '100%', maxWidth: '100%' }}>
                <div
                  ref={reportContentRef}
                  className="markdown-report"
                  style={{
                    color: '#e0e0e0',
                    fontSize: '15px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    width: '100%',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }: any) => (
                        <h1 style={markdownComponentStyles.h1}>{children}</h1>
                      ),
                      h2: ({ children }: any) => (
                        <h2 style={markdownComponentStyles.h2}>{children}</h2>
                      ),
                      h3: ({ children }: any) => (
                        <h3 style={markdownComponentStyles.h3}>{children}</h3>
                      ),
                      p: ({ children }: any) => (
                        <p style={markdownComponentStyles.p}>{children}</p>
                      ),
                      ul: ({ children }: any) => (
                        <ul style={markdownComponentStyles.ul}>{children}</ul>
                      ),
                      ol: ({ children }: any) => (
                        <ol style={markdownComponentStyles.ol}>{children}</ol>
                      ),
                      li: ({ children }: any) => (
                        <li style={markdownComponentStyles.li}>{children}</li>
                      ),
                      blockquote: ({ children }: any) => (
                        <blockquote style={markdownComponentStyles.blockquote}>{children}</blockquote>
                      ),
                      hr: () => <hr style={markdownComponentStyles.hr} />,
                      code: ({ children }: any) => (
                        <code style={markdownComponentStyles.code}>{children}</code>
                      ),
                      pre: ({ children }: any) => (
                        <pre style={markdownComponentStyles.pre}>{children}</pre>
                      ),
                      strong: ({ children }: any) => (
                        <strong style={markdownComponentStyles.strong}>{children}</strong>
                      ),
                      em: ({ children }: any) => (
                        <em style={markdownComponentStyles.em}>{children}</em>
                      ),
                      table: ({ children }: any) => (
                        <table style={markdownComponentStyles.table}>{children}</table>
                      ),
                      thead: ({ children }: any) => (
                        <thead style={markdownComponentStyles.thead}>{children}</thead>
                      ),
                      th: ({ children }: any) => (
                        <th style={markdownComponentStyles.th}>{children}</th>
                      ),
                      td: ({ children }: any) => (
                        <td style={markdownComponentStyles.td}>{children}</td>
                      ),
                      tr: ({ children }: any) => (
                        <tr style={markdownComponentStyles.tr}>{children}</tr>
                      ),
                    } as Record<string, any>}
                  >
                    {report}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 30px',
            borderTop: '1px solid #4ecca3',
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between',
            flexShrink: 0,
            backgroundColor: '#16213e',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            {report && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#FF5722',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#E64A19';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#FF5722';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  <span>📄</span> Download PDF
                </button>
                <button
                  onClick={() => {
                    setReport(null);
                    setError(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0f3460',
                    color: '#fff',
                    border: '1px solid #4ecca3',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#1a5276';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#0f3460';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  Generate New Report
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4ecca3',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#3bb894';
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#4ecca3';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .markdown-report {
          max-width: 100%;
        }

        .markdown-report * {
          max-width: 100%;
          box-sizing: border-box;
        }

        .markdown-report h1,
        .markdown-report h2,
        .markdown-report h3,
        .markdown-report h4,
        .markdown-report h5,
        .markdown-report h6 {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .markdown-report > h1:first-child,
        .markdown-report > h2:first-child,
        .markdown-report > h3:first-child {
          margin-top: 0;
        }

        .markdown-report p,
        .markdown-report li {
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .markdown-report pre {
          max-width: 100%;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .markdown-report code {
          word-break: break-all;
        }

        .markdown-report table {
          display: table;
          overflow-x: auto;
          max-width: 100%;
        }

        /* Custom scrollbar styling for content area */
        .markdown-report::-webkit-scrollbar {
          width: 8px;
        }

        .markdown-report::-webkit-scrollbar-track {
          background: #16213e;
          border-radius: 4px;
        }

        .markdown-report::-webkit-scrollbar-thumb {
          background: #4ecca3;
          border-radius: 4px;
        }

        .markdown-report::-webkit-scrollbar-thumb:hover {
          background: #3bb894;
        }
      `}</style>
    </div>
  );
};
