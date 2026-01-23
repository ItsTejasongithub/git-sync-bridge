import { AssetCategory, AssetUnlockSchedule, UnlockEntry } from '../types';

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
  'EASEMYTRIP': { category: 'STOCKS', firstYear: 2021, firstMonth: 3, lastYear: 2026 },
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
  'HONASA': { category: 'STOCKS', firstYear: 2023, firstMonth: 11, lastYear: 2026 },
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
  'MTARTECH': { category: 'STOCKS', firstYear: 2021, firstMonth: 3, lastYear: 2026 },
  'NACLIND': { category: 'STOCKS', firstYear: 2017, firstMonth: 4, lastYear: 2026 },
  'NESTLEIND': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2026 },
  'NIPPOBATRY': { category: 'STOCKS', firstYear: 2002, firstMonth: 6, lastYear: 2026 },
  'NTPC': { category: 'STOCKS', firstYear: 2004, firstMonth: 11, lastYear: 2026 },
  'ONGC': { category: 'STOCKS', firstYear: 1995, firstMonth: 12, lastYear: 2026 },
  'PAYTM': { category: 'STOCKS', firstYear: 2021, firstMonth: 11, lastYear: 2026 },
  'PNBHOUSING': { category: 'STOCKS', firstYear: 2016, firstMonth: 11, lastYear: 2026 },
  'POWERGRID': { category: 'STOCKS', firstYear: 2007, firstMonth: 10, lastYear: 2026 },
  'QUICKHEAL': { category: 'STOCKS', firstYear: 2016, firstMonth: 2, lastYear: 2026 },
  'RAILTEL': { category: 'STOCKS', firstYear: 2021, firstMonth: 2, lastYear: 2026 },
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
  'Nippon_SmallCap': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },
  'PGIM_Midcap': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },
  'SBI_Bluechip': { category: 'FUNDS', firstYear: 2017, firstMonth: 12, lastYear: 2026 },

  // REITs
  'EMBASSY': { category: 'REIT', firstYear: 2019, firstMonth: 3, lastYear: 2026 },
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
 * Ensures game ends by 2025 (max data year)
 */
export const calculateGameStartYear = (categories: AssetCategory[]): number => {
  const MAX_DATA_YEAR = 2025; // PostgreSQL data currently goes up to 2025
  const GAME_DURATION = 20;

  // Game must end by 2025, so start year = 2025 - 20 + 1 = 2006
  const maxStartYear = MAX_DATA_YEAR - GAME_DURATION + 1;

  const latestYear = getLatestAssetYear(categories);
  const calculatedStartYear = latestYear + 5 - GAME_DURATION + 1;

  // Return the minimum to ensure we don't exceed 2025
  return Math.min(calculatedStartYear, maxStartYear);
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
 * Generate asset unlock schedule based on selected categories
 */
export const generateAssetUnlockSchedule = (
  categories: AssetCategory[],
  gameStartYear: number
): AssetUnlockSchedule => {
  const schedule: AssetUnlockSchedule = {};
  const TOTAL_GAME_YEARS = 20;
  const NO_UNLOCK_LAST_YEARS = 5;

  // Collect all assets that need to be unlocked
  const assetsByCategory: { [key in AssetCategory]?: string[] } = {};

  categories.forEach(category => {
    assetsByCategory[category] = getAssetsForCategory(category);
  });

  let currentGameYear = 1;

  // Year 1: Always unlock Savings Account (if BANKING is selected)
  if (categories.includes('BANKING')) {
    schedule[currentGameYear] = [{
      category: 'BANKING',
      assetType: 'SAVINGS_AC',
      calendarYear: gameStartYear
    }];
    currentGameYear++;
  }

  // Year 2: Fixed Deposit (if BANKING is selected)
  if (categories.includes('BANKING')) {
    schedule[currentGameYear] = [{
      category: 'BANKING',
      assetType: 'FD',
      calendarYear: gameStartYear + currentGameYear - 1
    }];
    currentGameYear++;
  }

  // Year 3: Physical Gold (if GOLD is selected)
  if (categories.includes('GOLD')) {
    schedule[currentGameYear] = [{
      category: 'GOLD',
      assetType: 'Physical_Gold',
      calendarYear: gameStartYear + currentGameYear - 1
    }];
    currentGameYear++;
  }

  // Track remaining unlocks for progressive scheduling (must be declared before use)
  const remainingUnlocks: { category: AssetCategory; assetType: string; minYear: number; minMonth: number }[] = [];

  // Year 4: Stocks - NEW SELECTION RULES
  // Fixed Stocks: 2 stocks with data available (unlock immediately)
  // Random Stocks: 1-3 stocks from entire pool (unlock when data available)
  // Constraint: Total unlocked stocks must be 3-5
  // All stocks must be unique
  const selectedStocks: {
    fixed: string[];
    random: string[];
    allSelected: string[];
  } = { fixed: [], random: [], allSelected: [] };

  if (categories.includes('STOCKS')) {
    const calendarYear = gameStartYear + currentGameYear - 1;
    const calendarMonth = 1;

    // Get ALL stocks in the universe
    const allStocks = assetsByCategory['STOCKS'] || [];

    // Filter stocks with data available NOW (data-available pool)
    const dataAvailableStocks = allStocks.filter(stockName => {
      const stockData = ASSET_TIMELINE_DATA[stockName];
      if (!stockData) return false;
      return calendarYear > stockData.firstYear ||
        (calendarYear === stockData.firstYear && calendarMonth >= stockData.firstMonth);
    });

    // FIXED STOCKS: Select exactly 2 from data-available pool
    selectedStocks.fixed = getRandomItems(dataAvailableStocks, 2);

    // RANDOM STOCKS: Select 1-3 from remaining stocks (entire universe minus fixed)
    const stocksExcludingFixed = allStocks.filter(s => !selectedStocks.fixed.includes(s));
    const randomCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    selectedStocks.random = getRandomItems(stocksExcludingFixed, Math.min(randomCount, stocksExcludingFixed.length));

    // All selected stocks (unique)
    selectedStocks.allSelected = [...selectedStocks.fixed, ...selectedStocks.random];

    // Determine which stocks unlock NOW vs LATER
    const stocksToUnlockNow: string[] = [];
    const stocksToUnlockLater: { name: string; minYear: number; minMonth: number }[] = [];

    selectedStocks.allSelected.forEach(stockName => {
      const stockData = ASSET_TIMELINE_DATA[stockName];
      if (!stockData) return;

      const isAvailableNow = calendarYear > stockData.firstYear ||
        (calendarYear === stockData.firstYear && calendarMonth >= stockData.firstMonth);

      if (isAvailableNow) {
        stocksToUnlockNow.push(stockName);
      } else {
        stocksToUnlockLater.push({
          name: stockName,
          minYear: stockData.firstYear,
          minMonth: stockData.firstMonth
        });
      }
    });

    // Unlock stocks that are available NOW
    if (stocksToUnlockNow.length > 0) {
      schedule[currentGameYear] = [{
        category: 'STOCKS',
        assetType: 'STOCKS',
        assetNames: stocksToUnlockNow,
        calendarYear
      }];
    }

    currentGameYear++;

    // Schedule progressive unlocks for random stocks without data yet
    stocksToUnlockLater.sort((a, b) => {
      if (a.minYear !== b.minYear) return a.minYear - b.minYear;
      return a.minMonth - b.minMonth;
    });

    stocksToUnlockLater.forEach(stock => {
      remainingUnlocks.push({
        category: 'STOCKS',
        assetType: stock.name,
        minYear: stock.minYear,
        minMonth: stock.minMonth
      });
    });
  }

  // Year 5: Digital Gold (if GOLD is selected and data available)
  if (categories.includes('GOLD')) {
    const calendarYear = gameStartYear + currentGameYear - 1;
    if (calendarYear >= 2009) {
      schedule[currentGameYear] = [{
        category: 'GOLD',
        assetType: 'Digital_Gold',
        calendarYear
      }];
      currentGameYear++;
    }
  }

  // Crypto assets (BTC data available from 2014 Sep, ETH from 2017 Nov)
  if (categories.includes('CRYPTO')) {
    remainingUnlocks.push({ category: 'CRYPTO', assetType: 'BTC', minYear: 2014, minMonth: 9 });
    remainingUnlocks.push({ category: 'CRYPTO', assetType: 'ETH', minYear: 2017, minMonth: 11 });
  }

  // Funds (randomly select one fund - index or mutual)
  if (categories.includes('FUNDS')) {
    const availableFunds = assetsByCategory['FUNDS'] || [];
    if (availableFunds.length > 0) {
      // Randomly pick one fund (could be index or mutual)
      const randomFund = availableFunds[Math.floor(Math.random() * availableFunds.length)];
      const fundData = ASSET_TIMELINE_DATA[randomFund];
      remainingUnlocks.push({
        category: 'FUNDS',
        assetType: randomFund,
        minYear: fundData?.firstYear || 2009,
        minMonth: fundData?.firstMonth || 1
      });
    }
  }

  // REITs
  if (categories.includes('REIT')) {
    remainingUnlocks.push({ category: 'REIT', assetType: 'EMBASSY', minYear: 2019, minMonth: 4 });
    remainingUnlocks.push({ category: 'REIT', assetType: 'MINDSPACE', minYear: 2020, minMonth: 8 });
  }

  // Commodities
  if (categories.includes('COMMODITIES')) {
    const availableCommodities = assetsByCategory['COMMODITIES'] || [];
    if (availableCommodities.length > 0) {
      const commodityData = ASSET_TIMELINE_DATA[availableCommodities[0]];
      remainingUnlocks.push({
        category: 'COMMODITIES',
        assetType: availableCommodities[0],
        minYear: commodityData?.firstYear || 2000,
        minMonth: commodityData?.firstMonth || 1
      });
    }
  }

  // Sort by minimum year
  remainingUnlocks.sort((a, b) => a.minYear - b.minYear);

  // Distribute remaining unlocks across available years (not in last 5 years)
  const maxUnlockYear = TOTAL_GAME_YEARS - NO_UNLOCK_LAST_YEARS;

  remainingUnlocks.forEach(unlock => {
    // Find the first available year where data exists
    while (currentGameYear <= maxUnlockYear) {
      const calendarYear = gameStartYear + currentGameYear - 1;
      const calendarMonth = 1; // Assume month 1 for unlock year

      // Check if this asset's data is available in this calendar year AND month
      // Data available if: year > minYear OR (year == minYear AND month >= minMonth)
      const isDataAvailable = calendarYear > unlock.minYear ||
        (calendarYear === unlock.minYear && calendarMonth >= unlock.minMonth);

      if (isDataAvailable) {
        // Only unlock if this slot is not already taken
        if (!schedule[currentGameYear]) {
          schedule[currentGameYear] = [];
        }

        // Check if we're not adding to an already occupied year
        if (schedule[currentGameYear].length === 0) {
          schedule[currentGameYear].push({
            category: unlock.category,
            assetType: unlock.assetType,
            calendarYear
          });

          currentGameYear++;
          break;
        }
      }
      currentGameYear++;
    }
  });

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
 */
export const extractSelectedAssetsFromSchedule = (schedule: AssetUnlockSchedule): {
  stocks: string[];
  fundName: string;
  commodity: string;
} => {
  let allStocks: string[] = [];
  let fundName = '';
  let commodity = '';

  // Scan through all unlock years to collect assets
  Object.values(schedule).forEach((unlocks: UnlockEntry[]) => {
    unlocks.forEach((unlock: UnlockEntry) => {
      if (unlock.assetType === 'STOCKS' && unlock.assetNames) {
        // Collect all stock names (initial + progressive)
        allStocks = [...new Set([...allStocks, ...unlock.assetNames])];
      } else if (unlock.category === 'STOCKS' && typeof unlock.assetType === 'string') {
        // Individual stock unlock (from progressive unlocks)
        allStocks.push(unlock.assetType);
      } else if (unlock.category === 'FUNDS') {
        fundName = unlock.assetType;
      } else if (unlock.category === 'COMMODITIES') {
        commodity = unlock.assetType;
      }
    });
  });

  return {
    stocks: [...new Set(allStocks)], // Remove duplicates
    fundName,
    commodity
  };
};
