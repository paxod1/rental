// routes/rentals.js - FIXED ROUTE ORDER
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

// ✅ CRITICAL: ALL GET ROUTES FIRST (SPECIFIC BEFORE PARAMETERIZED)

// 1. Base route - Get all rentals
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

// 2. History route (specific)
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

// 3. All-history route (specific) - MUST BE BEFORE /:id
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

// 4. PARAMETERIZED ROUTE - MUST COME AFTER ALL SPECIFIC ROUTES
router.get("/:id", async (req, res) => {
  try {
    console.log('🎯 ID ROUTE HIT with id:', req.params.id);

    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    res.json(rental);
  } catch (error) {
    console.error('❌ Error in get rental by id:', error);
    res.status(500).json({ message: error.message });
  }
});




// ✅ ALL OTHER ROUTES (POST, PUT, DELETE)

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

    // Validate required fields
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

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(customerPhone)) {
      return res.status(400).json({
        message: "Please provide a valid phone number"
      });
    }

    // Validate and process product items
    const validatedItems = [];
    const transactions = [];
    let totalAmount = 0;

    for (const item of productItems) {
      if (!item.productId || !item.quantity) {
        continue; // Skip invalid items
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

      // Calculate amount for this item (if days provided)
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

      // Add to validated items
      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        currentQuantity: item.quantity, // Initially, current = total
        days: item.days || null,
        rate: product.rate,
        rateType: product.rateType,
        amount: itemAmount
      });

      // Create transaction for this product
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

    // Create advance payment if provided
    const payments = [];
    if (advancePayment && advancePayment > 0) {
      payments.push({
        amount: advancePayment,
        type: 'advance',
        date: new Date(),
        notes: 'Advance payment for rental'
      });
    }

    // Create rental record
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

    // Update product quantities
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

// @desc    Process return for specific product with optional payment
// @route   PUT /api/rentals/:id/return
// @desc    Process return for specific product with optional payment
// @route   PUT /api/rentals/:id/return
// @desc    Process return for specific product with optional payment
// @route   PUT /api/rentals/:id/return
router.put("/:id/return", async (req, res) => {
  try {
    const { productId, returnQuantity, paymentAmount, paymentNotes, notes } = req.body;
    const returnDate = new Date();

    // Validation
    if (!productId || !returnQuantity || returnQuantity <= 0) {
      return res.status(400).json({
        message: "Please provide productId and valid return quantity"
      });
    }

    // Get rental
    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Find product item
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

    console.log(`🔄 PROCESSING RETURN:`);
    console.log(`   Product: ${productItem.productName}`);
    console.log(`   Original Quantity: ${productItem.quantity}`);
    console.log(`   Current Quantity: ${productItem.currentQuantity}`);
    console.log(`   Returning: ${returnQuantity}`);
    console.log(`   Payment: ₹${paymentAmount || 0}`);
    console.log(`   Amount Locked: ${productItem.amountLocked}`);

    // ✅ CRITICAL FIX: Calculate and lock total amount for ALL units
    if (!productItem.amountLocked) {
      console.log(`🔒 CALCULATING AND LOCKING TOTAL AMOUNT FOR ALL UNITS...`);

      // Get all rental transactions for this product
      const rentalTransactions = rental.transactions
        .filter(t => t.type === 'rental' &&
          t.productId && t.productId.toString() === productId.toString())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      let totalCostForAllUnits = 0;

      // Calculate rental cost for ALL originally rented units
      for (const transaction of rentalTransactions) {
        const rentalStartDate = new Date(transaction.date);
        // Calculate days from rental start to return date
        const daysRented = Math.ceil((returnDate - rentalStartDate) / (1000 * 60 * 60 * 24));

        // Convert rate to daily rate
        let dailyRate = 0;
        switch (productItem.rateType) {
          case 'daily':
            dailyRate = productItem.rate;
            break;
          case 'weekly':
            dailyRate = productItem.rate / 7;
            break;
          case 'monthly':
            dailyRate = productItem.rate / 30;
            break;
          default:
            dailyRate = productItem.rate;
        }

        // ✅ CRITICAL: Calculate for ALL units in this transaction (not current quantity)
        const transactionCost = transaction.quantity * daysRented * dailyRate;
        totalCostForAllUnits += transactionCost;

        console.log(`   💰 Transaction: ${transaction.quantity} units × ${daysRented} days × ₹${dailyRate} = ₹${transactionCost}`);
      }

      // Add any existing return charges
      const existingReturnCharges = rental.transactions
        .filter(t => (t.type === 'return' || t.type === 'partial_return') &&
          t.productId && t.productId.toString() === productId.toString())
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      totalCostForAllUnits += existingReturnCharges;

      console.log(`   📊 RENTAL COST FOR ALL UNITS: ₹${totalCostForAllUnits}`);
      console.log(`   📊 EXISTING RETURN CHARGES: ₹${existingReturnCharges}`);
      console.log(`   📊 TOTAL LOCKED AMOUNT: ₹${totalCostForAllUnits}`);

      // ✅ LOCK THE AMOUNT PERMANENTLY
      productItem.amount = Math.round(totalCostForAllUnits * 100) / 100;
      productItem.amountLocked = true;

      console.log(`   🔒 AMOUNT LOCKED AT: ₹${productItem.amount}`);
    } else {
      console.log(`   🔒 AMOUNT ALREADY LOCKED AT: ₹${productItem.amount}`);
    }

    // Calculate return amount using FIFO for this specific return
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

    console.log(`   📝 Added return transaction: ₹${returnCalculation.total}`);

    // Update current quantity
    const oldCurrentQuantity = productItem.currentQuantity;
    productItem.currentQuantity -= returnQuantity;

    console.log(`   📦 Quantity updated: ${oldCurrentQuantity} → ${productItem.currentQuantity}`);

    // ✅ Add payment if provided (this preserves the payment)
    if (paymentAmount && paymentAmount > 0) {
      console.log(`💳 ADDING PAYMENT: ₹${paymentAmount}`);
      rental.payments.push({
        amount: parseFloat(paymentAmount),
        type: 'partial_payment',
        productId: productId,
        productName: productItem.productName,
        date: returnDate,
        notes: paymentNotes || `Payment of ₹${paymentAmount} made during return of ${returnQuantity} units of ${productItem.productName}`
      });
    }

    // Save rental (pre-save hook will calculate final balances)
    console.log(`💾 SAVING RENTAL...`);
    await rental.save();

    // Update rental status
    const hasActiveProducts = rental.productItems.some(item => item.currentQuantity > 0);
    const hasUnpaidBalance = rental.balanceAmount > 0;

    let newStatus = rental.status;
    if (hasActiveProducts) {
      newStatus = 'partially_returned';
    } else if (hasUnpaidBalance) {
      newStatus = 'returned_pending_payment';
    } else {
      newStatus = 'completed';
    }

    if (rental.status !== newStatus) {
      rental.status = newStatus;
      await rental.save();
      console.log(`📊 Status updated: ${newStatus}`);
    }

    // Return product to inventory
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: returnQuantity }
    });

    console.log(`📦 Returned ${returnQuantity} units to inventory`);

    // Get updated rental for response
    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    console.log(`✅ RETURN COMPLETED SUCCESSFULLY:`);
    console.log(`   Final Amount: ₹${updatedRental.productItems.find(p => p.productId._id.toString() === productId.toString())?.amount}`);
    console.log(`   Amount Locked: ${updatedRental.productItems.find(p => p.productId._id.toString() === productId.toString())?.amountLocked}`);
    console.log(`   Total Paid: ₹${updatedRental.totalPaid}`);
    console.log(`   Balance: ₹${updatedRental.balanceAmount}`);
    console.log(`   Status: ${updatedRental.status}`);

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






// @desc    Add new product to existing rental
// @route   PUT /api/rentals/:id/add-product
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

    // Check if product already exists in this rental
    const existingProduct = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (existingProduct) {
      return res.status(400).json({
        message: "Product already exists in this rental. Use 'Add More' instead."
      });
    }

    // Check product availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        message: `Insufficient product quantity. Available: ${product.quantity}, Requested: ${quantity}`
      });
    }

    // Calculate amount if days provided
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

    // Add new product item
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

    // Add rental transaction
    rental.transactions.push({
      type: 'rental',
      productId: productId,
      productName: product.name,
      quantity: quantity,
      days: days || null,
      amount: itemAmount,
      date: selectedStartDate, // ✅ Use selected date
      notes: notes || `Added new product - ${quantity} units of ${product.name} starting ${selectedStartDate.toLocaleDateString()}`
    });


    rental.status = 'active'; // Ensure status is active
    await rental.save();

    // Update product inventory
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

// @desc    Add additional quantity for existing product with custom date
// @route   PUT /api/rentals/:id/add-rental
router.put("/:id/add-rental", async (req, res) => {
  try {
    const { productId, additionalQuantity, additionalStartDate, notes } = req.body;
    // ✅ Use the selected date from frontend
    const selectedStartDate = additionalStartDate ? new Date(additionalStartDate) : new Date();

    console.log('🔄 ADD-RENTAL REQUEST:', {
      productId,
      additionalQuantity,
      additionalStartDate,
      selectedStartDate: selectedStartDate.toISOString()
    });

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

    // Find the product item
    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    // Check product availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < additionalQuantity) {
      return res.status(400).json({
        message: `Insufficient product quantity. Available: ${product.quantity}, Requested: ${additionalQuantity}`
      });
    }

    console.log(`📊 BEFORE ADD-MORE:`);
    console.log(`   Current Amount: ₹${productItem.amount}`);
    console.log(`   Amount Locked: ${productItem.amountLocked}`);
    console.log(`   Current Quantity: ${productItem.currentQuantity}`);

    // ✅ CRITICAL: Calculate additional cost for the new rental period
    const currentDate = new Date();
    const daysFromStart = Math.ceil((currentDate - selectedStartDate) / (1000 * 60 * 60 * 24));

    let dailyRate = 0;
    switch (productItem.rateType) {
      case 'daily':
        dailyRate = productItem.rate;
        break;
      case 'weekly':
        dailyRate = productItem.rate / 7;
        break;
      case 'monthly':
        dailyRate = productItem.rate / 30;
        break;
      default:
        dailyRate = productItem.rate;
    }

    const additionalAmount = additionalQuantity * daysFromStart * dailyRate;

    console.log(`💰 Additional Cost Calculation:`);
    console.log(`   ${additionalQuantity} units × ${daysFromStart} days × ₹${dailyRate}/day = ₹${additionalAmount}`);
    console.log(`   Rate Type: ${productItem.rateType}, Daily Rate: ₹${dailyRate}`);
    console.log(`   Start Date: ${selectedStartDate.toLocaleDateString()}`);

    // ✅ CRITICAL FIX: Add the additional amount to existing amount
    const oldAmount = productItem.amount;
    const newTotalAmount = oldAmount + additionalAmount;

    productItem.amount = Math.round(newTotalAmount * 100) / 100;

    // ✅ LOCK the amount after adding the new cost
    productItem.amountLocked = true;

    console.log(`📊 AMOUNT UPDATE:`);
    console.log(`   Old Amount: ₹${oldAmount}`);
    console.log(`   Additional Amount: ₹${additionalAmount}`);
    console.log(`   New Total Amount: ₹${productItem.amount}`);
    console.log(`   Amount Locked: ${productItem.amountLocked}`);

    // ✅ Add rental transaction with selected date and calculated amount
    rental.transactions.push({
      type: 'rental',
      productId: productId,
      productName: productItem.productName,
      quantity: additionalQuantity,
      days: null,
      amount: additionalAmount, // ✅ Include calculated amount
      date: selectedStartDate, // ✅ Use selected start date (NOT current date)
      notes: notes || `Additional rental - ${additionalQuantity} units of ${productItem.productName} starting ${selectedStartDate.toLocaleDateString()}`
    });

    // Update product item quantities
    productItem.quantity += additionalQuantity;
    productItem.currentQuantity += additionalQuantity;

    rental.status = 'active'; // Reset to active

    await rental.save(); // ✅ Pre-save hook will use the updated amount

    // Update product inventory
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: -additionalQuantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    console.log('✅ ADD-MORE COMPLETED:');
    console.log(`   Final Product Amount: ₹${updatedRental.productItems.find(p => p.productId._id.toString() === productId.toString())?.amount}`);
    console.log(`   New Total Amount: ₹${updatedRental.totalAmount}`);
    console.log(`   New Balance: ₹${updatedRental.balanceAmount}`);

    res.json(updatedRental);
  } catch (error) {
    console.error('❌ Error adding more quantity:', error);
    res.status(500).json({ message: error.message });
  }
});




router.get("/:id", async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    res.json(rental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @desc    Delete rental record
// @route   DELETE /api/rentals/:id
router.delete("/:id", async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('productItems.productId', 'name rate rateType');

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Check if rental has any active products
    if (!rental.isFullyReturned()) {
      return res.status(400).json({
        message: "Cannot delete active rental. Please process returns for all products first."
      });
    }

    // Handle inventory adjustment for each product
    for (const productItem of rental.productItems) {
      if (productItem.productId && productItem.productId._id) {
        const returnedQuantity = productItem.quantity - productItem.currentQuantity;

        if (returnedQuantity > 0) {
          // Reverse the return to maintain inventory consistency
          await Product.findByIdAndUpdate(productItem.productId._id, {
            $inc: { quantity: -returnedQuantity }
          });
        }
      }
    }

    // Delete the rental
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

// Add these routes to your existing routes/rentals.js file

// @desc    Add product-specific payment
// @route   PUT /api/rentals/:id/product-payment

// desc: Add product-specific payment
router.put("/:id/product-payment", async (req, res) => {
  try {
    const { productId, amount, paymentType, notes } = req.body;

    console.log('\n💳 PRODUCT PAYMENT STARTING...');
    console.log(`🆔 Rental ID: ${req.params.id}`);
    console.log(`🆔 Product ID: ${productId}`);
    console.log(`💰 Payment Amount: ₹${amount}`);

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

    // Find the product item
    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    // ✅ FIXED: Calculate product balance properly
    console.log('\n📊 PRODUCT BALANCE CALCULATION:');
    console.log(`   Product Name: ${productItem.productName}`);
    console.log(`   Product Amount: ₹${productItem.amount}`);
    console.log(`   Amount Locked: ${productItem.amountLocked}`);

    // Get all payments for this specific product
    const productPayments = rental.payments.filter(payment => 
      payment.productId && payment.productId.toString() === productId.toString()
    );

    const totalPaid = productPayments.reduce((sum, payment) => {
      return payment.type === 'refund' ? sum - payment.amount : sum + payment.amount;
    }, 0);

    // ✅ CORRECTED: Use the actual product amount and payments
    const currentProductBalance = Math.max(0, productItem.amount - totalPaid);

    console.log(`   Existing Payments: ${productPayments.length}`);
    console.log(`   Total Paid: ₹${totalPaid}`);
    console.log(`   Calculated Balance: ₹${currentProductBalance}`);

    // Check if payment amount exceeds product balance
    if (amount > currentProductBalance) {
      console.log(`❌ PAYMENT REJECTED: ₹${amount} > ₹${currentProductBalance}`);
      return res.status(400).json({
        message: `Payment amount (₹${amount}) exceeds product balance (₹${currentProductBalance.toFixed(2)})`
      });
    }

    if (currentProductBalance <= 0) {
      return res.status(400).json({
        message: "This product is already fully paid"
      });
    }

    console.log(`✅ PAYMENT APPROVED: ₹${amount} <= ₹${currentProductBalance}`);

    // Add product-specific payment
    rental.payments.push({
      amount: parseFloat(amount),
      type: paymentType || 'product_payment',
      productId: productId,
      productName: productItem.productName,
      date: new Date(),
      notes: notes || `Payment for ${productItem.productName}`
    });

    console.log('💾 SAVING RENTAL WITH NEW PAYMENT...');
    await rental.save();

    // Check if rental should be marked as completed
    if (rental.isFullyReturned && rental.balanceAmount <= 0) {
      rental.status = 'completed';
      await rental.save();
      console.log('✅ RENTAL MARKED AS COMPLETED');
    }

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    console.log('✅ PAYMENT COMPLETED SUCCESSFULLY');
    res.json(updatedRental);

  } catch (error) {
    console.error('❌ Error in product-payment:', error);
    res.status(500).json({ message: error.message });
  }
});



// @desc    Pay full amount for specific product
// @route   PUT /api/rentals/:id/product-full-payment
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

    // Find the product item
    const productItem = rental.productItems.find(item =>
      item.productId._id.toString() === productId.toString()
    );

    if (!productItem) {
      return res.status(404).json({ message: "Product not found in this rental" });
    }

    // Get current product balance
    const currentProductBalance = rental.getProductBalance(productId);

    if (currentProductBalance <= 0) {
      return res.status(400).json({
        message: "Product is already fully paid"
      });
    }

    // Add full payment for the product
    rental.payments.push({
      amount: currentProductBalance,
      type: 'full_payment',
      productId: productId,
      productName: productItem.productName,
      date: new Date(),
      notes: notes || `Full payment for ${productItem.productName}`
    });

    await rental.save();

    // Check if rental should be marked as completed
    if (rental.isFullyReturned() && rental.balanceAmount <= 0) {
      rental.status = 'completed';
      await rental.save();
    }

    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    res.json({
      rental: updatedRental,
      paidAmount: currentProductBalance,
      message: `Full payment of $${currentProductBalance.toFixed(2)} processed for ${productItem.productName}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Return product with full payment option
// @route   PUT /api/rentals/:id/return-and-pay
// @desc    Return product with full payment option
// @route   PUT /api/rentals/:id/return-and-pay
// @route   PUT /api/rentals/:id/return-and-pay
router.put("/:id/return-and-pay", async (req, res) => {
  try {
    const { productId, returnQuantity, payFullAmount, paymentAmount, paymentNotes, notes, returnDate } = req.body;
    const selectedReturnDate = returnDate ? new Date(returnDate) : new Date();

    console.log('\n🔄 RETURN-AND-PAY STARTING...');
    console.log(`🆔 Rental ID: ${req.params.id}`);
    console.log(`🆔 Product ID: ${productId}`);
    console.log(`📦 Return Quantity: ${returnQuantity}`);
    console.log(`💳 Payment Amount: ${paymentAmount}`);
    console.log(`💳 Pay Full Amount: ${payFullAmount}`);
    console.log(`📅 Selected Return Date: ${selectedReturnDate.toISOString()}`);

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

    // Find the product item
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

    console.log('\n📊 BEFORE RETURN - Product State:');
    console.log(`   Product: ${productItem.productName}`);
    console.log(`   Original Quantity: ${productItem.quantity}`);
    console.log(`   Current Quantity: ${productItem.currentQuantity}`);
    console.log(`   Stored Amount: ₹${productItem.amount}`);
    console.log(`   Amount Locked: ${productItem.amountLocked}`);

    // **********************************************************************************
    // ✅ OPTION B: UNIT-WISE FIFO CALCULATION (FIXED)
    console.log('\n🔹 OPTION B: UNIT-WISE FIFO CALCULATION...');

    // Get daily rate
    let dailyRate = 0;
    switch (productItem.rateType) {
      case 'daily':
        dailyRate = productItem.rate;
        break;
      case 'weekly':
        dailyRate = productItem.rate / 7;
        break;
      case 'monthly':
        dailyRate = productItem.rate / 30;
        break;
    }

    // Get all rental transactions for this product
    const rentalTransactions = rental.transactions
      .filter(t => t.type === 'rental' &&
        t.productId && t.productId.toString() === productId.toString())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`📝 Found ${rentalTransactions.length} rental transactions`);

    let totalUnitWiseCost = 0;
    let daysUntilReturn = 0; // ✅ Declare this variable

    for (const transaction of rentalTransactions) {
      const rentalStartDate = new Date(transaction.date);

      // ✅ CORRECTED: Proper inclusive day calculation
      // For returned units: from rental start to return date (inclusive)
      daysUntilReturn = Math.ceil((selectedReturnDate - rentalStartDate) / (1000 * 60 * 60 * 24)) + 1;

      // ✅ FIXED: For remaining units: from rental start to current date (inclusive, but don't double-add)
      const totalDaysFromStart = Math.ceil((new Date() - rentalStartDate) / (1000 * 60 * 60 * 24));

      // Calculate cost for returned units (start to return date)
      const returnedUnitsCost = returnQuantity * daysUntilReturn * dailyRate;

      // Calculate cost for remaining units (start to current)
      const remainingUnits = productItem.currentQuantity - returnQuantity;
      const remainingUnitsCost = remainingUnits * totalDaysFromStart * dailyRate;

      totalUnitWiseCost = returnedUnitsCost + remainingUnitsCost;

      console.log(`🔹 Option B Unit-wise calculation (CORRECTED):`);
      console.log(`   📅 Return period: ${daysUntilReturn} days (${new Date(rentalStartDate).toLocaleDateString()} to ${selectedReturnDate.toLocaleDateString()})`);
      console.log(`   📅 Current period: ${totalDaysFromStart} days (${new Date(rentalStartDate).toLocaleDateString()} to ${new Date().toLocaleDateString()})`);
      console.log(`   💰 Returned units: ${returnQuantity} units × ${daysUntilReturn} days × ₹${dailyRate} = ₹${returnedUnitsCost}`);
      console.log(`   💰 Remaining units: ${remainingUnits} units × ${totalDaysFromStart} days × ₹${dailyRate} = ₹${remainingUnitsCost}`);
      console.log(`   🔹 Total unit-wise cost: ₹${totalUnitWiseCost}`);

      break;
    }


    // ✅ ALWAYS update amount with unit-wise calculation
    productItem.amount = Math.round(totalUnitWiseCost * 100) / 100;
    productItem.amountLocked = true;

    console.log(`   ✅ Amount updated to: ₹${productItem.amount}`);

    // ✅ Calculate the return amount directly using the same logic
    const returnTransactionAmount = returnQuantity * daysUntilReturn * dailyRate;

    // Use calculateProductFIFOReturn for other purposes but calculate amount correctly
    const returnCalculation = calculateProductFIFOReturn(rental, productId, returnQuantity, selectedReturnDate);

    // Add return transaction with correct amount calculation
    rental.transactions.push({
      type: returnQuantity === productItem.currentQuantity ? 'return' : 'partial_return',
      productId: productId,
      productName: productItem.productName,
      quantity: returnQuantity,
      days: daysUntilReturn, // ✅ Add the calculated days
      amount: Math.round(returnTransactionAmount * 100) / 100, // ✅ Use direct calculation
      date: selectedReturnDate,
      notes: notes || `Return processed for ${productItem.productName} on ${selectedReturnDate.toLocaleDateString()}`
    });

    console.log(`✅ Return transaction amount: ₹${returnTransactionAmount.toFixed(2)} (${returnQuantity} units × ${daysUntilReturn} days × ₹${dailyRate}/day)`);


    // Update current quantity
    productItem.currentQuantity -= returnQuantity;

    console.log(`\n📦 AFTER RETURN PROCESSING:`);
    console.log(`   Current Quantity: ${productItem.currentQuantity}`);
    console.log(`   Amount: ₹${productItem.amount}`);
    console.log(`   Amount Locked: ${productItem.amountLocked}`);

    // Handle payments
    let paymentInfo = null;
    if (payFullAmount) {
      const productBalance = rental.getProductBalance ? rental.getProductBalance(productId) : (productItem.amount - (productItem.paidAmount || 0));
      if (productBalance > 0) {
        rental.payments.push({
          amount: productBalance,
          type: 'full_payment',
          productId: productId,
          productName: productItem.productName,
          date: selectedReturnDate,
          notes: paymentNotes || `Full payment for ${productItem.productName}`
        });
        paymentInfo = { type: 'full', amount: productBalance };
        console.log(`💳 Added full payment: ₹${productBalance}`);
      }
    } else if (paymentAmount && paymentAmount > 0) {
      rental.payments.push({
        amount: parseFloat(paymentAmount),
        type: 'partial_payment',
        productId: productId,
        productName: productItem.productName,
        date: selectedReturnDate,
        notes: paymentNotes || `Partial payment for ${productItem.productName}`
      });
      paymentInfo = { type: 'partial', amount: parseFloat(paymentAmount) };
      console.log(`💳 Added partial payment: ₹${paymentAmount}`);
    }

    // Save rental
    console.log('\n💾 SAVING RENTAL...');
    await rental.save();

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

    // Return to inventory
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: returnQuantity }
    });

    // Get final state
    const updatedRental = await Rental.findById(rental._id)
      .populate('productItems.productId', 'name rate rateType');

    const finalProduct = updatedRental.productItems.find(p => p.productId._id.toString() === productId.toString());

    console.log('\n🏁 FINAL RESULT:');
    console.log(`   Product Amount: ₹${finalProduct.amount}`);
    console.log(`   Amount Locked: ${finalProduct.amountLocked}`);
    console.log(`   Total Amount: ₹${updatedRental.totalAmount}`);
    console.log(`   Total Paid: ₹${updatedRental.totalPaid}`);
    console.log(`   Balance: ₹${updatedRental.balanceAmount}`);

    res.json({
      rental: updatedRental,
      returnCalculation: returnCalculation,
      paymentInfo: paymentInfo
    });

  } catch (error) {
    console.error('❌ Error in return-and-pay:', error);
    res.status(500).json({ message: error.message });
  }
});

// desc: Add global payment (pay total balance - full or partial)




// @desc    Add general payment with optional discount







// routes/rentals.js
router.put("/:id/general-payment", async (req, res) => {
  try {
    const { amount, discountAmount, paymentType, notes, discountNotes } = req.body;

    console.log("\n💰 GENERAL PAYMENT STARTING...");
    console.log(`Rental ID: ${req.params.id}`);
    console.log(`Payment: ₹${amount || 0}, Discount: ₹${discountAmount || 0}`);

    // Validate input
    if ((!amount || amount <= 0) && (!discountAmount || discountAmount <= 0)) {
      return res.status(400).json({ message: "Please provide payment or discount amount" });
    }

    const rental = await Rental.findById(req.params.id)
      .populate("productItems.productId", "name rate rateType");

    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    let paymentAmt = parseFloat(amount) || 0;
    let discountAmt = parseFloat(discountAmount) || 0;
    let totalToDistribute = paymentAmt + discountAmt;

    // ✅ Collect products with balances
    const productsWithBalance = rental.productItems.map(item => {
      const productPayments = rental.payments.filter(
        p => p.productId && p.productId.toString() === item.productId._id.toString()
      );

      const totalActualPayments = productPayments.reduce((sum, p) => {
        if (p.type === "refund") return sum - p.amount;
        if (p.type === "discount") return sum;
        return sum + p.amount;
      }, 0);

      const totalDiscounts = productPayments.reduce((sum, p) => {
        if (p.type === "discount") return sum + p.amount;
        return sum;
      }, 0);

      const currentBalance = Math.max(0, (item.amount - totalDiscounts) - totalActualPayments);

      return {
        productItem: item,
        productId: item.productId._id,
        productName: item.productName || item.productId.name,
        currentBalance,
        paid: totalActualPayments,
        discounts: totalDiscounts
      };
    }).filter(p => p.currentBalance > 0);

    if (productsWithBalance.length === 0) {
      return res.status(400).json({ message: "No products with outstanding balance" });
    }

    // ✅ Sort products by balance (smallest first)
    productsWithBalance.sort((a, b) => a.currentBalance - b.currentBalance);

    const distributionDetails = [];

    // ✅ Step 1: fully pay off cheapest products until funds run out
    for (let product of productsWithBalance) {
      if (totalToDistribute <= 0) break;

      let applyAmt = Math.min(product.currentBalance, totalToDistribute);

      // Split between discount + payment proportionally
      let fromDiscount = Math.min(discountAmt, applyAmt);
      let fromPayment = applyAmt - fromDiscount;

      // Apply discount
      if (fromDiscount > 0) {
        rental.payments.push({
          amount: fromDiscount,
          type: "discount",
          productId: product.productId,
          productName: product.productName,
          date: new Date(),
          notes: discountNotes || `Discount: ₹${fromDiscount} for ${product.productName}`
        });
        discountAmt -= fromDiscount;
        totalToDistribute -= fromDiscount;
      }

      // Apply payment
      if (fromPayment > 0) {
        rental.payments.push({
          amount: fromPayment,
          type: paymentType || "product_payment",
          productId: product.productId,
          productName: product.productName,
          date: new Date(),
          notes: notes || `Payment: ₹${fromPayment} for ${product.productName}`
        });
        paymentAmt -= fromPayment;
        totalToDistribute -= fromPayment;
      }

      distributionDetails.push({
        productId: product.productId,
        productName: product.productName,
        appliedTotal: applyAmt,
        fromPayment,
        fromDiscount
      });
    }

    // ✅ Step 2: split leftover equally among remaining products (no decimals)
    if (totalToDistribute > 0) {
      const remainingProducts = productsWithBalance.filter(p => {
        const dist = distributionDetails.find(d => d.productId.toString() === p.productId.toString());
        return !dist || dist.appliedTotal < p.currentBalance;
      });

      if (remainingProducts.length > 0) {
        let share = Math.floor(totalToDistribute / remainingProducts.length);

        for (let product of remainingProducts) {
          if (totalToDistribute <= 0) break;

          let applyAmt = Math.min(product.currentBalance, share);

          let fromDiscount = Math.min(discountAmt, applyAmt);
          let fromPayment = applyAmt - fromDiscount;

          if (fromDiscount > 0) {
            rental.payments.push({
              amount: fromDiscount,
              type: "discount",
              productId: product.productId,
              productName: product.productName,
              date: new Date(),
              notes: discountNotes || `Discount: ₹${fromDiscount} for ${product.productName}`
            });
            discountAmt -= fromDiscount;
            totalToDistribute -= fromDiscount;
          }

          if (fromPayment > 0) {
            rental.payments.push({
              amount: fromPayment,
              type: paymentType || "product_payment",
              productId: product.productId,
              productName: product.productName,
              date: new Date(),
              notes: notes || `Payment: ₹${fromPayment} for ${product.productName}`
            });
            paymentAmt -= fromPayment;
            totalToDistribute -= fromPayment;
          }

          distributionDetails.push({
            productId: product.productId,
            productName: product.productName,
            appliedTotal: applyAmt,
            fromPayment,
            fromDiscount
          });
        }
      }
    }

    await rental.save(); // pre-save hook recalculates totals

    const updatedRental = await Rental.findById(rental._id)
      .populate("productItems.productId", "name rate rateType");

    res.json({
      rental: updatedRental,
      distributionDetails,
      message: "General payment and discount applied successfully"
    });

  } catch (error) {
    console.error("❌ Error in general-payment:", error);
    res.status(500).json({ message: error.message });
  }
});














module.exports = router;
