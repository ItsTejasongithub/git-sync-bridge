// Banking transaction tracking utility for comprehensive financial analysis

export interface BankingLog {
  id: string;
  transactionType: 'deposit' | 'withdrawal' | 'fd_investment' | 'fd_maturity' | 'fd_break';
  subType?: string;
  amount: number;
  balanceAfter: number;
  fdId?: string;
  fdDurationMonths?: number;
  interestRate?: number;
  maturityAmount?: number;
  penaltyAmount?: number;
  remarks?: string;
  gameYear: number;
  gameMonth: number;
  timestamp: number;
}

class BankingTracker {
  private bankingLogs: BankingLog[] = [];

  logTransaction(transaction: Omit<BankingLog, 'id'>) {
    const logWithId: BankingLog = {
      ...transaction,
      id: `${transaction.timestamp}_${transaction.transactionType}`,
    };

    this.bankingLogs.push(logWithId);
  }

  logDeposit(amount: number, balanceAfter: number, gameYear: number, gameMonth: number, remarks?: string) {
    this.logTransaction({
      transactionType: 'deposit',
      subType: remarks || 'manual_deposit',
      amount,
      balanceAfter,
      gameYear,
      gameMonth,
      timestamp: Date.now(),
      remarks,
    });
  }

  logWithdrawal(amount: number, balanceAfter: number, gameYear: number, gameMonth: number, remarks?: string) {
    this.logTransaction({
      transactionType: 'withdrawal',
      subType: remarks || 'manual_withdrawal',
      amount,
      balanceAfter,
      gameYear,
      gameMonth,
      timestamp: Date.now(),
      remarks,
    });
  }

  logFDInvestment(
    fdId: string,
    amount: number,
    durationMonths: 3 | 12 | 36,
    interestRate: number,
    balanceAfter: number,
    gameYear: number,
    gameMonth: number
  ) {
    this.logTransaction({
      transactionType: 'fd_investment',
      subType: `fd_${durationMonths}_month`,
      amount,
      balanceAfter,
      fdId,
      fdDurationMonths: durationMonths,
      interestRate,
      gameYear,
      gameMonth,
      timestamp: Date.now(),
      remarks: `FD Investment - ${durationMonths} months at ${interestRate.toFixed(2)}%`,
    });
  }

  logFDMaturity(
    fdId: string,
    investedAmount: number,
    maturityAmount: number,
    balanceAfter: number,
    gameYear: number,
    gameMonth: number
  ) {
    const interestEarned = maturityAmount - investedAmount;
    this.logTransaction({
      transactionType: 'fd_maturity',
      subType: 'fd_maturity',
      amount: interestEarned, // Interest earned
      balanceAfter,
      fdId,
      maturityAmount,
      gameYear,
      gameMonth,
      timestamp: Date.now(),
      remarks: `FD Matured - Principal: ₹${investedAmount.toFixed(2)}, Interest: ₹${interestEarned.toFixed(2)}`,
    });
  }

  logFDBreak(
    fdId: string,
    investedAmount: number,
    receivedAmount: number,
    penaltyAmount: number,
    balanceAfter: number,
    gameYear: number,
    gameMonth: number
  ) {
    this.logTransaction({
      transactionType: 'fd_break',
      subType: 'premature_fd_break',
      amount: penaltyAmount, // The loss/penalty
      balanceAfter,
      fdId,
      penaltyAmount,
      maturityAmount: receivedAmount, // What they got back
      gameYear,
      gameMonth,
      timestamp: Date.now(),
      remarks: `FD Broken Prematurely - Principal: ₹${investedAmount.toFixed(2)}, Received: ₹${receivedAmount.toFixed(2)}, Penalty: ₹${penaltyAmount.toFixed(2)}`,
    });
  }

  getBankingLogs(): BankingLog[] {
    return [...this.bankingLogs];
  }

  getBankingLogsCount(): number {
    return this.bankingLogs.length;
  }

  getBankingSummary() {
    const summary = {
      totalTransactions: this.bankingLogs.length,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalFDInvestments: 0,
      totalFDMaturityReceived: 0,
      totalPenalties: 0,
      totalInterestEarned: 0,
      fdInvestmentCount: 0,
      fdMaturedCount: 0,
      fdBrokenCount: 0,
      depositWithdrawalRatio: 0,
      fdBreakRate: 0,
    };

    for (const log of this.bankingLogs) {
      if (log.transactionType === 'deposit') {
        summary.totalDeposits += log.amount;
      } else if (log.transactionType === 'withdrawal') {
        summary.totalWithdrawals += log.amount;
      } else if (log.transactionType === 'fd_investment') {
        summary.totalFDInvestments += log.amount;
        summary.fdInvestmentCount++;
      } else if (log.transactionType === 'fd_maturity') {
        summary.totalFDMaturityReceived += (log.maturityAmount || 0);
        summary.totalInterestEarned += log.amount; // amount = interest earned
        summary.fdMaturedCount++;
      } else if (log.transactionType === 'fd_break') {
        summary.totalPenalties += (log.penaltyAmount || 0);
        summary.fdBrokenCount++;
      }
    }

    // Calculate ratios
    if (summary.totalDeposits + summary.totalWithdrawals > 0) {
      summary.depositWithdrawalRatio = summary.totalDeposits / (summary.totalDeposits + summary.totalWithdrawals);
    }

    if (summary.fdInvestmentCount > 0) {
      summary.fdBreakRate = summary.fdBrokenCount / summary.fdInvestmentCount;
    }

    return summary;
  }

  /**
   * Analyze banking behavior and discipline
   */
  analyzeBankingBehavior() {
    const summary = this.getBankingSummary();

    const behavior = {
      savingsDisposition: 'unknown' as 'saver' | 'spender' | 'balanced' | 'unknown',
      fdCommitment: 'unknown' as 'strong' | 'moderate' | 'weak' | 'none' | 'unknown',
      bankingDiscipline: 'unknown' as 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown',
      riskTaking: 'unknown' as 'high' | 'moderate' | 'low' | 'unknown',
      fdLockInTolerance: 'unknown' as 'high' | 'moderate' | 'low' | 'unknown',
      savingsRate: 0,
      penaltyIncidence: 0,
      interestEarned: summary.totalInterestEarned,
    };

    // Savings disposition
    const totalMovement = summary.totalDeposits + summary.totalWithdrawals;
    if (totalMovement > 0) {
      const savingsRate = summary.totalDeposits / totalMovement;
      behavior.savingsRate = savingsRate;
      if (savingsRate > 0.7) behavior.savingsDisposition = 'saver';
      else if (savingsRate > 0.4) behavior.savingsDisposition = 'balanced';
      else behavior.savingsDisposition = 'spender';
    }

    // FD commitment
    if (summary.fdInvestmentCount === 0) {
      behavior.fdCommitment = 'none';
    } else if (summary.fdInvestmentCount >= 5) {
      behavior.fdCommitment = 'strong';
    } else if (summary.fdInvestmentCount >= 2) {
      behavior.fdCommitment = 'moderate';
    } else {
      behavior.fdCommitment = 'weak';
    }

    // FD lock-in tolerance (inverse of break rate)
    if (summary.fdBreakRate === 0 && summary.fdInvestmentCount > 0) {
      behavior.fdLockInTolerance = 'high';
    } else if (summary.fdBreakRate < 0.25) {
      behavior.fdLockInTolerance = 'high';
    } else if (summary.fdBreakRate < 0.5) {
      behavior.fdLockInTolerance = 'moderate';
    } else {
      behavior.fdLockInTolerance = 'low';
    }

    // Banking discipline (combination of savings rate and FD commitment)
    if (behavior.savingsDisposition === 'saver' && behavior.fdCommitment !== 'none') {
      behavior.bankingDiscipline = 'excellent';
    } else if (behavior.savingsDisposition !== 'spender' && behavior.fdCommitment !== 'none') {
      behavior.bankingDiscipline = 'good';
    } else if (behavior.savingsDisposition === 'balanced' || behavior.fdCommitment === 'weak') {
      behavior.bankingDiscipline = 'moderate';
    } else {
      behavior.bankingDiscipline = 'poor';
    }

    // Risk taking (FD break incidence)
    behavior.penaltyIncidence = summary.fdBreakRate;
    if (summary.fdBreakRate > 0.5) {
      behavior.riskTaking = 'high';
    } else if (summary.fdBreakRate > 0.2) {
      behavior.riskTaking = 'moderate';
    } else {
      behavior.riskTaking = 'low';
    }

    return behavior;
  }

  clearBankingLogs() {
    this.bankingLogs = [];
  }
}

// Singleton instance
export const bankingTracker = new BankingTracker();
