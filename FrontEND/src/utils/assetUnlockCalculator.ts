import { AssetCategory, AssetUnlockSchedule, UnlockEntry } from '../types';

// Asset timeline data from CSV (with month precision) - Generated from Asset_Timeline.csv
export const ASSET_TIMELINE_DATA: { [key: string]: { category: AssetCategory; firstYear: number; firstMonth: number; lastYear: number } } = {
  // Banking
  'SAVINGS_AC': { category: 'BANKING', firstYear: 2000, firstMonth: 1, lastYear: 2025 },
  'FD': { category: 'BANKING', firstYear: 2000, firstMonth: 1, lastYear: 2025 },

  // Gold Investments
  'Physical_Gold': { category: 'GOLD', firstYear: 1990, firstMonth: 1, lastYear: 2025 },
  'Digital_Gold': { category: 'GOLD', firstYear: 2009, firstMonth: 1, lastYear: 2025 },

  // Commodities
  'COTTON': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 1, lastYear: 2025 },
  'WHEAT': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 7, lastYear: 2025 },
  'CRUDEOIL_WTI': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2025 },
  'SILVER': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2025 },
  'NATURALGAS': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2025 },
  'COPPER': { category: 'COMMODITIES', firstYear: 2000, firstMonth: 8, lastYear: 2025 },
  'BRENT': { category: 'COMMODITIES', firstYear: 2007, firstMonth: 7, lastYear: 2025 },
  'ALUMINIUM': { category: 'COMMODITIES', firstYear: 2014, firstMonth: 5, lastYear: 2025 },

  // Crypto Assets
  'BTC': { category: 'CRYPTO', firstYear: 2014, firstMonth: 9, lastYear: 2025 },
  'ETH': { category: 'CRYPTO', firstYear: 2017, firstMonth: 11, lastYear: 2025 },

  // Index Funds
  'NIFTYBEES': { category: 'FUNDS', firstYear: 2009, firstMonth: 1, lastYear: 2025 },
  'SETFNIF50': { category: 'FUNDS', firstYear: 2015, firstMonth: 7, lastYear: 2025 },
  'UTINIFTETF': { category: 'FUNDS', firstYear: 2015, firstMonth: 9, lastYear: 2025 },
  'HDFCNIFETF': { category: 'FUNDS', firstYear: 2015, firstMonth: 12, lastYear: 2025 },
  'ICICIB22': { category: 'FUNDS', firstYear: 2019, firstMonth: 12, lastYear: 2025 },

  // Mutual Funds
  'SBI_Bluechip': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },
  'ICICI_Bluechip': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },
  'Axis_Midcap': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },
  'Kotak_Emerging': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },
  'PGIM_Midcap': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },
  'Nippon_SmallCap': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },
  'HDFC_SmallCap': { category: 'FUNDS', firstYear: 2018, firstMonth: 1, lastYear: 2025 },

  // Indian Stocks - 1996 batch (earliest)
  'INFY': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'WIPRO': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'HDFCBANK': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'SBIN': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'RELIANCE': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'ONGC': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'M&M': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'HINDUNILVR': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'ITC': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'TATACONSUM': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'TITAN': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'TATASTEEL': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'HINDALCO': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'SUNPHARMA': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },
  'Hindustan Construction': { category: 'STOCKS', firstYear: 1996, firstMonth: 1, lastYear: 2025 },

  // Indian Stocks - 1997-1998
  'GAIL': { category: 'STOCKS', firstYear: 1997, firstMonth: 4, lastYear: 2025 },
  'AXISBANK': { category: 'STOCKS', firstYear: 1998, firstMonth: 11, lastYear: 2025 },

  // Indian Stocks - 2001-2002
  'KOTAKBANK': { category: 'STOCKS', firstYear: 2001, firstMonth: 7, lastYear: 2025 },
  'ICICIBANK': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'INDUSINDBK': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'BAJFINANCE': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'SHRIRAMFIN': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'BAJAJ-AUTO': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'HEROMOTOCO': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'ASIANPAINT': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'APOLLOHOSP': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'LT': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'GRASIM': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'BHARTIARTL': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'ADANIENT': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'BEL': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'TRENT': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'Indo National': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'Zee Entertainment': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'Ashok Leyland': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'ITI Limited': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'CESC Limited': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'Trident': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'Weizmann': { category: 'STOCKS', firstYear: 2002, firstMonth: 7, lastYear: 2025 },
  'TCS': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2025 },
  'HCLTECH': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2025 },
  'BAJAJFINSV': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2025 },
  'NESTLEIND': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2025 },
  'ULTRACEMCO': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2025 },
  'HFCL': { category: 'STOCKS', firstYear: 2002, firstMonth: 8, lastYear: 2025 },

  // Indian Stocks - 2003-2010
  'JSWSTEEL': { category: 'STOCKS', firstYear: 2003, firstMonth: 5, lastYear: 2025 },
  'MARUTI': { category: 'STOCKS', firstYear: 2003, firstMonth: 7, lastYear: 2025 },
  'Subex': { category: 'STOCKS', firstYear: 2003, firstMonth: 9, lastYear: 2025 },
  'UCO Bank': { category: 'STOCKS', firstYear: 2003, firstMonth: 10, lastYear: 2025 },
  'Jindal Stainless': { category: 'STOCKS', firstYear: 2003, firstMonth: 11, lastYear: 2025 },
  'Indiabulls Real Estate': { category: 'STOCKS', firstYear: 2004, firstMonth: 9, lastYear: 2025 },
  'NTPC': { category: 'STOCKS', firstYear: 2004, firstMonth: 11, lastYear: 2025 },
  'JP Power Ventures': { category: 'STOCKS', firstYear: 2005, firstMonth: 4, lastYear: 2025 },
  'Saksoft': { category: 'STOCKS', firstYear: 2005, firstMonth: 5, lastYear: 2025 },
  'Yes Bank': { category: 'STOCKS', firstYear: 2005, firstMonth: 7, lastYear: 2025 },
  'Suzlon Energy': { category: 'STOCKS', firstYear: 2005, firstMonth: 10, lastYear: 2025 },
  'GVK Power & Infra': { category: 'STOCKS', firstYear: 2006, firstMonth: 2, lastYear: 2025 },
  'Vakrangee': { category: 'STOCKS', firstYear: 2006, firstMonth: 4, lastYear: 2025 },
  'TECHM': { category: 'STOCKS', firstYear: 2006, firstMonth: 8, lastYear: 2025 },
  'Vodafone Idea': { category: 'STOCKS', firstYear: 2007, firstMonth: 3, lastYear: 2025 },
  'Dish TV India': { category: 'STOCKS', firstYear: 2007, firstMonth: 4, lastYear: 2025 },
  'Websol Energy Systems': { category: 'STOCKS', firstYear: 2007, firstMonth: 5, lastYear: 2025 },
  'POWERGRID': { category: 'STOCKS', firstYear: 2007, firstMonth: 10, lastYear: 2025 },
  'ADANIPORTS': { category: 'STOCKS', firstYear: 2007, firstMonth: 11, lastYear: 2025 },
  'Reliance Power': { category: 'STOCKS', firstYear: 2008, firstMonth: 2, lastYear: 2025 },
  'IRB Infrastructure': { category: 'STOCKS', firstYear: 2008, firstMonth: 2, lastYear: 2025 },
  'Adani Power': { category: 'STOCKS', firstYear: 2009, firstMonth: 8, lastYear: 2025 },
  'RattanIndia Power': { category: 'STOCKS', firstYear: 2009, firstMonth: 10, lastYear: 2025 },
  'Hindustan Copper': { category: 'STOCKS', firstYear: 2010, firstMonth: 1, lastYear: 2025 },
  'Manappuram Finance': { category: 'STOCKS', firstYear: 2010, firstMonth: 6, lastYear: 2025 },

  // Indian Stocks - 2012-2021
  'RattanIndia Enterprises': { category: 'STOCKS', firstYear: 2012, firstMonth: 7, lastYear: 2025 },
  'Spacenet Enterprises': { category: 'STOCKS', firstYear: 2013, firstMonth: 11, lastYear: 2025 },
  'Brightcom Group': { category: 'STOCKS', firstYear: 2015, firstMonth: 5, lastYear: 2025 },
  'INDIGO': { category: 'STOCKS', firstYear: 2015, firstMonth: 11, lastYear: 2025 },
  'Quick Heal Technologies': { category: 'STOCKS', firstYear: 2016, firstMonth: 2, lastYear: 2025 },
  'PNB Housing Finance': { category: 'STOCKS', firstYear: 2016, firstMonth: 11, lastYear: 2025 },
  'Sanginita Chemicals': { category: 'STOCKS', firstYear: 2017, firstMonth: 3, lastYear: 2025 },
  'NACL Industries': { category: 'STOCKS', firstYear: 2017, firstMonth: 4, lastYear: 2025 },
  'SBILIFE': { category: 'STOCKS', firstYear: 2017, firstMonth: 10, lastYear: 2025 },
  '5Paisa Capital': { category: 'STOCKS', firstYear: 2017, firstMonth: 11, lastYear: 2025 },
  'Vertoz': { category: 'STOCKS', firstYear: 2017, firstMonth: 11, lastYear: 2025 },
  'Indostar Capital Finance': { category: 'STOCKS', firstYear: 2018, firstMonth: 5, lastYear: 2025 },
  'Vinny Overseas': { category: 'STOCKS', firstYear: 2018, firstMonth: 10, lastYear: 2025 },
  'Ujjivan Small Finance Bank': { category: 'STOCKS', firstYear: 2019, firstMonth: 12, lastYear: 2025 },
  'Ksolves India': { category: 'STOCKS', firstYear: 2020, firstMonth: 8, lastYear: 2025 },
  'Railtel Corporation': { category: 'STOCKS', firstYear: 2021, firstMonth: 2, lastYear: 2025 },
  'MTAR Technologies': { category: 'STOCKS', firstYear: 2021, firstMonth: 3, lastYear: 2025 },
  'Easy Trip Planners': { category: 'STOCKS', firstYear: 2021, firstMonth: 3, lastYear: 2025 },
  'One97 Communications (Paytm)': { category: 'STOCKS', firstYear: 2021, firstMonth: 11, lastYear: 2025 },
  'Honasa Consumer': { category: 'STOCKS', firstYear: 2023, firstMonth: 11, lastYear: 2025 },

  // REITs
  'EMBASSY': { category: 'REIT', firstYear: 2019, firstMonth: 4, lastYear: 2025 },
  'MINDSPACE': { category: 'REIT', firstYear: 2020, firstMonth: 8, lastYear: 2025 },
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
  const MAX_DATA_YEAR = 2025; // CSV data only goes up to 2025
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

  // Year 4: Stocks (FIXED 2 stocks initially, then 0-3 unlock progressively)
  // This creates better "look and feel" with gradual unlocks
  let additionalStocksToUnlock: string[] = [];

  if (categories.includes('STOCKS')) {
    const calendarYear = gameStartYear + currentGameYear - 1;
    const calendarMonth = 1; // Assume month 1 for unlock year

    // Filter stocks that have data available at this calendar year/month
    const availableStocks = (assetsByCategory['STOCKS'] || []).filter(stockName => {
      const stockData = ASSET_TIMELINE_DATA[stockName];
      if (!stockData) return false;

      // Stock data must be available: year > firstYear OR (year == firstYear AND month >= firstMonth)
      return calendarYear > stockData.firstYear ||
             (calendarYear === stockData.firstYear && calendarMonth >= stockData.firstMonth);
    });

    // ALWAYS unlock exactly 2 random stocks initially
    const initialStockCount = 2;
    const initialStocks = getRandomItems(availableStocks, initialStockCount);

    if (initialStocks.length >= 2) {
      // Select 1-3 additional stocks randomly (minimum 1, maximum 3)
      const additionalCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

      let stocksToUnlockNow = [...initialStocks];
      let stocksToUnlockLater: string[] = [];

      if (additionalCount > 0) {
        // Get remaining stocks (not already in initial 2)
        const remainingStocks = (assetsByCategory['STOCKS'] || []).filter(
          stock => !initialStocks.includes(stock)
        );

        // Randomly select additional stocks
        const selectedAdditionalStocks = getRandomItems(remainingStocks, Math.min(additionalCount, remainingStocks.length));

        // Split into "available now" vs "available later"
        selectedAdditionalStocks.forEach(stockName => {
          const stockData = ASSET_TIMELINE_DATA[stockName];
          if (!stockData) return;

          // Check if stock data is available NOW (at Year 4)
          const isAvailableNow = calendarYear > stockData.firstYear ||
                                (calendarYear === stockData.firstYear && calendarMonth >= stockData.firstMonth);

          if (isAvailableNow) {
            // Unlock immediately with fixed 2 stocks
            stocksToUnlockNow.push(stockName);
          } else {
            // Save for progressive unlock later
            stocksToUnlockLater.push(stockName);
            additionalStocksToUnlock.push(stockName);
          }
        });
      }

      // Unlock stocks that are available NOW (2 fixed + any additional with data)
      schedule[currentGameYear] = [{
        category: 'STOCKS',
        assetType: 'STOCKS',
        assetNames: stocksToUnlockNow,
        calendarYear
      }];
    } else {
      // Fallback: if less than 2 stocks available, select any 2
      schedule[currentGameYear] = [{
        category: 'STOCKS',
        assetType: 'STOCKS',
        assetNames: getRandomItems(assetsByCategory['STOCKS'] || [], 2),
        calendarYear
      }];
    }

    currentGameYear++;
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

  // Now progressively unlock remaining assets (one per year)
  const remainingUnlocks: { category: AssetCategory; assetType: string; minYear: number; minMonth: number }[] = [];

  // Add stocks that will unlock later (when their data becomes available)
  additionalStocksToUnlock.forEach(stockName => {
    const stockData = ASSET_TIMELINE_DATA[stockName];
    if (stockData) {
      remainingUnlocks.push({
        category: 'STOCKS',
        assetType: stockName,
        minYear: stockData.firstYear,
        minMonth: stockData.firstMonth
      });
    }
  });

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
