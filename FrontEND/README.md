# Build Your Dhan - Investment Game

A 20-year financial investment simulation game where you learn to build wealth through smart investment decisions.

## Game Overview

- **Duration**: 20 years (1 month = 3 seconds in real-time)
- **Starting Cash**: ₹1,00,000
- **Goal**: Build maximum wealth through strategic investments

## Game Rules

### Year-by-Year Asset Unlocks

1. **Year 1**: Savings Account (2.5% PA interest)
2. **Year 2**: Fixed Deposits (3-month, 1-year, 3-year options)
3. **Year 3**: Physical Gold & Digital Gold
4. **Year 4**: Index Funds OR Mutual Funds (choose one)
5. **Year 5**: Individual Stocks (select 2-5 stocks)
6. **Year 6**: Cryptocurrency (BTC & ETH)
7. **Year 7**: Commodities (choose one)
8. **Year 8**: REITs (Embassy & Mindspace)

### Investment Options

#### Savings Account
- Deposit/withdraw anytime
- Earns 2.5% annual interest
- Safe but low returns

#### Fixed Deposits
- Max 3 FDs at a time
- Durations: 3 months, 1 year, 3 years
- Breaking FD early incurs 1% penalty
- Interest rates based on real historical data

#### Tradeable Assets
- Buy/Sell at market prices
- Prices update based on real historical CSV data
- Track holdings and average purchase price
- View price charts and trends

## How to Play

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Game Features

- **Real-time Market Data**: Asset prices based on actual historical data
- **Interactive Charts**: Visual price trends for all tradeable assets
- **Portfolio Tracking**: Monitor your holdings and profits
- **Smart Validation**: Prevents invalid transactions
- **Auto-Interest**: Savings account grows automatically
- **FD Maturity Tracking**: Get notified when FDs mature

## UI Controls

### Savings Account
1. Click "Deposit" or "Withdraw"
2. Enter amount or click "MAX"
3. Confirm transaction

### Fixed Deposits
1. Select duration (3Mo, 1Yr, 3Yr)
2. Enter amount
3. Create FD
4. Collect when matured or break early with penalty

### Trading Assets
1. Select quantity (1, 10, Custom, or MAX)
2. Click BUY to purchase
3. Click SELL to liquidate holdings
4. Monitor price charts and trends

## Game Modes

- **Solo Mode**: Play alone, build your wealth
- **Multi Mode**: Coming Soon!

## Tips for Success

1. Diversify your investments across asset classes
2. Monitor price trends before buying/selling
3. Use FDs for guaranteed returns
4. Don't keep too much in pocket cash - let it work for you
5. Remember: "Rule No. 1 is never lose money. Rule No. 2 is never forget Rule No. 1."

## Technical Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **Data**: Real historical market data from CSV files
- **Styling**: CSS with Indian flag theme

## Project Structure

```
GameDesgin/
├── public/
│   └── data/              # Historical market data CSV files
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── package.json
└── vite.config.ts
```

## Credits

Inspired by BuildYourStax and designed to teach financial literacy through gamification.

---

**Build Your Dhan** - Learn to invest, one month at a time! 🚀
# Beautiful_FrontEnd_BuildYourDhan
