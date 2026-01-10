import React, { useState } from 'react';
import { FixedDeposit } from '../types';
import './AssetCard.css';
import './StockTooltip.css';
import { ConfirmModal } from './ConfirmModal';

interface FixedDepositCardProps {
  fixedDeposits: FixedDeposit[];
  pocketCash: number;
  currentRates: { threeMonth: number; oneYear: number; threeYear: number };
  currentYear: number;
  currentMonth: number;
  onCreate: (amount: number, duration: 3 | 12 | 36, rate: number) => void;
  onCollect: (fdId: string) => void;
  onBreak: (fdId: string) => void;
}

export const FixedDepositCard: React.FC<FixedDepositCardProps> = ({
  fixedDeposits,
  pocketCash,
  currentRates,
  currentYear,
  currentMonth,
  onCreate,
  onCollect,
  onBreak
}) => {
  // Calculate accrued value with interest earned so far
  const calculateAccruedValue = (fd: FixedDeposit) => {
    const monthsElapsed = (currentYear - fd.startYear) * 12 + (currentMonth - fd.startMonth);
    const totalMonths = fd.duration;
    const progress = Math.min(monthsElapsed / totalMonths, 1);

    // FD rates are annual (PA - Per Annum)
    // Calculate total return based on full duration
    const durationInYears = fd.duration / 12;
    const totalReturn = (fd.interestRate / 100) * durationInYears;
    const fullMaturityValue = fd.amount * (1 + totalReturn);

    // Pro-rate the interest based on time elapsed
    const accruedInterest = (fullMaturityValue - fd.amount) * progress;
    return fd.amount + accruedInterest;
  };

  const calculatePnL = (fd: FixedDeposit) => {
    const accruedValue = calculateAccruedValue(fd);
    return accruedValue - fd.amount;
  };
  const [showInput, setShowInput] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<3 | 12 | 36>(12);
  const [isShaking, setIsShaking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fdToBreak, setFdToBreak] = useState<string | null>(null);

  // Trigger shake animation
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleCreateFD = () => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Block FD creation while in debt
    if (pocketCash < 0) {
      triggerShake();
      return;
    }

    if (amount > pocketCash) {
      triggerShake();
      return;
    }

    const rate =
      selectedDuration === 3 ? currentRates.threeMonth :
      selectedDuration === 12 ? currentRates.oneYear :
      currentRates.threeYear;

    onCreate(amount, selectedDuration, rate);
    setShowInput(false);
    setInputAmount('');
  };

  const handleMax = () => {
    setInputAmount(Math.floor(pocketCash).toString());
  };

  const handleBreakClick = (fdId: string) => {
    setFdToBreak(fdId);
    setShowConfirmModal(true);
  };

  const handleConfirmBreak = () => {
    if (fdToBreak) {
      onBreak(fdToBreak);
    }
    setShowConfirmModal(false);
    setFdToBreak(null);
  };

  const handleCancelBreak = () => {
    setShowConfirmModal(false);
    setFdToBreak(null);
  };

  return (
    <div className={`asset-card fd-card ${isShaking ? 'shake' : ''}`}>
      <div className="asset-tooltip-wrapper">
        <h3 className="card-title">FIXED DEPOSIT</h3>
        <div className="asset-tooltip">
          <div className="tooltip-full-name">Fixed Deposit (Term Deposit)</div>
          <div className="tooltip-sector">Banking - Low Risk Investment</div>
          <div className="tooltip-description">Safe investment with guaranteed returns and fixed tenure. Higher interest than savings account but penalty on early withdrawal</div>
        </div>
      </div>

      <div className="fd-rates">
        <div className="rate-item">
          <span className="rate-label">3Mo</span>
          <span className="rate-value">{currentRates.threeMonth}% PA</span>
        </div>
        <div className="rate-item">
          <span className="rate-label">1Yr</span>
          <span className="rate-value">{currentRates.oneYear}% PA</span>
        </div>
        <div className="rate-item">
          <span className="rate-label">3Yr</span>
          <span className="rate-value">{currentRates.threeYear}% PA</span>
        </div>
      </div>

      {fixedDeposits.length < 3 && !showInput && (
        <button
          className={`action-button create-fd-btn ${pocketCash < 0 ? 'disabled' : ''}`}
          onClick={() => {
            if (pocketCash < 0) {
              triggerShake();
              return;
            }
            setShowInput(true);
          }}
          disabled={pocketCash < 0}
          title={pocketCash < 0 ? 'Cannot create FD while in debt' : ''}
        >
          {pocketCash < 0 ? '🔒 Create FD' : 'Create FD'}
        </button>
      )}

      {showInput && (
        <div className="input-section">
          <div className="duration-selector">
            <button
              className={`duration-btn ${selectedDuration === 3 ? 'active' : ''}`}
              onClick={() => setSelectedDuration(3)}
            >
              3 Mo
            </button>
            <button
              className={`duration-btn ${selectedDuration === 12 ? 'active' : ''}`}
              onClick={() => setSelectedDuration(12)}
            >
              1 Yr
            </button>
            <button
              className={`duration-btn ${selectedDuration === 36 ? 'active' : ''}`}
              onClick={() => setSelectedDuration(36)}
            >
              3 Yr
            </button>
          </div>

          <div className="input-container">
            <input
              type="number"
              className="amount-input"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <button className="max-button" onClick={handleMax}>
              MAX
            </button>
          </div>

          <div className="button-group">
            <button className="action-button confirm-btn" onClick={handleCreateFD}>
              Create
            </button>
            <button
              className="action-button cancel-btn"
              onClick={() => setShowInput(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="fd-list">
        {fixedDeposits.map(fd => {
          const pnl = calculatePnL(fd);
          const pnlPercentage = (pnl / fd.amount) * 100;
          const monthsElapsed = (currentYear - fd.startYear) * 12 + (currentMonth - fd.startMonth);
          const progressPercentage = Math.min((monthsElapsed / fd.duration) * 100, 100);

          return (
            <div
              key={fd.id}
              className={`fd-item ${fd.isMatured ? 'matured' : ''}`}
            >
              <div className="fd-progress-bar">
                <div
                  className="fd-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="fd-info">
                <span>₹{fd.amount.toFixed(0)}</span>
                <span>{fd.duration === 3 ? '3Mo' : fd.duration === 12 ? '1Yr' : '3Yr'}</span>
                <span>{fd.interestRate}%PA</span>
                <div className="fd-pnl" style={{ color: pnl >= 0 ? '#288d00ff' : 'rgba(175, 1, 1, 1)' }}>
                  {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)} ({pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                </div>
                {fd.isMatured ? (
                  <button
                    className="collect-btn"
                    onClick={() => onCollect(fd.id)}
                  >
                    Collect
                  </button>
                ) : (
                  <button
                    className="break-btn"
                    onClick={() => handleBreakClick(fd.id)}
                  >
                    Break
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {fixedDeposits.length >= 3 && (
        <div className="max-fd-notice">Maximum 3 FDs reached</div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Break Fixed Deposit?"
        message="Breaking FD early will incur 1% penalty. Continue?"
        onConfirm={handleConfirmBreak}
        onCancel={handleCancelBreak}
      />
    </div>
  );
};
