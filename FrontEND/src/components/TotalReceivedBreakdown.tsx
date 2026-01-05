import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CashTransaction } from '../types';
import './TotalReceivedBreakdown.css';

interface TotalReceivedBreakdownProps {
  totalReceived: number;
  cashTransactions: CashTransaction[];
  initialCash: number;
}

export const TotalReceivedBreakdown: React.FC<TotalReceivedBreakdownProps> = ({
  cashTransactions = [],
  initialCash
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Format currency with Indian numbering
  const formatCurrency = (amount: number): string => {
    const integerPart = Math.round(amount).toFixed(0);
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  };

  // Compute panel position so that it is fully visible on screen
  const computePanelPosition = () => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const preferredWidth = 480;
    const spacing = 12;

    // Available space on each side (inset by spacing)
    const availableRight = Math.max(0, window.innerWidth - rect.right - spacing);
    const availableLeft = Math.max(0, rect.left - spacing);

    // Choose width conservatively based on available space
    const MIN_WIDTH = 280;
    let width = preferredWidth;

    if (availableRight >= preferredWidth) {
      width = preferredWidth;
    } else if (availableLeft >= preferredWidth) {
      width = preferredWidth;
    } else if (availableRight >= availableLeft) {
      width = Math.max(MIN_WIDTH, Math.min(preferredWidth, availableRight));
    } else {
      width = Math.max(MIN_WIDTH, Math.min(preferredWidth, availableLeft));
    }

    // Compute vertical positioning and clamp so panel is not cut off
    const panelMaxHeight = Math.floor(window.innerHeight * 2);
    const estimatedPanelHeight = Math.min(panelMaxHeight, 720);

    const baseTop = Math.max(spacing, Math.min(rect.top, window.innerHeight - estimatedPanelHeight - spacing));

    // Shift more on short screens to avoid bottom clipping
    const SHIFT_UP = window.innerHeight < 800 ? 220 : 160;
    let desiredTop = baseTop - SHIFT_UP;
    desiredTop = Math.max(spacing, Math.min(desiredTop, window.innerHeight - estimatedPanelHeight - spacing));

    const style: React.CSSProperties = {
      position: 'fixed',
      top: desiredTop,
      width: Math.max(MIN_WIDTH, Math.floor(width)),
      zIndex: 99999,
      boxSizing: 'border-box',
      pointerEvents: 'auto',
      maxHeight: estimatedPanelHeight,
      overflow: 'auto' // make only the transactions list scroll when needed
    };

    // Prefer to show to the right, if enough room, otherwise try left, otherwise center
    if (availableRight >= width) {
      style.left = Math.max(spacing, rect.right + spacing);
    } else if (availableLeft >= width) {
      style.left = Math.max(spacing, rect.left - Math.floor(width) - spacing);
    } else {
      // fallback: use full-width inset by spacing
      style.left = spacing;
      style.width = Math.max(MIN_WIDTH, window.innerWidth - spacing * 2);
    }

    setPanelStyle(style);
  };

  useEffect(() => {
    if (isOpen) computePanelPosition();
    // Recompute on window resize while open
    const handler = () => {
      if (isOpen) computePanelPosition();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isOpen]);

  // Close with slight delay to allow entering panel
  let closeTimeout: number | null = null;
  const scheduleClose = () => {
    if (closeTimeout) window.clearTimeout(closeTimeout);
    closeTimeout = window.setTimeout(() => setIsOpen(false), 150);
  };
  const cancelClose = () => {
    if (closeTimeout) {
      window.clearTimeout(closeTimeout);
      closeTimeout = null;
    }
  };


  // Calculate summary data
  const summary = useMemo(() => {
    let totalRecurringIncome = 0;
    let totalLifeEventGains = 0;
    let totalLifeEventLosses = 0;

    cashTransactions.forEach(tx => {
      if (tx.type === 'recurring_income') {
        totalRecurringIncome += tx.amount;
      } else if (tx.type === 'life_event_gain') {
        totalLifeEventGains += tx.amount;
      } else if (tx.type === 'life_event_loss') {
        totalLifeEventLosses += Math.abs(tx.amount);
      }
    });

    const netLifeEventImpact = totalLifeEventGains - totalLifeEventLosses;

    return {
      totalRecurringIncome,
      totalLifeEventGains,
      totalLifeEventLosses,
      netLifeEventImpact
    };
  }, [cashTransactions]);

  // Determine compact mode based on screen height and compute displayed transactions
  const [compactMode, setCompactMode] = useState<boolean>(false);

  useEffect(() => {
    const computeMode = () => {
      const h = window.innerHeight;
      // If height between 500 and 900 -> compact: show 3 visible, scrollable
      if (h >= 500 && h <= 900) {
        setCompactMode(true);
      } else {
        setCompactMode(false);
      }
    };

    computeMode();
    window.addEventListener('resize', computeMode);
    return () => window.removeEventListener('resize', computeMode);
  }, []);

  const recentTransactions = useMemo(() => {
    const sorted = [...cashTransactions].sort((a, b) => b.timestamp - a.timestamp); // newest first
    // Show all recorded transactions (scrollable list will handle overflow)
    return sorted;
  }, [cashTransactions]);

  // Final net total calculation (Recurring + Gains - Losses)
  const netTotalSoFar = useMemo(() => {
    const recurring = summary.totalRecurringIncome || 0;
    const gains = summary.totalLifeEventGains || 0;
    const losses = summary.totalLifeEventLosses || 0;
    return recurring + gains - losses;
  }, [summary]);

  // Mouse handlers for hover behavior (open panel and compute position)
  const handleMouseEnter = () => {
    setIsOpen(true);
    computePanelPosition();
  };
  const handleMouseLeave = () => scheduleClose();

  const panelContent = (
    <div
      className={`total-received-breakdown-panel breakdown-floating ${isOpen ? 'open' : ''}`}
      style={panelStyle}
      onMouseEnter={() => { cancelClose(); setIsOpen(true); }}
      onMouseLeave={() => scheduleClose()}
      role="dialog"
      aria-label="Total Received Breakdown"
    >
      <div className="breakdown-header">
        <h3 className="breakdown-title">Cash Flow Breakdown</h3>
        <div className="breakdown-subtitle">Recent Transactions (scroll for more)</div>
      </div>

      {/* Final Net Income */}
      <div className="final-summary">
        <div className="final-label">Net Income</div>
        <div className={`final-value ${netTotalSoFar >= 0 ? 'positive' : 'negative'}`}>
          {netTotalSoFar >= 0 ? '+' : ''}₹{formatCurrency(netTotalSoFar)}
        </div>
      </div>

      {/* Recent Transactions List - Newest first (top to bottom). In compact mode the list becomes scrollable and shows 3 visible items. */}
      <div className={`transactions-list ${compactMode ? 'compact' : ''}`}>
        {recentTransactions.length === 0 ? (
          <div className="no-transactions">No transactions yet</div>
        ) : (
          recentTransactions.map((tx, idx) => {
            const isGain = tx.type === 'recurring_income' || tx.type === 'life_event_gain';
            const displayAmount = Math.abs(tx.amount);

            return (
              <div
                key={tx.id}
                className={`transaction-item ${isGain ? 'gain' : 'loss'}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="transaction-icon">
                  {tx.type === 'recurring_income' ? '💼' :
                   tx.type === 'life_event_gain' ? '🎉' : '⚠️'}
                </div>
                <div className="transaction-details">
                  <div className="transaction-message">{tx.message}</div>
                  <div className="transaction-meta">
                    Year {tx.gameYear}, Month {tx.gameMonth}
                  </div>
                </div>
                <div className={`transaction-amount ${isGain ? 'positive' : 'negative'}`}>
                  {isGain ? '+' : '-'}₹{formatCurrency(displayAmount)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Section */}
      <div className="breakdown-summary">
        <div className="summary-divider"></div>

        <div className="summary-row">
          <span className="summary-label">Initial Cash</span>
          <span className="summary-value neutral">₹{formatCurrency(initialCash)}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Total Recurring Income Received</span>
          <span className="summary-value positive">+₹{formatCurrency(summary.totalRecurringIncome)}</span>
        </div>

        <div className="summary-row life-events-row">
          <span className="summary-label">
            Net Impact from Life Events
            <span className="summary-sublabel">
              (Gains: ₹{formatCurrency(summary.totalLifeEventGains)} - Losses: ₹{formatCurrency(summary.totalLifeEventLosses)})
            </span>
            <span className="summary-note">Includes all life events</span>
          </span>
          <span className={`summary-value ${summary.netLifeEventImpact >= 0 ? 'positive' : 'negative'}`}>
            {summary.netLifeEventImpact >= 0 ? '+' : ''}₹{formatCurrency(summary.netLifeEventImpact)}
          </span>
        </div>

        <div className="summary-divider thick"></div>

            </div>

      {/* Pocket Cash definition and separation from Net Worth */}
      <div className="pocket-formula">Pocket Cash = Initial Cash + Net Income − Investment Outflows + Liquid Returns</div>

      <div className="breakdown-divider"></div>

      <div className="breakdown-note">Note: Cash Flow lists recent income and expenses. Net Worth (assets & investments) is shown in the sidebar.</div>

      {/* Hover Hint */}
      <div className="breakdown-hint">Hover to keep panel open</div>
    </div>
  );

  return (
    <div
      className="total-received-wrapper"
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="total-received-label">Net Income</div>
      <div className="total-received-amount">{netTotalSoFar >= 0 ? '+' : ''}₹{formatCurrency(netTotalSoFar)}</div>

      {/* Render breakdown panel via portal so it escapes sidebar overflow */}
      {createPortal(panelContent, document.body)}
    </div>
  );
};
