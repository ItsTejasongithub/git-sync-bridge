import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiReportApi } from '../services/aiReportApi';
import { generateReportPDF } from '../utils/pdfGenerator';

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
    color: '#FFFFFF',
    marginBottom: '16px',
    marginTop: '8px',
    borderBottom: '2px solid #854CE6',
    paddingBottom: '12px',
  } as React.CSSProperties,
  h2: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: '20px',
    marginBottom: '12px',
    border: 'none',
    background: 'transparent',
    padding: '0',
    boxShadow: 'none',
  } as React.CSSProperties,
  h3: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: '16px',
    marginBottom: '10px',
  } as React.CSSProperties,
  p: {
    marginBottom: '14px',
    lineHeight: '1.8',
    color: '#C8C8C8',
  } as React.CSSProperties,
  ul: {
    marginLeft: '24px',
    marginBottom: '14px',
    color: '#C8C8C8',
  } as React.CSSProperties,
  ol: {
    marginLeft: '0px',
    marginBottom: '14px',
    color: '#C8C8C8',
    paddingLeft: '0px',
    listStyleType: 'none',
  } as React.CSSProperties,
  li: {
    marginBottom: '12px',
    lineHeight: '1.7',
    border: 'none',
    background: 'transparent',
    padding: '0px',
    color: '#C8C8C8',
  } as React.CSSProperties,
  blockquote: {
    borderLeft: '4px solid #854CE6',
    paddingLeft: '16px',
    marginLeft: '0',
    marginRight: '0',
    marginBottom: '14px',
    color: '#854CE6',
    fontStyle: 'italic',
    backgroundColor: '#282828',
    padding: '12px 16px',
    borderRadius: '6px',
  } as React.CSSProperties,
  hr: {
    borderColor: '#3C3C3C',
    opacity: 0.5,
    margin: '20px 0',
  } as React.CSSProperties,
  code: {
    backgroundColor: '#282828',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#854CE6',
    fontSize: '14px',
  } as React.CSSProperties,
  pre: {
    backgroundColor: '#282828',
    padding: '16px',
    borderRadius: '6px',
    overflowX: 'auto' as const,
    marginBottom: '14px',
  } as React.CSSProperties,
  strong: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  } as React.CSSProperties,
  em: {
    fontStyle: 'italic',
    color: '#969696',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '14px',
    overflow: 'auto',
  } as React.CSSProperties,
  thead: {
    backgroundColor: '#282828',
  } as React.CSSProperties,
  th: {
    border: '1px solid #3C3C3C',
    padding: '10px',
    textAlign: 'left' as const,
    color: '#FFFFFF',
    fontWeight: 'bold',
  } as React.CSSProperties,
  td: {
    border: '1px solid #3C3C3C',
    padding: '10px',
    textAlign: 'left' as const,
    color: '#C8C8C8',
  } as React.CSSProperties,
  tr: {
    borderBottom: '1px solid #3C3C3C',
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
    if (!report) return;

    try {
      // Use text-based PDF generation for selectable/copyable text
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
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
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
          backgroundColor: '#121212',
          borderRadius: '16px',
          border: '1px solid #3C3C3C',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '900px',
          height: '90vh',
          maxHeight: '90vh',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Purple Accent Bar */}
        <div style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '3px', background: '#854CE6' }} />
          <div
            style={{
              padding: '20px 30px',
              borderBottom: '1px solid #3C3C3C',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#121212',
            }}
          >
            <h2 style={{ color: '#FFFFFF', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              AI-Powered Trading Analysis Report
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#969696',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '0',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#969696')}
            >
              ×
            </button>
          </div>

          {/* Player Data Cards */}
          <div style={{ padding: '20px 30px', backgroundColor: '#121212', borderBottom: '1px solid #3C3C3C' }}>
            {/* Player Info */}
            <div style={{
              backgroundColor: '#1E1E1E',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px'
            }}>
              <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                {playerName}
              </div>
              <div style={{ color: '#969696', fontSize: '13px' }}>
                Age {playerAge} • {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {/* Total Networth */}
              <div style={{
                backgroundColor: '#1E1E1E',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#969696', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  TOTAL MONEY
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold' }}>
                  ₹{finalNetworth.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Growth Rate */}
              <div style={{
                backgroundColor: '#1E1E1E',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#969696', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  GROWTH RATE
                </div>
                <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold' }}>
                  {cagr.toFixed(2)}%
                </div>
              </div>

              {/* Profit/Loss */}
              <div style={{
                backgroundColor: '#1E1E1E',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#969696', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  MONEY CHANGE
                </div>
                <div style={{
                  color: profitLoss >= 0 ? '#22C55E' : '#EF4444',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {profitLoss >= 0 ? '+' : ''}₹{Math.abs(profitLoss).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
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
                <p style={{ color: '#C8C8C8', marginBottom: '24px', fontSize: '16px', lineHeight: '1.7' }}>
                  Ready to see your learning journey? Get a friendly, educational analysis of your money choices and smart decisions!
                </p>
                <button
                  onClick={handleGenerateReport}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: '#854CE6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(133, 76, 230, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#9D6FF2';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(133, 76, 230, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#854CE6';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(133, 76, 230, 0.3)';
                  }}
                >
                  Generate My Learning Report
                </button>
              </div>
            )}

            {isLoading && (
              <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #3C3C3C',
                    borderTop: '5px solid #854CE6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px',
                  }}
                />
                <p style={{ color: '#854CE6', fontSize: '16px', fontWeight: '500' }}>Creating your AI-powered trading analysis report...</p>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#3C1616',
                  border: '1px solid #EF4444',
                  borderRadius: '8px',
                  color: '#EF4444',
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
                    color: '#C8C8C8',
                    fontSize: '15px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    width: '100%',
                    minHeight: '100%',
                    paddingBottom: '30px',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }: any) => (
                        <h1 style={markdownComponentStyles.h1}>{children}</h1>
                      ),
                      h2: ({ children }: any) => (
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#FFFFFF',
                          marginTop: '24px',
                          marginBottom: '12px',
                          border: 'none',
                          background: 'transparent',
                          padding: '0',
                          boxShadow: 'none',
                          outline: 'none',
                        }}>
                          {children}
                        </div>
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
            borderTop: '1px solid #3C3C3C',
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between',
            flexShrink: 0,
            backgroundColor: '#121212',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            {report && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#854CE6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(133, 76, 230, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#9D6FF2';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(133, 76, 230, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#854CE6';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(133, 76, 230, 0.3)';
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
                    padding: '12px 24px',
                    backgroundColor: '#1E1E1E',
                    color: '#FFFFFF',
                    border: '1px solid #3C3C3C',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#282828';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#1E1E1E';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  🔄 Generate New Report
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1E1E1E',
              color: '#FFFFFF',
              border: '1px solid #3C3C3C',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#282828';
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#1E1E1E';
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
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }

        .markdown-report h2::before,
        .markdown-report h2::after,
        .markdown-report h2 *::before,
        .markdown-report h2 *::after {
          display: none !important;
          content: none !important;
        }

        .markdown-report h2,
        .markdown-report h2 * {
          box-shadow: none !important;
          outline: none !important;
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
          background: #1E1E1E;
          border-radius: 4px;
        }

        .markdown-report::-webkit-scrollbar-thumb {
          background: #854CE6;
          border-radius: 4px;
        }

        .markdown-report::-webkit-scrollbar-thumb:hover {
          background: #9D6FF2;
        }
      `}</style>
    </div>
  );
};
