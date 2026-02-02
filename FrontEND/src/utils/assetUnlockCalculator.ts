import { AssetCategory, AssetUnlockSchedule, UnlockEntry } from '../types';
import {
  CATEGORY_MAX_CARDS,
  CALENDAR_YEAR_TRIGGERS,
  VALID_START_YEAR_MIN,
  VALID_START_YEAR_MAX
} from './constants';

// Asset timeline data from PostgreSQL - Last updated 2026-01-18
export const ASSET_TIMELINE_DATA: { [key: string]: { category: AssetCategory; firstYear: number; firstMonth: number; lastYear: number } } = {
  // Commodities
  'ALUMINIUM': { category: 'COMMODITIES', firstYear: 2014, firstMonth: 5, lastYear: 2026 },
  'BRENT': { category: 'COMMODITIES', firstYear: 2007, firstMonth: 7, lastYear: 2026 },
  'COPPER': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2026 },
  'COTTON': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 1, lastYear: 2026 },
  'CRUDEOIL_WTI': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2026 },
  'NATURALGAS': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2026 },
  'SILVER': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2026 },
  'WHEAT': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 7, lastYear: 2026 },

  // Crypto Assets
  'BTC': { category: 'CRYPTO', firstYear: 2014, firstMonth: 9, lastYear: 2026 },
  'ETH': { category: 'CRYPTO', firstYear: 2017, firstMonth: 11, lastYear: 2026 },

  // Forex (not previously included)
  'EURINR': { category: 'FOREX', firstYear: 2003, firstMonth: 11, lastYear: 2026 },
  'GBPINR': { category: 'FOREX', firstYear: 2006, firstMonth: 5, lastYear: 2026 },
  'USDINR': { category: 'FOREX', firstYear: 2003, firstMonth: 11, lastYear: 2026 },

  // Gold Investments
  'Digital_Gold': { category: 'GOLD', firstYear: 2009, firstMonth: 1, lastYear: 2026 },
  'Physical_Gold': { category: 'GOLD', firstYear: 2000, firstMonth: 8, lastYear: 2026 },

  // Index Funds
  'HDFCNIFETF': { category: 'FUNDS', firstYear: 2015, firstMonth: 12, lastYear: 2026 },
  'ICICIB22': { category: 'FUNDS', firstYear: 2019, firstMonth: 12, lastYear: 2026 },
  'NIFTYBEES': { category: 'FUNDS', firstYear: 2009, firstMonth: 1, lastYear: 2026 },
  'SETFNIF50': { category: 'FUNDS', firstYear: 2015, firstMonth: 7, lastYear: 2026 },
  'UTINIFTETF': { category: 'FUNDS', firstYear: 2015, firstMonth: 9, lastYear: 2026 },

  // Indian Stocks
  '5PAISA': { category: 'STOCKS', firstYear: 2017, firstMonth: 11, lastYear: 2026 },
  'ADANIENT': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'ADANIPORTS': { category: 'STOCKS', firstYear: 2007, firstMonth: 11, lastYear: 2026 },
  'ADANIPOWER': { category: 'STOCKS', firstYear: 2009, firstMonth: 8, lastYear: 2026 },
  'APOLLOHOSP': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'ASHOKLEY': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'ASIANPAINT': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'AXISBANK': { category: 'STOCKS', firstYear: 1998, firstMonth: 11, lastYear: 2026 },
  'BAJAJ-AUTO': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'BAJAJFINSV': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'BAJFINANCE': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'BCG': { category: 'STOCKS', firstYear: 2015, firstMonth: 5, lastYear: 2026 },
  'BEL': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'BHARTIARTL': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'CESC': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'DISHTV': { category: 'STOCKS', firstYear: 2007, firstMonth: 4, lastYear: 2026 },
  'GAIL': { category: 'STOCKS', firstYear: 1997, firstMonth: 4, lastYear: 2026 },
  'GRASIM': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'GVKPIL': { category: 'STOCKS', firstYear: 2006, firstMonth: 2, lastYear: 2026 },
  'HCC': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'HCLTECH': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'HDFCBANK': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'HEROMOTOCO': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'HFCL': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'HINDALCO': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'HINDCOPPER': { category: 'STOCKS', firstYear: 2010, firstMonth: 1, lastYear: 2026 },
  'HINDUNILVR': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'IBREALEST': { category: 'STOCKS', firstYear: 2004, firstMonth: 9, lastYear: 2026 },
  'ICICIBANK': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'IDEA': { category: 'STOCKS', firstYear: 2007, firstMonth: 3, lastYear: 2026 },
  'INDIGO': { category: 'STOCKS', firstYear: 2015, firstMonth: 11, lastYear: 2026 },
  'INDOSTAR': { category: 'STOCKS', firstYear: 2018, firstMonth: 5, lastYear: 2026 },
  'INDUSINDBK': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'INFY': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'IRB': { category: 'STOCKS', firstYear: 2008, firstMonth: 2, lastYear: 2026 },
  'ITC': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'ITI': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'JPPOWER': { category: 'STOCKS', firstYear: 2005, firstMonth: 4, lastYear: 2026 },
  'JSL': { category: 'STOCKS', firstYear: 2003, firstMonth: 11, lastYear: 2026 },
  'JSWSTEEL': { category: 'STOCKS', firstYear: 2003, firstMonth: 5, lastYear: 2026 },
  'KOTAKBANK': { category: 'STOCKS', firstYear: 2001, firstMonth: 7, lastYear: 2026 },
  'KSOLVES': { category: 'STOCKS', firstYear: 2020, firstMonth: 8, lastYear: 2026 },
  'LT': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'MANAPPURAM': { category: 'STOCKS', firstYear: 2010, firstMonth: 6, lastYear: 2026 },
  'MARUTI': { category: 'STOCKS', firstYear: 2003, firstMonth: 7, lastYear: 2026 },
  'M&M': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'NACLIND': { category: 'STOCKS', firstYear: 2017, firstMonth: 4, lastYear: 2026 },
  'NESTLEIND': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'NIPPOBATRY': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'NTPC': { category: 'STOCKS', firstYear: 2004, firstMonth: 11, lastYear: 2026 },
  'ONGC': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'PNBHOUSING': { category: 'STOCKS', firstYear: 2016, firstMonth: 11, lastYear: 2026 },
  'POWERGRID': { category: 'STOCKS', firstYear: 2007, firstMonth: 10, lastYear: 2026 },
  'QUICKHEAL': { category: 'STOCKS', firstYear: 2016, firstMonth: 2, lastYear: 2026 },
  'RELIANCE': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'RPOWER': { category: 'STOCKS', firstYear: 2008, firstMonth: 2, lastYear: 2026 },
  'RTNINDIA': { category: 'STOCKS', firstYear: 2012, firstMonth: 7, lastYear: 2026 },
  'RTNPOWER': { category: 'STOCKS', firstYear: 2009, firstMonth: 10, lastYear: 2026 },
  'SAKSOFT': { category: 'STOCKS', firstYear: 2005, firstMonth: 5, lastYear: 2026 },
  'SANGINITA': { category: 'STOCKS', firstYear: 2017, firstMonth: 3, lastYear: 2026 },
  'SBILIFE': { category: 'STOCKS', firstYear: 2017, firstMonth: 10, lastYear: 2026 },
  'SBIN': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'SHRIRAMFIN': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'SPCENET': { category: 'STOCKS', firstYear: 2013, firstMonth: 11, lastYear: 2026 },
  'SUBEXLTD': { category: 'STOCKS', firstYear: 2003, firstMonth: 9, lastYear: 2026 },
  'SUNPHARMA': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'SUZLON': { category: 'STOCKS', firstYear: 2005, firstMonth: 10, lastYear: 2026 },
  'TATACONSUM': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'TATASTEEL': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'TCS': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'TECHM': { category: 'STOCKS', firstYear: 2006, firstMonth: 8, lastYear: 2026 },
  'TITAN': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'TRENT': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'TRIDENT': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'UCOBANK': { category: 'STOCKS', firstYear: 2003, firstMonth: 10, lastYear: 2026 },
  'UJJIVANSFB': { category: 'STOCKS', firstYear: 2019, firstMonth: 12, lastYear: 2026 },
  'ULTRACEMCO': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'VAKRANGEE': { category: 'STOCKS', firstYear: 2006, firstMonth: 4, lastYear: 2026 },
  'VERTOZ': { category: 'STOCKS', firstYear: 2017, firstMonth: 11, lastYear: 2026 },
  'VINNY': { category: 'STOCKS', firstYear: 2018, firstMonth: 10, lastYear: 2026 },
  'WEBELSOLAR': { category: 'STOCKS', firstYear: 2007, firstMonth: 5, lastYear: 2026 },
  'WEIZMANIND': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2026 },
  'WIPRO': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'YESBANK': { category: 'STOCKS', firstYear: 2005, firstMonth: 7, lastYear: 2026 },
  'ZEEL': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },

  // Mutual Funds
  'Axis_Midcap': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },
  'HDFC_SmallCap': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2026 },
  'ICICI_Bluechip': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },
  'Kotak_Emerging': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },
  'PGIM_Midcap': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },
  'SBI_Bluechip': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },

  // REITs
  'EMBASSY': { category: 'REIT', firstYear: 2019, firstMonth: 4, lastYear: 2026 },
  'MINDSPACE': { category: 'REIT', firstYear: 2020, firstMonth: 8, lastYear: 2026 },
};

/**
 * Calculate the latest year among selected categories
 */
export const getLatestAssetYear = (categories: AssetCategory[]): number => {
  let latestYear = 2000;

  Object.entries(ASSET_TIMELINE_DATA).forEach(([_, data]) => {
    if (categories.includes(data.category)) {
      latestYear = Math.max(latestYear, data.firstYear);
    }
  });

  return latestYear;
};

/**
 * Calculate game start year based on selected categories
 * NEW: Returns the user-selected year, constrained to 2000-2005
 * @deprecated Use VALID_START_YEAR_MIN and VALID_START_YEAR_MAX directly
 */
export const calculateGameStartYear = (_categories: AssetCategory[]): number => {
  // New system: start year is user-selectable between 2000-2005
  // Default to 2000 (earliest valid year)
  return VALID_START_YEAR_MIN;
};

/**
 * Validate and constrain game start year to valid range (2000-2005)
 */
export const validateGameStartYear = (year: number): number => {
  return Math.max(VALID_START_YEAR_MIN, Math.min(VALID_START_YEAR_MAX, year));
};

/**
 * Get available assets for a category sorted by first year
 */
export const getAssetsForCategory = (category: AssetCategory): string[] => {
  return Object.entries(ASSET_TIMELINE_DATA)
    .filter(([_, data]) => data.category === category)
    .sort((a, b) => a[1].firstYear - b[1].firstYear)
    .map(([name]) => name);
};

/**
 * Generate asset unlock schedule based on HARD-CODED rules (Single Source of Truth)
 * Admin settings CANNOT override this logic.
 *
 * GAME YEAR BASED UNLOCKS:
 * - Year 1: Savings (1 card) + FD (1 card) - always enabled at start
 * - Year 2: Physical Gold (1 card)
 * - Year 3: Commodity (1 random card from pool)
 * - Year 4: Stocks (2 cards guaranteed at category unlock)
 *   - 2 stocks selected with data available at Year 4 or earlier
 * - Year 4+: Additional Stock (1 card - progressive unlock based on data availability)
 *   - 1 stock selected (preferably with data available after Year 4)
 *   - Example: 2 stocks unlock at Year 4, 3rd stock with firstYear=2015 unlocks at Year 11
 *
 * CALENDAR YEAR BASED UNLOCKS:
 * - Calendar >= 2009: Index Fund (NIFTYBEES - 1 fixed card)
 * - Calendar >= 2012: Gold ETF / Digital Gold (1 card)
 * - Calendar >= 2015: Index Fund (+1 random card from SETFNIF50, UTINIFTETF, HDFCNIFETF)
 * - Calendar >= 2017: Mutual Funds (2 cards)
 * - Calendar >= 2020: REITs (1 card)
 *
 * DISABLED CATEGORIES (always 0 cards): CRYPTO, FOREX
 *
 * RULE: No new asset category should unlock in the last 3 game years (Years 18-20)
 */
export const generateAssetUnlockSchedule = (
  _categories: AssetCategory[], // Ignored - using hard-coded categories
  gameStartYear: number
): AssetUnlockSchedule => {
  const schedule: AssetUnlockSchedule = {};
  const TOTAL_GAME_YEARS = 20;
  // RULE: No new assets in final 3 years (years 18-20)
  const MAX_UNLOCK_YEAR = TOTAL_GAME_YEARS - 3; // Year 17 is the last year for new unlocks

  // Calculate required start year to ensure REITs can unlock before year 17
  // REIT triggers at 2020, needs to unlock by year 17
  // So start year = 2020 - 17 + 1 = 2004
  const requiredStartYear = CALENDAR_YEAR_TRIGGERS.REITS - MAX_UNLOCK_YEAR + 1;

  // Validate game start year (must be at least requiredStartYear to allow all unlocks)
  const validStartYear = Math.max(
    requiredStartYear,
    Math.min(VALID_START_YEAR_MAX, gameStartYear),
    VALID_START_YEAR_MIN
  );

  // ===== GAME YEAR 1: Savings + FD (always enabled at start) =====
  schedule[1] = [
    {
      category: 'BANKING',
      assetType: 'SAVINGS_AC',
      calendarYear: validStartYear,
      maxCards: CATEGORY_MAX_CARDS.SAVINGS
    },
    {
      category: 'BANKING',
      assetType: 'FD',
      calendarYear: validStartYear,
      maxCards: CATEGORY_MAX_CARDS.FD
    }
  ];

  // ===== GAME YEAR 2: Physical Gold (1 card) =====
  const calendarYear2 = validStartYear + 1;
  schedule[2] = [{
    category: 'GOLD',
    assetType: 'Physical_Gold',
    calendarYear: calendarYear2,
    maxCards: CATEGORY_MAX_CARDS.PHYSICAL_GOLD
  }];

  // ===== GAME YEAR 3: Commodity (1 random card) =====
  const calendarYear3 = validStartYear + 2;
  const availableCommodities = Object.entries(ASSET_TIMELINE_DATA)
    .filter(([name, data]) =>
      data.category === 'COMMODITIES' &&
      calendarYear3 >= data.firstYear &&
      ['COTTON', 'WHEAT', 'CRUDEOIL_WTI', 'SILVER', 'NATURALGAS'].includes(name)
    )
    .map(([name]) => name);

  if (availableCommodities.length > 0) {
    const selectedCommodity = availableCommodities[Math.floor(Math.random() * availableCommodities.length)];
    schedule[3] = [{
      category: 'COMMODITIES',
      assetType: selectedCommodity,
      calendarYear: calendarYear3,
      maxCards: CATEGORY_MAX_CARDS.COMMODITIES
    }];
  }

  // ===== STOCKS: 2 stocks at category unlock + 1 progressive unlock =====
  // RULE: 2 stocks unlock at Year 4 (category unlock), 1 stock unlocks progressively (data-based)
  const allStocks = Object.entries(ASSET_TIMELINE_DATA)
    .filter(([_, data]) => data.category === 'STOCKS')
    .map(([name, data]) => ({ name, data }));

  if (allStocks.length >= 3) {
    const calendarYear4 = validStartYear + 3; // Year 4 calendar year

    // Split stocks into two groups:
    // 1. Stocks with data available at Year 4 or earlier
    // 2. Stocks with data available after Year 4
    const stocksAvailableAtYear4 = allStocks.filter(({ data }) => data.firstYear <= calendarYear4);
    const stocksAvailableLater = allStocks.filter(({ data }) => data.firstYear > calendarYear4);

    let selectedStocks: string[] = [];

    // Select 2 stocks that will unlock at Year 4
    if (stocksAvailableAtYear4.length >= 2) {
      const twoEarlyStocks = getRandomItems(stocksAvailableAtYear4, 2).map(s => s.name);
      selectedStocks = [...twoEarlyStocks];
    } else {
      // Fallback: if not enough early stocks, select from all stocks
      selectedStocks = getRandomItems(allStocks, 2).map(s => s.name);
    }

    // Select 1 stock for progressive unlock (prefer later stocks, fallback to any)
    const remainingStocks = allStocks.filter(s => !selectedStocks.includes(s.name));
    let progressiveStock: string | null = null;

    if (stocksAvailableLater.length > 0) {
      // Prefer a stock that unlocks later
      const laterStocksNotSelected = stocksAvailableLater.filter(s => !selectedStocks.includes(s.name));
      if (laterStocksNotSelected.length > 0) {
        progressiveStock = getRandomItems(laterStocksNotSelected, 1)[0].name;
      }
    }

    // Fallback: if no later stock available, select any remaining stock
    if (!progressiveStock && remainingStocks.length > 0) {
      progressiveStock = getRandomItems(remainingStocks, 1)[0].name;
    }

    if (progressiveStock) {
      selectedStocks.push(progressiveStock);
    }

    // Group stocks by when they unlock
    const stockUnlockMap: { [gameYear: number]: string[] } = {};

    selectedStocks.forEach(stockName => {
      const stockData = ASSET_TIMELINE_DATA[stockName];
      if (!stockData) return;

      // Calculate which game year this stock's data becomes available
      const stockCalendarYear = stockData.firstYear;

      // Stock unlocks at the later of:
      // 1. Year 4 (when stocks category unlocks)
      // 2. The game year when its data becomes available
      const dataAvailableAtGameYear = stockCalendarYear - validStartYear + 1;
      const unlockAtGameYear = Math.max(4, dataAvailableAtGameYear);

      // Only unlock if within valid game years (1-20) and before final 3 years
      if (unlockAtGameYear >= 1 && unlockAtGameYear <= TOTAL_GAME_YEARS && unlockAtGameYear <= MAX_UNLOCK_YEAR) {
        if (!stockUnlockMap[unlockAtGameYear]) {
          stockUnlockMap[unlockAtGameYear] = [];
        }
        stockUnlockMap[unlockAtGameYear].push(stockName);
      }
    });

    // Add stocks to schedule based on their unlock timing
    Object.entries(stockUnlockMap).forEach(([gameYearStr, stocks]) => {
      const gameYear = parseInt(gameYearStr);
      const calendarYear = validStartYear + gameYear - 1;

      if (!schedule[gameYear]) {
        schedule[gameYear] = [];
      }

      schedule[gameYear].push({
        category: 'STOCKS',
        assetType: 'STOCKS',
        assetNames: stocks,
        calendarYear: calendarYear,
        maxCards: stocks.length
      });
    });
  }

  // ===== SELECT REIT ONCE (before calendar year loop) =====
  // Randomly select EMBASSY (2019) or MINDSPACE (2020)
  const availableReits = ['EMBASSY', 'MINDSPACE'];
  const selectedReit = availableReits[Math.floor(Math.random() * availableReits.length)];
  const selectedReitData = ASSET_TIMELINE_DATA[selectedReit];

  // ===== CALENDAR YEAR BASED UNLOCKS =====
  for (let gameYear = 1; gameYear <= TOTAL_GAME_YEARS; gameYear++) {
    const calendarYear = validStartYear + gameYear - 1;
    const calendarUnlocks: UnlockEntry[] = [];

    // Skip calendar-based unlocks if we're in the final 3 years
    if (gameYear > MAX_UNLOCK_YEAR) {
      continue;
    }

    // Index Fund - PROGRESSIVE UNLOCK
    // 2009: NIFTYBEES (1 fixed card) - only one available in 2009
    if (calendarYear === CALENDAR_YEAR_TRIGGERS.INDEX_FUND) {
      calendarUnlocks.push({
        category: 'FUNDS',
        assetType: 'INDEX_FUND',
        assetNames: ['NIFTYBEES'], // Fixed - only NIFTYBEES available in 2009
        calendarYear,
        maxCards: 1 // First card only
      });
    }

    // 2015: +1 random index fund from newly available options
    if (calendarYear === CALENDAR_YEAR_TRIGGERS.INDEX_FUND_2) {
      // Select 1 random from SETFNIF50, UTINIFTETF, HDFCNIFETF (all available from 2015)
      const availableIndexFunds = Object.entries(ASSET_TIMELINE_DATA)
        .filter(([name, data]) =>
          data.category === 'FUNDS' &&
          calendarYear >= data.firstYear &&
          ['SETFNIF50', 'UTINIFTETF', 'HDFCNIFETF'].includes(name) // Exclude NIFTYBEES (already unlocked)
        )
        .map(([name]) => name);

      if (availableIndexFunds.length > 0) {
        const selectedFund = getRandomItems(availableIndexFunds, 1);
        calendarUnlocks.push({
          category: 'FUNDS',
          assetType: 'INDEX_FUND',
          assetNames: selectedFund,
          calendarYear,
          maxCards: 1 // Second card (progressive unlock)
        });
      }
    }

    // Gold ETF / Digital Gold (1 card when Calendar >= 2012)
    if (calendarYear === CALENDAR_YEAR_TRIGGERS.DIGITAL_GOLD) {
      calendarUnlocks.push({
        category: 'GOLD',
        assetType: 'Digital_Gold',
        calendarYear,
        maxCards: CATEGORY_MAX_CARDS.DIGITAL_GOLD
      });
    }

    // Mutual Funds (2 cards when Calendar >= 2017)
    if (calendarYear === CALENDAR_YEAR_TRIGGERS.MUTUAL_FUND) {
      const availableMutualFunds = Object.entries(ASSET_TIMELINE_DATA)
        .filter(([name, data]) =>
          data.category === 'FUNDS' &&
          data.firstYear <= 2017 &&
          ['SBI_Bluechip', 'ICICI_Bluechip', 'Axis_Midcap', 'Kotak_Emerging', 'PGIM_Midcap', 'HDFC_SmallCap'].includes(name)
        )
        .map(([name]) => name);

      if (availableMutualFunds.length > 0) {
        const selectedMFs = getRandomItems(availableMutualFunds, Math.min(2, availableMutualFunds.length));
        calendarUnlocks.push({
          category: 'FUNDS',
          assetType: 'MUTUAL_FUND',
          assetNames: selectedMFs,
          calendarYear,
          maxCards: CATEGORY_MAX_CARDS.MUTUAL_FUND // 2 cards
        });
      }
    }

    // REITs (1 card when the selected REIT's data becomes available)
    // Use pre-selected REIT: EMBASSY (2019) or MINDSPACE (2020)
    if (selectedReitData && calendarYear === selectedReitData.firstYear) {
      calendarUnlocks.push({
        category: 'REIT',
        assetType: selectedReit,
        calendarYear,
        maxCards: CATEGORY_MAX_CARDS.REITS
      });
    }

    // Add calendar-based unlocks to schedule
    if (calendarUnlocks.length > 0) {
      if (!schedule[gameYear]) {
        schedule[gameYear] = [];
      }
      schedule[gameYear].push(...calendarUnlocks);
    }
  }

  return schedule;
};

/**
 * Helper function to get random items from an array
 */
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Check if an asset is unlocked at a given game year
 */
export const isAssetUnlocked = (
  assetType: string,
  currentGameYear: number,
  schedule: AssetUnlockSchedule
): boolean => {
  for (let year = 1; year <= currentGameYear; year++) {
    const unlocks = schedule[year] || [];
    if (unlocks.some(unlock => unlock.assetType === assetType)) {
      return true;
    }
  }
  return false;
};

/**
 * Extract selected assets from the unlock schedule
 * This ensures selectedAssets matches what's in the schedule
 * Updated for hard-coded unlock system (no progressive unlocks)
 */
export const extractSelectedAssetsFromSchedule = (schedule: AssetUnlockSchedule): {
  stocks: string[];
  fundType: 'index' | 'mutual';
  fundName: string;
  indexFunds: string[];
  mutualFunds: string[];
  commodity: string;
  reit: string;
} => {
  let allStocks: string[] = [];
  let indexFunds: string[] = [];
  let mutualFunds: string[] = [];
  let commodity = '';
  let reit = '';

  // Scan through all unlock years to collect assets
  Object.values(schedule).forEach((unlocks: UnlockEntry[]) => {
    unlocks.forEach((unlock: UnlockEntry) => {
      // Stocks (all 3 cards unlock at Year 4)
      if (unlock.assetType === 'STOCKS' && unlock.assetNames) {
        allStocks = [...new Set([...allStocks, ...unlock.assetNames])];
      }

      // Index Funds (2 cards at calendar 2009)
      if (unlock.assetType === 'INDEX_FUND' && unlock.assetNames) {
        indexFunds = [...new Set([...indexFunds, ...unlock.assetNames])];
      }

      // Mutual Funds (2 cards at calendar 2017)
      if (unlock.assetType === 'MUTUAL_FUND' && unlock.assetNames) {
        mutualFunds = [...new Set([...mutualFunds, ...unlock.assetNames])];
      }

      // Commodities (1 random card at Year 3)
      if (unlock.category === 'COMMODITIES') {
        commodity = unlock.assetType;
      }

      // REITs (1 random REIT at Calendar 2020)
      if (unlock.category === 'REIT') {
        reit = unlock.assetType;
      }
    });
  });

  // Determine primary fund type (prefer index if available, else mutual)
  const fundType: 'index' | 'mutual' = indexFunds.length > 0 ? 'index' : 'mutual';
  const fundName = fundType === 'index' ? (indexFunds[0] || '') : (mutualFunds[0] || '');

  return {
    stocks: [...new Set(allStocks)], // Remove duplicates
    fundType,
    fundName,
    indexFunds: [...new Set(indexFunds)],
    mutualFunds: [...new Set(mutualFunds)],
    commodity,
    reit
  };
};
