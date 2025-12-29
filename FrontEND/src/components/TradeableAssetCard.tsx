import React, { useState } from 'react';
import { AssetHolding } from '../types';
import { MiniChart } from './MiniChart';
import { getAssetInfo } from '../utils/stockInfo';
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
  isStock = false
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [mode, setMode] = useState<'none' | 'buy' | 'sell'>('none');
  const [isShaking, setIsShaking] = useState(false);

  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Trigger shake animation
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleBuy = () => {
    if (mode !== 'buy') {
      // First click: Show quantity controls
      setMode('buy');
      setSelectedQuantity(1);
      setCustomQuantity('');
      return;
    }

    // Second click: Execute transaction
    const quantity = customQuantity ? parseFloat(customQuantity) : selectedQuantity;
    if (quantity <= 0) return;

    const totalCost = quantity * currentPrice;
    if (totalCost > pocketCash) {
      triggerShake();
      return;
    }

    onBuy(quantity);
    setCustomQuantity('');
    setMode('none'); // Hide controls after transaction
  };

  const handleSell = () => {
    if (mode !== 'sell') {
      // First click: Show quantity controls
      setMode('sell');
      setSelectedQuantity(1);
      setCustomQuantity('');
      return;
    }

    // Second click: Execute transaction
    const quantity = customQuantity ? parseFloat(customQuantity) : selectedQuantity;
    if (quantity <= 0) return;

    if (quantity > holding.quantity) {
      triggerShake();
      return;
    }

    onSell(quantity);
    setCustomQuantity('');
    setMode('none'); // Hide controls after transaction
  };

  // MAX quantity based on mode
  const maxQuantity = mode === 'buy'
    ? Math.floor(pocketCash / currentPrice)
    : holding.quantity;

  // Get asset info for tooltip (works for all asset types)
  const assetInfo = getAssetInfo(name);

  return (
    <div className={`asset-card tradeable-card ${isStock ? 'stock-card' : ''} ${isShaking ? 'shake' : ''}`}>
      <div className="asset-tooltip-wrapper">
        <h3 className="card-title">{name}</h3>
        <div className="asset-tooltip">
          <div className="tooltip-full-name">{assetInfo.fullName}</div>
          <div className="tooltip-sector">{assetInfo.sector}</div>
          <div className="tooltip-description">{assetInfo.description}</div>
        </div>
      </div>

      <div className="chart-container">
        <MiniChart data={priceHistory} isPositive={isPositive} />
      </div>

      <div className="price-info">
        <div className="current-price">
          <span className="price-label">Curr. ₹{unit}</span>
          <span className={`price-value ${isPositive ? 'positive' : 'negative'}`}>
            ₹{currentPrice.toFixed(2)}
          </span>
          <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
          </span>
        </div>
        <div className="holding-info">
          <div className="holdings-container">
            <div className="holdings-left">
              <div className="holding-row">
                <span className="holding-label">Holdings:</span>
                <span className="holding-value">{holding.quantity.toFixed(2)}</span>
              </div>
              <div className="holding-row">
                <span className="holding-label">AVG. Price:</span>
                <span className="holding-value">₹{holding.avgPrice > 0 ? holding.avgPrice.toFixed(2) : '-'}</span>
              </div>
            </div>
            {holding.avgPrice > 0 && holding.quantity > 0 && (
              <div className="holdings-right">
                {(() => {
                  const totalPL = (currentPrice - holding.avgPrice) * holding.quantity;
                  const plPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                  const isProfit = totalPL >= 0;
                  return (
                    <div className={`pl-display ${isProfit ? 'profit' : 'loss'}`}>
                      <div className="pl-amount">{isProfit ? '+' : ''}₹{totalPL.toFixed(2)}</div>
                      <div className="pl-percent">{isProfit ? '+' : ''}{plPercent.toFixed(2)}%</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {mode !== 'none' && (
        <div className="quantity-selector">
          <button
            className={`qty-btn ${selectedQuantity === 1 && !customQuantity ? 'active' : ''}`}
            onClick={() => {
              setSelectedQuantity(1);
              setCustomQuantity('');
            }}
          >
            1
          </button>
          <button
            className={`qty-btn ${selectedQuantity === 10 && !customQuantity ? 'active' : ''}`}
            onClick={() => {
              setSelectedQuantity(10);
              setCustomQuantity('');
            }}
          >
            10
          </button>
          <input
            type="number"
            className="qty-input"
            value={customQuantity}
            onChange={(e) => setCustomQuantity(e.target.value)}
            placeholder="Custom"
          />
          <button
            className="qty-btn max-qty-btn"
            onClick={() => {
              setCustomQuantity(maxQuantity.toString());
              setSelectedQuantity(0);
            }}
          >
            MAX
          </button>
        </div>
      )}

      <div className="button-group">
        {mode === 'buy' ? (
          <>
            <button className="action-button buy-btn" onClick={handleBuy}>
              BUY
            </button>
            <button className="action-button cancel-btn" onClick={() => setMode('none')}>
              CANCEL
            </button>
          </>
        ) : mode === 'sell' ? (
          <>
            <button className="action-button cancel-btn" onClick={() => setMode('none')}>
              CANCEL
            </button>
            <button className="action-button sell-btn" onClick={handleSell}>
              SELL
            </button>
          </>
        ) : (
          <>
            <button className="action-button buy-btn" onClick={handleBuy}>
              BUY
            </button>
            <button className="action-button sell-btn" onClick={handleSell}>
              SELL
            </button>
          </>
        )}
      </div>
    </div>
  );
};
