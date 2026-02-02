// Educational content and quiz questions for asset categories

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct answer (0-3)
  hint: string;
}

export interface AssetEducationContent {
  category: string;
  title: string;
  description: string;
  questions: QuizQuestion[]; // Multiple questions per category
}

export const ASSET_EDUCATION_DATA: { [key: string]: AssetEducationContent } = {
  // BANKING category combines Savings Account and Fixed Deposit concepts
  // This is shown once at Year 1 when both banking assets unlock together
  'BANKING': {
    category: 'BANKING',
    title: 'Banking: Savings & Fixed Deposits',
    description: 'Banking provides safe ways to store and grow your money. A Savings Account offers easy access with modest interest, while Fixed Deposits (FDs) lock your money for higher guaranteed returns. Both are insured up to ₹5 lakhs by DICGC.',
    questions: [
      {
        question: 'What is the main benefit of a savings account?',
        options: [
          'Tax-free income guaranteed',
          'Safe storage with interest',
          'Double money in 1 year',
          'Highest returns available'
        ],
        correctAnswer: 1,
        hint: 'Think about safety and guaranteed returns!'
      },
      {
        question: 'What happens if you break an FD before maturity?',
        options: [
          'You get bonus interest',
          'You pay a penalty',
          'You lose all money',
          'Nothing happens at all'
        ],
        correctAnswer: 1,
        hint: 'Breaking early comes with a cost!'
      },
      {
        question: 'Which offers higher interest - Savings Account or FD?',
        options: [
          'Savings Account always',
          'Both are exactly same',
          'Fixed Deposit typically',
          'Depends on bank only'
        ],
        correctAnswer: 2,
        hint: 'Locking money for longer pays more!'
      },
      {
        question: 'What is the deposit insurance limit in India?',
        options: [
          'Up to ₹5 lakhs',
          'Up to ₹1 lakh',
          'Unlimited insurance',
          'No insurance exists'
        ],
        correctAnswer: 0,
        hint: 'DICGC provides protection for deposits!'
      },
      {
        question: 'Can you withdraw from a savings account anytime?',
        options: [
          'Only after 6 months',
          'Only on weekdays',
          'Yes, anytime you need',
          'Locked for 1 year'
        ],
        correctAnswer: 2,
        hint: 'Savings accounts offer liquidity!'
      },
      {
        question: 'Which FD tenure typically offers the highest interest rate?',
        options: [
          '3 years or more',
          '1 month only',
          '3 months only',
          '1 year only'
        ],
        correctAnswer: 0,
        hint: 'Longer lock-in means better rates!'
      },
      {
        question: 'Are FD returns guaranteed?',
        options: [
          'Only for government FDs',
          'Depends on stock market',
          'Yes, rate locked at start',
          'No, they fluctuate daily'
        ],
        correctAnswer: 2,
        hint: 'Rate is fixed when you invest!'
      },
      {
        question: 'Who should use banking products like Savings and FDs?',
        options: [
          'Only wealthy individuals',
          'Everyone for emergency funds',
          'Only senior citizens',
          'Only business owners'
        ],
        correctAnswer: 1,
        hint: 'Everyone needs safe savings!'
      },
      {
        question: 'Can you take a loan against your FD?',
        options: [
          'Never allowed legally',
          'Only after 5 years',
          'Yes, up to 80-90% value',
          'Only for senior citizens'
        ],
        correctAnswer: 2,
        hint: 'FDs can be used as collateral!'
      },
      {
        question: 'What type of interest does a savings account typically earn?',
        options: [
          'Very high interest (10%+)',
          'No interest at all',
          'Variable negative interest',
          'Low but stable interest (2.5-4%)'
        ],
        correctAnswer: 3,
        hint: 'Interest is modest but stable!'
      }
    ]
  },

  // Keep individual categories for backwards compatibility (deprecated)
  'SAVINGS_AC': {
    category: 'SAVINGS_AC',
    title: 'Savings Account',
    description: 'A savings account is a basic bank account that allows you to deposit money, keep it safe, and earn a small interest. It provides easy access to your funds whenever needed.',
    questions: [
      {
        question: 'What is the main benefit of a savings account?',
        options: [
          'Tax-free income guaranteed',
          'Safe storage with interest',
          'Double money in 1 year',
          'Highest returns available'
        ],
        correctAnswer: 1,
        hint: 'Think about safety and guaranteed returns!'
      },
      {
        question: 'Can you withdraw money from a savings account at any time?',
        options: [
          'Only after 6 months',
          'Only on weekdays',
          'Yes, anytime you need',
          'Locked for 1 year'
        ],
        correctAnswer: 2,
        hint: 'Savings accounts offer liquidity!'
      },
      {
        question: 'What type of interest does a savings account typically earn?',
        options: [
          'Very high interest (10%+)',
          'No interest at all',
          'Variable negative interest',
          'Low but stable interest'
        ],
        correctAnswer: 3,
        hint: 'Interest is modest but stable!'
      },
      {
        question: 'Is money in a savings account safe?',
        options: [
          'Safe only in private banks',
          'Yes, deposit insurance protects it',
          'No, it can disappear',
          'Only safe above ₹1 lakh'
        ],
        correctAnswer: 1,
        hint: 'Banks provide insurance protection!'
      },
      {
        question: 'What happens to interest in a savings account?',
        options: [
          'You must claim manually',
          'Lost after 1 year',
          'It compounds over time',
          'Paid once annually'
        ],
        correctAnswer: 2,
        hint: 'Interest earns more interest!'
      },
      {
        question: 'Who should use a savings account?',
        options: [
          'Only wealthy individuals',
          'Everyone for emergency funds',
          'Only senior citizens',
          'Only business owners'
        ],
        correctAnswer: 1,
        hint: 'Everyone needs emergency savings!'
      },
      {
        question: 'What is the minimum balance requirement in most savings accounts?',
        options: [
          'Minimum ₹10 lakhs needed',
          'Usually ₹1,000 - ₹10,000',
          'Minimum ₹1 lakh required',
          'No minimum required ever'
        ],
        correctAnswer: 1,
        hint: 'Requirements are typically low!'
      },
      {
        question: 'How does inflation affect savings account returns?',
        options: [
          'Inflation doubles your money',
          'No effect on savings',
          'It may reduce real value',
          'Inflation increases returns'
        ],
        correctAnswer: 2,
        hint: 'Inflation erodes purchasing power!'
      },
      {
        question: 'Can you have multiple savings accounts?',
        options: [
          'Only in different countries',
          'Only if you are married',
          'No, just one per person',
          'Yes, you can have multiple'
        ],
        correctAnswer: 3,
        hint: 'You can diversify across banks!'
      },
      {
        question: 'What is the typical interest rate for savings accounts in India?',
        options: [
          '20% per year',
          '10-15% per year',
          '2.5-4% per year',
          '0.5-1% per year'
        ],
        correctAnswer: 2,
        hint: 'Rates are modest but stable!'
      }
    ]
  },

  'FIXED_DEPOSIT': {
    category: 'FIXED_DEPOSIT',
    title: 'Fixed Deposit (FD)',
    description: 'A Fixed Deposit is a safe investment where you lock your money for a fixed period (3 months, 1 year, or 3 years) and earn guaranteed interest. Higher interest than savings account, but penalty on early withdrawal.',
    questions: [
      {
        question: 'What happens if you break an FD before maturity?',
        options: [
          'You get bonus interest',
          'You pay a penalty',
          'You lose all money',
          'Nothing happens at all'
        ],
        correctAnswer: 1,
        hint: 'Breaking early comes with a cost!'
      },
      {
        question: 'What is the main advantage of a Fixed Deposit?',
        options: [
          'Tax-free income always',
          'Daily withdrawals allowed',
          'High liquidity anytime',
          'Guaranteed fixed returns'
        ],
        correctAnswer: 3,
        hint: 'FDs offer predictable returns!'
      },
      {
        question: 'Which FD tenure typically offers the highest interest rate?',
        options: [
          '3 years or more',
          '1 month only',
          '3 months only',
          '1 year only'
        ],
        correctAnswer: 0,
        hint: 'Longer lock-in means better rates!'
      },
      {
        question: 'Are FD returns guaranteed?',
        options: [
          'Only for government FDs',
          'Depends on stock market',
          'Yes, rate locked at start',
          'No, they fluctuate daily'
        ],
        correctAnswer: 2,
        hint: 'Rate is fixed when you invest!'
      },
      {
        question: 'What is the typical penalty for breaking an FD early?',
        options: [
          'You lose all interest',
          '50% of principal amount',
          'No penalty charged',
          '0.5-2% interest reduction'
        ],
        correctAnswer: 3,
        hint: 'Small penalty on interest rate!'
      },
      {
        question: 'Can you renew an FD automatically after maturity?',
        options: [
          'Only for 1-year FDs',
          'Yes, auto-renewal available',
          'Manual renewal only',
          'Only seniors can renew'
        ],
        correctAnswer: 1,
        hint: 'Auto-renewal is a common feature!'
      },
      {
        question: 'How is FD interest typically paid?',
        options: [
          'Monthly, quarterly, or maturity',
          'Only when you break FD',
          'Daily to your account',
          'Never paid, just added'
        ],
        correctAnswer: 0,
        hint: 'Multiple payout frequency options!'
      },
      {
        question: 'Who offers Fixed Deposits in India?',
        options: [
          'Only stock exchanges',
          'Banks and some NBFCs',
          'Only private companies',
          'Only government offices'
        ],
        correctAnswer: 1,
        hint: 'Multiple institutions offer FDs!'
      },
      {
        question: 'What is the deposit insurance limit for FDs in India?',
        options: [
          'Up to ₹5 lakhs',
          'Up to ₹1 lakh',
          'Unlimited insurance',
          'No insurance exists'
        ],
        correctAnswer: 0,
        hint: 'DICGC provides protection!'
      },
      {
        question: 'Can you take a loan against your FD?',
        options: [
          'Never allowed legally',
          'Only after 5 years',
          'Yes, up to 80-90% value',
          'Only for senior citizens'
        ],
        correctAnswer: 2,
        hint: 'FDs can be used as collateral!'
      }
    ]
  },

  'GOLD': {
    category: 'GOLD',
    title: 'Gold Investment',
    description: 'Gold is a precious metal used as an investment to protect against inflation. You can buy Physical Gold (jewelry, coins) or Digital Gold (online, backed by real gold). Gold traditionally holds value during economic uncertainty.',
    questions: [
      {
        question: 'Why do people invest in gold?',
        options: [
          'To earn high interest',
          'To get monthly income',
          'For quick daily profits',
          'To protect against inflation'
        ],
        correctAnswer: 3,
        hint: 'Gold protects your wealth when prices rise!'
      },
      {
        question: 'What are the two main types of gold investment?',
        options: [
          'Indian and Foreign Gold',
          'Physical and Digital Gold',
          'Old and New Gold',
          'Pure and Mixed Gold'
        ],
        correctAnswer: 1,
        hint: 'You can buy real or online gold!'
      },
      {
        question: 'Does gold provide regular income like dividends?',
        options: [
          'Yes, annual interest payments',
          'Only during festivals',
          'Yes, monthly dividends',
          'No, only price appreciation'
        ],
        correctAnswer: 3,
        hint: 'Gold gains value over time!'
      },
      {
        question: 'When does gold typically perform well?',
        options: [
          'During economic uncertainty',
          'Only during weddings',
          'Never performs well',
          'When stocks are rising'
        ],
        correctAnswer: 0,
        hint: 'Safe haven during crisis!'
      },
      {
        question: 'What is the purity measure for gold?',
        options: [
          'Percentage only',
          'Degrees of temperature',
          'Carats (22K, 24K)',
          'Grams and kilograms'
        ],
        correctAnswer: 2,
        hint: 'Higher number means purer gold!'
      },
      {
        question: 'What storage costs are involved when physical gold is kept in a bank?',
        options: [
          'Government pays storage',
          'Only electricity cost',
          'Locker rent and insurance',
          'No storage costs'
        ],
        correctAnswer: 2,
        hint: 'Security comes at a cost!'
      },
      {
        question: 'What is Digital Gold backed by?',
        options: [
          'Nothing, it is virtual',
          'Government promise only',
          'Cryptocurrency tokens',
          'Physical gold in vaults'
        ],
        correctAnswer: 3,
        hint: 'Real gold secures digital gold!'
      },
      {
        question: 'Can you sell gold easily when needed?',
        options: [
          'Only during business hours',
          'No, very difficult always',
          'Yes, gold is highly liquid',
          'Only to government agencies'
        ],
        correctAnswer: 2,
        hint: 'Gold is easy to convert to cash!'
      },
      {
        question: 'What is making charge on gold jewelry?',
        options: [
          'Storage fee charged',
          'Tax on gold purchases',
          'Delivery charge only',
          'Cost for crafting jewelry'
        ],
        correctAnswer: 3,
        hint: 'Jewelers charge for workmanship!'
      },
      {
        question: 'Which gold investment has lower making charges?',
        options: [
          'Gold coins and bars',
          'Jewelry items',
          'Digital Gold online',
          'All have same charges'
        ],
        correctAnswer: 0,
        hint: 'Simple forms have lower costs!'
      }
    ]
  },

  'STOCKS': {
    category: 'STOCKS',
    title: 'Stock Market',
    description: 'Stocks represent ownership in a company. When you buy shares, you become a part-owner and can profit from company growth. Stock prices fluctuate based on company performance and market conditions. Higher risk but potentially higher returns.',
    questions: [
      {
        question: 'What do you become when you buy stocks?',
        options: [
          'A company employee',
          'A lender to company',
          'A part-owner of company',
          'A customer of company'
        ],
        correctAnswer: 2,
        hint: 'You own a piece of the company!'
      },
      {
        question: 'How do stock investors make money?',
        options: [
          'Only through salary',
          'Government subsidy payments',
          'Monthly fixed interest',
          'Price appreciation and dividends'
        ],
        correctAnswer: 3,
        hint: 'Two ways to profit from stocks!'
      },
      {
        question: 'What makes stock prices go up or down?',
        options: [
          'Number of shareholders',
          'Company performance and sentiment',
          'Time of day',
          'Government orders only'
        ],
        correctAnswer: 1,
        hint: 'Performance and perception matter!'
      },
      {
        question: 'What is a dividend?',
        options: [
          'Share of company profits',
          'Stock purchase fee',
          'Company debt payment',
          'Government tax levy'
        ],
        correctAnswer: 0,
        hint: 'Companies share profits with owners!'
      },
      {
        question: 'What is the risk level of stock investing?',
        options: [
          'Higher risk, higher returns',
          'Same as savings account',
          'No risk at all',
          'Only paperwork risk'
        ],
        correctAnswer: 0,
        hint: 'Risk and reward go together!'
      },
      {
        question: 'Can you lose money in stocks?',
        options: [
          'No, stocks always go up',
          'Only if company closes',
          'Yes, if price falls',
          'Government protects all losses'
        ],
        correctAnswer: 2,
        hint: 'Prices can fall below purchase price!'
      },
      {
        question: 'What does market capitalization mean?',
        options: [
          'CEO salary package',
          'Number of employees',
          'Total value of shares',
          'Company annual profits'
        ],
        correctAnswer: 2,
        hint: 'Total worth of all shares!'
      },
      {
        question: 'What is diversification in stock investing?',
        options: [
          'Buying only one stock',
          'Selling all stocks quickly',
          'Trading every single day',
          'Spreading across multiple stocks'
        ],
        correctAnswer: 3,
        hint: 'Don\'t put all eggs in one basket!'
      },
      {
        question: 'What is a stock exchange?',
        options: [
          'Marketplace for buying/selling stocks',
          'A bank branch',
          'Government office',
          'Company headquarters'
        ],
        correctAnswer: 0,
        hint: 'Where buyers meet sellers!'
      },
      {
        question: 'What does BSE and NSE stand for?',
        options: [
          'Business Sales Enterprise',
          'Basic Stock Establishment',
          'Bank Savings Entity',
          'Bombay/National Stock Exchange'
        ],
        correctAnswer: 3,
        hint: 'India\'s major stock exchanges!'
      }
    ]
  },

  'CRYPTO': {
    category: 'CRYPTO',
    title: 'Cryptocurrency',
    description: 'Cryptocurrencies like Bitcoin (BTC) and Ethereum (ETH) are digital currencies that operate on blockchain technology. They are highly volatile and speculative investments. Not regulated like traditional assets.',
    questions: [
      {
        question: 'What is the main characteristic of cryptocurrency?',
        options: [
          'Government backing',
          'Guaranteed returns',
          'High volatility and risk',
          'Fixed interest rate'
        ],
        correctAnswer: 2,
        hint: 'Crypto prices can swing wildly!'
      },
      {
        question: 'What technology powers cryptocurrency?',
        options: [
          'Traditional banking system',
          'Paper currency system',
          'Blockchain technology',
          'Gold standard backing'
        ],
        correctAnswer: 2,
        hint: 'Distributed ledger technology!'
      },
      {
        question: 'Is cryptocurrency regulated in India?',
        options: [
          'Yes, fully like banks',
          'Only Bitcoin is regulated',
          'No regulation exists',
          'Partially, taxation applied'
        ],
        correctAnswer: 3,
        hint: 'Gray area with tax implications!'
      },
      {
        question: 'What is Bitcoin?',
        options: [
          'A traditional bank',
          'First famous cryptocurrency',
          'A stock exchange',
          'Government currency'
        ],
        correctAnswer: 1,
        hint: 'The original crypto pioneer!'
      },
      {
        question: 'Can cryptocurrency prices crash suddenly?',
        options: [
          'No, prices are stable',
          'Only during weekends',
          'Government protects prices',
          'Yes, extreme volatility common'
        ],
        correctAnswer: 3,
        hint: 'High risk, high reward asset!'
      },
      {
        question: 'Where do you store cryptocurrency?',
        options: [
          'In a digital wallet',
          'In a bank account',
          'In a physical safe',
          'In government treasury'
        ],
        correctAnswer: 0,
        hint: 'Digital assets need digital storage!'
      },
      {
        question: 'What is crypto mining?',
        options: [
          'Buying crypto on exchange',
          'Government printing money',
          'Digging for gold underground',
          'Validating transactions for coins'
        ],
        correctAnswer: 3,
        hint: 'Computational work for rewards!'
      },
      {
        question: 'Are cryptocurrency transactions anonymous?',
        options: [
          'Completely anonymous always',
          'Only government can see',
          'Pseudonymous - traceable',
          'Fully public with names'
        ],
        correctAnswer: 2,
        hint: 'Public ledger, private identity!'
      },
      {
        question: 'What is the maximum supply of Bitcoin?',
        options: [
          'Unlimited supply',
          '100 million coins',
          'Changes every year',
          '21 million coins'
        ],
        correctAnswer: 3,
        hint: 'Limited supply creates scarcity!'
      },
      {
        question: 'Should beginners invest heavily in cryptocurrency?',
        options: [
          'Yes, guaranteed profits',
          'Only if friends recommend',
          'No, only affordable losses',
          'Yes, invest all savings'
        ],
        correctAnswer: 2,
        hint: 'High risk means caution needed!'
      }
    ]
  },

  'COMMODITY': {
    category: 'COMMODITY',
    title: 'Commodities',
    description: 'Commodities are raw materials like Cotton, Wheat, Crude Oil, Silver, Natural Gas, Copper, and Aluminium. Their prices depend on global demand, weather, and economic conditions. Used for diversification and hedging against inflation.',
    questions: [
      {
        question: 'What are commodities?',
        options: [
          'Company stocks',
          'Digital currencies',
          'Raw materials like metals',
          'Bank deposits'
        ],
        correctAnswer: 2,
        hint: 'Think about physical resources!'
      },
      {
        question: 'What factors affect commodity prices?',
        options: [
          'Only time of day',
          'Number of investors',
          'Government orders only',
          'Demand, weather, economy'
        ],
        correctAnswer: 3,
        hint: 'Multiple real-world factors!'
      },
      {
        question: 'Which is an example of an agricultural commodity?',
        options: [
          'Wheat and Cotton',
          'Bitcoin token',
          'Gold jewelry',
          'Real estate'
        ],
        correctAnswer: 0,
        hint: 'Grown on farms!'
      },
      {
        question: 'Which is an example of an energy commodity?',
        options: [
          'Silver metal',
          'Company stocks',
          'Crude Oil and Gas',
          'Wheat crops'
        ],
        correctAnswer: 2,
        hint: 'Powers vehicles and homes!'
      },
      {
        question: 'How do investors typically trade commodities?',
        options: [
          'Only at grocery stores',
          'Cannot be traded',
          'By physically storing them',
          'Through futures contracts'
        ],
        correctAnswer: 3,
        hint: 'Standardized contracts on exchanges!'
      },
      {
        question: 'What is a metal commodity example?',
        options: [
          'Cotton fabric',
          'Bitcoin digital',
          'Copper and Aluminium',
          'Crude Oil'
        ],
        correctAnswer: 2,
        hint: 'Industrial metals!'
      },
      {
        question: 'Why invest in commodities?',
        options: [
          'Guaranteed daily income',
          'Diversification and inflation hedge',
          'No risk involved',
          'Tax-free returns always'
        ],
        correctAnswer: 1,
        hint: 'Protection during inflation!'
      },
      {
        question: 'What can affect agricultural commodity prices?',
        options: [
          'Only government policy',
          'Weather and crop yields',
          'Stock market only',
          'Interest rates only'
        ],
        correctAnswer: 1,
        hint: 'Nature plays a big role!'
      },
      {
        question: 'Are commodity prices stable?',
        options: [
          'Yes, never change',
          'Government fixes all prices',
          'Only change annually',
          'No, they can be volatile'
        ],
        correctAnswer: 3,
        hint: 'Supply and demand fluctuate!'
      },
      {
        question: 'What is crude oil used for?',
        options: [
          'Only decoration purposes',
          'Fuel, plastics, products',
          'Building houses',
          'Making jewelry'
        ],
        correctAnswer: 1,
        hint: 'Essential for modern economy!'
      }
    ]
  },

  'INDEX_FUND': {
    category: 'INDEX_FUND',
    title: 'Index Funds',
    description: 'Index Funds (ETFs) are passive investments that track market indices like Nifty 50. They provide instant diversification by investing in multiple companies at once. Low fees and less risky than individual stocks.',
    questions: [
      {
        question: 'What is the main advantage of index funds?',
        options: [
          'Guaranteed high returns',
          'Daily fixed income',
          'No market risk',
          'Diversification across companies'
        ],
        correctAnswer: 3,
        hint: 'Don\'t put all eggs in one basket!'
      },
      {
        question: 'What does an index fund track?',
        options: [
          'A single company',
          'Gold prices only',
          'Market indices like Nifty',
          'Fixed deposit rates'
        ],
        correctAnswer: 2,
        hint: 'Follows the whole market index!'
      },
      {
        question: 'What is the Nifty 50?',
        options: [
          'A savings account',
          'Index of top 50 companies',
          'A single stock',
          'A government bond'
        ],
        correctAnswer: 1,
        hint: 'Top companies tracked together!'
      },
      {
        question: 'Are index funds actively or passively managed?',
        options: [
          'Passively to track index',
          'Actively by fund managers',
          'Not managed at all',
          'Only government manages'
        ],
        correctAnswer: 0,
        hint: 'Just follows the index automatically!'
      },
      {
        question: 'What are the fees like for index funds?',
        options: [
          'Very high fees',
          'Fees change daily',
          'Lower than active funds',
          'No fees at all'
        ],
        correctAnswer: 2,
        hint: 'Passive management means lower costs!'
      },
      {
        question: 'Can you lose money in index funds?',
        options: [
          'No, they are risk-free',
          'Government protects all losses',
          'Only during weekends',
          'Yes, if market falls'
        ],
        correctAnswer: 3,
        hint: 'Market risk still exists!'
      },
      {
        question: 'What is an ETF?',
        options: [
          'Exchange Traded Fund',
          'A savings account',
          'A government scheme',
          'A cryptocurrency'
        ],
        correctAnswer: 0,
        hint: 'Traded on exchanges like stocks!'
      },
      {
        question: 'Who should invest in index funds?',
        options: [
          'Only experts traders',
          'Only wealthy people',
          'Only senior citizens',
          'Beginners and long-term investors'
        ],
        correctAnswer: 3,
        hint: 'Great for passive investors!'
      },
      {
        question: 'How many companies do you own in a Nifty 50 index fund?',
        options: [
          'Only 1 company',
          'All 50 companies',
          '5 companies',
          '100 companies'
        ],
        correctAnswer: 1,
        hint: 'Own a piece of all 50!'
      },
      {
        question: 'Can index funds outperform the market?',
        options: [
          'Yes, always beat market',
          'No, aim to match returns',
          'Only in bull markets',
          'Depends on weather'
        ],
        correctAnswer: 1,
        hint: 'Goal is to match, not beat!'
      }
    ]
  },

  'MUTUAL_FUND': {
    category: 'MUTUAL_FUND',
    title: 'Mutual Funds',
    description: 'Mutual Funds pool money from many investors to invest in stocks, bonds, or other assets. Professional fund managers make investment decisions. Suitable for investors who don\'t want to pick individual stocks.',
    questions: [
      {
        question: 'Who manages mutual funds?',
        options: [
          'The investors themselves',
          'Bank managers',
          'Government officials',
          'Professional fund managers'
        ],
        correctAnswer: 3,
        hint: 'Experts handle your investments!'
      },
      {
        question: 'What is a mutual fund?',
        options: [
          'Pooled money by professionals',
          'A single stock',
          'A savings account',
          'A cryptocurrency'
        ],
        correctAnswer: 0,
        hint: 'Many investors pooling together!'
      },
      {
        question: 'What do mutual funds invest in?',
        options: [
          'Only gold metal',
          'Only real estate',
          'Only government schemes',
          'Stocks, bonds, assets'
        ],
        correctAnswer: 3,
        hint: 'Diversified portfolio of assets!'
      },
      {
        question: 'What is NAV in mutual funds?',
        options: [
          'Name of manager',
          'Number of investors',
          'Net Asset Value',
          'New Account Value'
        ],
        correctAnswer: 2,
        hint: 'Price of one unit of the fund!'
      },
      {
        question: 'What is an equity mutual fund?',
        options: [
          'Invests in stocks primarily',
          'Invests only in gold',
          'Invests only in FDs',
          'Invests in real estate'
        ],
        correctAnswer: 0,
        hint: 'Stock market focused fund!'
      },
      {
        question: 'What is a debt mutual fund?',
        options: [
          'Invests in stocks',
          'Lends to friends',
          'Invests in cryptocurrencies',
          'Invests in bonds'
        ],
        correctAnswer: 3,
        hint: 'Lower risk fixed income!'
      },
      {
        question: 'Can you start a mutual fund SIP with small amounts?',
        options: [
          'No, ₹1 lakh minimum',
          'Minimum ₹10 lakhs',
          'Only lumpsum allowed',
          'Yes, ₹500-₹1000 start'
        ],
        correctAnswer: 3,
        hint: 'Accessible for small investors!'
      },
      {
        question: 'What is SIP in mutual funds?',
        options: [
          'Savings Interest Plan',
          'Stock Investment Portfolio',
          'Systematic Investment Plan',
          'Special Insurance Policy'
        ],
        correctAnswer: 2,
        hint: 'Regular monthly investments!'
      },
      {
        question: 'Are mutual fund returns guaranteed?',
        options: [
          'Yes, always guaranteed',
          'Only debt funds guaranteed',
          'Government guarantees all',
          'No, market-linked'
        ],
        correctAnswer: 3,
        hint: 'Market-linked, not guaranteed!'
      },
      {
        question: 'What is an expense ratio?',
        options: [
          'Your investment amount',
          'Your profit percentage',
          'Government tax rate',
          'Annual fund fee'
        ],
        correctAnswer: 3,
        hint: 'Cost of managing the fund!'
      }
    ]
  },

  'REIT': {
    category: 'REIT',
    title: 'Real Estate Investment Trust (REIT)',
    description: 'REITs allow you to invest in commercial real estate (office buildings, business parks) without buying property directly. They provide regular rental income and potential property value appreciation.',
    questions: [
      {
        question: 'What does a REIT invest in?',
        options: [
          'Gold and silver',
          'Stock market',
          'Commercial real estate',
          'Cryptocurrency'
        ],
        correctAnswer: 2,
        hint: 'Think about buildings and property!'
      },
      {
        question: 'What is a REIT?',
        options: [
          'A type of stock',
          'Retirement Income Tax',
          'A mutual fund',
          'Real Estate Investment Trust'
        ],
        correctAnswer: 3,
        hint: 'Invest in real estate collectively!'
      },
      {
        question: 'Can you invest in real estate without buying property?',
        options: [
          'No, must buy property',
          'Only through gold',
          'Yes, through REITs',
          'Only for rich people'
        ],
        correctAnswer: 2,
        hint: 'REITs make real estate accessible!'
      },
      {
        question: 'What type of properties do REITs typically own?',
        options: [
          'Only residential homes',
          'Only agricultural land',
          'Only parking lots',
          'Commercial properties'
        ],
        correctAnswer: 3,
        hint: 'Business and commercial spaces!'
      },
      {
        question: 'How do REIT investors make money?',
        options: [
          'Only from sale',
          'Government grants',
          'Rental income and appreciation',
          'Fixed interest only'
        ],
        correctAnswer: 2,
        hint: 'Rent and value growth!'
      },
      {
        question: 'Are REITs traded on stock exchanges?',
        options: [
          'No, only private',
          'Only on weekends',
          'Yes, publicly traded',
          'Only to government'
        ],
        correctAnswer: 2,
        hint: 'Can buy and sell like stocks!'
      },
      {
        question: 'What is the minimum investment for REITs?',
        options: [
          'Must buy entire building',
          'Can start with small amounts',
          'Minimum ₹1 crore',
          'Only for companies'
        ],
        correctAnswer: 1,
        hint: 'Affordable for retail investors!'
      },
      {
        question: 'Do REITs provide regular income?',
        options: [
          'No income, only gains',
          'Yes, distribute rental income',
          'Only annual income',
          'No income at all'
        ],
        correctAnswer: 1,
        hint: 'Rental income passed to investors!'
      },
      {
        question: 'What percentage of income must REITs distribute?',
        options: [
          'No requirement exists',
          'Typically 90% or more',
          '10% only',
          '50% maximum'
        ],
        correctAnswer: 1,
        hint: 'Most income goes to investors!'
      },
      {
        question: 'Are REITs more liquid than physical property?',
        options: [
          'Yes, easier to trade',
          'No, same liquidity',
          'Less liquid than property',
          'Cannot be sold'
        ],
        correctAnswer: 0,
        hint: 'Traded easily on exchanges!'
      }
    ]
  }
};

// Helper function to get education content for a category
export const getEducationContent = (category: string): AssetEducationContent | null => {
  return ASSET_EDUCATION_DATA[category] || null;
};

// Helper function to get a random question for a category
export const getRandomQuestion = (category: string): QuizQuestion | null => {
  const content = ASSET_EDUCATION_DATA[category];
  if (!content || !content.questions || content.questions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * content.questions.length);
  return content.questions[randomIndex];
};

// Helper function to generate a random question set for all categories
// Returns a map of category -> question index for consistency across multiplayer
export const generateQuestionIndices = (): { [category: string]: number } => {
  const indices: { [category: string]: number } = {};

  Object.keys(ASSET_EDUCATION_DATA).forEach(category => {
    const content = ASSET_EDUCATION_DATA[category];
    if (content.questions && content.questions.length > 0) {
      indices[category] = Math.floor(Math.random() * content.questions.length);
    }
  });

  return indices;
};

// Helper function to get a specific question by index
export const getQuestionByIndex = (category: string, index: number): QuizQuestion | null => {
  const content = ASSET_EDUCATION_DATA[category];
  if (!content || !content.questions || index < 0 || index >= content.questions.length) {
    return null;
  }

  return content.questions[index];
};
