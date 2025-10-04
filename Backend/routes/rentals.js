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
const calculateInclusiveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to start of day to avoid time zone issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const timeDifference = end.getTime() - start.getTime();
  const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  
  // ✅ CRITICAL: Add 1 to make it inclusive (both start and end dates count)
  return dayDifference + 1;
};

// ✅ COMPLETELY FIXED CALCULATION FUNCTION - HANDLES MULTIPLE RENTAL PERIODS
const calculateRentalAmounts = (rental) => {
  const currentDate = new Date();
  let calculatedTotalAmount = 0;

  console.log('\n🚀 CALCULATING RENTAL AMOUNTS (MULTI-PERIOD FIXED)...');
  console.log(`📅 Current Date: ${currentDate.toISOString()}`);

  for (const productItem of rental.productItems) {
    console.log(`\n🔄 Processing Product: ${productItem.productName}`);
    console.log(`   📦 Original Quantity: ${productItem.quantity}`);
    console.log(`   📦 Current Quantity: ${productItem.currentQuantity}`);

    // Get the correct product ID for comparison
    const targetProductId = productItem.productId._id ? 
      productItem.productId._id.toString() : 
      productItem.productId.toString();
    
    console.log(`   🆔 Target Product ID: ${targetProductId}`);

    // Calculate daily rate
    let dailyRate = 0;
    switch (productItem.rateType) {
      case 'daily': dailyRate = productItem.rate; break;
      case 'weekly': dailyRate = productItem.rate / 7; break;
      case 'monthly': dailyRate = productItem.rate / 30; break;
    }

    let productTotalAmount = 0;

    // ✅ STEP 1: Calculate ALL RETURNED amounts (finalized)
    const returnTransactions = rental.transactions.filter(t => {
      const isReturnType = t.type === 'return' || t.type === 'partial_return';
      if (!isReturnType) return false;

      if (t.productId) {
        const txProductId = t.productId._id ? 
          t.productId._id.toString() : 
          t.productId.toString();
        
        if (txProductId === targetProductId) {
          return true;
        }
      }

      if (t.productName && productItem.productName && 
          t.productName === productItem.productName) {
        return true;
      }

      return false;
    });

    console.log(`\n📝 Found ${returnTransactions.length} return transactions:`);
    
    let totalReturnedAmount = 0;
    for (const tx of returnTransactions) {
      let correctAmount = tx.amount || 0;
      
      // Use stored transaction amount (already calculated correctly)
      if (tx.amount > 0) {
        correctAmount = tx.amount;
        console.log(`      Return: Qty=${tx.quantity}, Days=${tx.days}, Amount=₹${correctAmount}`);
      }
      
      totalReturnedAmount += correctAmount;
    }

    console.log(`   💰 Total Returned Amount: ₹${totalReturnedAmount}`);

    // ✅ STEP 2: Calculate CURRENT ACTIVE quantity - FIXED FOR MULTIPLE PERIODS
    let currentActiveAmount = 0;
    
    if (productItem.currentQuantity > 0) {
      // ✅ Get ALL rental transactions for this product (including add-more)
      const rentalTransactions = rental.transactions.filter(t => {
        if (t.type !== 'rental') return false;
        
        if (t.productId) {
          const txProductId = t.productId._id ? 
            t.productId._id.toString() : 
            t.productId.toString();
          
          if (txProductId === targetProductId) return true;
        }

        if (t.productName && productItem.productName && 
            t.productName === productItem.productName) return true;

        return false;
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log(`\n🔍 Found ${rentalTransactions.length} rental transactions:`);

      // ✅ CRITICAL FIX: Calculate active amount for EACH rental period separately
      let remainingActiveQuantity = productItem.currentQuantity;
      let totalReturnedQuantity = returnTransactions.reduce((sum, tx) => sum + tx.quantity, 0);

      console.log(`   📊 Remaining Active Quantity: ${remainingActiveQuantity}`);
      console.log(`   📊 Total Returned Quantity: ${totalReturnedQuantity}`);

      // Process rental transactions from newest to oldest for active calculation
      for (let i = rentalTransactions.length - 1; i >= 0 && remainingActiveQuantity > 0; i--) {
        const rentalTx = rentalTransactions[i];
        const rentalDate = new Date(rentalTx.date);
        
        // Calculate how much of this rental period is still active
        const quantityFromThisPeriod = Math.min(remainingActiveQuantity, rentalTx.quantity);
        const daysFromThisPeriod = calculateInclusiveDays(rentalDate, currentDate);
        const amountFromThisPeriod = quantityFromThisPeriod * daysFromThisPeriod * dailyRate;

        console.log(`   📅 Rental Period ${i + 1}:`);
        console.log(`      Date: ${rentalDate.toLocaleDateString()}`);
        console.log(`      Quantity from this period: ${quantityFromThisPeriod}`);
        console.log(`      Days: ${daysFromThisPeriod}`);
        console.log(`      Amount: ${quantityFromThisPeriod} × ${daysFromThisPeriod} × ₹${dailyRate} = ₹${amountFromThisPeriod}`);

        currentActiveAmount += amountFromThisPeriod;
        remainingActiveQuantity -= quantityFromThisPeriod;
      }

      console.log(`   💰 Total Active Amount: ₹${currentActiveAmount}`);
    }

    // ✅ CRITICAL: TOTAL = Returned + Active
    productTotalAmount = totalReturnedAmount + currentActiveAmount;

    console.log(`\n   🎯 TOTAL PRODUCT CALCULATION:`);
    console.log(`      💰 Returned: ₹${totalReturnedAmount}`);
    console.log(`      🔄 Active: ₹${currentActiveAmount}`);
    console.log(`      📊 TOTAL: ₹${productTotalAmount}`);

    // Update product amount
    const oldAmount = productItem.amount;
    productItem.amount = Math.round(productTotalAmount * 100) / 100;
    
    console.log(`   📈 AMOUNT UPDATED: ₹${oldAmount} → ₹${productItem.amount}`);

    // Calculate payments and discounts (unchanged)
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

    console.log(`   📊 FINAL PRODUCT VALUES:`);
    console.log(`      💰 Amount: ₹${productItem.amount}`);
    console.log(`      💳 Paid: ₹${productPayments}`);
    console.log(`      💸 Discounts: ₹${productDiscounts}`);
    console.log(`      💰 Balance: ₹${productItem.balanceAmount}`);

    calculatedTotalAmount += productItem.amount;
  }

  // Calculate rental totals (unchanged)
  const totalPaidAmount = rental.payments
    .filter(p => p.type !== 'discount')
    .reduce((sum, p) => {
      return p.type === 'refund' ? sum - p.amount : sum + p.amount;
    }, 0);

  const totalDiscountAmount = rental.payments
    .filter(p => p.type === 'discount')
    .reduce((sum, p) => sum + p.amount, 0);

  const oldTotalAmount = rental.totalAmount;
  rental.totalAmount = Math.round(calculatedTotalAmount * 100) / 100;
  rental.totalPaid = Math.round(totalPaidAmount * 100) / 100;
  rental.balanceAmount = Math.max(0, (rental.totalAmount - totalDiscountAmount) - rental.totalPaid);

  console.log(`\n📊 RENTAL TOTALS CALCULATED:`);
  console.log(`   💰 Total Amount: ₹${oldTotalAmount} → ₹${rental.totalAmount}`);
  console.log(`   💸 Total Discounts: ₹${totalDiscountAmount}`);
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

    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;

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
      case 'all':
      default:
        query.status = { $in: ['completed', 'returned_pending_payment'] };
        break;
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

    const transformedRentals = rentals.map(rental => ({
      ...rental.toObject(),
      totalProducts: rental.productItems.length,
      activeProducts: rental.productItems.filter(item => item.currentQuantity > 0).length,
      returnedProducts: rental.productItems.filter(item => item.currentQuantity === 0).length,
      productNames: rental.productItems.map(item =>
        item.productId?.name || item.productName
      ).join(', '),
      paymentSummary: {
        totalAmount: rental.totalAmount || 0,
        totalPaid: rental.totalPaid || 0,
        balanceAmount: rental.balanceAmount || 0,
        isFullyPaid: rental.balanceAmount <= 0,
        paymentProgress: rental.totalAmount > 0 ?
          Math.min((rental.totalPaid / rental.totalAmount) * 100, 100) : 0
      }
    }));

    res.json({
      rentals: transformedRentals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalRentals: total
    });
  } catch (error) {
    console.error('❌ Error in all-history:', error);
    res.status(500).json({ message: error.message });
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

    const rentalTransactions = rental.transactions
      .filter(t => t.type === 'rental' &&
        t.productId && t.productId.toString() === productId.toString())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let returnTransactionAmount = 0;
    let daysUntilReturn = 0;

    if (rentalTransactions.length > 0) {
      const originalRentalDate = new Date(rentalTransactions[0].date);
      
      // ✅ FIXED: Use inclusive day calculation
      daysUntilReturn = calculateInclusiveDays(originalRentalDate, selectedReturnDate);
      returnTransactionAmount = returnQuantity * daysUntilReturn * dailyRate;

      console.log(`💰 Return calculation (INCLUSIVE):`);
      console.log(`   📅 From: ${originalRentalDate.toLocaleDateString()} to ${selectedReturnDate.toLocaleDateString()}`);
      console.log(`   📅 Days (INCLUSIVE): ${daysUntilReturn}`);
      console.log(`   💰 Amount: ${returnQuantity} × ${daysUntilReturn} × ₹${dailyRate} = ₹${returnTransactionAmount.toFixed(2)}`);
    }

    // Create return transaction with correct inclusive days
    const returnTransaction = {
      type: returnQuantity === productItem.currentQuantity ? 'return' : 'partial_return',
      productId: productId,
      productName: productItem.productName,
      quantity: returnQuantity,
      days: daysUntilReturn, // ✅ This will now be inclusive (e.g., 10 instead of 9)
      amount: Math.round(returnTransactionAmount * 100) / 100,
      date: selectedReturnDate,
      notes: notes || `Return processed for ${productItem.productName}`
    };

    rental.transactions.push(returnTransaction);
    productItem.currentQuantity -= returnQuantity;

    console.log(`✅ Added return transaction: ₹${returnTransactionAmount} for ${daysUntilReturn} days (inclusive)`);

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
        days: daysUntilReturn, // This will now show 10 instead of 9
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

module.exports = router;
