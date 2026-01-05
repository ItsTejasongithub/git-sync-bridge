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
  'Indo National': {
    fullName: 'Indo National Limited',
    sector: 'Diversified',
    description: 'Multi-business conglomerate with interests in trading and manufacturing'
  },
  'Zee Entertainment': {
    fullName: 'Zee Entertainment Enterprises',
    sector: 'Media & Entertainment',
    description: 'Leading media and entertainment company with TV channels and digital platforms'
  },
  'Ashok Leyland': {
    fullName: 'Ashok Leyland Limited',
    sector: 'Automotive',
    description: 'Major commercial vehicle manufacturer specializing in trucks and buses'
  },
  'ITI Limited': {
    fullName: 'ITI Limited',
    sector: 'Telecommunications Equipment',
    description: 'Public sector telecom equipment manufacturer and IT solutions provider'
  },
  'CESC Limited': {
    fullName: 'CESC Limited',
    sector: 'Power & Utilities',
    description: 'Integrated power utility company serving Kolkata and surrounding areas'
  },
  'Trident': {
    fullName: 'Trident Limited',
    sector: 'Textiles',
    description: 'Leading manufacturer of home textiles, yarn, and paper products'
  },
  'Weizmann': {
    fullName: 'Weizmann Forex Limited',
    sector: 'Financial Services',
    description: 'Foreign exchange and money transfer service provider'
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
  'HFCL': {
    fullName: 'HFCL Limited',
    sector: 'Telecommunications Equipment',
    description: 'Technology enterprise providing telecom and defense equipment solutions'
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
  'Subex': {
    fullName: 'Subex Limited',
    sector: 'Information Technology',
    description: 'Provider of telecom analytics and revenue assurance solutions'
  },
  'UCO Bank': {
    fullName: 'UCO Bank',
    sector: 'Banking & Finance',
    description: 'Public sector bank with pan-India presence and international operations'
  },
  'Jindal Stainless': {
    fullName: 'Jindal Stainless Limited',
    sector: 'Metals & Mining',
    description: 'Leading stainless steel manufacturer in India'
  },
  'Indiabulls Real Estate': {
    fullName: 'Indiabulls Real Estate Limited',
    sector: 'Real Estate',
    description: 'Real estate development company focused on residential and commercial projects'
  },
  'NTPC': {
    fullName: 'NTPC Limited',
    sector: 'Power Generation',
    description: 'Largest power generation company in India'
  },
  'JP Power Ventures': {
    fullName: 'Jaiprakash Power Ventures',
    sector: 'Power Generation',
    description: 'Power generation company with hydroelectric and thermal projects'
  },
  'Saksoft': {
    fullName: 'Saksoft Limited',
    sector: 'Information Technology',
    description: 'IT consulting and solutions company specializing in digital transformation'
  },
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
  'GVK Power & Infra': {
    fullName: 'GVK Power & Infrastructure',
    sector: 'Infrastructure',
    description: 'Infrastructure development company in power, airports, and energy sectors'
  },
  'Vakrangee': {
    fullName: 'Vakrangee Limited',
    sector: 'Technology',
    description: 'Technology company providing banking and retail solutions'
  },
  'TECHM': {
    fullName: 'Tech Mahindra Limited',
    sector: 'Information Technology',
    description: 'Leading IT services and consulting provider with telecom expertise'
  },
  'Vodafone Idea': {
    fullName: 'Vodafone Idea Limited',
    sector: 'Telecommunications',
    description: 'Telecom operator struggling with debt and market share loss'
  },
  'Dish TV India': {
    fullName: 'Dish TV India Limited',
    sector: 'Media & Entertainment',
    description: 'Direct-to-home satellite television service provider'
  },
  'Websol Energy Systems': {
    fullName: 'Websol Energy Systems Limited',
    sector: 'Renewable Energy',
    description: 'Solar cell and module manufacturing company'
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
  'Reliance Power': {
    fullName: 'Reliance Power Limited',
    sector: 'Power Generation',
    description: 'Power generation company with execution challenges'
  },
  'IRB Infrastructure': {
    fullName: 'IRB Infrastructure Developers',
    sector: 'Infrastructure',
    description: 'Leading highway infrastructure developer and toll road operator'
  },
  'Adani Power': {
    fullName: 'Adani Power Limited',
    sector: 'Power Generation',
    description: 'Private thermal power generation company'
  },
  'RattanIndia Power': {
    fullName: 'RattanIndia Power Limited',
    sector: 'Power Generation',
    description: 'Independent power producer with thermal power plants'
  },
  'Hindustan Copper': {
    fullName: 'Hindustan Copper Limited',
    sector: 'Metals & Mining',
    description: 'Public sector copper mining and smelting company'
  },
  'Manappuram Finance': {
    fullName: 'Manappuram Finance Limited',
    sector: 'Financial Services',
    description: 'Gold loan and microfinance services provider'
  },
  'RattanIndia Enterprises': {
    fullName: 'RattanIndia Enterprises Limited',
    sector: 'Diversified',
    description: 'Diversified company with interests in drones, e-vehicles, and fintech'
  },
  'Spacenet Enterprises': {
    fullName: 'Spacenet Enterprises India',
    sector: 'Technology',
    description: 'Satellite and telecom infrastructure services provider'
  },
  'Brightcom Group': {
    fullName: 'Brightcom Group Limited',
    sector: 'Digital Marketing',
    description: 'Digital advertising and marketing technology company'
  },
  'INDIGO': {
    fullName: 'InterGlobe Aviation (IndiGo)',
    sector: 'Aviation',
    description: "India's largest airline by market share and fleet size"
  },
  'Quick Heal Technologies': {
    fullName: 'Quick Heal Technologies Limited',
    sector: 'Information Technology',
    description: 'Cybersecurity solutions provider for individuals and enterprises'
  },
  'PNB Housing Finance': {
    fullName: 'PNB Housing Finance Limited',
    sector: 'Financial Services',
    description: 'Housing finance company providing home loans and related services'
  },
  'Sanginita Chemicals': {
    fullName: 'Sanginita Chemicals Limited',
    sector: 'Chemicals',
    description: 'Specialty chemicals manufacturer for pigments and dyes'
  },
  'NACL Industries': {
    fullName: 'NACL Industries Limited',
    sector: 'Chemicals',
    description: 'Agrochemical and specialty chemical manufacturing company'
  },
  'SBILIFE': {
    fullName: 'SBI Life Insurance Company',
    sector: 'Insurance',
    description: 'Leading private life insurance company in India'
  },
  '5Paisa Capital': {
    fullName: '5Paisa Capital Limited',
    sector: 'Financial Services',
    description: 'Discount brokerage and online trading platform'
  },
  'Vertoz': {
    fullName: 'Vertoz Advertising Limited',
    sector: 'Digital Marketing',
    description: 'Programmatic advertising and marketing technology company'
  },
  'Indostar Capital Finance': {
    fullName: 'IndoStar Capital Finance',
    sector: 'Financial Services',
    description: 'Non-banking finance company focused on SME and vehicle financing'
  },
  'Vinny Overseas': {
    fullName: 'Vinny Overseas Limited',
    sector: 'Textiles',
    description: 'Manufacturer and exporter of home furnishing textiles'
  },
  'Ujjivan Small Finance Bank': {
    fullName: 'Ujjivan Small Finance Bank',
    sector: 'Banking & Finance',
    description: 'Small finance bank focused on microfinance and inclusive banking'
  },
  'Ksolves India': {
    fullName: 'Ksolves India Limited',
    sector: 'Information Technology',
    description: 'IT services company specializing in cloud and data solutions'
  },
  'Railtel Corporation': {
    fullName: 'RailTel Corporation of India',
    sector: 'Telecommunications',
    description: 'Public sector telecom infrastructure provider leveraging railway networks'
  },
  'MTAR Technologies': {
    fullName: 'MTAR Technologies Limited',
    sector: 'Defense & Aerospace',
    description: 'Precision engineering solutions for nuclear, space, and defense sectors'
  },
  'Easy Trip Planners': {
    fullName: 'Easy Trip Planners Limited',
    sector: 'Travel & Hospitality',
    description: 'Online travel company offering flight, hotel, and holiday bookings'
  },
  'One97 Communications (Paytm)': {
    fullName: 'One97 Communications (Paytm)',
    sector: 'Financial Technology',
    description: 'Digital payments and financial services platform'
  },
  'Honasa Consumer': {
    fullName: 'Honasa Consumer Limited',
    sector: 'FMCG',
    description: 'D2C beauty and personal care brand company (Mamaearth, The Derma Co)'
  }
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