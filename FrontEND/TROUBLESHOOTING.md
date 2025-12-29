# Troubleshooting Guide

## ✅ Fixed Issues

### TypeScript Errors (RESOLVED)
**Problem**: `Cannot read properties of undefined (reading 'threeMonth')`

**Solution**: Added proper null checks and default values in `csvLoader.ts`:
- Added fallback default FD rates (6.9%, 7.0%, 7.5%)
- Added empty array checks before processing data
- Browser should auto-reload with fixes

---

## Common Issues & Solutions

### 1. CSV Files Not Loading

**Symptoms**: Gold prices showing as ₹0.00, FD rates not displaying

**Solutions**:
1. Check browser console (F12) for 404 errors
2. Verify CSV files exist in `public/data/` folders
3. Make sure dev server is running (`npm run dev`)
4. Clear browser cache (Ctrl+Shift+R)

**File Paths Should Be**:
- `public/data/Fd_Rate/fd_rates.csv`
- `public/data/Gold_Investments/Physical_Gold.csv`
- `public/data/Gold_Investments/Digital_Gold.csv`

### 2. Dev Server Not Starting

**Symptoms**: `npm run dev` fails

**Solutions**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try running again
npm run dev
```

### 3. Page is Blank

**Symptoms**: White screen, no content

**Solutions**:
1. Open browser console (F12) and check for errors
2. Verify you're on http://localhost:5173/
3. Check if dev server is running
4. Try hard refresh (Ctrl+Shift+R)

### 4. Game Timer Not Starting

**Symptoms**: Year/Month stuck at Year 1, Month 1

**Solutions**:
1. Make sure you clicked "SOLO MODE"
2. Check browser console for JavaScript errors
3. Verify `useGameState` hook is working

### 5. Transactions Not Working

**Symptoms**: Clicking Deposit/Withdraw/Buy/Sell does nothing

**Solutions**:
1. Check if you have sufficient funds
2. Verify input amount is valid (positive number)
3. Check browser console for validation errors
4. Make sure you're clicking "Confirm" after entering amount

### 6. FD Not Showing Rates

**Symptoms**: FD card shows 0% or NaN

**Solutions**:
1. Verify `fd_rates.csv` is in correct location
2. Check CSV file format matches expected structure
3. Should auto-use default rates (6.9%, 7%, 7.5%) if file not loaded

### 7. Charts Not Displaying

**Symptoms**: Gray boxes where charts should be

**Solutions**:
1. Verify Recharts is installed: `npm list recharts`
2. If missing: `npm install recharts`
3. Check if asset data is loading (console.log)
4. Verify CSV files have correct format

---

## Debugging Tips

### Open Browser Console
**Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
**Firefox**: Press `F12` or `Ctrl+Shift+K`

### Check Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Reload page (Ctrl+R)
4. Look for failed requests (red items)

### View Console Logs
All errors appear in the Console tab. Look for:
- Red error messages
- Failed fetch requests
- TypeScript type errors

### Common Error Messages

**"Failed to fetch"**
- CSV file doesn't exist at specified path
- Dev server not running
- Wrong file path in code

**"Cannot read properties of undefined"**
- Data not loaded yet (async issue)
- Null/undefined checks needed
- Fixed in latest update

**"Unexpected token"**
- CSV file has wrong format
- Parsing error in csvLoader.ts

---

## Verification Checklist

✅ Node.js installed (v16+)
✅ Dependencies installed (`npm install`)
✅ Dev server running (`npm run dev`)
✅ Browser open to http://localhost:5173/
✅ CSV files in `public/data/` folders
✅ No red errors in browser console

---

## Fresh Start (Nuclear Option)

If all else fails, start fresh:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Delete dependencies
rm -rf node_modules package-lock.json

# 3. Reinstall
npm install

# 4. Clear Vite cache
rm -rf node_modules/.vite

# 5. Restart dev server
npm run dev

# 6. Hard reload browser
# Chrome: Ctrl+Shift+R
# Clear cache: Ctrl+Shift+Delete
```

---

## Getting Help

### Check These Files First
1. Browser Console (F12) - Look for errors
2. Terminal - Check dev server output
3. `src/utils/csvLoader.ts` - Data loading logic
4. `src/hooks/useGameState.ts` - Game state logic

### What to Include When Asking for Help
1. Screenshot of error
2. Browser console output
3. Terminal output
4. Steps to reproduce the issue

---

## Performance Issues

### Game Running Slow?
1. Close unnecessary browser tabs
2. Disable browser extensions
3. Check CPU usage (Task Manager)
4. Reduce number of active FDs

### Price Updates Lagging?
- Normal behavior - prices update monthly (every 3 seconds)
- Not a bug, it's the game design!

---

## Known Limitations (Not Bugs)

✅ Game resets on page refresh (no save yet)
✅ Only Years 1-3 assets implemented
✅ Leaderboard not functional (placeholder)
✅ Multi-mode disabled
✅ No pause button yet

These are planned features, not bugs!

---

**If you're still stuck, check the browser console for specific error messages!**
