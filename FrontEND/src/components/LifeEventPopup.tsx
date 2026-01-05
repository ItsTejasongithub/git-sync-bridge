import React, { useEffect, useState } from 'react';
import './LifeEventPopup.css';
import { LifeEvent } from '../types';

interface Props {
  event: LifeEvent & { locked?: boolean; remainingDebt?: number; postPocketCash?: number };
  onClose?: () => void;
}

export const LifeEventPopup: React.FC<Props> = ({ event, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  // Detect if this is a debt recovery scenario (must be before any hooks)
  const wasInDebt = event.type === 'gain' && event.postPocketCash !== undefined && (event.postPocketCash - event.amount) < 0;
  const postPocketCashValue = event.postPocketCash ?? 0;
  const isNowOutOfDebt = wasInDebt && postPocketCashValue >= 0;
  const isStillInDebt = wasInDebt && postPocketCashValue < 0;
  const previousDebt = wasInDebt ? Math.abs(postPocketCashValue - event.amount) : 0;
  const remainingDebt = isStillInDebt ? Math.abs(postPocketCashValue) : 0;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Diagnostic: log mount/unmount and visible props
  useEffect(() => {
    console.log('🪟 LifeEventPopup mounted', { id: event.id, message: event.message, amount: event.amount, locked: event.locked, postPocketCash: event.postPocketCash });
    return () => console.log('🪟 LifeEventPopup unmounted', { id: event.id });
  }, [event]);

  // Auto-dismiss timing based on scenario
  useEffect(() => {
    let timeout: number;

    if (wasInDebt) {
      // Debt recovery scenarios need more time
      timeout = 15000; // 15 seconds for debt recovery
    } else if (event.type === 'gain') {
      timeout = 8000; // 8 seconds for regular gains
    } else {
      timeout = 12000; // 12 seconds for losses
    }

    const timer = setTimeout(() => {
      handleClose();
    }, timeout);

    return () => clearTimeout(timer);
  }, [event.type, wasInDebt]);

  const isInDebt = event.type === 'loss' && event.locked;
  const hasEnoughFunds = event.type === 'loss' && !event.locked;

  return (
    <div className={`life-event-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`life-event-card ${event.type === 'loss' ? 'loss' : 'gain'} ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="life-event-close" onClick={handleClose} title="Dismiss">
          ×
        </button>

        {/* Icon & Title */}
        <div className="life-event-header">
          <div className={`life-event-icon ${event.type}`}>
            {event.type === 'loss' ? '⚠️' : '🎉'}
          </div>
          <h3 className="life-event-title">
            {event.type === 'loss' ? 'Unexpected Expense' : 'Good News!'}
          </h3>
        </div>

        {/* Message */}
        <p className="life-event-message">{event.message}</p>

        {/* Amount Display */}
        <div className={`life-event-amount-container ${event.type}`}>
          <span className="life-event-amount-label">
            {event.type === 'loss' ? 'Amount Deducted' : 'Amount Received'}
          </span>
          <span className={`life-event-amount ${event.type}`}>
            {event.type === 'loss' ? '-' : '+'}₹{Math.abs(event.amount).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Status Section */}
        {isInDebt && (
          <div className="life-event-status debt">
            <div className="status-icon">🔴</div>
            <div className="status-content">
              <div className="status-title">You Are In Debt</div>
              <div className="status-debt">Current Debt: ₹{(event.remainingDebt || 0).toLocaleString('en-IN')}</div>
              <div className="status-actions">
                <div className="status-action-item">
                  <span className="action-icon">💰</span>
                  <span>Sell assets to clear debt</span>
                </div>
                <div className="status-action-item">
                  <span className="action-icon">⏳</span>
                  <span>Wait for monthly income</span>
                </div>
              </div>
              <div className="status-note">
                All purchase actions are temporarily disabled
              </div>
            </div>
          </div>
        )}

        {hasEnoughFunds && (
          <div className="life-event-status success">
            <div className="status-icon">✅</div>
            <div className="status-content">
              <div className="status-title">Payment Successful</div>
              <div className="status-message">
                Funds were deducted from your pocket cash
              </div>
            </div>
          </div>
        )}

        {event.type === 'gain' && !wasInDebt && (
          <div className="life-event-status success">
            <div className="status-icon">💰</div>
            <div className="status-content">
              <div className="status-title">Funds Added</div>
              <div className="status-message">
                Money has been credited to your pocket cash
              </div>
            </div>
          </div>
        )}

        {/* Debt Recovery - Fully Cleared */}
        {isNowOutOfDebt && (
          <div className="life-event-status debt-recovery cleared">
            <div className="status-icon recovery-icon">🎉</div>
            <div className="status-content">
              <div className="status-title recovery-title">Debt Cleared!</div>
              <div className="debt-recovery-details">
                <div className="recovery-row">
                  <span className="recovery-label">Previous Debt:</span>
                  <span className="recovery-value debt-amount">-₹{previousDebt.toLocaleString('en-IN')}</span>
                </div>
                <div className="recovery-row">
                  <span className="recovery-label">Payment Received:</span>
                  <span className="recovery-value gain-amount">+₹{event.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="recovery-divider"></div>
                <div className="recovery-row final">
                  <span className="recovery-label">New Balance:</span>
                  <span className="recovery-value success-amount">₹{event.postPocketCash?.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="status-message recovery-message">
                ✅ You are no longer in debt! All purchase actions are now available.
              </div>
            </div>
          </div>
        )}

        {/* Debt Recovery - Partially Cleared */}
        {isStillInDebt && (
          <div className="life-event-status debt-recovery partial">
            <div className="status-icon">💰</div>
            <div className="status-content">
              <div className="status-title">Debt Reduced</div>
              <div className="debt-recovery-details">
                <div className="recovery-row">
                  <span className="recovery-label">Previous Debt:</span>
                  <span className="recovery-value debt-amount">-₹{previousDebt.toLocaleString('en-IN')}</span>
                </div>
                <div className="recovery-row">
                  <span className="recovery-label">Payment Received:</span>
                  <span className="recovery-value gain-amount">+₹{event.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="recovery-divider"></div>
                <div className="recovery-row final">
                  <span className="recovery-label">Remaining Debt:</span>
                  <span className="recovery-value debt-amount">-₹{remainingDebt.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="status-message recovery-message">
                ⚡ You are still in debt. Continue selling assets or wait for more income.
              </div>
            </div>
          </div>
        )}

        {/* Dismiss hint */}
        <div className="life-event-hint">
          Click anywhere to dismiss
        </div>
      </div>
    </div>
  );
};
