// models/Rental.js - Updated with dynamic balance calculation
const mongoose = require("mongoose");

const rentalTransactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['rental', 'return', 'partial_return'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  days: { type: Number },
  amount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['advance', 'full_payment', 'partial_payment', 'refund'], 
    required: true 
  },
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

const rentalSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String },
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Products1', 
      required: true 
    },
    initialQuantity: { type: Number, required: true },
    currentQuantity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'partially_returned', 'returned_pending_payment', 'cancelled'],
      default: 'active' 
    },
    transactions: [rentalTransactionSchema],
    payments: [paymentSchema],
    totalAmount: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// Calculate dynamic balance based on rental duration and rates
rentalSchema.pre('save', async function(next) {
  try {
    // Calculate total paid (accounting for refunds)
    this.totalPaid = this.payments.reduce((sum, payment) => {
      return payment.type === 'refund' ? sum - payment.amount : sum + payment.amount;
    }, 0);

    // Only calculate dynamic balance for active rentals
    if (this.status === 'active' || this.status === 'partially_returned') {
      // Populate product to get rate information
      await this.populate('productId');
      
      if (this.productId) {
        const currentDate = new Date();
        let calculatedAmount = 0;

        // Get rental transactions sorted by date (FIFO)
        const rentalTransactions = this.transactions
          .filter(t => t.type === 'rental')
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        const returnTransactions = this.transactions
          .filter(t => t.type === 'return' || t.type === 'partial_return');

        // Calculate total returned quantity
        const totalReturned = returnTransactions.reduce((sum, t) => sum + t.quantity, 0);
        let remainingQuantity = this.currentQuantity;

        // Calculate amount for currently rented items (FIFO basis)
        for (const transaction of rentalTransactions) {
          if (remainingQuantity <= 0) break;

          const quantityForThisTransaction = Math.min(remainingQuantity, transaction.quantity);
          const rentalStartDate = new Date(transaction.date);
          const daysRented = Math.ceil((currentDate - rentalStartDate) / (1000 * 60 * 60 * 24));

          // Convert rate to daily rate based on product rate type
          let dailyRate = 0;
          switch (this.productId.rateType) {
            case 'daily':
              dailyRate = this.productId.rate;
              break;
            case 'weekly':
              dailyRate = this.productId.rate / 7;
              break;
            case 'monthly':
              dailyRate = this.productId.rate / 30;
              break;
            default:
              dailyRate = this.productId.rate; // Default to daily
          }

          calculatedAmount += quantityForThisTransaction * daysRented * dailyRate;
          remainingQuantity -= quantityForThisTransaction;
        }

        // Add fixed amounts from return transactions
        const returnAmount = returnTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        calculatedAmount += returnAmount;

        this.totalAmount = Math.round(calculatedAmount * 100) / 100; // Round to 2 decimal places
      }
    }

    // Calculate final balance
    this.balanceAmount = Math.max(0, this.totalAmount - this.totalPaid);
    
    next();
  } catch (error) {
    console.error('Error in rental pre-save hook:', error);
    next(error);
  }
});

// Instance method to get current balance without saving
rentalSchema.methods.getCurrentBalance = async function() {
  const currentDate = new Date();
  
  if (!this.populated('productId')) {
    await this.populate('productId');
  }

  if (this.status !== 'active' && this.status !== 'partially_returned') {
    return this.balanceAmount;
  }

  let calculatedAmount = 0;
  const rentalTransactions = this.transactions
    .filter(t => t.type === 'rental')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const returnTransactions = this.transactions
    .filter(t => t.type === 'return' || t.type === 'partial_return');

  let remainingQuantity = this.currentQuantity;

  for (const transaction of rentalTransactions) {
    if (remainingQuantity <= 0) break;

    const quantityForThisTransaction = Math.min(remainingQuantity, transaction.quantity);
    const rentalStartDate = new Date(transaction.date);
    const daysRented = Math.ceil((currentDate - rentalStartDate) / (1000 * 60 * 60 * 24));

    let dailyRate = 0;
    switch (this.productId.rateType) {
      case 'daily':
        dailyRate = this.productId.rate;
        break;
      case 'weekly':
        dailyRate = this.productId.rate / 7;
        break;
      case 'monthly':
        dailyRate = this.productId.rate / 30;
        break;
      default:
        dailyRate = this.productId.rate;
    }

    calculatedAmount += quantityForThisTransaction * daysRented * dailyRate;
    remainingQuantity -= quantityForThisTransaction;
  }

  const returnAmount = returnTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  calculatedAmount += returnAmount;

  const totalPaid = this.payments.reduce((sum, payment) => {
    return payment.type === 'refund' ? sum - payment.amount : sum + payment.amount;
  }, 0);

  return Math.max(0, calculatedAmount - totalPaid);
};

module.exports = mongoose.model("Rentals1", rentalSchema);
