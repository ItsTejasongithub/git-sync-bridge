# Quick Start Guide - Build Your Dhan

## 🚀 Get Started in 30 Seconds

### 1. The game is already running!
Open your browser and go to: **http://localhost:5173/**

### 2. Click "SOLO MODE" to start playing

### 3. Game Controls

#### Savings Account (Available immediately)
- Click **Deposit** → Enter amount → Click MAX for all cash → Confirm
- Click **Withdraw** → Enter amount → Click MAX for all balance → Confirm

#### Fixed Deposits (Unlocks in Year 2)
- Click duration button (3 Mo, 1 Yr, 3 Yr)
- Enter amount → Click MAX
- Click **Create**
- Wait for maturity (green glow)
- Click **Collect** when matured
- Or click **Break** early (1% penalty)

#### Gold Trading (Unlocks in Year 3)
- Select quantity: Click 1, 10, or type custom amount
- Click **MAX** to buy maximum possible
- Click **BUY** to purchase
- Click **SELL** to sell holdings
- Watch the chart for price trends!

## 📱 UI Layout

```
┌─────────────┬──────────────────────────────────────┐
│             │                                      │
│  BUILD      │         GAME CONTENT                │
│  YOUR       │                                      │
│  DHAN       │  [Savings AC] [Fixed Deposit]       │
│             │                                      │
│  Quote      │  [Physical Gold] [Digital Gold]     │
│             │                                      │
│  Pocket     │  (More assets unlock each year)     │
│  Cash       │                                      │
│  ₹100,000   │                                      │
│             │                                      │
│  Leaderboard│                                      │
│             │                                      │
│  Year: 1/20 │                                      │
│  Month: 1   │                                      │
└─────────────┴──────────────────────────────────────┘
```

## ⏱️ Time System

- **3 seconds** = 1 month
- **36 seconds** = 1 year
- **12 minutes** = Complete 20-year game

The timer runs automatically! Watch your year/month counter.

## 🔓 Asset Unlock Timeline

| Year | Assets Available |
|------|-----------------|
| 1 | Savings Account |
| 2 | + Fixed Deposits |
| 3 | + Physical & Digital Gold |
| 4 | + Index Fund OR Mutual Fund |
| 5 | + Individual Stocks (2-5) |
| 6 | + Bitcoin & Ethereum |
| 7 | + Commodities (1) |
| 8 | + REITs (Embassy & Mindspace) |

## 💰 Starting Resources

- **Pocket Cash**: ₹1,00,000
- **Goal**: Maximize your wealth in 20 years!

## 🎯 Strategy Tips

1. **Don't hoard cash** - Invest it to grow
2. **Diversify** - Spread across different assets
3. **Watch the charts** - Buy low, sell high
4. **Use FDs wisely** - Lock in guaranteed returns
5. **Save some cash** - For opportunities when prices drop

## ⚠️ Important Notes

- Game resets if you refresh the page (no save yet)
- You can only have 3 FDs at once
- Breaking FDs early costs 1% penalty
- Prices are based on real historical data

## 🎮 Currently Implemented

✅ Savings Account
✅ Fixed Deposits
✅ Physical Gold
✅ Digital Gold

🔜 Coming Soon: Stocks, Crypto, Commodities, REITs

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Stop dev server
# Press Ctrl+C in the terminal
```

## 🆘 Need Help?

Check these files:
- `README.md` - Complete documentation
- `GAME_IMPLEMENTATION_SUMMARY.md` - Technical details
- Game has quote: "Rule No. 1 is never lose money..."

---

**Have fun building your Dhan!** 💸📈
