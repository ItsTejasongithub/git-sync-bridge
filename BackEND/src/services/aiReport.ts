import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTradesByLogId } from '../database/tradingTransactions';
import { getBankingTransactionSummary } from '../database/bankingTransactions';
import { getCashTransactionsByLogId, getCashSummaryByLogId } from '../database/cashTransactions';
import { getHoldingsByLogId, getTotalUnrealizedPL, getHoldingsSummaryByCategory } from '../database/playerHoldings';
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

    // Fetch server-side precomputed summaries (banking + cash events + holdings)
    const bankingSummary = getBankingTransactionSummary(params.logId);
    const cashTxns = getCashTransactionsByLogId(params.logId);
    const cashSummary = getCashSummaryByLogId(params.logId);

    // Fetch holdings data for unrealized P&L analysis
    const holdings = getHoldingsByLogId(params.logId);
    const totalUnrealizedPL = getTotalUnrealizedPL(params.logId);
    const holdingsSummary = getHoldingsSummaryByCategory(params.logId);

    if (!trades || trades.length === 0) {
      // Short, templated report for players who didn't make investment choices
      const lines: string[] = [];

      lines.push(`## 1. Your Learning Style: 🎯 The Patient Observer`);
      lines.push(``);
      lines.push(`You showed excellent patience this month by taking time to watch and learn before making any investment choices. This is actually a smart approach - understanding how money works before jumping in shows maturity!`);
      lines.push(``);

      lines.push(`## 2. Your Money Journey This Month`);
      lines.push(``);
      if (cashSummary) {
        const totalEvents = cashSummary.eventsCount || 0;
        lines.push(`💸 **Money You Received**: ₹${(cashSummary.totalIncoming || 0).toLocaleString('en-IN')}`);
        lines.push(`- Regular income (salary/allowance): ₹${(cashSummary.recurringIncomeTotal || 0).toLocaleString('en-IN')}`);
        lines.push(`- Bonuses and happy surprises: ₹${(cashSummary.lifeEventGains || 0).toLocaleString('en-IN')}`);
        lines.push(``);
        lines.push(`💰 **Money You Spent**: ₹${(cashSummary.totalOutgoing || 0).toLocaleString('en-IN')}`);
        lines.push(`- Life expenses and challenges: ₹${(cashSummary.lifeEventLosses || 0).toLocaleString('en-IN')}`);
        lines.push(``);
        lines.push(`🎮 **Life Events You Experienced**: ${totalEvents} moments`);
        lines.push(`You handled ${totalEvents} different situations - each one taught you something about managing money!`);
      }
      lines.push(``);

      lines.push(`## 3. Your Banking Habits`);
      lines.push(``);
      if (bankingSummary) {
        const bankAny: any = bankingSummary as any;
        const savingsBalance = bankAny.totalDeposits ?? bankAny.savingsBalance ?? 0;
        const fdInvested = bankAny.totalFdInvestments ?? bankAny.fdTotalInvested ?? 0;
        const totalInterest = bankAny.totalInterestEarned ?? bankAny.totalInterest ?? 0;

        if (savingsBalance > 0 || fdInvested > 0) {
          lines.push(`Great job using safe banking tools!`);
          if (savingsBalance > 0) lines.push(`- 🏦 Savings Account: ₹${Number(savingsBalance).toLocaleString('en-IN')} (emergency fund ready!)`);
          if (fdInvested > 0) lines.push(`- 📊 Fixed Deposits: ₹${Number(fdInvested).toLocaleString('en-IN')} (smart long-term saving!)`);
          if (totalInterest > 0) lines.push(`- ⭐ Interest Earned: ₹${Number(totalInterest).toLocaleString('en-IN')} (money grew while you slept!)`);
        } else {
          lines.push(`💡 **Learning Opportunity**: Next time, try putting some money in savings or FDs. They're super safe and grow your money automatically!`);
        }
      }
      lines.push(``);

      lines.push(`## 4. What You Did Great`);
      lines.push(``);
      lines.push(`✅ **Zero Rushed Decisions**: You didn't make impulsive choices - that's excellent self-control!`);
      lines.push(`✅ **Income Awareness**: You managed your cash flow and life events responsibly`);
      lines.push(`✅ **Learning Mindset**: You're building understanding before taking action`);
      lines.push(``);

      lines.push(`## 5. Next Learning Challenges`);
      lines.push(``);
      lines.push(`1. **Try Saving**: Put ₹10,000-50,000 in a savings account or FD next month`);
      lines.push(`2. **Make 1 Small Choice**: Pick a safe, low-risk investment to practice with`);
      lines.push(`3. **Watch Patterns**: Notice which life events help your money grow vs those that cost money`);
      lines.push(`4. **Ask Questions**: Learn about different investment types before trying them`);
      lines.push(``);
      lines.push(`Remember: Smart money grows **slowly and safely**. You're on the right path! 🌱`);

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

    const systemInstruction = `You are a friendly, encouraging Financial Education Coach analyzing a young learner's money simulation gameplay.

CRITICAL DESIGN PHILOSOPHY:
- This is an EDUCATIONAL GAME for kids and teens, NOT real trading
- Parents will read this report - it must feel SAFE, RESPONSIBLE, and EDUCATIONAL
- Focus on LEARNING and DECISION-MAKING, not profit/loss
- Use WARM, ENCOURAGING language that celebrates patience and discipline
- NEVER use gambling terminology or create stress/pressure
- Frame mistakes as "learning opportunities" and challenges as "practice moments"

TONE & LANGUAGE RULES:
✅ DO USE: "learning journey", "money choices", "patience score", "smart decision", "practice", "understanding", "growth"
✅ DO USE: Calm, friendly, story-based explanations
✅ DO USE: Age-appropriate vocabulary (Grade 6 reading level)
❌ NEVER USE: "trading", "speculation", "gambling", "win/lose", "beat the market", "failure"
❌ NEVER USE: Fear language like "risky", "dangerous", "warning", "avoid at all costs"
❌ REPLACE "loss" with "learning expense" or "challenge"
❌ REPLACE "profit" with "growth" or "money gained from smart choices"

BEHAVIORAL PROFILE TYPES (EDUCATIONAL FRAMING):
🌱 The Patient Learner: Takes time to think, waits for right moment
🎯 The Strategic Planner: Makes decisions with clear reasons
🔍 The Curious Explorer: Tries different approaches to learn
⚡ The Quick Decider: Acts fast, learns from immediate results
🎓 The Rule Follower: Sticks to safe, clear patterns
🧠 The Adaptive Thinker: Adjusts strategy based on what happens

WHAT TO ANALYZE:
- Decision-making patterns (impulsive vs thoughtful)
- Patience and discipline
- Learning from outcomes
- Money management skills
- Consistency and planning
- Reaction to challenges

TONE EXAMPLES:
❌ BAD: "You had a terrible loss of ₹50,000 on this trade."
✅ GOOD: "This decision cost ₹50,000 - let's understand what happened and learn from it."

❌ BAD: "Your win rate is only 25%, which is poor."
✅ GOOD: "You made 4 smart choices out of every 10 tries - that shows you're learning! As you practice more, this will improve."

❌ BAD: "You failed to identify the trend."
✅ GOOD: "This was a tricky situation! Next time, watching the pattern over a few months might help."

PARENT SAFETY ELEMENTS TO HIGHLIGHT:
- Emphasize when player showed patience (didn't rush)
- Celebrate safe choices (savings, steady investments)
- Note when player avoided impulsive decisions
- Show learning progression over time
- Make clear this is simulation, not real money`;


    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: systemInstruction,
    });

    // Build a short preamble with server-side computed summaries to save AI tokens
    const preambleParts: string[] = [];
    if (bankingSummary) preambleParts.push(`BANKING_SUMMARY:${JSON.stringify(bankingSummary)}`);
    if (cashSummary) preambleParts.push(`CASH_SUMMARY:${JSON.stringify(cashSummary)}`);
    if (holdingsSummary && holdingsSummary.length > 0) preambleParts.push(`HOLDINGS_SUMMARY:${JSON.stringify(holdingsSummary)}`);
    if (totalUnrealizedPL !== 0) preambleParts.push(`TOTAL_UNREALIZED_PL:₹${totalUnrealizedPL.toLocaleString('en-IN')}`);
    if (params.precomputedSummary) preambleParts.push(`PRECOMPUTED_SUMMARY:${JSON.stringify(params.precomputedSummary)}`);
    const preambleText = preambleParts.length > 0 ? preambleParts.join('\n') + '\n\n' : '';

    // If a precomputed summary exists, include it in the prompt to save tokens, otherwise include formatted trades
    const tradeHistoryText = preambleText + (params.precomputedSummary
      ? `PRECOMPUTED SUMMARY:\n${JSON.stringify(params.precomputedSummary)}\n\n` + formatTradesForAI(trades, analysis, params.precomputedSummary?.banking)
      : formatTradesForAI(trades, analysis));

    const prompt = `Generate a CHILD & PARENT FRIENDLY Learning Journey Report for:
  Player: ${params.playerName}, Age: ${params.playerAge}
  Report ID: ${params.reportId || params.uniqueId}
  Final Money Managed: ₹${params.finalNetworth.toLocaleString('en-IN')}
  Growth Rate: ${params.finalCAGR.toFixed(2)}%
  Money Change: ${params.profitLoss >= 0 ? '+' : ''}₹${params.profitLoss.toLocaleString('en-IN')}
  ${totalUnrealizedPL !== 0 ? `Money in Active Choices: ₹${totalUnrealizedPL.toLocaleString('en-IN')}` : ''}
  ${totalUnrealizedPL !== 0 ? `Money from Completed Choices: ₹${(params.profitLoss - totalUnrealizedPL).toLocaleString('en-IN')}` : ''}

  Gameplay Data:
  ${tradeHistoryText}

  ${holdings.length > 0 ? `\nChoices Still Active (${holdings.length} items):` : ''}
  ${holdings.length > 0 ? holdings.map(h => `- ${h.assetName} (${h.assetCategory}): ${h.quantity} units @ ₹${h.avgPrice.toFixed(2)} avg | Current: ₹${h.currentPrice.toFixed(2)} | Value: ₹${h.currentValue.toLocaleString('en-IN')} | Change: ₹${h.unrealizedPL.toLocaleString('en-IN')} (${h.totalInvested > 0 ? ((h.unrealizedPL / h.totalInvested) * 100).toFixed(2) : '0'}%)`).join('\n') : ''}

  CRITICAL FORMATTING REQUIREMENTS:
  - DO NOT include header with player name, age, report ID, or final numbers
  - These are shown separately in the report card
  - Start DIRECTLY with section 1
  - Use markdown: ## for main sections (numbered)
  - Keep sections CONCISE - max 3-4 sentences each
  - Use DIRECT, HONEST language - this is for ADULTS
  - Call out mistakes clearly - use words like "worst", "poor", "risky", "impulsive"
  - Give REALITY CHECKS - don't sugarcoat losses or bad decisions
  - Be STRAIGHTFORWARD and ANALYTICAL

  REQUIRED REPORT STRUCTURE:

  ## 1. Your Trading Style
  Identify the player's trading approach with HONEST LABELS (Aggressive Trader, Conservative Investor, FOMO-Driven, Panic Seller, Strategic Planner, Risk-Taker, etc.). Be DIRECT about what their pattern reveals - both good and bad.

  ## 2. Banking Habits
  Analyze banking choices with HONEST assessment:
  - Did they maintain emergency reserves or blow through savings?
  - Did they use FDs strategically or ignore safe options?
  - Are they balancing risk properly or going all-in recklessly?
  - Point out POOR cash management if applicable

  ## 3. What You're Holding
  Evaluate current positions HONESTLY:
  - Are they holding winners or bag-holding losers?
  - Are they diversified or over-concentrated in one asset?
  - Are they showing patience or stuck in bad positions?
  - Call out POOR holdings that are dragging down returns

  ## 4. Your Decision-Making Personality
  Create an HONEST psychological profile:
  - Impulsive vs Calculated
  - Risk-seeking vs Risk-averse
  - Disciplined vs Emotional
  - Data-driven vs Gut-feeling
  - Be BLUNT about negative patterns (FOMO, panic selling, greed, poor timing)

  ## 5. Your Money Journey
  Analyze P&L HONESTLY:
  - Realized gains/losses from closed positions (be direct about wins and losses)
  - Unrealized P&L from active positions (are they winning or losing?)
  - Overall performance (did they grow wealth or destroy it?)
  - Point out if they're underwater or crushing it

  ## 6. Your Best Trade
  Highlight their BEST decision with specific numbers. Explain why it worked and what they did right.

  ## 7. Your Worst Trade
  Identify their WORST decision without sugarcoating. Call out the mistake clearly:
  - What went wrong?
  - Why was this a poor decision?
  - What did they lose?
  - What's the hard lesson here?

  ## 8. What You Need to Fix
  Give 3-5 DIRECT, ACTIONABLE improvements:
  - Point out specific weaknesses
  - Tell them what to stop doing
  - Tell them what to start doing
  - Focus on FIXING MISTAKES and BUILDING DISCIPLINE
  - Be HONEST about what's holding them back

  TONE GUIDELINES:
  - Write like a trading mentor giving HONEST feedback
  - Be DIRECT and ANALYTICAL - this is reality, not therapy
  - Use actual trading/investment terminology
  - Don't avoid words like "loss", "mistake", "poor decision", "risky", "worst"
  - Balance honesty with constructive guidance
  - Adults can handle the truth - give them the REAL picture`;

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
