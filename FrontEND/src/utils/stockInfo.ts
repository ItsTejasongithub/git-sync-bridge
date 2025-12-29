// Asset information database with details for all asset types
export interface AssetInfo {
  fullName: string;
  sector: string;
  description: string;
}

// Legacy type alias for backwards compatibility
export type StockInfo = AssetInfo;

export const STOCK_INFO_DATABASE: { [key: string]: StockInfo } = {
  // 1996 batch - IT Giants & Banks
  'INFY': {
    fullName: 'Infosys Limited',
    sector: 'Information Technology',
    description: 'Global leader in consulting, technology, and outsourcing solutions'
  },
  'WIPRO': {
    fullName: 'Wipro Limited',
    sector: 'Information Technology',
    description: 'Leading IT services, consulting, and business process services company'
  },
  'HDFCBANK': {
    fullName: 'HDFC Bank Limited',
    sector: 'Banking & Finance',
    description: "India's largest private sector bank by assets"
  },
  'SBIN': {
    fullName: 'State Bank of India',
    sector: 'Banking & Finance',
    description: 'Largest public sector bank in India with nationwide presence'
  },
  'RELIANCE': {
    fullName: 'Reliance Industries Limited',
    sector: 'Conglomerate',
    description: 'Diversified conglomerate in energy, petrochemicals, retail, and telecom'
  },
  'ONGC': {
    fullName: 'Oil and Natural Gas Corporation',
    sector: 'Oil & Gas',
    description: "India's largest crude oil and natural gas exploration company"
  },
  'M&M': {
    fullName: 'Mahindra & Mahindra Limited',
    sector: 'Automotive',
    description: 'Leading manufacturer of tractors, utility vehicles, and commercial vehicles'
  },
  'HINDUNILVR': {
    fullName: 'Hindustan Unilever Limited',
    sector: 'FMCG',
    description: "India's largest FMCG company with iconic consumer brands"
  },
  'ITC': {
    fullName: 'ITC Limited',
    sector: 'Conglomerate',
    description: 'Diversified conglomerate in FMCG, hotels, paperboards, and agri-business'
  },
  'TATACONSUM': {
    fullName: 'Tata Consumer Products Limited',
    sector: 'FMCG',
    description: 'Leading consumer goods company with brands like Tata Tea and Tata Salt'
  },
  'TITAN': {
    fullName: 'Titan Company Limited',
    sector: 'Consumer Durables',
    description: 'Leading manufacturer of watches, jewelry, and eyewear'
  },
  'TATASTEEL': {
    fullName: 'Tata Steel Limited',
    sector: 'Metals & Mining',
    description: "India's largest integrated steel producer"
  },
  'HINDALCO': {
    fullName: 'Hindalco Industries Limited',
    sector: 'Metals & Mining',
    description: 'Leading aluminum and copper manufacturer in India'
  },
  'SUNPHARMA': {
    fullName: 'Sun Pharmaceutical Industries',
    sector: 'Pharmaceuticals',
    description: "India's largest pharmaceutical company by market cap"
  },
  'Hindustan Construction': {
    fullName: 'Hindustan Construction Company',
    sector: 'Infrastructure',
    description: 'Pioneer in infrastructure development and construction'
  },

  // 1997-1998
  'GAIL': {
    fullName: 'GAIL (India) Limited',
    sector: 'Oil & Gas',
    description: 'Largest state-owned natural gas processing and distribution company'
  },
  'AXISBANK': {
    fullName: 'Axis Bank Limited',
    sector: 'Banking & Finance',
    description: 'Third largest private sector bank in India'
  },

  // 2001-2002
  'KOTAKBANK': {
    fullName: 'Kotak Mahindra Bank Limited',
    sector: 'Banking & Finance',
    description: 'Leading private sector bank with diverse financial services'
  },
  'ICICIBANK': {
    fullName: 'ICICI Bank Limited',
    sector: 'Banking & Finance',
    description: 'Second largest private sector bank in India'
  },
  'INDUSINDBK': {
    fullName: 'IndusInd Bank Limited',
    sector: 'Banking & Finance',
    description: 'New generation private sector bank with innovative banking solutions'
  },
  'BAJFINANCE': {
    fullName: 'Bajaj Finance Limited',
    sector: 'Financial Services',
    description: 'Leading non-banking financial company in consumer finance'
  },
  'SHRIRAMFIN': {
    fullName: 'Shriram Finance Limited',
    sector: 'Financial Services',
    description: 'Leading commercial vehicle financing company'
  },
  'BAJAJ-AUTO': {
    fullName: 'Bajaj Auto Limited',
    sector: 'Automotive',
    description: 'Leading manufacturer of motorcycles and three-wheelers'
  },
  'HEROMOTOCO': {
    fullName: 'Hero MotoCorp Limited',
    sector: 'Automotive',
    description: "World's largest manufacturer of motorcycles and scooters"
  },
  'ASIANPAINT': {
    fullName: 'Asian Paints Limited',
    sector: 'Paints & Coatings',
    description: 'Largest paint company in India with pan-Asia presence'
  },
  'APOLLOHOSP': {
    fullName: 'Apollo Hospitals Enterprise',
    sector: 'Healthcare',
    description: "India's leading integrated healthcare services provider"
  },
  'LT': {
    fullName: 'Larsen & Toubro Limited',
    sector: 'Infrastructure',
    description: 'Leading engineering, construction, and technology conglomerate'
  },
  'GRASIM': {
    fullName: 'Grasim Industries Limited',
    sector: 'Diversified',
    description: 'Flagship company of Aditya Birla Group in cement and chemicals'
  },
  'BHARTIARTL': {
    fullName: 'Bharti Airtel Limited',
    sector: 'Telecommunications',
    description: "India's second largest telecom operator with global presence"
  },
  'ADANIENT': {
    fullName: 'Adani Enterprises Limited',
    sector: 'Conglomerate',
    description: 'Flagship company of Adani Group in infrastructure and commodities'
  },
  'BEL': {
    fullName: 'Bharat Electronics Limited',
    sector: 'Defense & Aerospace',
    description: 'State-owned aerospace and defense electronics company'
  },
  'TRENT': {
    fullName: 'Trent Limited',
    sector: 'Retail',
    description: 'Leading retail chain operating Westside, Zudio, and Star stores'
  },
  'TCS': {
    fullName: 'Tata Consultancy Services',
    sector: 'Information Technology',
    description: 'Largest IT services and consulting company in India'
  },
  'HCLTECH': {
    fullName: 'HCL Technologies Limited',
    sector: 'Information Technology',
    description: 'Global IT services company specializing in digital transformation'
  },
  'BAJAJFINSV': {
    fullName: 'Bajaj Finserv Limited',
    sector: 'Financial Services',
    description: 'Diversified financial services holding company'
  },
  'NESTLEIND': {
    fullName: 'Nestlé India Limited',
    sector: 'FMCG',
    description: 'Leading food and beverage company with brands like Maggi and Nescafé'
  },
  'ULTRACEMCO': {
    fullName: 'UltraTech Cement Limited',
    sector: 'Cement',
    description: 'Largest cement manufacturer in India'
  },
  'JSWSTEEL': {
    fullName: 'JSW Steel Limited',
    sector: 'Metals & Mining',
    description: "India's leading integrated steel manufacturer"
  },
  'MARUTI': {
    fullName: 'Maruti Suzuki India Limited',
    sector: 'Automotive',
    description: 'Largest passenger car manufacturer in India'
  },
  'NTPC': {
    fullName: 'NTPC Limited',
    sector: 'Power Generation',
    description: 'Largest power generation company in India'
  },
  'TECHM': {
    fullName: 'Tech Mahindra Limited',
    sector: 'Information Technology',
    description: 'Leading IT services and consulting provider with telecom expertise'
  },
  'POWERGRID': {
    fullName: 'Power Grid Corporation of India',
    sector: 'Power Transmission',
    description: 'Central transmission utility responsible for national power grid'
  },
  'ADANIPORTS': {
    fullName: 'Adani Ports and SEZ Limited',
    sector: 'Infrastructure',
    description: 'Largest private sector port and logistics company in India'
  },
  'INDIGO': {
    fullName: 'InterGlobe Aviation (IndiGo)',
    sector: 'Aviation',
    description: "India's largest airline by market share and fleet size"
  },
  'SBILIFE': {
    fullName: 'SBI Life Insurance Company',
    sector: 'Insurance',
    description: 'Leading private life insurance company in India'
  },

  // High-risk/Penny stocks
  'Yes Bank': {
    fullName: 'Yes Bank Limited',
    sector: 'Banking & Finance',
    description: 'Private sector bank that faced crisis in 2020, now recovering'
  },
  'Suzlon Energy': {
    fullName: 'Suzlon Energy Limited',
    sector: 'Renewable Energy',
    description: 'Wind turbine manufacturer facing financial challenges'
  },
  'Vodafone Idea': {
    fullName: 'Vodafone Idea Limited',
    sector: 'Telecommunications',
    description: 'Telecom operator struggling with debt and market share loss'
  },
  'Reliance Power': {
    fullName: 'Reliance Power Limited',
    sector: 'Power Generation',
    description: 'Power generation company with execution challenges'
  },
  'Vakrangee': {
    fullName: 'Vakrangee Limited',
    sector: 'Technology',
    description: 'Technology company providing banking and retail solutions'
  },
  'Ksolves India': {
    fullName: 'Ksolves India Limited',
    sector: 'Information Technology',
    description: 'IT services company specializing in cloud and data solutions'
  },
  'Vertoz': {
    fullName: 'Vertoz Advertising Limited',
    sector: 'Digital Marketing',
    description: 'Programmatic advertising and marketing technology company'
  },
  'Jindal Stainless': {
    fullName: 'Jindal Stainless Limited',
    sector: 'Metals & Mining',
    description: 'Leading stainless steel manufacturer in India'
  },

  // Default fallback for any stock not in database
};

// Comprehensive asset information database (includes all tradeable assets)
export const ASSET_INFO_DATABASE: { [key: string]: AssetInfo } = {
  // Include all stocks
  ...STOCK_INFO_DATABASE,

  // Gold Investments
  'Physical_Gold': {
    fullName: 'Physical Gold',
    sector: 'Precious Metals',
    description: 'Traditional gold investment with intrinsic value and inflation hedge properties'
  },
  'Digital_Gold': {
    fullName: 'Digital Gold',
    sector: 'Precious Metals',
    description: 'Modern way to invest in gold with 24K purity, backed by physical gold reserves'
  },

  // Cryptocurrencies
  'BTC': {
    fullName: 'Bitcoin',
    sector: 'Cryptocurrency',
    description: 'First and largest cryptocurrency, decentralized digital currency and store of value'
  },
  'ETH': {
    fullName: 'Ethereum',
    sector: 'Cryptocurrency',
    description: 'Leading smart contract platform and second largest cryptocurrency by market cap'
  },

  // Index Funds
  'NIFTYBEES': {
    fullName: 'Nippon India ETF Nifty BeES',
    sector: 'Index Fund - ETF',
    description: 'India\'s first ETF tracking Nifty 50 index with low expense ratio'
  },
  'SETFNIF50': {
    fullName: 'SBI ETF Nifty 50',
    sector: 'Index Fund - ETF',
    description: 'Exchange-traded fund tracking top 50 large-cap Indian companies'
  },
  'UTINIFTETF': {
    fullName: 'UTI Nifty 50 ETF',
    sector: 'Index Fund - ETF',
    description: 'Passive investment fund mirroring Nifty 50 performance'
  },
  'HDFCNIFETF': {
    fullName: 'HDFC Nifty 50 ETF',
    sector: 'Index Fund - ETF',
    description: 'Low-cost index fund for diversified large-cap exposure'
  },
  'ICICIB22': {
    fullName: 'ICICI Prudential Nifty Next 50 ETF',
    sector: 'Index Fund - ETF',
    description: 'Tracks Nifty Next 50 index featuring emerging blue-chip companies'
  },

  // Mutual Funds
  'SBI_Bluechip': {
    fullName: 'SBI Bluechip Fund',
    sector: 'Mutual Fund - Large Cap',
    description: 'Actively managed large-cap equity fund focusing on established companies'
  },
  'ICICI_Bluechip': {
    fullName: 'ICICI Prudential Bluechip Fund',
    sector: 'Mutual Fund - Large Cap',
    description: 'Large-cap fund investing in fundamentally strong market leaders'
  },
  'Axis_Midcap': {
    fullName: 'Axis Midcap Fund',
    sector: 'Mutual Fund - Mid Cap',
    description: 'Mid-cap focused fund targeting high-growth potential companies'
  },
  'Kotak_Emerging': {
    fullName: 'Kotak Emerging Equity Fund',
    sector: 'Mutual Fund - Mid Cap',
    description: 'Invests in emerging mid-cap companies with strong growth prospects'
  },
  'PGIM_Midcap': {
    fullName: 'PGIM India Midcap Opportunities Fund',
    sector: 'Mutual Fund - Mid Cap',
    description: 'Opportunistic mid-cap fund for capital appreciation'
  },
  'Nippon_SmallCap': {
    fullName: 'Nippon India Small Cap Fund',
    sector: 'Mutual Fund - Small Cap',
    description: 'High-risk, high-reward fund investing in small-cap companies'
  },
  'HDFC_SmallCap': {
    fullName: 'HDFC Small Cap Fund',
    sector: 'Mutual Fund - Small Cap',
    description: 'Small-cap equity fund for aggressive long-term wealth creation'
  },

  // Commodities
  'COTTON': {
    fullName: 'Cotton Futures',
    sector: 'Agricultural Commodity',
    description: 'Natural fiber commodity influenced by weather, demand, and global textile industry'
  },
  'WHEAT': {
    fullName: 'Wheat Futures',
    sector: 'Agricultural Commodity',
    description: 'Essential food grain commodity affected by climate and global food demand'
  },
  'CRUDEOIL_WTI': {
    fullName: 'WTI Crude Oil',
    sector: 'Energy Commodity',
    description: 'West Texas Intermediate crude oil benchmark for US oil prices'
  },
  'SILVER': {
    fullName: 'Silver',
    sector: 'Precious Metals',
    description: 'Industrial and precious metal with dual demand from jewelry and electronics'
  },
  'NATURALGAS': {
    fullName: 'Natural Gas',
    sector: 'Energy Commodity',
    description: 'Clean energy commodity for heating, power generation, and industrial use'
  },
  'COPPER': {
    fullName: 'Copper',
    sector: 'Industrial Metal',
    description: 'Essential industrial metal for construction, electronics, and green energy'
  },
  'BRENT': {
    fullName: 'Brent Crude Oil',
    sector: 'Energy Commodity',
    description: 'International oil benchmark pricing two-thirds of global crude oil'
  },
  'ALUMINIUM': {
    fullName: 'Aluminium',
    sector: 'Industrial Metal',
    description: 'Lightweight metal used in aerospace, automotive, and construction industries'
  },

  // REITs
  'EMBASSY': {
    fullName: 'Embassy Office Parks REIT',
    sector: 'Real Estate Investment Trust',
    description: 'India\'s first REIT, investing in premium commercial office spaces'
  },
  'MINDSPACE': {
    fullName: 'Mindspace Business Parks REIT',
    sector: 'Real Estate Investment Trust',
    description: 'Premium office and business park REIT with presence across major cities'
  },

  // Forex
  'USDINR': {
    fullName: 'US Dollar / Indian Rupee',
    sector: 'Foreign Exchange',
    description: 'Most traded currency pair in India, reflects dollar strength vs rupee'
  },
  'EURINR': {
    fullName: 'Euro / Indian Rupee',
    sector: 'Foreign Exchange',
    description: 'Exchange rate between Euro and Indian Rupee for European trade'
  },
  'GBPINR': {
    fullName: 'British Pound / Indian Rupee',
    sector: 'Foreign Exchange',
    description: 'GBP to INR exchange rate for UK-India trade and investments'
  }
};

// Helper function to get stock info with fallback
export const getStockInfo = (stockSymbol: string): StockInfo => {
  return STOCK_INFO_DATABASE[stockSymbol] || {
    fullName: stockSymbol,
    sector: 'Diversified',
    description: 'Indian equity stock'
  };
};

// Helper function to get any asset info with fallback
export const getAssetInfo = (assetName: string): AssetInfo => {
  return ASSET_INFO_DATABASE[assetName] || {
    fullName: assetName,
    sector: 'Investment',
    description: 'Investment asset'
  };
};
