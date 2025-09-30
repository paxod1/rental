// models/Rental.js - Enhanced with improved total calculations
const mongoose = require("mongoose");

// Update productItemSchema in models/Rental.js
const productItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products1',
    required: true
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  currentQuantity: { type: Number, required: true },
  days: { type: Number },
  rate: { type: Number, required: true },
  rateType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  amount: { type: Number, default: 0 },
  amountLocked: { type: Boolean, default: false }, // ✅ ADD THIS
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 }
});

const rentalTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['rental', 'return', 'partial_return', 'edit'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products1'
  },
  productName: { type: String },
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
    enum: [
      'advance',
      'full_payment',
      'partial_payment',
      'refund',
      'product_payment',
      'general',               // ✅ For general payments
      'discount',              // ✅ For discounts
      'global_payment',
      'global_full_payment',
      'global_partial_payment'
    ],
    required: true
  },
  productId: { // Optional - for product-specific payments
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products1'
  },
  productName: { type: String }, // For easier tracking
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

const rentalSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String },
    startDate: { type: Date, required: true },

    // Multiple products support
    productItems: [productItemSchema],

    status: {
      type: String,
      enum: ['active', 'completed', 'partially_returned', 'returned_pending_payment', 'cancelled'],
      default: 'active'
    },
    transactions: [rentalTransactionSchema],
    payments: [paymentSchema],

    // Enhanced total calculations - these will be calculated automatically
    totalAmount: { type: Number, default: 0 }, // Sum of all product amounts
    totalPaid: { type: Number, default: 0 }, // Sum of all payments (minus refunds)
    balanceAmount: { type: Number, default: 0 }, // Total amount - total paid

    // Additional summary fields for better tracking
    productPayments: { type: Number, default: 0 }, // Product-specific payments only
    generalPayments: { type: Number, default: 0 }, // General payments only

    notes: { type: String },
  },
  { timestamps: true }
);

// Enhanced pre-save hook with REAL-TIME calculation up to today
rentalSchema.pre('save', async function (next) {
  try {
    const currentDate = new Date();
    let calculatedTotalAmount = 0;

    console.log('\n🚀 PRE-SAVE HOOK STARTING...');
    console.log(`📅 Current Date: ${currentDate.toISOString()}`);
    console.log(`👤 Customer: ${this.customerName}`);
    console.log(`🆔 Rental ID: ${this._id}`);

    for (const productItem of this.productItems) {
      console.log(`\n🔄 Processing Product: ${productItem.productName}`);
      console.log(`   🆔 Product ID: ${productItem.productId}`);
      console.log(`   📦 Original Quantity: ${productItem.quantity}`);
      console.log(`   📦 Current Quantity: ${productItem.currentQuantity}`);
      console.log(`   💰 Stored Amount: ₹${productItem.amount}`);
      console.log(`   🔒 Amount Locked: ${productItem.amountLocked}`);

      let productAmount = 0;

      // ✅ ALWAYS CALCULATE REAL-TIME AMOUNT (ignore locked status for balance calculation)
      console.log(`   🕐 CALCULATING REAL-TIME AMOUNT FOR TODAY`);

      // Get all transactions for this product
      const rentalTransactions = this.transactions
        .filter(t => t.type === 'rental' &&
          t.productId && t.productId.toString() === productItem.productId.toString())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const returnTransactions = this.transactions
        .filter(t => (t.type === 'return' || t.type === 'partial_return') &&
          t.productId && t.productId.toString() === productItem.productId.toString())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(`   📝 Found ${rentalTransactions.length} rental transactions`);
      console.log(`   📝 Found ${returnTransactions.length} return transactions`);

      if (rentalTransactions.length === 0) {
        console.log(`   ⚠️ WARNING: No rental transactions found for ${productItem.productName}`);
        productAmount = productItem.amount || 0;
      } else {
        let dailyRate = 0;
        switch (productItem.rateType) {
          case 'daily': dailyRate = productItem.rate; break;
          case 'weekly': dailyRate = productItem.rate / 7; break;
          case 'monthly': dailyRate = productItem.rate / 30; break;
        }

        let totalCalculatedAmount = 0;

        // ✅ CALCULATE RETURN AMOUNTS (already finalized)
        for (const returnTx of returnTransactions) {
          if (returnTx.amount && returnTx.amount > 0) {
            totalCalculatedAmount += returnTx.amount;
            console.log(`   💰 Return amount: ₹${returnTx.amount} for ${returnTx.quantity} units on ${new Date(returnTx.date).toLocaleDateString()}`);
          }
        }

        // ✅ CALCULATE REMAINING QUANTITY AMOUNT UP TO TODAY
        if (productItem.currentQuantity > 0) {
          const originalRentalDate = new Date(rentalTransactions[0].date);
          const daysRentedToToday = Math.ceil((currentDate - originalRentalDate) / (1000 * 60 * 60 * 24));
          const remainingAmountToday = productItem.currentQuantity * daysRentedToToday * dailyRate;

          totalCalculatedAmount += remainingAmountToday;

          console.log(`   📊 Remaining TODAY: ${productItem.currentQuantity} units × ${daysRentedToToday} days × ₹${dailyRate} = ₹${remainingAmountToday}`);
          console.log(`   📅 From: ${originalRentalDate.toLocaleDateString()} to TODAY: ${currentDate.toLocaleDateString()}`);
        }

        productAmount = totalCalculatedAmount;
        console.log(`   🎯 TODAY'S TOTAL: ₹${productAmount} (returns + remaining up to today)`);
      }

      // ✅ ALWAYS UPDATE AMOUNT TO REFLECT TODAY'S VALUE
      const oldAmount = productItem.amount;
      productItem.amount = Math.round(productAmount * 100) / 100;
      console.log(`   📈 Amount updated for TODAY: ₹${oldAmount} → ₹${productItem.amount}`);

      // Calculate payments for this product (exclude discounts from balance calculation)
      const productPayments = this.payments
        .filter(p => {
          if (!p.productId) return false;
          const pId = String(p.productId);
          const itemId = String(productItem.productId._id || productItem.productId);
          return pId === itemId;
        })
        .reduce((sum, p) => {
          if (p.type === 'refund') return sum - p.amount;
          if (p.type === 'discount') return sum; // ✅ Don't count discounts as payments
          return sum + p.amount;
        }, 0);

      // ✅ FIXED: Calculate discounts for this product separately
      const productDiscounts = this.payments
        .filter(p => {
          if (!p.productId) return false;
          const pId = String(p.productId);
          const itemId = String(productItem.productId._id || productItem.productId);
          return pId === itemId && p.type === 'discount';
        })
        .reduce((sum, p) => sum + p.amount, 0);

      console.log(`   💳 Total Actual Payments: ₹${productPayments}`);
      console.log(`   💸 Total Discounts: ₹${productDiscounts}`);

      // Update payment tracking
      productItem.paidAmount = productPayments;
      // ✅ FIXED: Balance = (Amount - Discounts) - ActualPayments
      productItem.balanceAmount = Math.max(0, (productItem.amount - productDiscounts) - productPayments);

      console.log(`   📊 FINAL PRODUCT VALUES (AS OF TODAY):`);
      console.log(`      💰 Amount: ₹${productItem.amount} (live calculation)`);
      console.log(`      💸 Discounts: ₹${productDiscounts}`);
      console.log(`      💳 Paid: ₹${productPayments}`);
      console.log(`      🎯 Adjusted Amount: ₹${productItem.amount - productDiscounts}`);
      console.log(`      💰 Balance: ₹${productItem.balanceAmount}`);


      calculatedTotalAmount += productItem.amount;
    }

    // ✅ FIXED: Calculate total payments and discounts separately
    const totalPaidAmount = this.payments
      .filter(p => p.type !== 'discount')
      .reduce((sum, p) => {
        return p.type === 'refund' ? sum - p.amount : sum + p.amount;
      }, 0);

    const totalDiscountAmount = this.payments
      .filter(p => p.type === 'discount')
      .reduce((sum, p) => sum + p.amount, 0);

    // Update rental totals
    const oldTotalAmount = this.totalAmount;
    const oldTotalPaid = this.totalPaid;
    const oldBalanceAmount = this.balanceAmount;

    this.totalAmount = Math.round(calculatedTotalAmount * 100) / 100;
    this.totalPaid = Math.round(totalPaidAmount * 100) / 100;
    // ✅ FIXED: Balance = (TotalAmount - TotalDiscounts) - TotalPaid
    this.balanceAmount = Math.max(0, (this.totalAmount - totalDiscountAmount) - this.totalPaid);

    console.log(`\n📊 RENTAL TOTALS UPDATED (AS OF TODAY):`);
    console.log(`   💰 Total Amount: ₹${oldTotalAmount} → ₹${this.totalAmount}`);
    console.log(`   💸 Total Discounts: ₹${totalDiscountAmount}`);
    console.log(`   💳 Total Paid: ₹${oldTotalPaid} → ₹${this.totalPaid}`);
    console.log(`   🎯 Adjusted Total: ₹${this.totalAmount - totalDiscountAmount}`);
    console.log(`   💰 Balance: ₹${oldBalanceAmount} → ₹${this.balanceAmount}`);
    console.log(`   📅 Calculation Date: ${currentDate.toLocaleDateString()}`);

    console.log(`\n🏁 PRE-SAVE HOOK COMPLETED\n`);

    next();
  } catch (error) {
    console.error('❌ Pre-save error:', error);
    next(error);
  }
});








// Enhanced helper methods for better total calculations
rentalSchema.methods.getTotalLiveAmount = function () {
  return this.totalAmount || 0;
};

rentalSchema.methods.getTotalPaidAmount = function () {
  return this.totalPaid || 0;
};

rentalSchema.methods.getTotalBalance = function () {
  return this.balanceAmount || 0;
};

rentalSchema.methods.getProductSpecificPayments = function () {
  return this.productPayments || 0;
};

rentalSchema.methods.getGeneralPayments = function () {
  return this.generalPayments || 0;
};

// Calculate payment progress percentage
rentalSchema.methods.getPaymentProgress = function () {
  if (this.totalAmount <= 0) return 0;
  return Math.min((this.totalPaid / this.totalAmount) * 100, 100);
};

// Check if rental is fully paid
rentalSchema.methods.isFullyPaid = function () {
  return this.balanceAmount <= 0;
};

// Get payment summary for frontend display
rentalSchema.methods.getPaymentSummary = function () {
  return {
    totalAmount: this.totalAmount || 0,
    totalPaid: this.totalPaid || 0,
    balanceAmount: this.balanceAmount || 0,
    productPayments: this.productPayments || 0,
    generalPayments: this.generalPayments || 0,
    paymentProgress: this.getPaymentProgress(),
    isFullyPaid: this.isFullyPaid(),
    activeProducts: this.productItems.filter(item => item.currentQuantity > 0).length,
    returnedProducts: this.productItems.filter(item => item.currentQuantity === 0).length
  };
};

// Helper method to check if all products are returned
rentalSchema.methods.isFullyReturned = function () {
  return this.productItems.every(item => item.currentQuantity === 0);
};

// Helper method to get active products count
rentalSchema.methods.getActiveProductsCount = function () {
  return this.productItems.filter(item => item.currentQuantity > 0).length;
};

// Helper method to get product-specific balance
rentalSchema.methods.getProductBalance = function (productId) {
  const productItem = this.productItems.find(item =>
    item.productId.toString() === productId.toString()
  );
  return productItem ? productItem.balanceAmount || 0 : 0;
};

// Helper method to check if product is fully paid
rentalSchema.methods.isProductFullyPaid = function (productId) {
  const balance = this.getProductBalance(productId);
  return balance <= 0;
};


// Helper method to get product status
rentalSchema.methods.getProductStatus = function (productId) {
  const productItem = this.productItems.find(item =>
    item.productId.toString() === productId.toString()
  );

  if (!productItem) return 'not_found';

  if (productItem.currentQuantity > 0) {
    return 'active';
  } else if (productItem.balanceAmount > 0) {
    return 'returned_pending_payment';  // ✅ Key status for your requirement
  } else {
    return 'returned_paid';
  }
};

// Helper method to check if any product has unpaid balance
rentalSchema.methods.hasUnpaidProducts = function () {
  return this.productItems.some(item =>
    item.currentQuantity === 0 && item.balanceAmount > 0
  );
};

module.exports = mongoose.model("Rentals1", rentalSchema);
