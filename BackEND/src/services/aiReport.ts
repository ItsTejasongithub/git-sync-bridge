import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTradesByLogId } from '../database/tradingTransactions';
import { getBankingTransactionSummary } from '../database/bankingTransactions';
import { getCashTransactionsByLogId, getCashSummaryByLogId } from '../database/cashTransactions';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_RESPONSES_DIR = path.join(__dirname, '../../data/ai_responses');
const AI_RESPONSES_FILE = path.join(AI_RESPONSES_DIR, 'responses.json');

interface TradeAnalysis {
  bestTrade: any;
  worstTrade: any;
  totalProfitLoss: number;
  winRate: number;
  totalTrades: number;
}

interface AIReportParams {
  logId: number;
  uniqueId: string; // Unique identifier for the player log
  playerName: string;
  playerAge: number;
  finalNetworth: number;
  finalCAGR: number;
  profitLoss: number;
  // Optional precomputed inputs to save tokens
  reportId?: string | null;
  precomputedSummary?: any | null;
  precomputedTrades?: any[] | null;
}

interface StoredAIResponse {
  timestamp: string;
  reportId: string;
  uniqueId: string;
  playerName: string;
  playerAge: number;
  finalNetworth: number;
  finalCAGR: number;
  profitLoss: number;
  rawResponse: string;
}

// Ensure AI responses directory exists
function ensureResponsesDirectory(): void {
  if (!fs.existsSync(AI_RESPONSES_DIR)) {
    fs.mkdirSync(AI_RESPONSES_DIR, { recursive: true });
  }
}

// Store AI response in JSON file
function storeAIResponse(params: AIReportParams, report: string): void {
  try {
    ensureResponsesDirectory();

    const responseEntry: StoredAIResponse = {
      timestamp: new Date().toISOString(),
      reportId: params.reportId || `REPORT-${Date.now()}`,
      uniqueId: params.uniqueId,
      playerName: params.playerName,
      playerAge: params.playerAge,
      finalNetworth: params.finalNetworth,
      finalCAGR: params.finalCAGR,
      profitLoss: params.profitLoss,
      rawResponse: report,
    };

    let responses: StoredAIResponse[] = [];

    // Read existing responses if file exists
    if (fs.existsSync(AI_RESPONSES_FILE)) {
      try {
        const fileContent = fs.readFileSync(AI_RESPONSES_FILE, 'utf-8');
        responses = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('Error parsing existing responses file, creating new:', parseError);
        responses = [];
      }
    }

    // Append new response
    responses.push(responseEntry);

    // Write back to file
    fs.writeFileSync(AI_RESPONSES_FILE, JSON.stringify(responses, null, 2), 'utf-8');
    console.log(`AI Response stored: ${responseEntry.reportId}`);
  } catch (error) {
    console.error('Failed to store AI response:', error);
    // Don't throw - storage failure shouldn't break report generation
  }
}

export async function generateTradingReport(params: AIReportParams): Promise<{ success: boolean; report?: string; error?: string }> {
  try {
    if (!GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    // Prefer precomputed trades if provided (to save DB reads and tokens)
    const trades = params.precomputedTrades && params.precomputedTrades.length > 0
      ? params.precomputedTrades
      : getTradesByLogId(params.logId);

    // Fetch server-side precomputed summaries (banking + cash events)
    const bankingSummary = getBankingTransactionSummary(params.logId);
    const cashTxns = getCashTransactionsByLogId(params.logId);
    const cashSummary = getCashSummaryByLogId(params.logId);

    if (!trades || trades.length === 0) {
      // Short, templated report to save AI tokens when no trades exist
      const lines: string[] = [];
      lines.push(`# Trading Performance Report`);
      lines.push(``);
      lines.push(`Player: ${params.playerName} (Age: ${params.playerAge})`);
      lines.push(`Report ID: ${params.reportId || params.uniqueId}`);
      lines.push(`Final Networth: ₹${params.finalNetworth.toLocaleString('en-IN')}`);
      lines.push(`CAGR: ${params.finalCAGR.toFixed(2)}%`);
      lines.push(`Profit/Loss: ₹${params.profitLoss.toLocaleString('en-IN')}`);
      lines.push(``);
      lines.push(`Summary of cash events (life events & recurring income):`);
      if (cashSummary) {
        lines.push(`  - Total incoming: ₹${(cashSummary.totalIncoming || 0).toLocaleString('en-IN')}`);
        lines.push(`  - Total outgoing: ₹${(cashSummary.totalOutgoing || 0).toLocaleString('en-IN')}`);
        lines.push(`  - Recurring income total: ₹${(cashSummary.recurringIncomeTotal || 0).toLocaleString('en-IN')}`);
        lines.push(`  - Life event gains: ₹${(cashSummary.lifeEventGains || 0).toLocaleString('en-IN')}`);
        lines.push(`  - Life event losses: ₹${(cashSummary.lifeEventLosses || 0).toLocaleString('en-IN')}`);
        lines.push(`  - Events recorded: ${cashSummary.eventsCount || 0}`);
      } else {
        lines.push(`  No cash events recorded`);
      }
      lines.push(``);
      lines.push(`Banking summary:`);
      if (bankingSummary) {
        // Banking summary shape can vary depending on what was computed; safely extract fields
        const bankAny: any = bankingSummary as any;
        const savingsBalance = bankAny.totalDeposits ?? bankAny.savingsBalance ?? 0;
        const fdInvested = bankAny.totalFdInvestments ?? bankAny.fdTotalInvested ?? 0;
        const totalInterest = bankAny.totalInterestEarned ?? bankAny.totalInterest ?? 0;

        lines.push(`  - Savings balance: ₹${Number(savingsBalance).toLocaleString('en-IN')}`);
        lines.push(`  - FD investments: ₹${Number(fdInvested).toLocaleString('en-IN')}`);
        lines.push(`  - Total interest earned: ₹${Number(totalInterest).toLocaleString('en-IN')}`);
      } else {
        lines.push(`  No banking transactions recorded`);
      }
      lines.push(``);
      lines.push(`Short analysis:`);
      lines.push(`  You made no trades during this session. Your networth changed mainly due to cash flows (recurring income or life events) and banking activity. Consider using a simple strategy next time — allocate a portion of recurring income to a low-risk instrument (e.g., FDs or index funds) and gradually experiment with small trades to learn. Keep your emergency fund (savings) intact before taking risks.`);
      lines.push(``);
      lines.push(`Top-level metrics: Networth: ₹${params.finalNetworth.toLocaleString('en-IN')}, P&L: ₹${params.profitLoss.toLocaleString('en-IN')}, CAGR: ${params.finalCAGR.toFixed(2)}%`);

      const report = lines.join('\n');

      // Store templated response for auditing
      storeAIResponse(params, report);

      return { success: true, report };
    }

    // If precomputed summary provided, use it to reduce token usage
    const analysis = params.precomputedSummary ? params.precomputedSummary : analyzeTrades(trades);

    // If trade history is small, skip caching
    const useCache = trades.length > 50;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const systemInstruction = `You are a Professional Trading Performance Analyst. Your role is to analyze player trading behavior based on logged in-game actions such as buy, sell, hold, timing, frequency, risk taken, and reaction to outcomes. Your goal is to identify the player’s underlying trading mindset and potential, not financial profit alone. Generate a single-page performance report that includes: Trading Style Classification Identify the closest matching trader type based on behavior patterns. Best and Worst Trades Highlight decisions with clear reasoning (timing, risk, patience, impulsiveness). Actionable Improvement Advice Give age-appropriate, constructive guidance to improve decision-making, discipline, and strategy. Use professional, concise language, but keep insights simple and interpretable for kids and educators. Avoid financial jargon unless necessary. Focus on decision quality, consistency, and learning potential. TRADER TYPES TO IDENTIFY (COMPLETE LIST) CORE TRADING STYLES (PRIMARY) Scalper Very frequent buy/sell actions Short holding time Reacts quickly to small changes Strength: Speed, alertness Risk: Overtrading, impatience Day Trader Trades multiple times within a session Closes positions quickly but not instantly Watches trends and momentum Strength: Focus, adaptability Risk: Emotional decisions under pressure Swing Trader Holds positions for medium duration Waits for better opportunities Less frequent but more deliberate trades Strength: Patience, planning Risk: Missed opportunities Long-Term / Position Trader Buys and holds for long periods Minimal reaction to short-term events Focuses on big-picture outcomes Strength: Discipline, confidence Risk: Ignoring warning signals Investor-Mindset Player Rare trades Prioritizes stability over action Avoids unnecessary risk Strength: Risk control Risk: Low engagement or slow learning BEHAVIOR-BASED PROFILES (VERY IMPORTANT FOR KIDS) Impulsive Trader Trades immediately after events No consistent pattern Emotion-driven decisions Indicator: High excitement, low patience Overconfident Trader Increases risk after wins Ignores losses or repeats mistakes Indicator: Strong belief, weak reflection Fear-Driven Trader Sells quickly after small losses Avoids buying again Indicator: Risk aversion, low confidence Random / No Clear Strategy Buy/sell actions lack consistency No timing logic Indicator: Exploration phase or confusion Adaptive Learner Changes strategy after losses Improves timing over time Indicator: High learning potential GAME-SPECIFIC / EDUCATIONAL TYPES (OPTIONAL BUT POWERFUL) Experimenter Tries many approaches intentionally Learning-focused, not result-focused Rule Follower Trades only when conditions are clear Consistent, cautious behavior Trend Chaser Buys after others succeed Sells when trend weakens Opportunistic Player Waits, then acts decisively Few but high-impact moves WHAT YOUR LOGS SHOULD TRACK (FOR BEST ANALYSIS) To enable accurate classification, log: Time between buy and sell Trade frequency Risk size per trade Reaction after wins/losses Strategy changes over time Holding duration OUTCOME YOU WILL GET From gameplay alone, your AI will be able to infer: Decision-making style Emotional control Risk appetite Learning ability Strategic thinking level This makes your game a behavioral intelligence tool, not just a trading simulation.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: systemInstruction,
    });

    // Build a short preamble with server-side computed summaries to save AI tokens
    const preambleParts: string[] = [];
    if (bankingSummary) preambleParts.push(`BANKING_SUMMARY:${JSON.stringify(bankingSummary)}`);
    if (cashSummary) preambleParts.push(`CASH_SUMMARY:${JSON.stringify(cashSummary)}`);
    if (params.precomputedSummary) preambleParts.push(`PRECOMPUTED_SUMMARY:${JSON.stringify(params.precomputedSummary)}`);
    const preambleText = preambleParts.length > 0 ? preambleParts.join('\n') + '\n\n' : '';

    // If a precomputed summary exists, include it in the prompt to save tokens, otherwise include formatted trades
    const tradeHistoryText = preambleText + (params.precomputedSummary
      ? `PRECOMPUTED SUMMARY:\n${JSON.stringify(params.precomputedSummary)}\n\n` + formatTradesForAI(trades, analysis, params.precomputedSummary?.banking)
      : formatTradesForAI(trades, analysis));

    const prompt = `Generate a Comprehensive Trading & Financial Discipline Report for:
  Player: ${params.playerName}, Age: ${params.playerAge}
  Report ID: ${params.reportId || params.uniqueId}
  Final Networth: ₹${params.finalNetworth.toLocaleString('en-IN')}
  CAGR: ${params.finalCAGR.toFixed(2)}%
  Profit/Loss: ₹${params.profitLoss.toLocaleString('en-IN')}

  Trade History:
  ${tradeHistoryText}

  ANALYSIS FRAMEWORK:

  ## 1. Trading Style Classification
  Classify the player into the closest matching trading style based strictly on observed behavior (frequency, holding time, risk, reactions, consistency).
  
  ## 2. Banking Discipline Assessment
  Analyze the player's banking decisions including:
  - Savings Account Balance: Emergency fund adequacy
  - Fixed Deposits: Commitment to long-term goals, lock-in patience
  - Liquidity Management: Balance between safety and growth investments
  - Interest Rate Awareness: Strategic use of banking products
  
  ## 3. Combined Risk Profile
  Identify the player's overall financial personality by combining:
  - Trading Aggressiveness (scalper vs. long-term investor)
  - Banking Conservatism (savings focus vs. investment drive)
  - Decision Pattern (impulsive vs. deliberate)
  - Learning Capacity (adaptive vs. rigid)
  
  ## 4. Best Trade Analysis
  Identify the most effective trade and explain why it was good.
  
  ## 5. Worst Trade Analysis
  Identify the weakest trade and explain what went wrong.
  
  ## 6. Key Recommendations
  Provide 3-5 actionable recommendations to improve financial decision-making.
  
  Format as a professional single-page report with clear sections.`;

    let result;
    if (useCache) {
      // Use caching for large trade histories
      const cacheResult = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });
      result = cacheResult;
    } else {
      // Standard generation for small histories
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });
    }

    const report = result.response.text();

    // Store the AI response in JSON file for backup/reuse
    storeAIResponse(params, report);

    return { success: true, report };
  } catch (error: any) {
    console.error('AI Report Generation Error:', error);
    return { success: false, error: error.message || 'Failed to generate report' };
  }
}

function analyzeTrades(trades: any[]): TradeAnalysis {
  let bestTrade = null;
  let worstTrade = null;
  let maxProfit = -Infinity;
  let maxLoss = Infinity;
  let totalProfitLoss = 0;
  let winningTrades = 0;

  for (const trade of trades) {
    if (trade.profitLoss !== null) {
      totalProfitLoss += trade.profitLoss;

      if (trade.profitLoss > 0) winningTrades++;

      if (trade.profitLoss > maxProfit) {
        maxProfit = trade.profitLoss;
        bestTrade = trade;
      }

      if (trade.profitLoss < maxLoss) {
        maxLoss = trade.profitLoss;
        worstTrade = trade;
      }
    }
  }

  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  return {
    bestTrade,
    worstTrade,
    totalProfitLoss,
    winRate,
    totalTrades: trades.length,
  };
}

function formatTradesForAI(
  trades: any[],
  analysis: TradeAnalysis,
  bankingMetrics?: any
): string {
  const fmtNum = (v: any) => {
    const n = Number(v || 0);
    return n.toLocaleString('en-IN');
  };

  let text = `Total Trades: ${analysis.totalTrades || 0}\n`;
  text += `Win Rate: ${(Number(analysis.winRate) || 0).toFixed(1)}%\n`;
  text += `Total P/L: ₹${fmtNum(analysis.totalProfitLoss)}\n\n`;

  // BEHAVIORAL METRICS - Critical for trader classification
  const behavioralMetrics = calculateBehavioralMetrics(trades);
  text += `BEHAVIORAL METRICS (TRADING):\n`;
  text += `  Trading Frequency: ${behavioralMetrics.frequency}\n`;
  text += `  Average Holding Time: ${behavioralMetrics.avgHoldingTime}\n`;
  text += `  Risk Per Trade (Avg): ₹${behavioralMetrics.avgRiskSize.toLocaleString('en-IN')}\n`;
  text += `  Consistency Score: ${behavioralMetrics.consistencyScore}\n`;
  text += `  Reaction Pattern: ${behavioralMetrics.reactionPattern}\n\n`;

  // BANKING METRICS - New addition for financial discipline analysis
  if (bankingMetrics) {
    text += `BANKING DISCIPLINE METRICS:\n`;
    text += `  Savings Balance: ₹${fmtNum(bankingMetrics.savingsBalance)}\n`;
    text += `  Savings Interest Rate: ${bankingMetrics.savingsInterestRate.toFixed(2)}% p.a.\n`;
    text += `  Total Deposited in Savings: ₹${fmtNum(bankingMetrics.savingsTotalDeposited)}\n`;
    text += `  Fixed Deposits Count: ${bankingMetrics.fdCount}\n`;
    if (bankingMetrics.fdCount > 0) {
      text += `  FD Total Invested: ₹${fmtNum(bankingMetrics.fdTotalInvested)}\n`;
      text += `  FD Matured: ${bankingMetrics.fdMaturedCount}, Active: ${bankingMetrics.fdActiveCount}\n`;
      text += `  Average FD Duration: ${bankingMetrics.fdAverageDuration.toFixed(1)} months\n`;
      text += `  Average FD Interest Rate: ${bankingMetrics.fdAverageInterestRate.toFixed(2)}% p.a.\n`;
      text += `  Total Interest Earned (FD): ₹${fmtNum(bankingMetrics.fdTotalInterestEarned)}\n`;
      text += `  FD Risk Profile: ${bankingMetrics.fdRiskProfile}\n`;
    }
    text += `  Liquidity Management: ${bankingMetrics.liquidityManagement}\n\n`;
  }

  if (analysis.bestTrade) {
    const bt: any = analysis.bestTrade || {};
    text += `BEST TRADE:\n`;
    text += `  Asset: ${bt.assetName || bt.assetType || 'Unknown'}\n`;
    text += `  Type: ${bt.transactionType || 'N/A'}\n`;
    text += `  Entry: ₹${fmtNum(bt.entryPrice)}\n`;
    text += `  Exit: ₹${fmtNum(bt.exitPrice)}\n`;
    text += `  P/L: ₹${fmtNum(bt.profitLoss)}\n`;
    text += `  Time: Year ${bt.gameYear ?? 'N/A'}, Month ${bt.gameMonth ?? 'N/A'}\n\n`;
  }

  if (analysis.worstTrade) {
    const wt: any = analysis.worstTrade || {};
    text += `WORST TRADE:\n`;
    text += `  Asset: ${wt.assetName || wt.assetType || 'Unknown'}\n`;
    text += `  Type: ${wt.transactionType || 'N/A'}\n`;
    text += `  Entry: ₹${fmtNum(wt.entryPrice)}\n`;
    text += `  Exit: ₹${fmtNum(wt.exitPrice)}\n`;
    text += `  P/L: ₹${fmtNum(wt.profitLoss)}\n`;
    text += `  Time: Year ${wt.gameYear ?? 'N/A'}, Month ${wt.gameMonth ?? 'N/A'}\n\n`;
  }

  // Include summary of all trades grouped by asset type
  const assetGroups: { [key: string]: { count: number; totalPL: number } } = {};
  for (const trade of trades) {
    const assetType = trade.assetType;
    if (!assetGroups[assetType]) {
      assetGroups[assetType] = { count: 0, totalPL: 0 };
    }
    assetGroups[assetType].count++;
    if (trade.profitLoss) assetGroups[assetType].totalPL += Number(trade.profitLoss);
  }

  text += `TRADES BY ASSET TYPE:\n`;
  for (const [assetType, data] of Object.entries(assetGroups)) {
    text += `  ${assetType}: ${data.count} trades, P/L: ₹${fmtNum(data.totalPL)}\n`;
  }

  return text;
}

interface BehavioralMetrics {
  frequency: string;
  avgHoldingTime: string;
  avgRiskSize: number;
  consistencyScore: string;
  reactionPattern: string;
}

function calculateBehavioralMetrics(trades: any[]): BehavioralMetrics {
  // Trading frequency classification
  let frequency = 'Very Low';
  if (trades.length >= 50) frequency = 'Very High';
  else if (trades.length >= 30) frequency = 'High';
  else if (trades.length >= 15) frequency = 'Medium';
  else if (trades.length >= 5) frequency = 'Low';

  // Calculate average holding time by matching buy/sell pairs
  let totalHoldingMonths = 0;
  let holdingPairCount = 0;
  const buysByAsset = new Map<string, any[]>();

  trades.forEach(trade => {
    const key = `${trade.assetType}_${trade.assetName || trade.assetType}`;
    if (!buysByAsset.has(key)) buysByAsset.set(key, []);
    buysByAsset.get(key)!.push(trade);
  });

  buysByAsset.forEach(assetTrades => {
    const buys = assetTrades.filter(t => t.transactionType === 'buy');
    const sells = assetTrades.filter(t => t.transactionType === 'sell');

    buys.forEach(buy => {
      const matchingSells = sells.filter(sell =>
        sell.gameYear > buy.gameYear ||
        (sell.gameYear === buy.gameYear && sell.gameMonth > buy.gameMonth)
      );
      if (matchingSells.length > 0) {
        const nearestSell = matchingSells[0];
        const holdingTime = (nearestSell.gameYear - buy.gameYear) * 12 + (nearestSell.gameMonth - buy.gameMonth);
        totalHoldingMonths += holdingTime;
        holdingPairCount++;
      }
    });
  });

  const avgHoldingMonths = holdingPairCount > 0 ? totalHoldingMonths / holdingPairCount : 0;
  let avgHoldingTime = 'No completed trades';
  if (avgHoldingMonths > 0) {
    if (avgHoldingMonths < 1) avgHoldingTime = 'Less than 1 month (Scalper)';
    else if (avgHoldingMonths < 3) avgHoldingTime = `${avgHoldingMonths.toFixed(1)} months (Day Trader)`;
    else if (avgHoldingMonths < 12) avgHoldingTime = `${avgHoldingMonths.toFixed(1)} months (Swing Trader)`;
    else avgHoldingTime = `${avgHoldingMonths.toFixed(1)} months (Long-term)`;
  }

  // Average risk size per trade
  const totalRisk = trades.reduce((sum, t) => sum + (t.positionSize || 0), 0);
  const avgRiskSize = trades.length > 0 ? totalRisk / trades.length : 0;

  // Consistency: Check if same assets are traded repeatedly
  const uniqueAssets = new Set(trades.map(t => `${t.assetType}_${t.assetName}`)).size;
  const consistencyRatio = trades.length > 0 ? uniqueAssets / trades.length : 0;
  let consistencyScore = 'Random';
  if (consistencyRatio < 0.3) consistencyScore = 'Very Consistent (Focused)';
  else if (consistencyRatio < 0.5) consistencyScore = 'Consistent';
  else if (consistencyRatio < 0.7) consistencyScore = 'Moderate';
  else consistencyScore = 'Random (Experimenter)';

  // Reaction pattern: Analyze trades after wins/losses
  let reactionPattern = 'Insufficient data';
  if (trades.length >= 3) {
    let reactiveCount = 0;
    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];
      const timeDiff = (currentTrade.gameYear - prevTrade.gameYear) * 12 + (currentTrade.gameMonth - prevTrade.gameMonth);

      if (timeDiff <= 1) reactiveCount++; // Quick reaction
    }
    const reactiveRatio = reactiveCount / (trades.length - 1);
    if (reactiveRatio > 0.6) reactionPattern = 'Impulsive (Quick reactions)';
    else if (reactiveRatio > 0.3) reactionPattern = 'Moderately Reactive';
    else reactionPattern = 'Deliberate (Patient)';
  }

  return {
    frequency,
    avgHoldingTime,
    avgRiskSize,
    consistencyScore,
    reactionPattern,
  };
}
