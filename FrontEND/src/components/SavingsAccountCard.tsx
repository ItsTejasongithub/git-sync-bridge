import React, { useState } from 'react';
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

  // Trigger shake animation
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDeposit = () => {
    setOperation('deposit');
    setShowInput(true);
    setInputAmount('');
  };

  const handleWithdraw = () => {
    setOperation('withdraw');
    setShowInput(true);
    setInputAmount('');
  };

  const handleMax = () => {
    const maxAmount = operation === 'deposit' ? pocketCash : balance;
    setInputAmount(Math.floor(maxAmount).toString());
  };

  const handleConfirm = () => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (operation === 'deposit') {
      if (amount > pocketCash) {
        triggerShake();
        return;
      }
      onDeposit(amount);
    } else {
      if (amount > balance) {
        triggerShake();
        return;
      }
      onWithdraw(amount);
    }

    setShowInput(false);
    setInputAmount('');
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
        <div className="balance-amount">₹{balance.toFixed(2)}</div>
      </div>

      {!showInput ? (
        <div className="button-group">
          <button className="action-button deposit-btn" onClick={handleDeposit}>
            Deposit
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
              onChange={(e) => setInputAmount(e.target.value)}
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
              onClick={() => setShowInput(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
