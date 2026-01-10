// routes/rentals.js - UPDATED WITH MANUAL CALCULATIONS
const express = require("express");
const router = express.Router();
const Rental = require("../models/Rental");
const Product = require("../models/Product");

// Helper functions
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end.getTime() - start.getTime();
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
};
// ✅ FIXED: Proper inclusive day calculation for rental industry
// ✅ COMPLETELY FIXED: Proper inclusive day calculation
const calculateInclusiveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Reset time to start of day to avoid time zone issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const timeDifference = end.getTime() - start.getTime();
  const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  // ✅ CRITICAL: Add 1 to make it inclusive (both start and end dates count)
  const inclusiveDays = dayDifference + 1;

  // ✅ DEBUG: Log the calculation
  console.log(`   🔍 Day calc: ${start.toLocaleDateString()} to ${end.toLocaleDateString()} = ${inclusiveDays} days`);

  return inclusiveDays;
};

// ✅ TEST THE FUNCTION:
console.log('Testing day calculation:');
console.log('Sept 13 to Oct 5:', calculateInclusiveDays('2025-09-13', '2025-10-05'));
// Should output: 23 days




// ✅ FIXED CALCULATION FUNCTION - FORCES RETURN RECALCULATION
// ✅ COMPLETE ADDON DATE FIX - HANDLES ALL PRODUCTS
const calculateRentalAmounts = (rental) => {
  const currentDate = new Date();
  let calculatedTotalAmount = 0;

  console.log('\n🚀 CALCULATING RENTAL AMOUNTS (FINAL FIXED VERSION)...');
  console.log(`📅 Current Date: ${currentDate.toISOString()}`);

  for (const productItem of rental.productItems) {
    console.log(`\n🔄 Processing Product: ${productItem.productName}`);
    console.log(`   📦 Current Quantity: ${productItem.currentQuantity}`);

    const targetProductId = productItem.productId._id ?
      productItem.productId._id.toString() :
      productItem.productId.toString();

    // Calculate daily rate
    let dailyRate = 0;
    switch (productItem.rateType) {
      case 'daily': dailyRate = productItem.rate; break;
      case 'weekly': dailyRate = productItem.rate / 7; break;
      case 'monthly': dailyRate = productItem.rate / 30; break;
    }

    // Get rental and return transactions
    const rentalTransactions = rental.transactions.filter(t => {
      if (t.type !== 'rental') return false;

      if (t.productId) {
        const txProductId = t.productId._id ?
          t.productId._id.toString() :
          t.productId.toString();
        if (txProductId === targetProductId) return true;
      }

      return t.productName === productItem.productName;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const returnTransactions = rental.transactions.filter(t => {
      const isReturnType = t.type === 'return' || t.type === 'partial_return';
      if (!isReturnType) return false;

      if (t.productId) {
        const txProductId = t.productId._id ?
          t.productId._id.toString() :
          t.productId.toString();
        if (txProductId === targetProductId) return true;
      }

      return t.productName === productItem.productName;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`🔍 Found ${rentalTransactions.length} rentals, ${returnTransactions.length} returns`);

    // ✅ STEP 1: Calculate returned amounts (keep as is - working correctly)
    let totalReturnedAmount = 0;

    if (rentalTransactions.length >= 2) {
      console.log('\n🔧 MULTI-PERIOD PRODUCT - RECALCULATING RETURNS:');

      let remainingByPeriod = rentalTransactions.map(tx => ({
        date: new Date(tx.date),
        originalQuantity: tx.quantity,
        remainingQuantity: tx.quantity
      }));

      for (const returnTx of returnTransactions) {
        const returnDate = new Date(returnTx.date);
        let returnQuantity = returnTx.quantity;
        let returnAmountForThisTx = 0;

        console.log(`\n   📦 Processing return: ${returnQuantity} units on ${returnDate.toLocaleDateString()}`);

        // FIFO for returns
        for (let i = 0; i < remainingByPeriod.length && returnQuantity > 0; i++) {
          const period = remainingByPeriod[i];
          const quantityFromThisPeriod = Math.min(returnQuantity, period.remainingQuantity);

          if (quantityFromThisPeriod > 0) {
            const daysForThisPeriod = calculateInclusiveDays(period.date, returnDate);
            const amountFromThisPeriod = quantityFromThisPeriod * daysForThisPeriod * dailyRate;

            console.log(`      Period ${i + 1}: ${quantityFromThisPeriod} × ${daysForThisPeriod} × ₹${dailyRate} = ₹${amountFromThisPeriod}`);

            returnAmountForThisTx += amountFromThisPeriod;
            period.remainingQuantity -= quantityFromThisPeriod;
            returnQuantity -= quantityFromThisPeriod;
          }
        }

        returnTx.amount = Math.round(returnAmountForThisTx * 100) / 100;
        totalReturnedAmount += returnTx.amount;
        console.log(`      🔧 Return total: ₹${returnTx.amount}`);
      }
    } else {
      // Single period calculation
      for (const returnTx of returnTransactions) {
        totalReturnedAmount += returnTx.amount || 0;
      }
    }

    console.log(`   💰 Total Returned Amount: ₹${totalReturnedAmount}`);

    // ✅ STEP 2: COMPLETELY FIXED ACTIVE CALCULATION
    let currentActiveAmount = 0;

    if (productItem.currentQuantity > 0) {
      console.log(`\n🔍 CALCULATING ACTIVE AMOUNTS (FIXED LOGIC):`);
      console.log(`   📦 Need to distribute: ${productItem.currentQuantity} active units`);

      // ✅ CRITICAL FIX: Use REVERSE/LIFO order for active calculations
      let remainingActiveToDistribute = productItem.currentQuantity;

      // Process rental transactions in REVERSE order (newest first)
      for (let i = rentalTransactions.length - 1; i >= 0 && remainingActiveToDistribute > 0; i--) {
        const rentalTx = rentalTransactions[i];
        const rentalDate = new Date(rentalTx.date);

        // Take as much as possible from this rental period
        const quantityFromThisPeriod = Math.min(remainingActiveToDistribute, rentalTx.quantity);

        if (quantityFromThisPeriod > 0) {
          const daysFromThisRental = calculateInclusiveDays(rentalDate, currentDate);
          const amountFromThisPeriod = quantityFromThisPeriod * daysFromThisRental * dailyRate;

          console.log(`   📅 Active Period ${i + 1} (${rentalDate.toLocaleDateString()}):`);
          console.log(`      Quantity: ${quantityFromThisPeriod} units`);
          console.log(`      Days: ${daysFromThisRental}`);
          console.log(`      Amount: ${quantityFromThisPeriod} × ${daysFromThisRental} × ₹${dailyRate} = ₹${amountFromThisPeriod}`);

          currentActiveAmount += amountFromThisPeriod;
          remainingActiveToDistribute -= quantityFromThisPeriod;
        }
      }
    }

    console.log(`   💰 Total Active Amount: ₹${currentActiveAmount}`);

    // ✅ STEP 3: Calculate final totals
    const productTotalAmount = totalReturnedAmount + currentActiveAmount;
    productItem.amount = Math.round(productTotalAmount * 100) / 100;

    console.log(`\n   🎯 FINAL PRODUCT CALCULATION:`);
    console.log(`      💰 Returned: ₹${totalReturnedAmount}`);
    console.log(`      🔄 Active: ₹${currentActiveAmount}`);
    console.log(`      📊 TOTAL: ₹${productItem.amount}`);

    // Calculate payments and balances
    const productPayments = rental.payments
      .filter(p => {
        if (!p.productId) return false;
        const pId = String(p.productId);
        const itemId = String(productItem.productId._id || productItem.productId);
        return pId === itemId;
      })
      .reduce((sum, p) => {
        if (p.type === 'refund') return sum - p.amount;
        if (p.type === 'discount') return sum;
        return sum + p.amount;
      }, 0);

    const productDiscounts = rental.payments
      .filter(p => {
        if (!p.productId) return false;
        const pId = String(p.productId);
        const itemId = String(productItem.productId._id || productItem.productId);
        return pId === itemId && p.type === 'discount';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    productItem.paidAmount = productPayments;
    productItem.balanceAmount = Math.max(0, (productItem.amount - productDiscounts) - productPayments);

    calculatedTotalAmount += productItem.amount;
  }

  // Calculate rental totals
  const totalPaidAmount = rental.payments
    .filter(p => p.type !== 'discount' && p.type !== 'refund')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRefunds = rental.payments
    .filter(p => p.type === 'refund')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalDiscountAmount = rental.payments
    .filter(p => p.type === 'discount')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const netPaidAmount = totalPaidAmount - totalRefunds;

  rental.totalAmount = Math.round(calculatedTotalAmount * 100) / 100;
  rental.totalPaid = Math.round(netPaidAmount * 100) / 100;
  rental.balanceAmount = Math.max(0, (rental.totalAmount - totalDiscountAmount) - rental.totalPaid);

  console.log(`\n📊 FINAL TOTALS:`);
  console.log(`   💰 Total Amount: ₹${rental.totalAmount}`);
  console.log(`   💳 Total Paid: ₹${rental.totalPaid}`);
  console.log(`   💰 Balance: ₹${rental.balanceAmount}`);

  return rental;
};




// ✅ ALL GET ROUTES (UNCHANGED)
router.get("/", async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('productItems.productId', 'name rate rateType')
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    let query = { status: 'completed' };

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const rentals = await Rental.find(query)
      .populate('productItems.productId', 'name rate rateType')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rental.countDocuments(query);

    res.json({
      rentals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRentals: total
    });
  } catch (error) {
    console.error('Error in rental history:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/all-history", async (req, res) => {
  try {
    console.log('🎯 ALL-HISTORY ROUTE HIT!');

    const { page = 1, limit = 10, search = '', status = 'all', dateFrom, dateTo } = req.query;

    let query = {};

    switch (status) {
      case 'completed':
        query.status = 'completed';
        break;
      case 'pending_payment':
        query = {
          $or: [
            { status: 'returned_pending_payment' },
            { balanceAmount: { $gt: 0 } }
          ]
        };
        break;
      case 'active':
        query.status = 'active';
        break;
      case 'partially_returned':
        query.status = 'partially_returned';
        break;
      case 'all':
      default:
        // Include all statuses except cancelled if you want
        query.status = { $in: ['active', 'completed', 'partially_returned', 'returned_pending_payment'] };
        break;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    if (search) {
      const searchQuery = {
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } }
        ]
      };

      if (query.$or) {
        query = {
          $and: [query, searchQuery]
        };
      } else {
        query = { ...query, ...searchQuery };
      }
    }

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));

    const rentals = await Rental.find(query)
      .populate('productItems.productId', 'name rate rateType')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rental.countDocuments(query);

    const transformedRentals = rentals.map(rental => {
      // Calculate total discount for this rental
      const totalDiscount = rental.payments
        .filter(payment => payment.type === 'discount')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Calculate product-level discounts
      const productDiscounts = rental.productItems.map(item => {
        const productDiscount = rental.payments
          .filter(payment =>
            payment.type === 'discount' &&
            payment.productId &&
            payment.productId.toString() === (item.productId._id || item.productId).toString()
          )
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        return {
          productId: item.productId._id || item.productId,
          productName: item.productName,
          discount: productDiscount
        };
      });

      // Calculate net amount (total amount after discount)
      const netAmount = Math.max(0, (rental.totalAmount || 0) - totalDiscount);

      // Calculate payment summary with discount info
      const paymentSummary = {
        totalAmount: rental.totalAmount || 0,
        totalPaid: rental.totalPaid || 0,
        balanceAmount: rental.balanceAmount || 0,
        totalDiscount: totalDiscount,
        netAmount: netAmount, // Amount after discount
        isFullyPaid: rental.balanceAmount <= 0,
        paymentProgress: rental.totalAmount > 0 ?
          Math.min(((rental.totalPaid || 0) / rental.totalAmount) * 100, 100) : 0,
        discountProgress: rental.totalAmount > 0 ?
          Math.min((totalDiscount / rental.totalAmount) * 100, 100) : 0
      };

      // Get all discount transactions
      const discountTransactions = rental.payments
        .filter(payment => payment.type === 'discount')
        .map(payment => ({
          amount: payment.amount,
          date: payment.date,
          notes: payment.notes || '',
          productId: payment.productId,
          productName: payment.productName
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        ...rental.toObject(),
        // Basic counts
        totalProducts: rental.productItems.length,
        activeProducts: rental.productItems.filter(item => item.currentQuantity > 0).length,
        returnedProducts: rental.productItems.filter(item => item.currentQuantity === 0).length,

        // Product information
        productNames: rental.productItems.map(item =>
          item.productId?.name || item.productName
        ).join(', '),

        // Payment and discount information
        paymentSummary: paymentSummary,

        // Detailed discount information
        discountInfo: {
          totalDiscount: totalDiscount,
          productDiscounts: productDiscounts,
          discountTransactions: discountTransactions,
          hasDiscount: totalDiscount > 0
        },

        // Date information
        rentalStartDate: rental.startDate,
        rentalEndDate: rental.productItems.every(item => item.currentQuantity === 0) ?
          rental.updatedAt : null,

        // Status flags
        isActive: rental.status === 'active',
        isCompleted: rental.status === 'completed',
        hasPendingPayment: rental.balanceAmount > 0,
        hasPartialReturns: rental.status === 'partially_returned'
      };
    });

    // Calculate summary statistics for all rentals in the response
    const summaryStatistics = {
      totalRentalsCount: transformedRentals.length,
      totalActiveRentals: transformedRentals.filter(r => r.isActive).length,
      totalCompletedRentals: transformedRentals.filter(r => r.isCompleted).length,
      totalPendingPayment: transformedRentals.filter(r => r.hasPendingPayment).length,
      totalAmount: transformedRentals.reduce((sum, r) => sum + (r.paymentSummary.totalAmount || 0), 0),
      totalPaid: transformedRentals.reduce((sum, r) => sum + (r.paymentSummary.totalPaid || 0), 0),
      totalDiscount: transformedRentals.reduce((sum, r) => sum + (r.discountInfo.totalDiscount || 0), 0),
      totalBalance: transformedRentals.reduce((sum, r) => sum + (r.paymentSummary.balanceAmount || 0), 0),
      averageDiscountPercentage: transformedRentals.length > 0 ?
        transformedRentals.reduce((sum, r) => {
          const discountPct = r.paymentSummary.totalAmount > 0 ?
            (r.discountInfo.totalDiscount / r.paymentSummary.totalAmount) * 100 : 0;
          return sum + discountPct;
        }, 0) / transformedRentals.length : 0
    };

    res.json({
      rentals: transformedRentals,
      summary: summaryStatistics,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalRentals: total,
        limit: parseInt(limit),
        hasNextPage: (page * limit) < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error in all-history:', error);
    res.status(500).json({
      message: error.message,
      error: "Failed to fetch rental history"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    console.log('🎯 ID ROUTE HIT with id:', req.params.id);

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // ✅ CRITICAL: Calculate amounts AND save to fix wrong transaction amounts
    calculateRentalAmounts(rental);
    await rental.save();

    res.json(rental);
  } catch (error) {
    console.error('❌ Error in get rental by id:', error);
    res.status(500).json({ message: error.message });
  }
});



// ✅ ALL POST/PUT/DELETE ROUTES WITH MANUAL CALCULATION

// CREATE RENTAL - WITH MANUAL CALCULATION
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      startDate,
      advancePayment,
      notes,
      productItems
    } = req.body;

    // Validation (unchanged)
    if (!customerName || !customerPhone || !startDate) {
      return res.status(400).json({
        message: "Please provide customerName, customerPhone, and startDate"
      });
    }

    if (!productItems || !Array.isArray(productItems) || productItems.length === 0) {
      return res.status(400).json({
        message: "Please provide at least one product item"
      });
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(customerPhone)) {
      return res.status(400).json({
        message: "Please provide a valid phone number"
      });
    }

    // Process products (unchanged)
    const validatedItems = [];
    const transactions = [];
    let totalAmount = 0;

    for (const item of productItems) {
      if (!item.productId || !item.quantity) {
        continue;
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient quantity for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        });
      }

      let itemAmount = 0;
      if (item.days) {
        switch (product.rateType) {
          case 'daily':
            itemAmount = product.rate * item.days * item.quantity;
            break;
          case 'weekly':
            itemAmount = product.rate * Math.ceil(item.days / 7) * item.quantity;
            break;
          case 'monthly':
            itemAmount = product.rate * Math.ceil(item.days / 30) * item.quantity;
            break;
        }
      }

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        currentQuantity: item.quantity,
        days: item.days || null,
        rate: product.rate,
        rateType: product.rateType,
        amount: itemAmount
      });

      transactions.push({
        type: 'rental',
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        days: item.days || null,
        amount: itemAmount,
        date: new Date(startDate),
        notes: `Initial rental - ${item.quantity} units of ${product.name}${item.days ? ` for ${item.days} days` : ''}`
      });

      totalAmount += itemAmount;
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({ message: "No valid product items provided" });
    }

    const payments = [];
    if (advancePayment && advancePayment > 0) {
      payments.push({
        amount: advancePayment,
        type: 'advance',
        date: new Date(),
        notes: 'Advance payment for rental'
      });
    }

    // Create rental
    const rental = await Rental.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress ? customerAddress.trim() : undefined,
      startDate,
      productItems: validatedItems,
      transactions,
      payments,
      totalAmount: totalAmount,
      notes: notes ? notes.trim() : undefined,
    });

    // ✅ CRITICAL: Calculate amounts manually after creation
    calculateRentalAmounts(rental);
    await rental.save();

    // Update inventory
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity }
      });
    }

    const populatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.status(201).json(populatedRental);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({ message: error.message });
  }
});

// RETURN ROUTE - WITH MANUAL CALCULATION
router.put("/:id/return", async (req, res) => {
  try {
    const { productId, returnQuantity, paymentAmount, paymentNotes, notes } = req.body;
    const returnDate = new Date();

    if (!productId || !returnQuantity || returnQuantity <= 0) {
      return res.status(400).json({
        message: "Please provide productId and valid return quantity"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    if (returnQuantity > productItem.currentQuantity) {
      return res.status(400).json({
        message: `Return quantity (${returnQuantity}) cannot exceed current rented quantity (${productItem.currentQuantity})`
      });
    }

    // Calculate return using existing logic
    const calculateProductFIFOReturn = (rental, productId, returnQuantity, returnDate) => {
      const returnAmount = { total: 0, breakdown: [] };
      let remainingToReturn = returnQuantity;

      const rentalTransactions = rental.transactions
        .filter(t => t.type === 'rental' && t.productId && t.productId.toString() === productId.toString())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const productItem = rental.productItems.find(item => item.productId.toString() === productId.toString());

      if (!productItem) {
        return returnAmount;
      }

      for (const transaction of rentalTransactions) {
        if (remainingToReturn <= 0) break;

        const quantityToReturn = Math.min(remainingToReturn, transaction.quantity);
        const daysUsed = calculateDaysBetween(transaction.date, returnDate);

        let ratePerDay = 0;
        switch (productItem.rateType) {
          case 'daily':
            ratePerDay = productItem.rate;
            break;
          case 'weekly':
            ratePerDay = productItem.rate / 7;
            break;
          case 'monthly':
            ratePerDay = productItem.rate / 30;
            break;
        }

        const amount = quantityToReturn * daysUsed * ratePerDay;

        returnAmount.breakdown.push({
          transactionDate: transaction.date,
          productName: productItem.productName,
          quantity: quantityToReturn,
          daysUsed: daysUsed,
          ratePerDay: ratePerDay,
          amount: amount
        });

        returnAmount.total += amount;
        remainingToReturn -= quantityToReturn;
      }

      return returnAmount;
    };

    const returnCalculation = calculateProductFIFOReturn(rental, productId, returnQuantity, returnDate);

    // Add return transaction
    rental.transactions.push({
      type: returnQuantity === productItem.currentQuantity ? 'return' : 'partial_return',
      productId: productId,
      productName: productItem.productName,
      quantity: returnQuantity,
      days: null,
      amount: returnCalculation.total,
      date: returnDate,
      notes: notes || `Return processed for ${productItem.productName}`
    });

    // Update current quantity
    productItem.currentQuantity -= returnQuantity;

    // Add payment if provided
    if (paymentAmount && paymentAmount > 0) {
      rental.payments.push({
        amount: parseFloat(paymentAmount),
        type: 'partial_payment',
        productId: productId,
        productName: productItem.productName,
        date: returnDate,
        notes: paymentNotes || `Payment of ₹${paymentAmount} made during return of ${returnQuantity} units of ${productItem.productName}`
      });
    }

    // ✅ CRITICAL: Calculate amounts manually before saving
    calculateRentalAmounts(rental);

    // Update status
    const hasActiveProducts = rental.productItems.some(item => item.currentQuantity > 0);
    const hasUnpaidBalance = rental.balanceAmount > 0;

    if (hasActiveProducts) {
      rental.status = 'partially_returned';
    } else if (hasUnpaidBalance) {
      rental.status = 'returned_pending_payment';
    } else {
      rental.status = 'completed';
    }

    await rental.save();

    // Update inventory
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: returnQuantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json({
      rental: updatedRental,
      returnCalculation: returnCalculation,
      message: `Successfully returned ${returnQuantity} units of ${productItem.productName}${paymentAmount ? ` with payment of ₹${paymentAmount}` : ''}`
    });

  } catch (error) {
    console.error('❌ Return processing error:', error);
    res.status(500).json({
      message: error.message,
      error: "Failed to process return"
    });
  }
});

// ADD PRODUCT ROUTE - WITH MANUAL CALCULATION
router.put("/:id/add-product", async (req, res) => {
  try {
    const { productId, quantity, days, startDate, notes } = req.body;
    const selectedStartDate = startDate ? new Date(startDate) : new Date();

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Please provide productId and valid quantity"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const existingProduct = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (existingProduct) {
      return res.status(400).json({
        message: "Product already exists in this rental. Use 'Add More' instead."
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        message: `Insufficient product quantity. Available: ${product.quantity}, Requested: ${quantity}`
      });
    }

    let itemAmount = 0;
    if (days) {
      switch (product.rateType) {
        case 'daily':
          itemAmount = product.rate * days * quantity;
          break;
        case 'weekly':
          itemAmount = product.rate * Math.ceil(days / 7) * quantity;
          break;
        case 'monthly':
          itemAmount = product.rate * Math.ceil(days / 30) * quantity;
          break;
      }
    }

    rental.productItems.push({
      productId: productId,
      productName: product.name,
      quantity: quantity,
      currentQuantity: quantity,
      days: days || null,
      rate: product.rate,
      rateType: product.rateType,
      amount: itemAmount
    });

    rental.transactions.push({
      type: 'rental',
      productId: productId,
      productName: product.name,
      quantity: quantity,
      days: days || null,
      amount: itemAmount,
      date: selectedStartDate,
      notes: notes || `Added new product - ${quantity} units of ${product.name} starting ${selectedStartDate.toLocaleDateString()}`
    });

    rental.status = 'active';

    // ✅ CRITICAL: Calculate amounts manually before saving
    calculateRentalAmounts(rental);

    await rental.save();

    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: -quantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json(updatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ✅ RETURN-AND-PAY ROUTE - WITH PROPER CALCULATION
router.put("/:id/return-and-pay", async (req, res) => {
  try {
    const { productId, returnQuantity, payFullAmount, paymentAmount, paymentNotes, notes, returnDate } = req.body;
    const selectedReturnDate = returnDate ? new Date(returnDate) : new Date();

    console.log('\n🔄 RETURN-AND-PAY STARTING...');

    if (!productId || !returnQuantity || returnQuantity <= 0) {
      return res.status(400).json({
        message: "Please provide productId and valid return quantity"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem || returnQuantity > productItem.currentQuantity) {
      return res.status(400).json({
        message: `Invalid return quantity`
      });
    }

    let dailyRate = 0;
    switch (productItem.rateType) {
      case 'daily': dailyRate = productItem.rate; break;
      case 'weekly': dailyRate = productItem.rate / 7; break;
      case 'monthly': dailyRate = productItem.rate / 30; break;
    }

    // ✅ FIXED: Get ALL rental transactions for this product (sorted by date)
    const rentalTransactions = rental.transactions
      .filter(t => t.type === 'rental' &&
        t.productId && t.productId.toString() === productId.toString())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // ✅ FIXED: Get existing return transactions to track what's already returned
    const existingReturns = rental.transactions
      .filter(t => (t.type === 'return' || t.type === 'partial_return') &&
        t.productId && t.productId.toString() === productId.toString())
      .reduce((sum, tx) => sum + tx.quantity, 0);

    console.log(`🔍 Found ${rentalTransactions.length} rental transactions`);
    console.log(`📦 Already returned: ${existingReturns} units`);
    console.log(`📦 Current active: ${productItem.currentQuantity} units`);
    console.log(`🔄 Returning now: ${returnQuantity} units`);

    // ✅ FIXED: Calculate return amount based on ACTUAL rental periods with proper date validation
    let returnTransactionAmount = 0;
    let totalDaysForDisplay = 0;

    if (rentalTransactions.length > 0) {
      console.log(`\n💰 CALCULATING RETURN AMOUNT WITH PROPER DATE VALIDATION:`);

      // Sort rental transactions by date
      const sortedRentalTransactions = [...rentalTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));

      let remainingToReturn = returnQuantity;
      let returnAmountDetails = [];

      console.log(`   🔄 Processing returns in chronological order:`);

      for (let i = 0; i < sortedRentalTransactions.length && remainingToReturn > 0; i++) {
        const rental_tx = sortedRentalTransactions[i];
        const rentalDate = new Date(rental_tx.date);

        // ✅ CRITICAL FIX: Skip rental transactions that happen AFTER return date
        if (rentalDate > selectedReturnDate) {
          console.log(`   ⏩ Skipping rental from ${rentalDate.toLocaleDateString()} (after return date)`);
          continue;
        }

        // Calculate available quantity from this rental period
        const availableFromThisPeriod = Math.min(rental_tx.quantity, remainingToReturn);

        if (availableFromThisPeriod > 0) {
          const daysForThisPeriod = calculateInclusiveDays(rentalDate, selectedReturnDate);
          const amountFromThisPeriod = availableFromThisPeriod * daysForThisPeriod * dailyRate;

          console.log(`   📅 Period ${i + 1} (Rented: ${rentalDate.toLocaleDateString()}):`);
          console.log(`      Returning: ${availableFromThisPeriod} units`);
          console.log(`      Days: ${daysForThisPeriod} (${rentalDate.toLocaleDateString()} to ${selectedReturnDate.toLocaleDateString()})`);
          console.log(`      Amount: ${availableFromThisPeriod} × ${daysForThisPeriod} × ₹${dailyRate} = ₹${amountFromThisPeriod}`);

          returnTransactionAmount += amountFromThisPeriod;
          remainingToReturn -= availableFromThisPeriod;
          returnAmountDetails.push({
            rentalDate: rentalDate.toLocaleDateString(),
            quantity: availableFromThisPeriod,
            days: daysForThisPeriod,
            amount: amountFromThisPeriod
          });

          // For display purposes, use the calculation from the first applicable period
          if (totalDaysForDisplay === 0) {
            totalDaysForDisplay = daysForThisPeriod;
          }
        }
      }

      // ✅ If we still have units to return but no more valid rental periods
      if (remainingToReturn > 0) {
        console.log(`   ⚠️  Warning: ${remainingToReturn} units cannot be returned (no valid rental period)`);
      }

      console.log(`   💰 TOTAL RETURN AMOUNT: ₹${returnTransactionAmount}`);

    } else {
      // Fallback to original logic if no rental transactions found
      const originalRentalDate = new Date(rental.startDate);
      totalDaysForDisplay = calculateInclusiveDays(originalRentalDate, selectedReturnDate);
      returnTransactionAmount = returnQuantity * totalDaysForDisplay * dailyRate;

      console.log(`💰 Fallback calculation:`);
      console.log(`   📅 From: ${originalRentalDate.toLocaleDateString()} to ${selectedReturnDate.toLocaleDateString()}`);
      console.log(`   📅 Days (INCLUSIVE): ${totalDaysForDisplay}`);
      console.log(`   💰 Amount: ${returnQuantity} × ${totalDaysForDisplay} × ₹${dailyRate} = ₹${returnTransactionAmount.toFixed(2)}`);
    }

    // ✅ Create return transaction with the calculated amount
    const returnTransaction = {
      type: returnQuantity === productItem.currentQuantity ? 'return' : 'partial_return',
      productId: productId,
      productName: productItem.productName,
      quantity: returnQuantity,
      days: totalDaysForDisplay, // For display purposes
      amount: Math.round(returnTransactionAmount * 100) / 100,
      date: selectedReturnDate,
      notes: notes || `Return processed for ${productItem.productName}`
    };

    rental.transactions.push(returnTransaction);
    productItem.currentQuantity -= returnQuantity;

    console.log(`✅ Added return transaction: ₹${returnTransactionAmount} for ${returnQuantity} units`);

    // Handle payments (unchanged)
    let paymentInfo = null;
    if (payFullAmount) {
      calculateRentalAmounts(rental);
      const productBalance = productItem.balanceAmount;
      if (productBalance > 0) {
        rental.payments.push({
          amount: productBalance,
          type: 'product_payment',
          productId: productId,
          productName: productItem.productName,
          date: selectedReturnDate,
          notes: paymentNotes || `Full payment for ${productItem.productName}`
        });
        paymentInfo = { type: 'full', amount: productBalance };
      }
    } else if (paymentAmount && paymentAmount > 0) {
      rental.payments.push({
        amount: parseFloat(paymentAmount),
        type: 'product_payment',
        productId: productId,
        productName: productItem.productName,
        date: selectedReturnDate,
        notes: paymentNotes || `Partial payment for ${productItem.productName}`
      });
      paymentInfo = { type: 'partial', amount: parseFloat(paymentAmount) };
    }

    // Final calculation
    calculateRentalAmounts(rental);

    const hasActiveProducts = rental.productItems.some(item => item.currentQuantity > 0);
    const hasUnpaidBalance = rental.balanceAmount > 0;

    if (hasActiveProducts) {
      rental.status = 'partially_returned';
    } else if (hasUnpaidBalance) {
      rental.status = 'returned_pending_payment';
    } else {
      rental.status = 'completed';
    }

    await rental.save();

    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: returnQuantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    console.log('\n🏁 RETURN COMPLETED:');
    console.log(`   Total Amount: ₹${updatedRental.totalAmount}`);
    console.log(`   Balance: ₹${updatedRental.balanceAmount}`);

    res.json({
      rental: updatedRental,
      returnCalculation: {
        amount: returnTransactionAmount,
        days: totalDaysForDisplay,
        rate: dailyRate,
        quantity: returnQuantity
      },
      paymentInfo: paymentInfo
    });

  } catch (error) {
    console.error('❌ Error in return-and-pay:', error);
    res.status(500).json({ message: error.message });
  }
});




// ADD-RENTAL ROUTE - WITH MANUAL CALCULATION
router.put("/:id/add-rental", async (req, res) => {
  try {
    const { productId, additionalQuantity, additionalStartDate, notes } = req.body;
    const selectedStartDate = additionalStartDate ? new Date(additionalStartDate) : new Date();

    console.log('🔄 ADD-RENTAL STARTING...');

    if (!productId || !additionalQuantity || additionalQuantity <= 0) {
      return res.status(400).json({
        message: "Please provide productId and valid additional quantity"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    const product = await Product.findById(productId);
    if (!product || product.quantity < additionalQuantity) {
      return res.status(400).json({
        message: `Insufficient product quantity. Available: ${product ? product.quantity : 0}`
      });
    }

    rental.transactions.push({
      type: 'rental',
      productId: productId,
      productName: productItem.productName,
      quantity: additionalQuantity,
      date: selectedStartDate,
      notes: notes || `Additional rental - ${additionalQuantity} units starting ${selectedStartDate.toLocaleDateString()}`
    });

    productItem.quantity += additionalQuantity;
    productItem.currentQuantity += additionalQuantity;
    rental.status = 'active';

    // ✅ CRITICAL: Calculate all amounts manually
    calculateRentalAmounts(rental);

    await rental.save();

    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: -additionalQuantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    console.log('✅ ADD-RENTAL COMPLETED:');
    console.log(`   New Total: ₹${updatedRental.totalAmount}`);

    res.json({
      rental: updatedRental,
      message: "Additional rental processed successfully"
    });

  } catch (error) {
    console.error('❌ Error in add-rental:', error);
    res.status(500).json({ message: error.message });
  }
});

// PRODUCT PAYMENT ROUTE - WITH MANUAL CALCULATION
router.put("/:id/product-payment", async (req, res) => {
  try {
    const { productId, amount, paymentType, notes } = req.body;

    if (!productId || !amount || amount <= 0) {
      return res.status(400).json({
        message: "Please provide productId and valid payment amount"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    // ✅ First calculate amounts manually to get current balances
    calculateRentalAmounts(rental);

    const currentProductBalance = productItem.balanceAmount;

    if (amount > currentProductBalance) {
      return res.status(400).json({
        message: `Payment amount (₹${amount}) exceeds product balance (₹${currentProductBalance.toFixed(2)})`
      });
    }

    if (currentProductBalance <= 0) {
      return res.status(400).json({
        message: "This product is already fully paid"
      });
    }

    rental.payments.push({
      amount: parseFloat(amount),
      type: paymentType || 'product_payment',
      productId: productId,
      productName: productItem.productName,
      date: new Date(),
      notes: notes || `Payment for ${productItem.productName}`
    });

    // ✅ CRITICAL: Calculate amounts manually after adding payment
    calculateRentalAmounts(rental);

    if (rental.isFullyReturned && rental.balanceAmount <= 0) {
      rental.status = 'completed';
    }

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json(updatedRental);

  } catch (error) {
    console.error('❌ Error in product-payment:', error);
    res.status(500).json({ message: error.message });
  }
});

// PRODUCT FULL PAYMENT ROUTE - WITH MANUAL CALCULATION
router.put("/:id/product-full-payment", async (req, res) => {
  try {
    const { productId, notes } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Please provide productId"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    // ✅ First calculate amounts manually to get current balance
    calculateRentalAmounts(rental);

    const currentProductBalance = productItem.balanceAmount;

    if (currentProductBalance <= 0) {
      return res.status(400).json({
        message: "Product is already fully paid"
      });
    }

    rental.payments.push({
      amount: currentProductBalance,
      type: 'full_payment',
      productId: productId,
      productName: productItem.productName,
      date: new Date(),
      notes: notes || `Full payment for ${productItem.productName}`
    });

    // ✅ CRITICAL: Calculate amounts manually after adding payment
    calculateRentalAmounts(rental);

    if (rental.isFullyReturned() && rental.balanceAmount <= 0) {
      rental.status = 'completed';
    }

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json({
      rental: updatedRental,
      paidAmount: currentProductBalance,
      message: `Full payment of ₹${currentProductBalance.toFixed(2)} processed for ${productItem.productName}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GENERAL PAYMENT ROUTE - WITH MANUAL CALCULATION
router.put("/:id/general-payment", async (req, res) => {
  try {
    const { amount, discountAmount, paymentType, notes, discountNotes } = req.body;

    if ((!amount || amount <= 0) && (!discountAmount || discountAmount <= 0)) {
      return res.status(400).json({ message: "Please provide payment or discount amount" });
    }

    const rental = await Rental.findById(req.params.id)
      .populate("productItems.productId", "name rate rateType");

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // ✅ First calculate amounts manually to get current balances
    calculateRentalAmounts(rental);

    let paymentAmt = parseFloat(amount) || 0;
    let discountAmt = parseFloat(discountAmount) || 0;

    const productsWithBalance = rental.productItems
      .map((item, originalIndex) => ({
        productItem: item,
        productId: item.productId._id,
        productName: item.productName || item.productId.name,
        currentBalance: item.balanceAmount,
        originalIndex
      }))
      .filter(p => p.currentBalance > 0)
      .sort((a, b) => b.originalIndex - a.originalIndex);

    if (productsWithBalance.length === 0) {
      return res.status(400).json({ message: "No products with outstanding balance" });
    }

    const distributionDetails = [];

    // Apply discount first
    if (discountAmt > 0) {
      for (let product of productsWithBalance) {
        if (discountAmt <= 0) break;

        let discountForProduct = Math.min(product.currentBalance, discountAmt);

        if (discountForProduct > 0) {
          rental.payments.push({
            amount: discountForProduct,
            type: "discount",
            productId: product.productId,
            productName: product.productName,
            date: new Date(),
            notes: discountNotes || `Discount: ₹${discountForProduct.toFixed(2)} for ${product.productName}`
          });

          discountAmt -= discountForProduct;
          product.currentBalance -= discountForProduct;

          distributionDetails.push({
            productId: product.productId,
            productName: product.productName,
            appliedTotal: discountForProduct,
            fromPayment: 0,
            fromDiscount: discountForProduct,
            remainingBalance: product.currentBalance
          });
        }
      }
    }

    // Apply payment amount
    if (paymentAmt > 0) {
      for (let product of productsWithBalance) {
        if (paymentAmt <= 0) break;
        if (product.currentBalance <= 0) continue;

        let paymentForProduct = Math.min(product.currentBalance, paymentAmt);

        if (paymentForProduct > 0) {
          rental.payments.push({
            amount: paymentForProduct,
            type: paymentType || "general_payment",
            productId: product.productId,
            productName: product.productName,
            date: new Date(),
            notes: notes || `Payment: ₹${paymentForProduct.toFixed(2)} for ${product.productName}`
          });

          paymentAmt -= paymentForProduct;

          let existing = distributionDetails.find(d => d.productId.toString() === product.productId.toString());
          if (existing) {
            existing.fromPayment += paymentForProduct;
            existing.appliedTotal += paymentForProduct;
          } else {
            distributionDetails.push({
              productId: product.productId,
              productName: product.productName,
              appliedTotal: paymentForProduct,
              fromPayment: paymentForProduct,
              fromDiscount: 0,
              remainingBalance: product.currentBalance - paymentForProduct
            });
          }
        }
      }
    }

    // ✅ CRITICAL: Calculate amounts manually after adding payments
    calculateRentalAmounts(rental);

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate("productItems.productId", "name rate rateType");

    res.json({
      rental: updatedRental,
      distributionDetails,
      totalApplied: (parseFloat(amount) || 0) + (parseFloat(discountAmount) || 0),
      paymentApplied: (parseFloat(amount) || 0) - paymentAmt,
      discountApplied: (parseFloat(discountAmount) || 0) - discountAmt,
      unusedPayment: paymentAmt,
      unusedDiscount: discountAmt,
      message: "General payment and discount applied successfully"
    });

  } catch (error) {
    console.error("❌ Error in general-payment:", error);
    res.status(500).json({ message: error.message });
  }
});

// ADD PRODUCTS BULK ROUTE - WITH MANUAL CALCULATION
router.put('/:id/add-products-bulk', async (req, res) => {
  try {
    const { products, notes } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one product' });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const addedProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      const { productId, quantity, days, startDate } = item;
      const selectedStartDate = startDate ? new Date(startDate) : new Date();

      try {
        if (!productId || !quantity || quantity <= 0) {
          errors.push(`Product ${i + 1}: Invalid product ID or quantity`);
          continue;
        }

        const existingProduct = rental.productItems.find(item =>
          item.productId.id.toString() === productId.toString()
        );

        if (existingProduct) {
          errors.push(`Product ${i + 1}: Already exists in this rental. Use Add More instead.`);
          continue;
        }

        const product = await Product.findById(productId);
        if (!product) {
          errors.push(`Product ${i + 1}: Product not found`);
          continue;
        }

        if (product.quantity < quantity) {
          errors.push(`Product ${i + 1}: Insufficient quantity. Available: ${product.quantity}, Requested: ${quantity}`);
          continue;
        }

        let itemAmount = 0;
        if (days) {
          switch (product.rateType) {
            case 'daily':
              itemAmount = product.rate * days * quantity;
              break;
            case 'weekly':
              itemAmount = product.rate * Math.ceil(days / 7) * quantity;
              break;
            case 'monthly':
              itemAmount = product.rate * Math.ceil(days / 30) * quantity;
              break;
          }
        }

        rental.productItems.push({
          productId: productId,
          productName: product.name,
          quantity: quantity,
          currentQuantity: quantity,
          days: days || null,
          rate: product.rate,
          rateType: product.rateType,
          amount: itemAmount
        });

        rental.transactions.push({
          type: 'rental',
          productId: productId,
          productName: product.name,
          quantity: quantity,
          days: days || null,
          amount: itemAmount,
          date: selectedStartDate,
          notes: `${notes || 'Added new product'} - ${quantity} units of ${product.name} starting ${selectedStartDate.toLocaleDateString()}`
        });

        await Product.findByIdAndUpdate(productId, {
          $inc: { quantity: -quantity }
        });

        addedProducts.push({
          name: product.name,
          quantity: quantity,
          amount: itemAmount
        });

      } catch (error) {
        errors.push(`Product ${i + 1}: ${error.message}`);
      }
    }

    if (addedProducts.length === 0) {
      return res.status(400).json({
        message: 'No products were added successfully',
        errors: errors
      });
    }

    rental.status = 'active';

    // ✅ CRITICAL: Calculate amounts manually after adding products
    calculateRentalAmounts(rental);

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json({
      rental: updatedRental,
      addedProducts: addedProducts,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully added ${addedProducts.length} products${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE CUSTOMER ROUTE - WITH MANUAL CALCULATION
router.put('/:id/update-customer', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({
        message: 'Customer name and phone number are required'
      });
    }

    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    rental.customerName = customerName.trim();
    rental.customerPhone = customerPhone.trim();
    rental.customerAddress = customerAddress ? customerAddress.trim() : '';

    // ✅ CRITICAL: Calculate amounts manually before saving
    calculateRentalAmounts(rental);

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json(updatedRental);
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE PRODUCT ROUTE - WITH MANUAL CALCULATION
router.delete('/:id/delete-product/:productId', async (req, res) => {
  try {
    const { id: rentalId, productId } = req.params;
    const { reason } = req.body;

    const rental = await Rental.findById(rentalId)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const productItemIndex = rental.productItems.findIndex(item =>
      (item.productId._id || item.productId).toString() === productId.toString()
    );

    if (productItemIndex === -1) {
      return res.status(404).json({ message: 'Product not found in this rental' });
    }

    const productItem = rental.productItems[productItemIndex];

    // Validation checks
    const hasReturns = rental.transactions.some(t =>
      (t.type === 'return' || t.type === 'partial_return') &&
      t.productId && t.productId.toString() === productId.toString()
    );

    const hasPayments = rental.payments.some(p =>
      p.productId && p.productId.toString() === productId.toString()
    );

    if (hasReturns || hasPayments || productItem.currentQuantity < productItem.quantity) {
      return res.status(400).json({
        message: 'Cannot delete product that has transactions or returns'
      });
    }

    // Return quantity to inventory
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: productItem.currentQuantity }
    });

    // Remove transactions
    rental.transactions = rental.transactions.filter(t =>
      !t.productId || t.productId.toString() !== productId.toString()
    );

    // Add audit transaction
    rental.transactions.push({
      type: 'edit',
      productId: productId,
      productName: productItem.productName,
      quantity: -productItem.quantity,
      days: 0,
      amount: -productItem.amount,
      date: new Date(),
      notes: `PRODUCT DELETED: ${productItem.productName} (${productItem.quantity} units) - Reason: ${reason || 'Added by mistake'}`
    });

    // Remove product
    rental.productItems.splice(productItemIndex, 1);

    // ✅ CRITICAL: Calculate amounts manually after deletion
    calculateRentalAmounts(rental);

    // Check if empty
    if (rental.productItems.length === 0) {
      rental.status = 'cancelled';
    }

    await rental.save();

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json({
      rental: updatedRental,
      deletedProduct: {
        name: productItem.productName,
        quantity: productItem.quantity,
        amount: productItem.amount
      },
      message: `Successfully deleted ${productItem.productName} from rental`
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE RENTAL ROUTE - UNCHANGED
router.delete("/:id", async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    if (!rental.isFullyReturned()) {
      return res.status(400).json({
        message: "Cannot delete active rental. Please process returns for all products first."
      });
    }

    for (const productItem of rental.productItems) {
      if (productItem.productId && productItem.productId._id) {
        const returnedQuantity = productItem.quantity - productItem.currentQuantity;

        if (returnedQuantity > 0) {
          await Product.findByIdAndUpdate(productItem.productId._id, {
            $inc: { quantity: -returnedQuantity }
          });
        }
      }
    }

    await Rental.findByIdAndDelete(req.params.id);

    res.json({ message: "Rental deleted successfully" });
  } catch (error) {
    console.error("Error deleting rental:", error);
    res.status(500).json({
      message: "Error deleting rental",
      error: error.message
    });
  }
});

// DELETE ENTIRE RENTAL ROUTE - WITH PROPER INVENTORY RESTORATION
router.delete("/:id/delete-rental", async (req, res) => {
  try {
    const { reason } = req.body;

    console.log('🗑️ DELETE ENTIRE RENTAL STARTING...');

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // ✅ CRITICAL: Check if rental has any payments
    if (rental.payments && rental.payments.length > 0) {
      const totalPaid = rental.payments
        .filter(p => p.type !== 'refund')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      if (totalPaid > 0) {
        return res.status(400).json({
          message: `Cannot delete rental with payments. Total paid: ₹${totalPaid.toFixed(2)}. Please process refunds first.`
        });
      }
    }

    // ✅ Prepare deletion summary
    const deletionSummary = {
      customerName: rental.customerName,
      customerPhone: rental.customerPhone,
      totalProducts: rental.productItems.length,
      totalAmount: rental.totalAmount || 0,
      productsReturned: [],
      inventoryUpdates: []
    };

    // ✅ Return ALL products to inventory (both active and returned quantities)
    for (const productItem of rental.productItems) {
      const productId = productItem.productId._id || productItem.productId;

      // Calculate total quantity to return (original quantity - what was already physically returned)
      const quantityToReturn = productItem.currentQuantity; // Only return what's still out

      if (quantityToReturn > 0) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { quantity: quantityToReturn }
        });

        deletionSummary.inventoryUpdates.push({
          productName: productItem.productName,
          quantityReturned: quantityToReturn,
          totalQuantityWas: productItem.quantity
        });
      }

      deletionSummary.productsReturned.push({
        name: productItem.productName,
        originalQuantity: productItem.quantity,
        currentQuantity: productItem.currentQuantity,
        amount: productItem.amount || 0
      });
    }

    // ✅ Create audit log entry before deletion (optional - you can store this in a separate collection)
    const auditLog = {
      action: 'RENTAL_DELETED',
      rentalId: rental._id,
      customerName: rental.customerName,
      customerPhone: rental.customerPhone,
      reason: reason || 'No reason provided',
      deletionDate: new Date(),
      deletedBy: 'Admin', // You can pass user info from auth
      summary: deletionSummary
    };

    console.log('📋 DELETION AUDIT:', auditLog);

    // ✅ Delete the rental
    await Rental.findByIdAndDelete(req.params.id);

    console.log('✅ RENTAL DELETED SUCCESSFULLY');

    res.json({
      message: `Rental deleted successfully`,
      deletionSummary: deletionSummary,
      auditLog: auditLog
    });

  } catch (error) {
    console.error('❌ Error deleting rental:', error);
    res.status(500).json({
      message: "Error deleting rental",
      error: error.message
    });
  }
});



// ✅ CLOSE ALL RENTALS & SETTLE PAYMENTS - COMPLETE ENDPOINT
router.put("/:id/close-all-rentals", async (req, res) => {
  try {
    const {
      returnDate,
      payAllAmount,
      discountAmount,
      paymentMethod,
      paymentNotes,
      returnNotes,
      discountNotes
    } = req.body;

    console.log('\n🎯 CLOSE ALL RENTALS API HIT');
    console.log('📊 Request Data:', {
      returnDate,
      payAllAmount: payAllAmount || 0,
      discountAmount: discountAmount || 0,
      paymentMethod,
      paymentNotes,
      returnNotes
    });

    // Validation
    if (!returnDate) {
      return res.status(400).json({
        message: "Please provide a return date for closing all rentals"
      });
    }

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType stock');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Check if there are active products
    const activeProducts = rental.productItems.filter(item => item.currentQuantity > 0);
    if (activeProducts.length === 0) {
      return res.status(400).json({
        message: "No active rentals to close. All products are already returned."
      });
    }

    const selectedReturnDate = new Date(returnDate);
    const closeSummary = {
      rentalId: rental._id,
      customerName: rental.customerName,
      customerPhone: rental.customerPhone,
      returnDate: selectedReturnDate,
      totalProducts: rental.productItems.length,
      activeProducts: activeProducts.length,
      productsReturned: [],
      paymentsApplied: [],
      totalReturnAmount: 0,
      totalDiscountApplied: 0,
      totalPaymentApplied: 0
    };

    console.log(`\n📦 Found ${activeProducts.length} active products to return`);

    // Step 1: Calculate current amounts before any operations
    calculateRentalAmounts(rental);
    const originalBalance = rental.balanceAmount;
    console.log(`💰 Original Balance: ₹${originalBalance}`);

    // Step 2: Process returns for all active products
    for (const productItem of activeProducts) {
      const productId = productItem.productId._id || productItem.productId;
      const returnQuantity = productItem.currentQuantity;

      console.log(`\n🔄 Processing return for: ${productItem.productName}`);
      console.log(`   📦 Quantity to return: ${returnQuantity}`);

      // Calculate return amount using proper FIFO logic
      const calculateProductReturnAmount = (rental, productId, returnQuantity, returnDate) => {
        let returnAmount = 0;
        let remainingToReturn = returnQuantity;

        // Get all rental transactions for this product
        const rentalTransactions = rental.transactions
          .filter(t =>
            t.type === 'rental' &&
            t.productId &&
            t.productId.toString() === productId.toString()
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log(`   🔍 Found ${rentalTransactions.length} rental periods for this product`);

        // Calculate daily rate
        let dailyRate = 0;
        switch (productItem.rateType) {
          case 'daily': dailyRate = productItem.rate; break;
          case 'weekly': dailyRate = productItem.rate / 7; break;
          case 'monthly': dailyRate = productItem.rate / 30; break;
        }

        // Process each rental period
        for (const rentalTx of rentalTransactions) {
          if (remainingToReturn <= 0) break;

          const rentalDate = new Date(rentalTx.date);

          // Skip if rental date is after return date
          if (rentalDate > selectedReturnDate) {
            console.log(`   ⏩ Skipping rental from ${rentalDate.toLocaleDateString()} (after return date)`);
            continue;
          }

          const quantityFromThisPeriod = Math.min(rentalTx.quantity, remainingToReturn);
          if (quantityFromThisPeriod > 0) {
            const daysForThisPeriod = calculateInclusiveDays(rentalDate, selectedReturnDate);
            const amountFromThisPeriod = quantityFromThisPeriod * daysForThisPeriod * dailyRate;

            console.log(`   📅 Period (${rentalDate.toLocaleDateString()}):`);
            console.log(`      Quantity: ${quantityFromThisPeriod} units`);
            console.log(`      Days: ${daysForThisPeriod} days`);
            console.log(`      Rate/day: ₹${dailyRate}`);
            console.log(`      Amount: ₹${amountFromThisPeriod.toFixed(2)}`);

            returnAmount += amountFromThisPeriod;
            remainingToReturn -= quantityFromThisPeriod;
          }
        }

        return Math.round(returnAmount * 100) / 100;
      };

      const returnAmount = calculateProductReturnAmount(rental, productId, returnQuantity, selectedReturnDate);

      // Create return transaction
      const returnTransaction = {
        type: 'return',
        productId: productId,
        productName: productItem.productName,
        quantity: returnQuantity,
        days: null,
        amount: returnAmount,
        date: selectedReturnDate,
        notes: returnNotes || `Bulk return - ${returnQuantity} units of ${productItem.productName}`
      };

      rental.transactions.push(returnTransaction);

      // Update product item
      productItem.currentQuantity = 0;

      // Add to inventory
      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: returnQuantity }
      });

      // Add to summary
      closeSummary.productsReturned.push({
        productId: productId,
        productName: productItem.productName,
        quantityReturned: returnQuantity,
        returnAmount: returnAmount,
        returnDate: selectedReturnDate.toISOString()
      });

      closeSummary.totalReturnAmount += returnAmount;

      console.log(`   ✅ Returned ${returnQuantity} units of ${productItem.productName}`);
      console.log(`   💰 Return amount: ₹${returnAmount.toFixed(2)}`);
    }

    // Step 3: Recalculate amounts after returns
    calculateRentalAmounts(rental);
    console.log(`\n💰 After returns calculation:`);
    console.log(`   Total Amount: ₹${rental.totalAmount}`);
    console.log(`   Balance Amount: ₹${rental.balanceAmount}`);

    // Step 4: Apply discount if provided
    let remainingDiscount = discountAmount || 0;
    if (remainingDiscount > 0) {
      console.log(`\n🎁 Applying discount: ₹${remainingDiscount}`);

      // Apply discount proportionally to products with balance
      const productsWithBalance = rental.productItems
        .filter(item => item.balanceAmount > 0)
        .map(item => ({
          productId: item.productId._id || item.productId,
          productName: item.productName,
          balance: item.balanceAmount
        }));

      if (productsWithBalance.length > 0) {
        const totalBalance = productsWithBalance.reduce((sum, item) => sum + item.balance, 0);

        for (const product of productsWithBalance) {
          if (remainingDiscount <= 0) break;

          // Calculate proportional discount
          const discountProportion = product.balance / totalBalance;
          const discountForProduct = Math.min(
            Math.round(remainingDiscount * discountProportion * 100) / 100,
            product.balance
          );

          if (discountForProduct > 0) {
            rental.payments.push({
              amount: discountForProduct,
              type: 'discount',
              productId: product.productId,
              productName: product.productName,
              date: new Date(),
              notes: discountNotes || `Bulk close discount: ₹${discountForProduct} for ${product.productName}`
            });

            remainingDiscount -= discountForProduct;
            closeSummary.totalDiscountApplied += discountForProduct;
            closeSummary.paymentsApplied.push({
              type: 'discount',
              productId: product.productId,
              productName: product.productName,
              amount: discountForProduct,
              description: `Discount applied`
            });

            console.log(`   💰 Applied ₹${discountForProduct} discount to ${product.productName}`);
          }
        }
      }

      // If there's still discount remaining, apply to rental-level
      if (remainingDiscount > 0) {
        rental.payments.push({
          amount: remainingDiscount,
          type: 'discount',
          date: new Date(),
          notes: discountNotes || `General discount for bulk close`
        });

        closeSummary.totalDiscountApplied += remainingDiscount;
        closeSummary.paymentsApplied.push({
          type: 'discount',
          amount: remainingDiscount,
          description: `General discount`
        });

        console.log(`   💰 Applied remaining ₹${remainingDiscount} as general discount`);
      }
    }

    // Step 5: Apply payment if provided
    let remainingPayment = payAllAmount || 0;
    if (remainingPayment > 0) {
      console.log(`\n💳 Applying payment: ₹${remainingPayment}`);

      // Recalculate after discount
      calculateRentalAmounts(rental);

      // Get products with balance after discount
      const productsWithBalance = rental.productItems
        .filter(item => item.balanceAmount > 0)
        .map(item => ({
          productId: item.productId._id || item.productId,
          productName: item.productName,
          balance: item.balanceAmount,
          originalIndex: rental.productItems.findIndex(i =>
            (i.productId._id || i.productId).toString() ===
            (item.productId._id || item.productId).toString()
          )
        }))
        .sort((a, b) => b.originalIndex - a.originalIndex); // LIFO: newest first

      if (productsWithBalance.length > 0) {
        for (const product of productsWithBalance) {
          if (remainingPayment <= 0) break;

          const paymentForProduct = Math.min(product.balance, remainingPayment);

          if (paymentForProduct > 0) {
            rental.payments.push({
              amount: paymentForProduct,
              type: paymentMethod || 'full_payment',
              productId: product.productId,
              productName: product.productName,
              date: new Date(),
              notes: paymentNotes || `Bulk close payment: ₹${paymentForProduct} for ${product.productName}`
            });

            remainingPayment -= paymentForProduct;
            closeSummary.totalPaymentApplied += paymentForProduct;
            closeSummary.paymentsApplied.push({
              type: 'payment',
              productId: product.productId,
              productName: product.productName,
              amount: paymentForProduct,
              description: `Payment applied`
            });

            console.log(`   💰 Applied ₹${paymentForProduct} payment to ${product.productName}`);
          }
        }
      }

      // If there's still payment remaining (overpayment), create a refund or note
      if (remainingPayment > 0) {
        console.log(`   ⚠️  Overpayment detected: ₹${remainingPayment}`);

        // Option 1: Create a refund entry
        rental.payments.push({
          amount: remainingPayment,
          type: 'refund',
          date: new Date(),
          notes: `Overpayment refund from bulk close`
        });

        closeSummary.paymentsApplied.push({
          type: 'refund',
          amount: remainingPayment,
          description: `Overpayment refund`
        });

        console.log(`   💰 Created refund entry for overpayment`);
      }
    }

    // Step 6: Final calculation and status update
    calculateRentalAmounts(rental);

    // Determine final status
    const hasActiveProducts = rental.productItems.some(item => item.currentQuantity > 0);
    const hasUnpaidBalance = rental.balanceAmount > 0;

    if (!hasActiveProducts && !hasUnpaidBalance) {
      rental.status = 'completed';
    } else if (!hasActiveProducts && hasUnpaidBalance) {
      rental.status = 'returned_pending_payment';
    } else {
      rental.status = 'partially_returned';
    }

    // Add summary transaction
    rental.transactions.push({
      type: 'edit',
      productId: null,
      productName: 'ALL PRODUCTS',
      quantity: 0,
      days: 0,
      amount: 0,
      date: new Date(),
      notes: `BULK CLOSE: All rentals returned on ${selectedReturnDate.toLocaleDateString()}. ` +
        `Payment: ₹${payAllAmount || 0}, Discount: ₹${discountAmount || 0}. ` +
        `Final status: ${rental.status}`
    });

    // Save all changes
    await rental.save();

    // Step 7: Prepare final response
    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    // Create detailed summary
    const detailedSummary = {
      rentalDetails: {
        id: updatedRental._id,
        customerName: updatedRental.customerName,
        customerPhone: updatedRental.customerPhone,
        status: updatedRental.status,
        closedDate: selectedReturnDate
      },
      financialSummary: {
        originalBalance: originalBalance,
        totalReturnAmount: closeSummary.totalReturnAmount,
        totalDiscountApplied: closeSummary.totalDiscountApplied,
        totalPaymentApplied: closeSummary.totalPaymentApplied,
        finalTotalAmount: updatedRental.totalAmount,
        finalBalanceAmount: updatedRental.balanceAmount,
        isFullyPaid: updatedRental.balanceAmount <= 0
      },
      productsSummary: closeSummary.productsReturned.map(p => ({
        productName: p.productName,
        quantityReturned: p.quantityReturned,
        returnAmount: p.returnAmount
      })),
      paymentsSummary: closeSummary.paymentsApplied,
      inventoryUpdates: closeSummary.productsReturned.map(p => ({
        productName: p.productName,
        quantityAddedToInventory: p.quantityReturned
      }))
    };

    console.log('\n🏁 BULK CLOSE COMPLETED SUCCESSFULLY');
    console.log('📊 Final Summary:', {
      status: updatedRental.status,
      totalAmount: updatedRental.totalAmount,
      balanceAmount: updatedRental.balanceAmount,
      productsReturned: closeSummary.productsReturned.length
    });

    res.json({
      success: true,
      message: `Successfully closed all rentals. ${closeSummary.productsReturned.length} products returned.`,
      rental: updatedRental,
      summary: detailedSummary,
      closeSummary: closeSummary
    });

  } catch (error) {
    console.error('❌ Error in close-all-rentals:', error);
    res.status(500).json({
      success: false,
      message: "Failed to close all rentals",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});



// ✅ ENHANCED PDF DOWNLOAD WITH PDFKIT-TABLE
const PDFDocument = require('pdfkit-table');

router.get("/download/history-pdf-enhanced", async (req, res) => {
  try {
    const { search = '', status = 'all', dateFrom, dateTo } = req.query;

    // Build query
    let query = buildRentalQuery(search, status, dateFrom, dateTo);

    // Get rentals with full history
    const rentals = await Rental.find(query)
      .populate('productItems.productId', 'name rate rateType')
      .sort({ createdAt: -1 });

    if (rentals.length === 0) {
      return res.status(404).json({ message: "No rentals found" });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });

    const filename = `Detailed-Rental-Report-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- HEADER PAGE ---
    doc.fontSize(24).font('Helvetica-Bold').text('RENTAL MANAGEMENT SYSTEM', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text('Detailed Regulatory Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Oblique').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(14).font('Helvetica-Bold').text('Executive Summary', { underline: true });
    doc.moveDown(0.5);

    const summaryData = generateSummaryRows(rentals);
    // Convert to simple text summary for better readability
    doc.fontSize(10).font('Helvetica');
    let yPos = doc.y;

    summaryData.forEach((row, i) => {
      // Two column layout for summary
      const xPos = (i % 2) === 0 ? 40 : 300;
      if (i % 2 === 0 && i !== 0) yPos += 20;

      doc.font('Helvetica-Bold').text(`${row[0]}: `, xPos, yPos, { continued: true });
      doc.font('Helvetica').text(row[1]);
    });

    doc.moveDown(3);

    // --- DETAILED RECORDS ---
    // Start detailed records on a new page after summary
    doc.addPage();

    rentals.forEach((rental, index) => {
      // Smart Pagination: Check if there is enough space for the Header + Financial Overview (approx 150px)
      // If not, add a new page. 
      if (doc.y > 650) {
        doc.addPage();
      } else if (index > 0) {
        // Add some spacing between rentals if on the same page
        doc.moveDown(2);
        doc.lineWidth(0.5).strokeColor('#cccccc').moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(2);
      }

      const startY = doc.y;

      // 1. HEADER: Customer & Status
      // Background box
      doc.rect(40, startY, 515, 70).fillAndStroke('#f0f9ff', '#086cbe');
      doc.fillColor('black');

      // Customer Name
      doc.fontSize(16).font('Helvetica-Bold')
        .text(rental.customerName, 50, startY + 15);

      // Phone
      doc.fontSize(10).font('Helvetica')
        .text(`Phone: ${rental.customerPhone}`, 50, startY + 40);

      // Status Badge (Text representation)
      const statusText = rental.status.replace(/_/g, ' ').toUpperCase();

      // Measure height of status text to ensure Date doesn't overlap
      doc.fontSize(10).font('Helvetica-Bold');
      const statusWidth = 180;
      const statusHeight = doc.heightOfString(statusText, { width: statusWidth, align: 'right' });

      doc.text(statusText, 360, startY + 15, { align: 'right', width: statusWidth });

      // Position Date relative to Status height
      doc.font('Helvetica')
        .text(`Date: ${new Date(rental.createdAt).toLocaleDateString()}`, 360, startY + 15 + statusHeight + 5, { align: 'right', width: statusWidth });

      // Reset text position for next section
      doc.y = startY + 85;
      doc.x = 40;

      // 2. FINANCIAL OVERVIEW STATEMENT
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#086cbe').text('Financial Overview');
      doc.moveDown(0.5);

      const totalDiscount = rental.payments.filter(p => p.type === 'discount').reduce((sum, p) => sum + p.amount, 0);
      const netTotal = (rental.totalAmount || 0) - totalDiscount;
      const balance = rental.balanceAmount || 0;

      // FIXED: Added continued: true to the first segment and intermediate segments
      doc.fontSize(10).font('Helvetica').fillColor('black');
      doc.text(`This rental agreement has a total gross value of `, { continued: true })
        .font('Helvetica-Bold').text(`₹${(rental.totalAmount || 0).toFixed(2)}`, { continued: true })
        .font('Helvetica').text(`. A total discount of `, { continued: true })
        .font('Helvetica-Bold').text(`₹${totalDiscount.toFixed(2)}`, { continued: true })
        .font('Helvetica').text(` was applied, resulting in a net payable amount of `, { continued: true })
        .font('Helvetica-Bold').text(`₹${netTotal.toFixed(2)}`, { continued: true })
        .font('Helvetica').text(`. To date, `, { continued: true })
        .font('Helvetica-Bold').text(`₹${(rental.totalPaid || 0).toFixed(2)}`, { continued: true })
        .font('Helvetica').text(` has been paid, leaving an outstanding balance of `, { continued: true })
        .font('Helvetica-Bold').fillColor(balance > 0 ? 'red' : 'green')
        .text(`₹${balance.toFixed(2)}`, { continued: true })
        .fillColor('black').font('Helvetica').text(`.`);

      doc.moveDown(1.5);

      // 3. PRODUCT DETAILS (Narrative)
      // Check for space before starting section
      if (doc.y > 700) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#086cbe').text('Product Details');
      doc.moveDown(0.5);

      rental.productItems.forEach((item, i) => {
        // Check space for item
        if (doc.y > 750) doc.addPage();

        const prodName = item.productId?.name || item.productName;
        const status = item.currentQuantity === 0 ? "Returned" : "Active";

        doc.fontSize(10).font('Helvetica-Bold').fillColor('black')
          .text(`${i + 1}. ${prodName}`, { continued: true });
        doc.font('Helvetica').text(` - ${item.quantity} Unit(s) @ ₹${item.rate}/${item.rateType}`);

        doc.fontSize(9).fillColor('#444444')
          .text(`   Current Status: ${status} | Total Item Cost: ₹${(item.amount || 0).toFixed(2)}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);

      // 4. TRANSACTION HISTORY
      if (doc.y > 680) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#086cbe').text('Activity Log (Rentals & Returns)');
      doc.moveDown(0.5);

      const historyEvents = rental.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (historyEvents.length > 0) {
        historyEvents.forEach(tx => {
          if (doc.y > 750) doc.addPage();

          const dateStr = new Date(tx.date).toLocaleDateString();
          const typeStr = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
          const desc = `${typeStr}: ${tx.quantity} unit(s) of ${tx.productName}`;

          doc.fontSize(9).font('Helvetica').fillColor('black')
            .text(`• ${dateStr} - `, { continued: true })
            .font('Helvetica-Bold').text(desc);

          if (tx.notes) {
            doc.fontSize(8).font('Helvetica-Oblique').fillColor('gray')
              .text(`  Note: ${tx.notes}`, { indent: 15 });
          }
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(9).font('Helvetica-Oblique').text('No activity recorded.');
      }

      doc.moveDown(1);

      // 5. PAYMENT & DISCOUNT HISTORY
      if (doc.y > 680) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#086cbe').text('Payment & Discount History');
      doc.moveDown(0.5);

      const paymentEvents = rental.payments.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (paymentEvents.length > 0) {
        paymentEvents.forEach(pay => {
          if (doc.y > 750) doc.addPage();

          const dateStr = new Date(pay.date).toLocaleString();
          const isDiscount = pay.type === 'discount';
          const label = isDiscount ? 'DISCOUNT APPLIED' : 'PAYMENT RECEIVED';
          const color = isDiscount ? 'orange' : 'green';

          doc.fontSize(9).font('Helvetica').fillColor('black')
            .text(`• ${dateStr} - `, { continued: true })
            .font('Helvetica-Bold').fillColor(color).text(`${label}: ₹${pay.amount.toFixed(2)}`);

          if (pay.notes) {
            doc.fontSize(8).font('Helvetica-Oblique').fillColor('gray')
              .text(`  Note: ${pay.notes}`, { indent: 15 });
          }
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('black').text('No payments recorded.');
      }
    });

    // Page Numbering Footer
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('gray').font('Helvetica')
        .text(`Page ${i + 1} of ${totalPages}`, 40, doc.page.height - 30, { align: 'center', width: 515 });
    }

    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: error.message });
  }
});

function buildRentalQuery(search, status, dateFrom, dateTo) {
  let query = {};

  switch (status) {
    case 'completed': query.status = 'completed'; break;
    case 'pending_payment':
      query = { $or: [{ status: 'returned_pending_payment' }, { balanceAmount: { $gt: 0 } }] };
      break;
    case 'active': query.status = 'active'; break;
    case 'partially_returned': query.status = 'partially_returned'; break;
    default:
      query.status = { $in: ['active', 'completed', 'partially_returned', 'returned_pending_payment'] };
      break;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } }
    ];
  }

  return query;
}

function generateSummaryRows(rentals) {
  const summary = {
    totalRentals: rentals.length,
    active: rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
    pending: rentals.filter(r => r.balanceAmount > 0).length,
    totalAmount: rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
    totalPaid: rentals.reduce((sum, r) => sum + (r.totalPaid || 0), 0),
    totalDiscount: rentals.reduce((sum, r) =>
      sum + r.payments.filter(p => p.type === 'discount').reduce((s, p) => s + p.amount, 0), 0),
    totalBalance: rentals.reduce((sum, r) => sum + (r.balanceAmount || 0), 0),
    avgRentalValue: rentals.length > 0 ?
      rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0) / rentals.length : 0
  };

  return [
    ['Total Rentals', summary.totalRentals.toString()],
    ['Active Rentals', summary.active.toString()],
    ['Completed Rentals', summary.completed.toString()],
    ['Pending Payment', summary.pending.toString()],
    ['Gross Revenue', `₹${summary.totalAmount.toFixed(2)}`],
    ['Total Discounts', `₹${summary.totalDiscount.toFixed(2)}`],
    ['Net Revenue', `₹${(summary.totalAmount - summary.totalDiscount).toFixed(2)}`],
    ['Amount Collected', `₹${summary.totalPaid.toFixed(2)}`],
    ['Outstanding Balance', `₹${summary.totalBalance.toFixed(2)}`],
    ['Collection Rate', `${summary.totalAmount > 0 ? ((summary.totalPaid / summary.totalAmount) * 100).toFixed(1) : 0}%`],
    ['Average Rental Value', `₹${summary.avgRentalValue.toFixed(2)}`]
  ];
}

// ✅ SIMPLE PDF DOWNLOAD API
router.get("/download/simple-pdf", async (req, res) => {
  try {
    const rentals = await Rental.find({})
      .populate('productItems.productId', 'name rate rateType')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 records for performance

    if (rentals.length === 0) {
      return res.status(404).json({ message: "No rentals found" });
    }

    const doc = new PDFDocument();
    const filename = `rentals-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20)
      .text('Rental Report', { align: 'center' });

    doc.moveDown();

    // Generate report
    rentals.forEach((rental, index) => {
      // Check for page break
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${rental.customerName} (${rental.customerPhone})`);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Date: ${new Date(rental.createdAt).toLocaleDateString()} | Status: ${rental.status}`);

      doc.text(`Total: ₹${rental.totalAmount || 0} | Paid: ₹${rental.totalPaid || 0} | Balance: ₹${rental.balanceAmount || 0}`);

      // Products
      if (rental.productItems.length > 0) {
        doc.text('Products:');
        rental.productItems.forEach(item => {
          const name = item.productId?.name || item.productName;
          doc.text(`  • ${name} - Qty: ${item.quantity}, Rate: ₹${item.rate}/${item.rateType}, Amount: ₹${item.amount || 0}`);
        });
      }

      doc.moveDown();
      doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown();
    });

    // Footer
    doc.fontSize(8)
      .text(`Generated on ${new Date().toLocaleDateString()} | Total: ${rentals.length} rentals`,
        50, doc.page.height - 50, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
