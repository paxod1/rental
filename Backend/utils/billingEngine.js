// utils/billingEngine.js - BULLETPROOF BILLING SYSTEM
const moment = require('moment');

class RentalBillingEngine {
  constructor() {
    this.debugMode = true; // Set to false in production
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`🧮 BILLING: ${message}`, data || '');
    }
  }

  /**
   * Calculate days between two dates (inclusive)
   */
  calculateDays(startDate, endDate) {
    const start = moment(startDate).startOf('day');
    const end = moment(endDate).startOf('day');
    const days = end.diff(start, 'days') + 1; // +1 for inclusive
    
    this.log(`Days calculation: ${start.format('DD/MM/YYYY')} to ${end.format('DD/MM/YYYY')} = ${days} days`);
    return Math.max(1, days); // Minimum 1 day
  }

  /**
   * Convert rate to daily rate
   */
  getDailyRate(rate, rateType) {
    let dailyRate;
    switch (rateType.toLowerCase()) {
      case 'daily':
        dailyRate = rate;
        break;
      case 'weekly':
        dailyRate = rate / 7;
        break;
      case 'monthly':
        dailyRate = rate / 30;
        break;
      default:
        dailyRate = rate;
    }
    
    this.log(`Rate conversion: ₹${rate}/${rateType} = ₹${dailyRate}/daily`);
    return dailyRate;
  }

  /**
   * Calculate rental batches from transactions (MANUAL METHOD)
   */
  calculateRentalBatches(transactions, productId) {
    const batches = [];
    let runningQuantity = 0;

    // Sort transactions by date
    const sortedTransactions = transactions
      .filter(t => t.productId && t.productId.toString() === productId.toString())
      .sort((a, b) => moment(a.date).diff(moment(b.date)));

    this.log(`Processing ${sortedTransactions.length} transactions for product ${productId}`);

    for (const transaction of sortedTransactions) {
      const transactionDate = moment(transaction.date);

      if (transaction.type === 'rental') {
        // Add new rental batch
        batches.push({
          id: transaction._id || `batch_${Date.now()}_${Math.random()}`,
          startDate: transactionDate.toDate(),
          originalQuantity: transaction.quantity,
          currentQuantity: transaction.quantity,
          dailyRate: this.getDailyRate(transaction.rate || 0, transaction.rateType || 'daily'),
          transactions: [transaction]
        });
        
        runningQuantity += transaction.quantity;
        this.log(`Added rental batch: ${transaction.quantity} units from ${transactionDate.format('DD/MM/YYYY')}`);
        
      } else if (transaction.type === 'return' || transaction.type === 'partial_return') {
        // Process return by reducing from batches (MANUAL ALLOCATION)
        let remainingToReturn = transaction.quantity;
        
        // Return from oldest batches first (but manually calculated, not FIFO complexity)
        for (const batch of batches) {
          if (remainingToReturn <= 0 || batch.currentQuantity <= 0) continue;
          
          const returnFromThisBatch = Math.min(remainingToReturn, batch.currentQuantity);
          batch.currentQuantity -= returnFromThisBatch;
          remainingToReturn -= returnFromThisBatch;
          
          this.log(`Returned ${returnFromThisBatch} units from batch starting ${moment(batch.startDate).format('DD/MM/YYYY')}`);
        }
        
        runningQuantity -= transaction.quantity;
      }
    }

    return { batches, currentQuantity: runningQuantity };
  }

  /**
   * Calculate product amount - MAIN CALCULATION METHOD
   */
  calculateProductAmount(transactions, productId, calculateToDate = null) {
    const calculationDate = calculateToDate ? moment(calculateToDate) : moment();
    
    this.log(`\n🎯 CALCULATING AMOUNT FOR PRODUCT ${productId}`);
    this.log(`Calculation date: ${calculationDate.format('DD/MM/YYYY HH:mm')}`);

    const { batches, currentQuantity } = this.calculateRentalBatches(transactions, productId);
    
    let totalAmount = 0;
    const breakdown = [];

    // Calculate amount for each batch
    for (const batch of batches) {
      if (batch.currentQuantity <= 0) continue; // Skip fully returned batches
      
      const batchStartDate = moment(batch.startDate);
      const daysUsed = this.calculateDays(batchStartDate.toDate(), calculationDate.toDate());
      const batchAmount = batch.currentQuantity * daysUsed * batch.dailyRate;
      
      totalAmount += batchAmount;
      
      breakdown.push({
        batchId: batch.id,
        startDate: batchStartDate.format('DD/MM/YYYY'),
        quantity: batch.currentQuantity,
        daysUsed: daysUsed,
        dailyRate: batch.dailyRate,
        amount: batchAmount
      });
      
      this.log(`Batch amount: ${batch.currentQuantity} × ${daysUsed} × ₹${batch.dailyRate} = ₹${batchAmount}`);
    }

    const result = {
      totalAmount: Math.round(totalAmount * 100) / 100,
      currentQuantity: currentQuantity,
      calculationDate: calculationDate.toDate(),
      breakdown: breakdown
    };

    this.log(`\n✅ FINAL RESULT: ₹${result.totalAmount} for ${result.currentQuantity} units`);
    return result;
  }

  /**
   * Calculate return amount for specific return transaction
   */
  calculateReturnAmount(transactions, productId, returnQuantity, returnDate) {
    this.log(`\n💰 CALCULATING RETURN AMOUNT`);
    this.log(`Product: ${productId}, Quantity: ${returnQuantity}, Date: ${moment(returnDate).format('DD/MM/YYYY')}`);

    const { batches } = this.calculateRentalBatches(
      transactions.filter(t => moment(t.date).isSameOrBefore(moment(returnDate))), 
      productId
    );

    let totalReturnAmount = 0;
    let remainingToReturn = returnQuantity;
    const returnBreakdown = [];

    // Calculate return amount using MANUAL method (oldest first)
    for (const batch of batches) {
      if (remainingToReturn <= 0 || batch.currentQuantity <= 0) continue;
      
      const returnFromBatch = Math.min(remainingToReturn, batch.currentQuantity);
      const daysUsed = this.calculateDays(batch.startDate, returnDate);
      const batchReturnAmount = returnFromBatch * daysUsed * batch.dailyRate;
      
      totalReturnAmount += batchReturnAmount;
      remainingToReturn -= returnFromBatch;
      
      returnBreakdown.push({
        batchStartDate: moment(batch.startDate).format('DD/MM/YYYY'),
        quantity: returnFromBatch,
        daysUsed: daysUsed,
        dailyRate: batch.dailyRate,
        amount: batchReturnAmount
      });
      
      this.log(`Return from batch: ${returnFromBatch} × ${daysUsed} × ₹${batch.dailyRate} = ₹${batchReturnAmount}`);
    }

    return {
      amount: Math.round(totalReturnAmount * 100) / 100,
      breakdown: returnBreakdown
    };
  }

  /**
   * Calculate rental totals
   */
  calculateRentalTotals(rental, calculateToDate = null) {
    this.log(`\n🏢 CALCULATING RENTAL TOTALS FOR: ${rental.customerName}`);
    
    let totalAmount = 0;
    const productCalculations = [];

    for (const productItem of rental.productItems) {
      const calculation = this.calculateProductAmount(
        rental.transactions, 
        productItem.productId, 
        calculateToDate
      );

      productCalculations.push({
        productId: productItem.productId,
        productName: productItem.productName,
        ...calculation
      });

      totalAmount += calculation.totalAmount;
      
      this.log(`Product ${productItem.productName}: ₹${calculation.totalAmount}`);
    }

    // Calculate payments and discounts
    const totalPaid = rental.payments
      .filter(p => p.type !== 'discount' && p.type !== 'refund')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunds = rental.payments
      .filter(p => p.type === 'refund')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDiscounts = rental.payments
      .filter(p => p.type === 'discount')
      .reduce((sum, p) => sum + p.amount, 0);

    const netPaid = totalPaid - totalRefunds;
    const adjustedTotal = totalAmount - totalDiscounts;
    const balance = Math.max(0, adjustedTotal - netPaid);

    const totals = {
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(netPaid * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      adjustedTotal: Math.round(adjustedTotal * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      calculationDate: calculateToDate || new Date(),
      productCalculations: productCalculations
    };

    this.log(`\n🎯 RENTAL TOTALS:`);
    this.log(`Total Amount: ₹${totals.totalAmount}`);
    this.log(`Total Discounts: ₹${totals.totalDiscounts}`);
    this.log(`Adjusted Total: ₹${totals.adjustedTotal}`);
    this.log(`Total Paid: ₹${totals.totalPaid}`);
    this.log(`Balance: ₹${totals.balance}`);

    return totals;
  }
}

module.exports = new RentalBillingEngine();
