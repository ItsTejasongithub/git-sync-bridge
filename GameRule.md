# Bull Run Game - Official Game Rules

**Single Source of Truth for Game Logic (Solo & Multiplayer Modes)**

**Last Updated:** 2026-02-01
**Version:** 2.0

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Core Game Mechanics](#core-game-mechanics)
3. [Asset Unlock System](#asset-unlock-system)
4. [Quiz System](#quiz-system)
5. [Stock Progressive Unlock](#stock-progressive-unlock)
6. [Mode Differences (Solo vs Multiplayer)](#mode-differences-solo-vs-multiplayer)
7. [Technical Implementation](#technical-implementation)

---

## Game Overview

### Game Duration
- **Total Years:** 20 game years
- **Time Scale:** Each month represents a time period (configurable)
- **Starting Year:** Configurable (default: 2005)

### Game Objective
- Build wealth through strategic asset allocation
- Maximize net worth by game end (Year 20, Month 12)
- Learn about different financial instruments through gameplay

### Initial Resources
- **Pocket Cash:** ₹100,000 (configurable)
- **Recurring Income:** ₹50,000 every 6 months (configurable)

---

## Core Game Mechanics

### 1. Asset Categories
The game includes the following asset categories:

| Category | Description | Max Cards |
|----------|-------------|-----------|
| Banking | Savings Account + Fixed Deposits | 1 + 1 |
| Gold | Physical Gold + Digital Gold (ETF) | 1 + 1 |
| Commodities | Random commodity from pool | 1 |
| Stocks | Individual Indian stocks | 3 |
| Index Funds | Market index trackers | 2 |
| Mutual Funds | Actively managed funds | 2 |
| REITs | Real Estate Investment Trusts | 1 |
| Crypto | *(Disabled - Future Phase)* | 0 |
| Forex | *(Disabled - Future Phase)* | 0 |

### 2. Asset Data Source
- **PostgreSQL Database** (MANDATORY for both modes)
- Contains 554,210+ historical price records
- Covers period from 1995-2026
- Real market data for authentic gameplay

---

## Asset Unlock System

### CRITICAL RULE
**Both Solo and Multiplayer modes follow IDENTICAL unlock logic**

### Game Year Based Unlocks

| Year | Assets Unlocked | Trigger | Quiz |
|------|-----------------|---------|------|
| **Year 1, Month 1** | Savings Account + Fixed Deposit | Game start | Banking Quiz |
| **Year 2, Month 1** | Physical Gold | Game year progression | Gold Quiz |
| **Year 3, Month 1** | 1 Commodity (random) | Game year progression | Commodity Quiz |
| **Year 4, Month 1** | 2 Stocks (guaranteed at category unlock) | Game year progression | Stock Quiz |
| **Year 4+** | 1 Stock (progressive unlock based on data availability) | Data availability | None |

### Calendar Year Based Unlocks

| Calendar Year | Assets Unlocked | Max Cards | Quiz |
|---------------|-----------------|-----------|------|
| **≥ 2009** | Index Funds (when first fund data available) | 2 | Index Fund Quiz |
| **≥ 2017** | Mutual Funds (when first fund data available) | 2 | Mutual Fund Quiz |
| **≥ 2020** | REITs (EMBASSY or MINDSPACE) | 1 | REIT Quiz |
| **≥ 2012** | Digital Gold (ETF) | 1 | None (covered by Gold) |

### Unlock Trigger Logic

**Game Year Based:**
- Triggered at **Month 1** of the specified game year
- Independent of calendar year
- Examples: Banking (Y1M1), Gold (Y2M1), Commodity (Y3M1)

**Calendar Year Based:**
- Triggered when **calendar year** reaches specified year
- Uses: `calendarYear = gameStartYear + currentYear - 1`
- Asset must have data available in the database
- Examples: Index Funds (2009), Mutual Funds (2017), REITs (2020)

---

## Quiz System

### Quiz Trigger Rules

**When Quizzes Appear:**
- Quizzes appear when an asset category **unlocks for the first time**
- One quiz per category
- Quiz appears at the **exact moment** of unlock (Month 1 of unlock year/month)

**Quiz Categories:**

| Category | Unlock Trigger | Quiz Content |
|----------|----------------|--------------|
| Banking | Year 1, Month 1 | Savings + FD education |
| Physical Gold | Year 2, Month 1 | Gold investment basics |
| Commodity | Year 3, Month 1 | Commodity trading |
| Stocks | Year 4, Month 1 | Stock market basics |
| Index Funds | Calendar 2009 | Index fund education |
| Mutual Funds | Calendar 2017 | Mutual fund basics |
| REITs | Calendar 2020 | REIT investment |

### Quiz Behavior

**Solo Mode:**
1. Quiz appears → Game pauses automatically
2. Player answers questions
3. Quiz completes → Game unpauses automatically

**Multiplayer Mode:**
1. Quiz appears → Player notifies server
2. Game pauses for ALL players
3. ALL players must complete quiz
4. Last player finishes → Server unpauses game for everyone

**Quiz Content:**
- Educational information about the asset
- Multiple choice questions
- Hints after 3 wrong attempts
- Must answer correctly to proceed

**Admin Setting:**
- `enableQuiz: true/false` - Can disable quizzes entirely
- If disabled, shows notification instead of quiz (5 seconds auto-close)

---

## Stock Progressive Unlock

### Stock Selection Logic

**At Game Start:**
1. System selects **3 random stocks** from the stock pool:
   - **2 stocks** with data available at Year 4 or earlier (unlock at category unlock)
   - **1 stock** with data available after Year 4 (progressive unlock)
2. This ensures players always see **2 stocks immediately** at Year 4
3. The 3rd stock unlocks later when its data becomes available
4. Selection is **random every game** for variety

**Stock Unlock Timing:**

- **Year 4 unlock:** 2 stocks unlock when STOCKS category unlocks
- **Progressive unlock:** 1 stock unlocks when its data becomes available (after Year 4)

**Formula:**
```
Stock 1 & 2: Unlock at Year 4 (data available at Year 4 or earlier)
Stock 3: Unlock at MAX(4, stockFirstYear - gameStartYear + 1)
```

### Example Timelines

**Scenario 1: 2 Stocks at Year 4 + 1 Later**
Game Start Year = 2005
Selected Stocks: RELIANCE (1995), TCS (2002), INDIGO (2015)

| Game Time | Calendar Year | Event |
|-----------|---------------|-------|
| Year 4, Month 1 | 2008, Jan | RELIANCE + TCS unlock (2/3 stocks) |
| Year 11, Month 1 | 2015, Jan | INDIGO unlocks (3/3 stocks - data available) |
| After Year 11 | - | No more stocks unlock (max 3 reached) |

**Scenario 2: All 3 Stocks at Year 4**
Game Start Year = 2005
Selected Stocks: RELIANCE (1995), TCS (2002), INFY (1995)

| Game Time | Calendar Year | Event |
|-----------|---------------|-------|
| Year 4, Month 1 | 2008, Jan | RELIANCE + TCS unlock (2/3 stocks guaranteed) |
| Year 4, Month 1 | 2008, Jan | INFY unlocks (3/3 stocks - 3rd stock data also available at Year 4) |
| After Year 4 | - | No more stocks unlock (max 3 reached) |

**Scenario 3: 2 Stocks at Year 4 + 1 Much Later**
Game Start Year = 2000
Selected Stocks: RELIANCE (1995), TCS (2002), HONASA (2023)

| Game Time | Calendar Year | Event |
|-----------|---------------|-------|
| Year 4, Month 1 | 2003, Jan | RELIANCE + TCS unlock (2/3 stocks) |
| Year 24, Month 1 | 2023, Jan | HONASA unlocks (3/3 stocks - data available) |

> **Note:** In Scenario 3, the 3rd stock unlocks after Year 20, so game ends before all 3 stocks appear. This is intentional.

### Stock Display Rules

**CRITICAL:**
- Only show stocks that have **actual price data** for current month
- Filter by: `calendarYear >= stock.firstYear AND month >= stock.firstMonth`
- Never show stocks with ₹0.00 prices
- Total visible stocks: **Maximum 3 at any time**

### Data-Based Unlock Logic

1. **Stock Selection:**
   - 2 stocks from pool with data available at Year 4 or earlier
   - 1 stock from pool (preferably with data available after Year 4)
2. **Unlock Timing:** Based on `ASSET_TIMELINE_DATA[stock].firstYear`
3. **Category Unlock:** Year 4 (always shows 2 stocks minimum)
4. **Result:** Every playthrough has 2 stocks at Year 4, with 1 stock unlocking later

**Variety Examples:**
- Game 1: 2 old stocks at Year 4 + 1 old stock at Year 4 (all 3 at once)
- Game 2: 2 old stocks at Year 4 + 1 newer stock at Year 11 (progressive unlock)
- Game 3: 2 mid-range stocks at Year 4 + 1 very new stock at Year 18
- Game 4: 2 early stocks at Year 4 + 1 stock that unlocks after game ends (only 2 visible)

---

## Mode Differences (Solo vs Multiplayer)

### Shared Rules (Same in Both Modes)

✓ Asset unlock logic
✓ Quiz trigger timing
✓ Stock progressive unlock
✓ Price data source (PostgreSQL)
✓ Net worth calculation
✓ Trading mechanics
✓ Life events

### Solo Mode Specifics

| Feature | Behavior |
|---------|----------|
| **Quiz Pause** | Auto-pause on quiz, auto-unpause on completion |
| **Leaderboard** | Hidden (only net worth display) |
| **Price Source** | PostgreSQL database via API |
| **Game Control** | Player controls pause/resume |
| **Player Name** | Required for logging |

### Multiplayer Mode Specifics

| Feature | Behavior |
|---------|----------|
| **Quiz Pause** | Server controls pause for all players |
| **Quiz Wait** | Shows waiting overlay until all players finish |
| **Leaderboard** | Real-time leaderboard sidebar visible |
| **Price Source** | Encrypted price broadcast from server |
| **Price Security** | AES-256-GCM encryption, per-room keys |
| **Game Control** | Host controls pause/resume |
| **Sync** | Real-time networth sync every month |
| **Room** | Isolated game rooms with unique IDs |

### Technical Differences

**Solo Mode:**
```typescript
showLeaderboard = false
onQuizStarted = undefined (no server notification)
Price source: Direct PostgreSQL API calls
```

**Multiplayer Mode:**
```typescript
showLeaderboard = true
onQuizStarted = (category) => socket.emit('quizStarted', ...)
Price source: Encrypted server broadcasts via Socket.IO
```

---

## Technical Implementation

### Asset Unlock Check Functions

**`isAssetUnlocked(category)`**
- Returns: `true` if category should be visible
- Used for: Showing/hiding entire sections

**`isAssetUnlockingNow(category)`**
- Returns: `true` if category is unlocking THIS month
- Used for: Triggering quizzes

### Quiz Completion Flow

**Solo Mode:**
```
1. Asset unlocks → isAssetUnlockingNow() = true
2. Show quiz modal → Pause game
3. Player completes quiz → onMarkQuizCompleted()
4. Close modal → Unpause game
```

**Multiplayer Mode:**
```
1. Asset unlocks → isAssetUnlockingNow() = true
2. Show quiz modal → socket.emit('quizStarted')
3. Server pauses game for ALL players
4. Player completes quiz → socket.emit('quizFinished')
5. Server waits for all players
6. Last player finishes → Server unpauses for everyone
```

### Stock Unlock Schedule Generation

```typescript
// Select 3 random stocks from entire pool (any firstYear)
const allStocks = Object.entries(ASSET_TIMELINE_DATA)
  .filter(([_, data]) => data.category === 'STOCKS')
  .map(([name]) => name);

const selectedStocks = getRandomItems(allStocks, 3);

// Group stocks by when they become available
selectedStocks.forEach(stockName => {
  const stockData = ASSET_TIMELINE_DATA[stockName];

  // Calculate which game year this stock's data becomes available
  const stockCalendarYear = stockData.firstYear;
  const dataAvailableAtGameYear = stockCalendarYear - gameStartYear + 1;

  // Stock unlocks at the later of Year 4 or when data is available
  const unlockAtGameYear = Math.max(4, dataAvailableAtGameYear);

  // Add to schedule at the appropriate game year
  if (!schedule[unlockAtGameYear]) {
    schedule[unlockAtGameYear] = [];
  }
  schedule[unlockAtGameYear].push({
    category: 'STOCKS',
    assetNames: [stockName]
  });
});
```

### Price Data Validation

**MANDATORY Checks:**
1. PostgreSQL must be running (server won't start without it)
2. Asset data must exist in `asset_prices` table
3. Price must be available for current calendar year/month
4. Never show assets with null or ₹0.00 prices

---

## Consistency Verification Checklist

Use this checklist to verify both modes follow the same rules:

- [ ] Banking unlocks at Year 1, Month 1 in both modes
- [ ] Gold unlocks at Year 2, Month 1 in both modes
- [ ] Commodity unlocks at Year 3, Month 1 in both modes
- [ ] Stocks unlock at Year 4, Month 1 (2 stocks guaranteed) in both modes
- [ ] 3rd stock unlocks progressively (data-based) in both modes
- [ ] Index Funds unlock at Calendar 2009 in both modes
- [ ] Mutual Funds unlock at Calendar 2017 in both modes
- [ ] REITs unlock at Calendar 2020 in both modes
- [ ] Quiz triggers at exact unlock moment in both modes
- [ ] Only 3 stocks visible maximum in both modes
- [ ] PostgreSQL is mandatory in both modes

---

## Error Handling

### PostgreSQL Connection Failure

**Server Startup:**
```
❌ CRITICAL ERROR: PostgreSQL connection failed!
⚠️  PostgreSQL is REQUIRED for the game to function.
Server exits with code 1
```

**Game Start (Multiplayer):**
```
Error: "Database connection error. Please check the database or contact your administrator for assistance."
Game fails to start
```

### Quiz Issues

- If `adminSettings` not loaded → Quiz doesn't trigger (prevents race condition)
- If quiz disabled (`enableQuiz: false`) → Show notification instead (5s auto-close)
- If quiz already completed → Don't show again (tracked in `completedQuizzes[]`)

---

## Admin Configuration

### Admin Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `selectedCategories` | All | Which categories to enable |
| `gameStartYear` | 2005 | Starting calendar year |
| `hideCurrentYear` | false | Hide year display from players |
| `initialPocketCash` | 100000 | Starting cash |
| `recurringIncome` | 50000 | Income every 6 months |
| `enableQuiz` | true | Show quizzes on unlock |
| `eventsCount` | 3 | Number of life events |
| `monthDuration` | 5000 | Milliseconds per month |

### Admin Panel Access

**Default Credentials:**
- Username: `admin`
- Password: `Tejas@6767`

**Stored in:** SQLite database (`BackEND/data/game.db`)

---

## Database Schema

### PostgreSQL (Price Data)

**Tables:**
- `asset_prices` (554,210 rows) - Historical price data
- `asset_metadata` (113 rows) - Asset information
- `physical_gold_inr` (5,568 rows) - Gold prices in INR

**Connection:**
- Host: localhost
- Port: 5432
- Database: BullRun_GameDB_PGSQL
- User: postgres

### SQLite (Game Data)

**Tables:**
- `admin_accounts` - Admin credentials
- `admin_settings` - Global game settings
- `player_logs` - Game completion logs
- `trading_transactions` - Trade history
- `banking_transactions` - Banking history
- `cash_transactions` - Life events & income
- `player_holdings` - End-game portfolio
- `ai_reports` - AI-generated reports

---

## Future Phases

### Phase 2 (Planned)
- Enable Crypto category (BTC, ETH)
- Additional crypto assets

### Phase 3 (Planned)
- Enable Forex category
- Currency trading (USD/INR, EUR/INR, GBP/INR)

---

## Troubleshooting

### Quiz Not Appearing

**Check:**
1. `adminSettings.enableQuiz` is `true`
2. Asset is unlocking THIS month (check `isAssetUnlockingNow`)
3. Quiz not already completed (check `completedQuizzes[]`)
4. `adminSettings` loaded (not null)

### Stock Not Showing

**Check:**
1. Game is at Year 4 or later
2. Stock has data for current calendar year/month
3. Maximum 3 stocks selected
4. Stock appears in `selectedAssets.stocks[]`
5. Price data available (not ₹0.00)

### Database Connection Error

**Check:**
1. Docker container running: `docker ps`
2. Port 5432 accessible
3. Credentials correct in `.env`
4. Database restored: `cd backups && verify_database.bat`

---

**END OF GAME RULES**

---

## Change Log

### Version 2.2 (2026-02-01)
- ✅ Fixed Stock unlock logic to ensure 2 stocks unlock at category unlock:
  - 2 stocks with data available at Year 4 or earlier (guaranteed at category unlock)
  - 1 stock with data available after Year 4 (progressive unlock)
  - This ensures players always see at least 2 stocks when STOCKS category unlocks
  - Prevents scenario where only 1 stock appears at Year 4

### Version 2.1 (2026-02-01)
- ✅ Simplified Stock unlock logic to data-based system:
  - Select 3 random stocks from entire pool (any firstYear)
  - Each stock unlocks when its data becomes available (or Year 4, whichever is later)
  - Natural progressive unlock based on ASSET_TIMELINE_DATA
  - Removed hardcoded Year 6-8 random logic
  - Every game has unique unlock pattern based on random stock selection

### Version 2.0 (2026-02-01)
- ✅ Fixed Commodity quiz trigger (Year 3 instead of calendar year)
- ✅ Made PostgreSQL mandatory (no CSV fallback)
- ✅ Documented Solo vs Multiplayer differences
- ✅ Added comprehensive troubleshooting guide
- ✅ Created single source of truth for both modes

### Version 1.0 (Initial)
- Initial game rules documentation
- Basic asset unlock system
- Quiz system foundation
