import React, { useState } from 'react';
import { formatIndianNumber } from '../utils/constants';
import './AssetCard.css';
import './StockTooltip.css';

interface SavingsAccountCardProps {
  balance: number;
  pocketCash: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
}

export const SavingsAccountCard: React.FC<SavingsAccountCardProps> = ({
  balance,
  pocketCash,
  onDeposit,
  onWithdraw
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [operation, setOperation] = useState<'deposit' | 'withdraw'>('deposit');
  const [isShaking, setIsShaking] = useState(false);
  const [isMaxClicked, setIsMaxClicked] = useState(false);

  // Trigger shake animation
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDeposit = () => {
    // Block deposits while in debt - just shake
    if (pocketCash < 0) {
      triggerShake();
      return;
    }
    setOperation('deposit');
    setShowInput(true);
    setInputAmount('');
    setIsMaxClicked(false);
  };

  const handleWithdraw = () => {
    setOperation('withdraw');
    setShowInput(true);
    setInputAmount('');
    setIsMaxClicked(false);
  };

  const handleMax = () => {
  const maxAmount = operation === 'deposit' ? pocketCash : balance;
  // Show rounded value in UI, but mark that MAX was clicked
  setInputAmount(Math.round(maxAmount).toString());
  setIsMaxClicked(true);
};

const handleConfirm = () => {
  const amount = parseFloat(inputAmount);
  if (isNaN(amount) || amount <= 0) return;

  if (operation === 'deposit') {
    // If MAX was clicked, use exact pocket cash value
    const actualAmount = isMaxClicked ? pocketCash : amount;
    // Use a small epsilon for floating-point comparison
    if (actualAmount > pocketCash + 0.01) {
      triggerShake();
      return;
    }
    // Ensure we don't deposit more than available
    onDeposit(Math.min(actualAmount, pocketCash));
  } else {
    // If MAX was clicked, use exact balance value
    const actualAmount = isMaxClicked ? balance : amount;
    if (actualAmount > balance + 0.01) {
      triggerShake();
      return;
    }
    // Ensure we don't withdraw more than available
    onWithdraw(Math.min(actualAmount, balance));
  }

  setShowInput(false);
  setInputAmount('');
  setIsMaxClicked(false);
};

  return (
    <div className={`asset-card savings-card ${isShaking ? 'shake' : ''}`}>
      <div className="asset-tooltip-wrapper">
        <h3 className="card-title">SAVING ACCOUNT</h3>
        <div className="asset-tooltip">
          <div className="tooltip-full-name">Savings Bank Account</div>
          <div className="tooltip-sector">Banking - Safe Investment</div>
          <div className="tooltip-description">Low-risk deposit account with guaranteed returns and instant liquidity for emergencies</div>
        </div>
      </div>

      <div className="balance-display">
        <div className="balance-label">Balance</div>
        <div className="balance-amount">₹{formatIndianNumber(balance)}</div>
      </div>

      {!showInput ? (
        <div className="button-group">
          <button
            className={`action-button deposit-btn ${pocketCash < 0 ? 'disabled' : ''}`}
            onClick={handleDeposit}
            disabled={pocketCash < 0}
            title={pocketCash < 0 ? 'Cannot deposit while in debt' : ''}
          >
            {pocketCash < 0 ? '🔒 Deposit' : 'Deposit'}
          </button>
          <button className="action-button withdraw-btn" onClick={handleWithdraw}>
            Withdraw
          </button>
        </div>
      ) : (
        <div className="input-section">
          <div className="input-container">
            <input
              type="number"
              className="amount-input"
              value={inputAmount}
              onChange={(e) => {
                setInputAmount(e.target.value);
                setIsMaxClicked(false); // Reset flag when user manually changes input
              }}
              placeholder="Enter amount"
            />
            <button className="max-button" onClick={handleMax}>
              MAX
            </button>
          </div>
          <div className="button-group">
            <button className="action-button confirm-btn" onClick={handleConfirm}>
              {operation === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
            <button
              className="action-button cancel-btn"
              onClick={() => {
                setShowInput(false);
                setIsMaxClicked(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
