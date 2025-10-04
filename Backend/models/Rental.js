// models/Rental.js - Clean model WITHOUT pre-save hook
const mongoose = require("mongoose");

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
      'general',
      'discount',
      'global_payment',
      'global_full_payment',
      'global_partial_payment'
    ],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products1'
  },
  productName: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

const rentalSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String },
    startDate: { type: Date, required: true },
    productItems: [productItemSchema],
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

// ✅ HELPER METHODS ONLY (NO PRE-SAVE HOOK)
rentalSchema.methods.getTotalLiveAmount = function () {
  return this.totalAmount || 0;
};

rentalSchema.methods.getTotalPaidAmount = function () {
  return this.totalPaid || 0;
};

rentalSchema.methods.getTotalBalance = function () {
  return this.balanceAmount || 0;
};

rentalSchema.methods.getPaymentProgress = function () {
  if (this.totalAmount <= 0) return 0;
  return Math.min((this.totalPaid / this.totalAmount) * 100, 100);
};

rentalSchema.methods.isFullyPaid = function () {
  return this.balanceAmount <= 0;
};

rentalSchema.methods.isFullyReturned = function () {
  return this.productItems.every(item => item.currentQuantity === 0);
};

rentalSchema.methods.getActiveProductsCount = function () {
  return this.productItems.filter(item => item.currentQuantity > 0).length;
};

rentalSchema.methods.getProductBalance = function (productId) {
  const productItem = this.productItems.find(item =>
    item.productId.toString() === productId.toString()
  );
  return productItem ? productItem.balanceAmount || 0 : 0;
};

rentalSchema.methods.getProductStatus = function (productId) {
  const productItem = this.productItems.find(item =>
    item.productId.toString() === productId.toString()
  );

  if (!productItem) return 'not_found';

  if (productItem.currentQuantity > 0) {
    return 'active';
  } else if (productItem.balanceAmount > 0) {
    return 'returned_pending_payment';
  } else {
    return 'returned_paid';
  }
};



module.exports = mongoose.model("Rentals1", rentalSchema);
