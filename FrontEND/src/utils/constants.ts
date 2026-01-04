export const MONTH_DURATION_MS = 3000; // 3 seconds = 1 month
export const TOTAL_GAME_YEARS = 20;
export const STARTING_CASH = 100000; // Starting pocket cash in rupees
export const SAVINGS_INTEREST_RATE = 0.025; // 2.5% per annum
export const GAME_START_YEAR = 2005; // Game year 1 maps to calendar year 2005

// Financial quotes - one random quote per year
export const FINANCIAL_QUOTES = [
  "Rule No. 1 is never lose money. Rule No. 2 is never forget Rule No. 1.",
  "Price is what you pay. Value is what you get.",
  "The stock market is a device for transferring money from the impatient to the patient.",
  "Risk comes from not knowing what you're doing.",
  "Be fearful when others are greedy and greedy when others are fearful.",
  "The best investment you can make is in yourself.",
  "Compound interest is the eighth wonder of the world.",
  "An investment in knowledge pays the best interest.",
  "Do not save what is left after spending, but spend what is left after saving.",
  "The four most dangerous words in investing are: 'This time it's different.'",
  "In investing, what is comfortable is rarely profitable.",
  "Time in the market beats timing the market.",
  "Don't put all your eggs in one basket.",
  "The goal of a successful trader is to make the best trades. Money is secondary.",
  "Investing should be more like watching paint dry or watching grass grow.",
  "Wide diversification is only required when investors do not understand what they are doing.",
  "The individual investor should act consistently as an investor and not as a speculator.",
  "It's not how much money you make, but how much money you keep.",
  "Every once in a while, the market does something so stupid it takes your breath away.",
  "The investor's chief problem—and even his worst enemy—is likely to be himself.",
  "Behind every stock is a company. Find out what it's doing.",
  "Know what you own, and know why you own it.",
  "Returns matter a lot, but avoiding the big loss matters more.",
  "The intelligent investor is a realist who sells to optimists and buys from pessimists."
];

// Asset unlock timeline based on year
export const ASSET_UNLOCK_TIMELINE: { [key: number]: string[] } = {
  1: ['SAVINGS_AC'],
  2: ['FIXED_DEPOSIT'],
  3: ['PHYSICAL_GOLD', 'DIGITAL_GOLD'],
  4: ['INDEX_FUND', 'MUTUAL_FUND'], // User can select one
  5: ['INDIAN_STOCKS'], // Min 2, Max 5 stocks
  6: ['BTC', 'ETH'],
  7: ['COMMODITY'], // User can select one
  8: ['EMBASSY', 'MINDSPACE'] // Both REITs
};

// Available stocks for selection - ALL 90 stocks from Asset_Timeline.csv
export const AVAILABLE_STOCKS = [
  // 1996 batch (earliest)
  'INFY', 'WIPRO', 'HDFCBANK', 'SBIN', 'RELIANCE', 'ONGC', 'M&M', 'HINDUNILVR',
  'ITC', 'TATACONSUM', 'TITAN', 'TATASTEEL', 'HINDALCO', 'SUNPHARMA',
  'Hindustan Construction',
  // 1997-1998
  'GAIL', 'AXISBANK',
  // 2001-2002
  'KOTAKBANK', 'ICICIBANK', 'INDUSINDBK', 'BAJFINANCE', 'SHRIRAMFIN',
  'BAJAJ-AUTO', 'HEROMOTOCO', 'ASIANPAINT', 'APOLLOHOSP', 'LT', 'GRASIM',
  'BHARTIARTL', 'ADANIENT', 'BEL', 'TRENT', 'Indo National',
  'Zee Entertainment', 'Ashok Leyland', 'ITI Limited', 'CESC Limited',
  'Trident', 'Weizmann', 'TCS', 'HCLTECH', 'BAJAJFINSV', 'NESTLEIND',
  'ULTRACEMCO', 'HFCL',
  // 2003-2010
  'JSWSTEEL', 'MARUTI', 'Subex', 'UCO Bank', 'Jindal Stainless',
  'Indiabulls Real Estate', 'NTPC', 'JP Power Ventures', 'Saksoft',
  'Yes Bank', 'Suzlon Energy', 'GVK Power & Infra', 'Vakrangee', 'TECHM',
  'Vodafone Idea', 'Dish TV India', 'Websol Energy Systems', 'POWERGRID',
  'ADANIPORTS', 'Reliance Power', 'IRB Infrastructure', 'Adani Power',
  'RattanIndia Power', 'Hindustan Copper', 'Manappuram Finance',
  // 2012-2021
  'RattanIndia Enterprises', 'Spacenet Enterprises', 'Brightcom Group',
  'INDIGO', 'Quick Heal Technologies', 'PNB Housing Finance',
  'Sanginita Chemicals', 'NACL Industries', 'SBILIFE', '5Paisa Capital',
  'Vertoz', 'Indostar Capital Finance', 'Vinny Overseas',
  'Ujjivan Small Finance Bank', 'Ksolves India', 'Railtel Corporation',
  'MTAR Technologies', 'Easy Trip Planners', 'One97 Communications (Paytm)',
  'Honasa Consumer'
];

// Available index funds (user selects one in Year 4)
export const AVAILABLE_INDEX_FUNDS = [
  'NIFTYBEES', 'SETFNIF50', 'UTINIFTETF', 'HDFCNIFETF', 'ICICIB22'
];

// Available mutual funds (user selects one in Year 4)
export const AVAILABLE_MUTUAL_FUNDS = [
  'SBI_Bluechip', 'ICICI_Bluechip', 'Axis_Midcap',
  'Kotak_Emerging', 'PGIM_Midcap', 'Nippon_SmallCap', 'HDFC_SmallCap'
];

// Available commodities (user selects one in Year 7)
export const AVAILABLE_COMMODITIES = [
  'COTTON', 'WHEAT', 'CRUDEOIL_WTI', 'SILVER', 'NATURALGAS',
  'COPPER', 'BRENT', 'ALUMINIUM'
];

export const getAssetPath = (category: string, assetName: string): string => {
  const categoryMap: { [key: string]: string } = {
    'stocks': 'Indian_Stocks',
    'index': 'Index_Funds',
    'mutual': 'Mutual_Funds',
    'commodity': 'Commodities',
    'crypto': 'Crypto_Assets',
    'reit': 'REIT',
    'gold': 'Gold_Investments'
  };

  const folder = categoryMap[category] || category;
  return `/data/${folder}/${assetName}.csv`;
};

// Utility function to get random items from an array
export const getRandomItems = <T>(array: T[], min: number, max: number): T[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Utility function to get a single random item from an array
export const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Utility function to format numbers in Indian numbering system (lakhs, crores)
export const formatIndianNumber = (num: number): string => {
  const numStr = Math.abs(num).toFixed(2);
  const [integerPart, decimalPart] = numStr.split('.');

  // Indian numbering system: last 3 digits, then groups of 2
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);

  let formatted = lastThree;
  if (otherNumbers !== '') {
    formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  return formatted + '.' + decimalPart;
};
