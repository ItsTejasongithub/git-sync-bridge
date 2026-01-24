// Trade tracking utility for comprehensive AI analysis
import { bankingTracker } from './bankingTracker';
import { getServerUrl } from './getServerUrl';

export interface TradeLog {
  positionSize: number;
  id: string;
  transactionType: 'buy' | 'sell';
  assetType: string;
  assetName: string;
  quantity: number;
  price: number;
  totalValue: number;
  gameYear: number;
  gameMonth: number;
  timestamp: number; // Unix timestamp
  pocketCashBefore: number;
  pocketCashAfter: number;
  holdingQuantityBefore: number;
  holdingQuantityAfter: number;
}

class TradeTracker {
  private trades: TradeLog[] = [];

  logTrade(trade: Omit<TradeLog, 'id'>) {
    const tradeWithId: TradeLog = {
      ...trade,
      id: `${trade.timestamp}_${trade.assetType}_${trade.assetName}`,
    };

    this.trades.push(tradeWithId);
  }

  getTrades(): TradeLog[] {
    return [...this.trades];
  }

  getTradeCount(): number {
    return this.trades.length;
  }

  getBuyCount(): number {
    return this.trades.filter(t => t.transactionType === 'buy').length;
  }

  getSellCount(): number {
    return this.trades.filter(t => t.transactionType === 'sell').length;
  }

  getAverageHoldingTime(): number {
    // Calculate average time between buy and sell for same asset
    const buysByAsset = new Map<string, TradeLog[]>();

    this.trades.forEach(trade => {
      const key = `${trade.assetType}_${trade.assetName}`;
      if (!buysByAsset.has(key)) {
        buysByAsset.set(key, []);
      }
      buysByAsset.get(key)!.push(trade);
    });

    let totalHoldingTime = 0;
    let pairCount = 0;

    buysByAsset.forEach(assetTrades => {
      const buys = assetTrades.filter(t => t.transactionType === 'buy');
      const sells = assetTrades.filter(t => t.transactionType === 'sell');

      buys.forEach(buy => {
        const matchingSells = sells.filter(sell => sell.timestamp > buy.timestamp);
        if (matchingSells.length > 0) {
          const nearestSell = matchingSells[0];
          const holdingTime = nearestSell.timestamp - buy.timestamp;
          totalHoldingTime += holdingTime;
          pairCount++;
        }
      });
    });

    return pairCount > 0 ? totalHoldingTime / pairCount / (1000 * 60) : 0; // Return in minutes
  }

  async uploadToDatabase(
    logUniqueId: string,
    playerName: string,
    playerAge?: number,
    savingsAccount?: { balance: number; interestRate: number; totalDeposited?: number },
    fixedDeposits?: Array<{
      id: string;
      amount: number;
      duration: 3 | 12 | 36;
      interestRate: number;
      startMonth: number;
      startYear: number;
      maturityMonth: number;
      maturityYear: number;
      isMatured: boolean;
    }>,
    cashTransactions?: Array<{
      type?: string;
      subType?: string | null;
      amount: number;
      message?: string | null;
      gameYear?: number | null;
      gameMonth?: number | null;
      timestamp?: number;
    }>,
    holdings?: Array<{
      assetCategory: string;
      assetName: string;
      quantity: number;
      avgPrice: number;
      totalInvested: number;
      currentPrice: number;
      currentValue: number;
      unrealizedPL: number;
      gameYear: number;
      gameMonth: number;
    }>
  ) {
    const bankingLogs = bankingTracker.getBankingLogs();
    if (this.trades.length === 0 && (!bankingLogs || bankingLogs.length === 0) && (!cashTransactions || cashTransactions.length === 0)) {
      return;
    }

    try {
    // Precompute banking metrics
    const bankingSummary = this.computeBankingMetrics(savingsAccount, fixedDeposits);

    // Precompute summary metrics
    const totalTrades = this.getTradeCount();
    const buyTrades = this.getBuyCount();
    const sellTrades = this.getSellCount();
    const averageHoldingTimeMinutes = this.getAverageHoldingTime();

    // Net P&L and per-trade P&L stats
    let totalPnL = 0;
    let bestTrade: TradeLog | null = null;
    let worstTrade: TradeLog | null = null;
    let realizedCount = 0;
    const exposureByAsset: { [key: string]: number } = {};

    for (const t of this.trades) {
      // Exposure
      exposureByAsset[t.assetType] = (exposureByAsset[t.assetType] || 0) + (t.positionSize || 0);

      // For realized PnL, we estimate using calculateProfitLoss when sell
      if (t.transactionType === 'sell') {
        const pl = this.calculateProfitLoss(t);
        totalPnL += pl;
        realizedCount++;
        if (!bestTrade || pl > (this.calculateProfitLoss(bestTrade))) bestTrade = t;
        if (!worstTrade || pl < (this.calculateProfitLoss(worstTrade))) worstTrade = t;
      }
    }

    const winCount = this.trades.filter(t => t.transactionType === 'sell' && this.calculateProfitLoss(t) > 0).length;
    const lossCount = this.trades.filter(t => t.transactionType === 'sell' && this.calculateProfitLoss(t) <= 0).length;
    const winRate = realizedCount > 0 ? (winCount / realizedCount) : 0;

    // Generate a timestamp-based Report ID
    function generateReportId() {
      const now = new Date();
      const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let rnd = '';
      for (let i = 0; i < 5; i++) rnd += chars.charAt(Math.floor(Math.random() * chars.length));
      return `RPT-${ts}-${rnd}`;
    }

    const reportId = generateReportId();

    const payload = {
      uniqueId: logUniqueId,
      reportId,
      player: {
        name: playerName,
        age: playerAge || null,
        tradingId: logUniqueId,
      },
      summary: {
        totalTrades,
        buyTrades,
        sellTrades,
        totalPnL,
        bestTrade: bestTrade ? { assetType: bestTrade.assetType, assetName: bestTrade.assetName, timestamp: bestTrade.timestamp } : null,
        worstTrade: worstTrade ? { assetType: worstTrade.assetType, assetName: worstTrade.assetName, timestamp: worstTrade.timestamp } : null,
        averageHoldingTimeMinutes,
        winCount,
        lossCount,
        winRate,
        exposureByAsset,
        tradingFrequency: this.calculateTradingFrequency(),
        assetTypeDistribution: this.getAssetTypeDistribution(),
        banking: bankingSummary,
      },
      trades: this.trades.map(trade => ({
          transactionType: trade.transactionType,
          assetType: trade.assetType,
          assetName: trade.assetName,
          quantity: trade.quantity,
          entryPrice: trade.price,
          exitPrice: trade.transactionType === 'sell' ? trade.price : null,
          positionSize: trade.totalValue,
          profitLoss: trade.transactionType === 'sell' ? this.calculateProfitLoss(trade) : null,
          gameYear: trade.gameYear,
          gameMonth: trade.gameMonth,
        })),
        bankingTransactions: bankingTracker.getBankingLogs(),
        cashTransactions: cashTransactions || [],
        holdings: holdings || [],
      };

      const response = await fetch(`${getServerUrl()}/api/trades/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, message: result.message };
      } else {
        console.error('❌ Failed to upload trades:', result);
      }
    } catch (error) {
      console.error('❌ Error uploading trades:', error);
    }
    return { success: false };
  }

  private calculateProfitLoss(sellTrade: TradeLog): number {
    // Find corresponding buy trade
    const buyTrades = this.trades.filter(
      t => t.transactionType === 'buy' &&
           t.assetType === sellTrade.assetType &&
           t.assetName === sellTrade.assetName &&
           t.timestamp < sellTrade.timestamp
    );

    if (buyTrades.length === 0) return 0;

    // Use most recent buy before this sell
    const buyTrade = buyTrades[buyTrades.length - 1];
    const avgBuyPrice = buyTrade.price;
    const sellPrice = sellTrade.price;

    return (sellPrice - avgBuyPrice) * sellTrade.quantity;
  }

  private computeBankingMetrics(
    savingsAccount?: { balance: number; interestRate: number; totalDeposited?: number },
    fixedDeposits?: Array<{
      id: string;
      amount: number;
      duration: 3 | 12 | 36;
      interestRate: number;
      startMonth: number;
      startYear: number;
      maturityMonth: number;
      maturityYear: number;
      isMatured: boolean;
    }>
  ) {
    const banking = {
      savingsBalance: savingsAccount?.balance || 0,
      savingsInterestRate: savingsAccount?.interestRate || 0,
      savingsTotalDeposited: savingsAccount?.totalDeposited || 0,
      fdCount: fixedDeposits?.length || 0,
      fdTotalInvested: 0,
      fdMaturedCount: 0,
      fdActiveCount: 0,
      fdAverageDuration: 0,
      fdAverageInterestRate: 0,
      fdTotalInterestEarned: 0,
      fdRiskProfile: 'conservative' as 'conservative' | 'moderate' | 'aggressive',
      liquidityManagement: 'unknown' as 'poor' | 'moderate' | 'good' | 'excellent',
    };

    if (fixedDeposits && fixedDeposits.length > 0) {
      let totalDuration = 0;
      let totalInterest = 0;

      fixedDeposits.forEach(fd => {
        banking.fdTotalInvested += fd.amount;
        if (fd.isMatured) banking.fdMaturedCount++;
        else banking.fdActiveCount++;

        totalDuration += fd.duration;
        banking.fdAverageInterestRate += fd.interestRate;

        // Calculate interest earned on matured FDs
        if (fd.isMatured) {
          const months = fd.duration;
          const monthlyRate = fd.interestRate / 12;
          const interest = fd.amount * monthlyRate * months;
          totalInterest += interest;
        }
      });

      banking.fdAverageDuration = totalDuration / fixedDeposits.length;
      banking.fdAverageInterestRate = banking.fdAverageInterestRate / fixedDeposits.length;
      banking.fdTotalInterestEarned = totalInterest;

      // Determine risk profile based on FD durations and rates
      const shortTermCount = fixedDeposits.filter(fd => fd.duration === 3).length;
      const longTermCount = fixedDeposits.filter(fd => fd.duration === 36).length;

      if (shortTermCount > longTermCount) {
        banking.fdRiskProfile = 'aggressive';
      } else if (longTermCount > shortTermCount) {
        banking.fdRiskProfile = 'conservative';
      } else {
        banking.fdRiskProfile = 'moderate';
      }
    }

    // Assess liquidity management based on savings balance and FD investments
    const totalBankingAssets = banking.savingsBalance + banking.fdTotalInvested;
    if (totalBankingAssets === 0) {
      banking.liquidityManagement = 'poor';
    } else if (banking.savingsBalance > totalBankingAssets * 0.7) {
      banking.liquidityManagement = 'excellent';
    } else if (banking.savingsBalance > totalBankingAssets * 0.4) {
      banking.liquidityManagement = 'good';
    } else if (banking.savingsBalance > 0) {
      banking.liquidityManagement = 'moderate';
    } else {
      banking.liquidityManagement = 'poor';
    }

    return banking;
  }

  clearTrades() {
    this.trades = [];
  }

  getTradesSummary() {
    return {
      totalTrades: this.getTradeCount(),
      buyTrades: this.getBuyCount(),
      sellTrades: this.getSellCount(),
      averageHoldingTimeMinutes: this.getAverageHoldingTime(),
      assetTypeDistribution: this.getAssetTypeDistribution(),
      tradingFrequency: this.calculateTradingFrequency(),
    };
  }

  private getAssetTypeDistribution() {
    const distribution: { [key: string]: number } = {};
    this.trades.forEach(trade => {
      distribution[trade.assetType] = (distribution[trade.assetType] || 0) + 1;
    });
    return distribution;
  }

  private calculateTradingFrequency(): 'very_high' | 'high' | 'medium' | 'low' | 'very_low' {
    const tradeCount = this.getTradeCount();
    if (tradeCount >= 50) return 'very_high';
    if (tradeCount >= 30) return 'high';
    if (tradeCount >= 15) return 'medium';
    if (tradeCount >= 5) return 'low';
    return 'very_low';
  }
}

// Singleton instance
export const tradeTracker = new TradeTracker();
