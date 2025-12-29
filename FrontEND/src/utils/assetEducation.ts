// Educational content and quiz questions for asset categories

export interface AssetEducationContent {
  category: string;
  title: string;
  description: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct answer (0-3)
  hint: string;
}

export const ASSET_EDUCATION_DATA: { [key: string]: AssetEducationContent } = {
  'SAVINGS_AC': {
    category: 'SAVINGS_AC',
    title: 'Savings Account',
    description: 'A savings account is a basic bank account that allows you to deposit money, keep it safe, and earn a small interest. It provides easy access to your funds whenever needed.',
    question: 'What is the main benefit of a savings account?',
    options: [
      'High returns and growth',
      'Safe storage with guaranteed interest',
      'Tax-free income',
      'Double your money quickly'
    ],
    correctAnswer: 1,
    hint: 'Think about safety and guaranteed returns!'
  },

  'FIXED_DEPOSIT': {
    category: 'FIXED_DEPOSIT',
    title: 'Fixed Deposit (FD)',
    description: 'A Fixed Deposit is a safe investment where you lock your money for a fixed period (3 months, 1 year, or 3 years) and earn guaranteed interest. Higher interest than savings account, but penalty on early withdrawal.',
    question: 'What happens if you break an FD before maturity?',
    options: [
      'You get bonus interest',
      'Nothing happens',
      'You pay a penalty',
      'You lose all money'
    ],
    correctAnswer: 2,
    hint: 'Breaking early comes with a cost!'
  },

  'GOLD': {
    category: 'GOLD',
    title: 'Gold Investment',
    description: 'Gold is a precious metal used as an investment to protect against inflation. You can buy Physical Gold (jewelry, coins) or Digital Gold (online, backed by real gold). Gold traditionally holds value during economic uncertainty.',
    question: 'Why do people invest in gold?',
    options: [
      'To get monthly income',
      'To protect against inflation',
      'To earn high interest',
      'For quick profits'
    ],
    correctAnswer: 1,
    hint: 'Gold protects your wealth when prices rise!'
  },

  'STOCKS': {
    category: 'STOCKS',
    title: 'Stock Market',
    description: 'Stocks represent ownership in a company. When you buy shares, you become a part-owner and can profit from company growth. Stock prices fluctuate based on company performance and market conditions. Higher risk but potentially higher returns.',
    question: 'What do you become when you buy stocks?',
    options: [
      'A company employee',
      'A part-owner of the company',
      'A lender to the company',
      'A customer of the company'
    ],
    correctAnswer: 1,
    hint: 'You own a piece of the company!'
  },

  'CRYPTO': {
    category: 'CRYPTO',
    title: 'Cryptocurrency',
    description: 'Cryptocurrencies like Bitcoin (BTC) and Ethereum (ETH) are digital currencies that operate on blockchain technology. They are highly volatile and speculative investments. Not regulated like traditional assets.',
    question: 'What is the main characteristic of cryptocurrency?',
    options: [
      'Guaranteed returns',
      'Government backing',
      'High volatility and risk',
      'Fixed interest rate'
    ],
    correctAnswer: 2,
    hint: 'Crypto prices can swing wildly!'
  },

  'COMMODITY': {
    category: 'COMMODITY',
    title: 'Commodities',
    description: 'Commodities are raw materials like Cotton, Wheat, Crude Oil, Silver, Natural Gas, Copper, and Aluminium. Their prices depend on global demand, weather, and economic conditions. Used for diversification and hedging against inflation.',
    question: 'What are commodities?',
    options: [
      'Company stocks',
      'Bank deposits',
      'Raw materials like oil and metals',
      'Digital currencies'
    ],
    correctAnswer: 2,
    hint: 'Think about physical resources!'
  },

  'INDEX_FUND': {
    category: 'INDEX_FUND',
    title: 'Index Funds',
    description: 'Index Funds (ETFs) are passive investments that track market indices like Nifty 50. They provide instant diversification by investing in multiple companies at once. Low fees and less risky than individual stocks.',
    question: 'What is the main advantage of index funds?',
    options: [
      'Guaranteed high returns',
      'Diversification across many companies',
      'No market risk',
      'Daily fixed income'
    ],
    correctAnswer: 1,
    hint: 'Don\'t put all eggs in one basket!'
  },

  'MUTUAL_FUND': {
    category: 'MUTUAL_FUND',
    title: 'Mutual Funds',
    description: 'Mutual Funds pool money from many investors to invest in stocks, bonds, or other assets. Professional fund managers make investment decisions. Suitable for investors who don\'t want to pick individual stocks.',
    question: 'Who manages mutual funds?',
    options: [
      'The investors themselves',
      'Bank managers',
      'Professional fund managers',
      'Government officials'
    ],
    correctAnswer: 2,
    hint: 'Experts handle your investments!'
  },

  'REIT': {
    category: 'REIT',
    title: 'Real Estate Investment Trust (REIT)',
    description: 'REITs allow you to invest in commercial real estate (office buildings, business parks) without buying property directly. They provide regular rental income and potential property value appreciation.',
    question: 'What does a REIT invest in?',
    options: [
      'Gold and silver',
      'Stock market',
      'Commercial real estate',
      'Cryptocurrency'
    ],
    correctAnswer: 2,
    hint: 'Think about buildings and property!'
  }
};

// Helper function to get education content for a category
export const getEducationContent = (category: string): AssetEducationContent | null => {
  return ASSET_EDUCATION_DATA[category] || null;
};
