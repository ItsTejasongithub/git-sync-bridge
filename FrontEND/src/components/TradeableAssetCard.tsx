import React, { useState } from 'react';
import { AssetHolding } from '../types';
import { MiniChart } from './MiniChart';
import { getAssetInfo } from '../utils/stockInfo';
import { formatIndianNumber } from '../utils/constants';
import './AssetCard.css';
import './StockTooltip.css';

interface TradeableAssetCardProps {
  name: string;
  currentPrice: number;
  previousPrice: number;
  priceHistory: number[];
  holding: AssetHolding;
  pocketCash: number;
  unit: string; // e.g., "/10g", "/share", "/coin"
  onBuy: (quantity: number) => void;
  onSell: (quantity: number) => void;
  isStock?: boolean; // Add compact stock card styling
  isTransacting?: boolean; // When true, disable buy/sell UI to avoid duplicates
}

export const TradeableAssetCard: React.FC<TradeableAssetCardProps> = ({
  name,
  currentPrice,
  previousPrice,
  priceHistory,
  holding,
  pocketCash,
  unit,
  onBuy,
  onSell,
  isStock = false,
  isTransacting = false
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [mode, setMode] = useState<'none' | 'buy' | 'sell'>('none');
  const [isShaking, setIsShaking] = useState(false);
  // Local click lock to prevent double clicks before parent state updates
  const [localLock, setLocalLock] = useState(false);

  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Trigger shake animation
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleBuy = () => {
    if (isTransacting || localLock) {
      console.warn('[TradeableAssetCard] Buy blocked - transaction pending or localLock active');
      return;
    }

    // Block buys while in debt - NO ALERT, just shake
    if (pocketCash < 0) {
      triggerShake();
      return;
    }

    // If first click, reveal quantity UI and don't execute
    if (mode !== 'buy') {
      setMode('buy');
      setSelectedQuantity(1);
      setCustomQuantity('');
      return;
    }

    // Second click: execute; set localLock immediately to prevent rapid second calls
    setLocalLock(true);

    const quantity = customQuantity ? parseFloat(customQuantity) : selectedQuantity;
    if (quantity <= 0) {
      setLocalLock(false);
      return;
    }

    const totalCost = quantity * currentPrice;
    if (totalCost > pocketCash) {
      triggerShake();
      setLocalLock(false);
      return;
    }

    onBuy(quantity);
    setCustomQuantity('');
    setMode('none'); // Hide controls after transaction

    // Clear local lock after a short delay (parent will also clear via isTransacting)
    setTimeout(() => setLocalLock(false), 300);
  };

  const handleSell = () => {
    if (isTransacting || localLock) {
      console.warn('[TradeableAssetCard] Sell blocked - transaction pending or localLock active');
      return;
    }

    if (mode !== 'sell') {
      // First click: Show quantity controls
      setMode('sell');
      setSelectedQuantity(1);
      setCustomQuantity('');
      return;
    }

    // Second click: Execute transaction
    setLocalLock(true);
    const quantity = customQuantity ? parseFloat(customQuantity) : selectedQuantity;
    if (quantity <= 0) {
      setLocalLock(false);
      return;
    }

    if (quantity > holding.quantity) {
      triggerShake();
      setLocalLock(false);
      return;
    }

    onSell(quantity);
    setCustomQuantity('');
    setMode('none'); // Hide controls after transaction

    setTimeout(() => setLocalLock(false), 300);
  };

  // MAX quantity based on mode
  const maxQuantity = mode === 'buy'
    ? Math.floor(pocketCash / currentPrice)
    : holding.quantity;

  // Get asset info for tooltip (works for all asset types)
  const assetInfo = getAssetInfo(name);

  // Calculate P/L
  const totalPL = holding.avgPrice > 0 && holding.quantity > 0
    ? (currentPrice - holding.avgPrice) * holding.quantity
    : 0;
  const isProfit = totalPL >= 0;

  // Calculate pocket cash required/received based on mode and selected quantity
  const currentQuantity = customQuantity ? parseFloat(customQuantity) || 0 : selectedQuantity;
  const pocketCashImpact = currentQuantity * currentPrice;

  // Calculate total invested amount
  const totalInvested = holding.avgPrice > 0 && holding.quantity > 0
    ? holding.avgPrice * holding.quantity
    : 0;

  return (
    <div className={`asset-card tradeable-card ${isStock ? 'stock-card' : ''} ${isShaking ? 'shake' : ''}`}>
      {/* Row 1: Stock Name */}
      <div className="asset-tooltip-wrapper">
        <h3 className="card-title">{name}</h3>
        <div className="asset-tooltip">
          <div className="tooltip-full-name">{assetInfo.fullName}</div>
          <div className="tooltip-sector">{assetInfo.sector}</div>
          <div className="tooltip-description">{assetInfo.description}</div>
        </div>
      </div>

      {/* Row 2: Current Price (left) & Price Change % (right) */}
      <div className="row-2-price-change">
        <span className={`current-price-large ${isPositive ? 'positive' : 'negative'}`}>
          ₹{currentPrice.toFixed(2)}
        </span>
        {/* show unit if provided */}
        {unit && <small className="price-unit">{unit}</small>}
        <span className={`price-change-percent ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
        </span>
      </div>

      {/* Row 3: P&L (prominent) with AVG & QTY on hover */}
      <div className="row-3-stats">
        {/* Default: Show only P&L prominently */}
        <div className={`stat-item-main ${isProfit ? 'profit' : 'loss'}`}>
          <span className="stat-label">P&L</span>
          <span className="stat-value-main">{isProfit ? '+' : ''}₹{formatIndianNumber(totalPL)}</span>
        </div>
            <div className="stat-item">
            <span className="stat-label">QTY</span>
            <span className="stat-value">{holding.quantity > 0 ? holding.quantity.toFixed(0) : '--'}</span>
          </div>

        {/* Hover: Show all three stats */}
        <div className="stat-details">

          <div className="stat-item">
            <span className="stat-label">Invested</span>
            <span className="stat-value">{totalInvested > 0 ? `₹${formatIndianNumber(totalInvested)}` : '--'}</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <span className="stat-label">Avg</span>
            <span className="stat-value">{holding.avgPrice > 0 ? `₹${formatIndianNumber(holding.avgPrice)}` : '--'}</span>
          </div>

        </div>
      </div>

      {/* Row 4-7: Chart */}
      <div className="chart-container">
        <MiniChart data={priceHistory} isPositive={isPositive} />
      </div>

      {mode !== 'none' && (
        <>
          {/* Pocket Cash Preview */}
          <div className="pocket-cash-preview">
            {mode === 'buy' ? (
              <div className="cash-preview-text">
                <span className="preview-label">Pocket cash required:</span>
                <span className="preview-amount buy">₹{formatIndianNumber(pocketCashImpact)}</span>
              </div>
            ) : (
              <div className="cash-preview-text">
                <span className="preview-label">You will receive:</span>
                <span className="preview-amount sell">₹{formatIndianNumber(pocketCashImpact)}</span>
              </div>
            )}
          </div>

          <div className="quantity-selector">
            <button
              type="button"
              className={`qty-btn ${selectedQuantity === 1 && !customQuantity ? 'active' : ''}`}
              onClick={() => {
                setSelectedQuantity(1);
                setCustomQuantity('');
              }}
            >
              1
            </button>
            <button
              type="button"
              className={`qty-btn ${selectedQuantity === 10 && !customQuantity ? 'active' : ''}`}
              onClick={() => {
                setSelectedQuantity(10);
                setCustomQuantity('');
              }}
            >
              10
            </button>
            <div className="input-container">
              <input
                type="number"
                className="qty-input"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                placeholder="Custom"
              />
              <button
                type="button"
                className="max-button"
                onClick={() => {
                  setCustomQuantity(maxQuantity.toString());
                  setSelectedQuantity(0);
                }}
              >
                MAX
              </button>
            </div>
          </div>
        </>
      )}

      <div className="button-group">
        {mode === 'buy' ? (
          <>
            <button type="button" className={`action-button buy-btn ${isTransacting || pocketCash < 0 ? 'disabled' : ''}`} onClick={handleBuy} disabled={isTransacting || pocketCash < 0}>
              BUY
            </button>
            <button type="button" className="action-button cancel-btn" onClick={() => setMode('none')}>
              CANCEL
            </button>
          </>
        ) : mode === 'sell' ? (
          <>
            <button className="action-button cancel-btn" onClick={() => setMode('none')}>
              CANCEL
            </button>
            <button className={`action-button sell-btn ${isTransacting ? 'disabled' : ''}`} onClick={handleSell} disabled={isTransacting}>
              SELL
            </button>
          </>
        ) : (
          <>
            <button type="button" className={`action-button buy-btn ${isTransacting || pocketCash < 0 ? 'disabled' : ''}`} onClick={handleBuy} disabled={isTransacting || pocketCash < 0} title={pocketCash < 0 ? 'Cannot buy while in debt' : ''}>
              {pocketCash < 0 ? '🔒 BUY' : 'BUY'}
            </button>
            <button type="button" className={`action-button sell-btn ${isTransacting ? 'disabled' : ''}`} onClick={handleSell} disabled={isTransacting}>
              SELL
            </button>
          </>
        )}
      </div>
    </div>
  );
};
