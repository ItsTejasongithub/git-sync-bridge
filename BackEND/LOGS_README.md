# Game Logs Access Guide

## ✅ Your logs ARE being saved!

Game logs are automatically saved to the SQLite database at:
```
BackEND/data/game.db
```

## 📊 How to View Logs

### Method 1: Using the Log Viewer Script (Recommended)

Run this command from the BackEND directory:
```bash
node viewLogs.js
```

This will display a beautiful formatted view of all game logs including:
- Player name, game mode, completion time
- Final networth, CAGR, profit/loss
- **Complete portfolio breakdown** with percentages
- Admin settings used for that game
- Game duration in minutes

### Method 2: Using the Database Inspector

Run this command from the BackEND directory:
```bash
node inspectDB.js
```

This shows:
- All database tables
- Admin accounts
- Admin settings
- Summary of player logs

### Method 3: Live Backend Console

When the backend server is running, completed games will automatically print detailed logs to the console, including the portfolio breakdown:

```
🎮 ═══════════════════════════════════════════════════════════════
   Player Game Logged: BOT (SOLO)
   Log ID: 2
   💰 Final Networth: ₹84,62,121
   📈 CAGR: 7.22%
   💵 Profit/Loss: +₹63,62,121

   📊 Portfolio Breakdown:
      • cash                 ₹14,00,004 (16.5%)
      • gold                 ₹27,33,283 (32.3%)
      • funds                ₹14,20,984 (16.8%)
      • stocks               ₹29,07,851 (34.4%)
═══════════════════════════════════════════════════════════════
```

## 🔐 Admin Panel - View Logs in Browser

1. Click the settings icon (⚙️) on the main menu
2. Login with admin credentials:
   - Username: `admin`
   - Password: `Tejas@6767`
3. The admin panel shows game settings (logs viewer UI coming soon)

## 📂 Database Structure

### Tables Created:
1. **admin_accounts** - Admin user accounts with hashed passwords
2. **admin_settings** - Global game configuration (single row)
3. **player_logs** - All completed game records

### Player Logs Fields:
- `id` - Unique log identifier
- `game_mode` - "solo" or "multiplayer"
- `player_name` - Player's name
- `room_id` - Multiplayer room ID (null for solo)
- `final_networth` - Final net worth in rupees
- `final_cagr` - Compound Annual Growth Rate percentage
- `profit_loss` - Total profit or loss
- `portfolio_breakdown` - JSON with complete asset breakdown
- `admin_settings` - JSON with game settings used
- `game_duration_minutes` - How long the game took
- `completed_at` - Timestamp of game completion

## 🛠️ Troubleshooting

### Logs not appearing?

1. Make sure the backend server is running
2. Check that the game actually completed (reached year 20)
3. Verify the database exists: `BackEND/data/game.db`
4. Run `node inspectDB.js` to check database content

### Need to clear all logs?

Delete the database file and restart the server:
```bash
# From BackEND directory
rm data/game.db
npm run dev
```

The database will be recreated with fresh tables.

## 📈 Sample Log Output

```
🎮 LOG #2 ─────────────────────────────────────────────────────────
   Player Name:      BOT
   Game Mode:        SOLO
   Completed At:     2026-01-05 07:19:27
   Duration:         14 minutes

   💰 Final Networth:  ₹84,62,121
   📈 CAGR:            7.22%
   💵 Profit/Loss:     +₹63,62,121

   📊 Portfolio Breakdown:
      • cash                 ₹14,00,004 (16.5%)
      • gold                 ₹27,33,283 (32.3%)
      • funds                ₹14,20,984 (16.8%)
      • stocks               ₹29,07,851 (34.4%)

   ⚙️  Game Settings:
      • Start Year:         2006
      • Initial Cash:       ₹1,00,000
      • Recurring Income:   ₹50,000
      • Asset Categories:   BANKING, GOLD, STOCKS, FUNDS, REIT, COMMODITIES
      • Quiz Enabled:       Yes
      • Hide Year:          No
```

## 🎯 What Gets Logged?

Every completed game automatically logs:
- ✅ Player identification (name, room ID for multiplayer)
- ✅ Final financial metrics (networth, CAGR, profit/loss)
- ✅ Complete portfolio breakdown by asset type
- ✅ All admin settings that were active during the game
- ✅ Game duration from start to completion
- ✅ Timestamp of when the game ended

## 🔄 Automatic Logging

Logging happens automatically when:
1. Player completes all 20 years of the game
2. Game end screen is displayed
3. Player has entered their name
4. Admin settings are loaded

No manual action required - just play the game!
