// routes/rentals.js - Updated with payment on return and completion logic
const express = require("express");
const router = express.Router();
const Rental = require("../models/Rental");
const Product = require("../models/Product");

// Helper function to calculate days between dates
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end.getTime() - start.getTime();
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
};

// Calculate return amount using FIFO logic
const calculateFIFOReturn = (rental, returnQuantity, returnDate) => {
  const returnAmount = { total: 0, breakdown: [] };
  let remainingToReturn = returnQuantity;

  const rentalTransactions = rental.transactions
    .filter(t => t.type === 'rental')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const transaction of rentalTransactions) {
    if (remainingToReturn <= 0) break;

    const quantityToReturn = Math.min(remainingToReturn, transaction.quantity);
    const daysUsed = calculateDaysBetween(transaction.date, returnDate);

    const product = rental.productId;
    let ratePerDay = 0;

    switch (product.rateType) {
      case 'daily':
        ratePerDay = product.rate;
        break;
      case 'weekly':
        ratePerDay = product.rate / 7;
        break;
      case 'monthly':
        ratePerDay = product.rate / 30;
        break;
    }

    const amount = quantityToReturn * daysUsed * ratePerDay;

    returnAmount.breakdown.push({
      transactionDate: transaction.date,
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

// @desc    Get all rentals
// @route   GET /api/rentals
router.get("/", async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('productId', 'name rate rateType')
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get rental history (completed rentals only)
// @route   GET /api/rentals/history
router.get("/history", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    let query = { status: 'completed' };

    // Add search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const rentals = await Rental.find(query)
      .populate('productId', 'name rate rateType')
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
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new rental
// @route   POST /api/rentals
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      productId,
      quantity,
      days,
      startDate,
      advancePayment,
      notes
    } = req.body;

    if (!customerName || !productId || !quantity || !startDate) {
      return res.status(400).json({
        message: "Please provide customerName, productId, quantity, and startDate"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient product quantity" });
    }

    // Calculate amount for initial rental transaction (if days provided)
    let amount = 0;
    if (days) {
      switch (product.rateType) {
        case 'daily':
          amount = product.rate * days * quantity;
          break;
        case 'weekly':
          amount = product.rate * Math.ceil(days / 7) * quantity;
          break;
        case 'monthly':
          amount = product.rate * Math.ceil(days / 30) * quantity;
          break;
      }
    }

    // Create initial rental transaction
    const transactions = [{
      type: 'rental',
      quantity: quantity,
      days: days || null,
      amount: amount,
      date: new Date(startDate),
      notes: `Initial rental - ${quantity} units${days ? ` for ${days} days` : ''}`
    }];

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

    const rental = await Rental.create({
      customerName,
      customerEmail,
      customerPhone,
      productId,
      initialQuantity: quantity,
      currentQuantity: quantity,
      startDate,
      transactions,
      payments,
      totalAmount: amount,
      notes,
    });

    // Update product quantity
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: -quantity }
    });

    const populatedRental = await Rental.findById(rental._id)
      .populate('productId', 'name rate rateType');

    res.status(201).json(populatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Process return with optional payment
// @route   PUT /api/rentals/:id/return

router.put("/:id/return", async (req, res) => {
  try {
    const { returnQuantity, paymentAmount, paymentNotes, notes } = req.body;
    const returnDate = new Date();

    if (!returnQuantity || returnQuantity <= 0) {
      return res.status(400).json({ message: "Return quantity must be greater than 0" });
    }

    const rental = await Rental.findById(req.params.id).populate('productId');
    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    if (returnQuantity > rental.currentQuantity) {
      return res.status(400).json({ message: "Return quantity cannot exceed current rented quantity" });
    }

    // Calculate return amount using FIFO
    const returnCalculation = calculateFIFOReturn(rental, returnQuantity, returnDate);

    // Add return transaction
    rental.transactions.push({
      type: returnQuantity === rental.currentQuantity ? 'return' : 'partial_return',
      quantity: returnQuantity,
      days: null,
      amount: returnCalculation.total,
      date: returnDate,
      notes: notes || 'Return processed'
    });

    // CRITICAL: Add payment BEFORE saving to ensure it's included in balance calculation
    if (paymentAmount && paymentAmount > 0) {
      rental.payments.push({
        amount: parseFloat(paymentAmount),
        type: 'partial_payment',
        date: returnDate,
        notes: paymentNotes || `Payment made during return of ${returnQuantity} units`
      });
    }

    // Update quantities and amounts
    rental.currentQuantity -= returnQuantity;

    // Save the rental - this triggers the pre-save hook to calculate totalAmount and balance
    await rental.save();

    // Update status based on current state after balance calculation
    if (rental.currentQuantity === 0 && rental.balanceAmount <= 0) {
      rental.status = 'completed';
    } else if (rental.currentQuantity === 0) {
      rental.status = 'returned_pending_payment';
    } else {
      rental.status = 'partially_returned';
    }

    await rental.save();

    // Return product to inventory
    await Product.findByIdAndUpdate(rental.productId._id, {
      $inc: { quantity: returnQuantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productId', 'name rate rateType');

    res.json({
      rental: updatedRental,
      returnCalculation: returnCalculation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// @desc    Add additional rental
// @route   PUT /api/rentals/:id/add-rental
router.put("/:id/add-rental", async (req, res) => {
  try {
    const { additionalQuantity, notes } = req.body;
    const additionalStartDate = new Date();

    if (!additionalQuantity || additionalQuantity <= 0) {
      return res.status(400).json({ message: "Additional quantity must be greater than 0" });
    }

    const rental = await Rental.findById(req.params.id).populate('productId');
    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const product = await Product.findById(rental.productId._id);
    if (product.quantity < additionalQuantity) {
      return res.status(400).json({ message: "Insufficient product quantity" });
    }

    // Add rental transaction
    rental.transactions.push({
      type: 'rental',
      quantity: additionalQuantity,
      days: null,
      amount: 0,
      date: additionalStartDate,
      notes: notes || `Additional rental - ${additionalQuantity} units added on ${additionalStartDate.toLocaleDateString()}`
    });

    // Update quantities
    rental.currentQuantity += additionalQuantity;
    rental.status = 'active'; // Reset to active

    await rental.save();

    // Update product inventory
    await Product.findByIdAndUpdate(rental.productId._id, {
      $inc: { quantity: -additionalQuantity }
    });

    const updatedRental = await Rental.findById(rental._id)
      .populate('productId', 'name rate rateType');

    res.json(updatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add payment to rental
// @route   PUT /api/rentals/:id/payment
router.put("/:id/payment", async (req, res) => {
  try {
    const { amount, paymentType, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    rental.payments.push({
      amount,
      type: paymentType || 'partial_payment',
      notes
    });

    await rental.save(); // This will trigger the pre-save hook to calculate balance

    // Check if rental should be marked as completed
    if (rental.currentQuantity === 0 && rental.balanceAmount <= 0) {
      rental.status = 'completed';
      await rental.save();
    }

    const updatedRental = await Rental.findById(rental._id)
      .populate('productId', 'name rate rateType');

    res.json(updatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to routes/rentals.js - Payment update route for rental history
// @desc    Update payment for rental from history
// @route   PUT /api/rentals/:id/history-payment
router.put("/:id/history-payment", async (req, res) => {
  try {
    const { amount, paymentType, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Check if payment amount exceeds balance
    if (amount > rental.balanceAmount) {
      return res.status(400).json({
        message: `Payment amount ($${amount}) exceeds balance ($${rental.balanceAmount})`
      });
    }

    // Add payment
    rental.payments.push({
      amount: parseFloat(amount),
      type: paymentType || 'partial_payment',
      date: new Date(),
      notes: notes || 'Payment added from rental history'
    });

    await rental.save(); // This will trigger the pre-save hook to calculate balance

    // Check if rental should be marked as completed (if balance is now 0 or less)
    if (rental.balanceAmount <= 0) {
      rental.status = 'completed';
      await rental.save();
    }

    const updatedRental = await Rental.findById(rental._id)
      .populate('productId', 'name rate rateType');

    res.json(updatedRental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all rentals including pending payments
// @route   GET /api/rentals/all-history
// Add to routes/rentals.js - Updated all-history route with proper balance filtering
// @desc    Get all rentals including pending payments
// @route   GET /api/rentals/all-history
router.get("/all-history", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;

    let query = {};

    // Filter by status if specified
    if (status !== 'all') {
      if (status === 'completed') {
        // Only fully paid and completed rentals (balance = 0)
        query.status = 'completed';
        query.balanceAmount = { $lte: 0 }; // Balance is 0 or less
      } else if (status === 'pending_payment') {
        // Rentals with outstanding balance (balance > 0)
        query.$or = [
          { status: 'returned_pending_payment' },
          { status: 'completed', balanceAmount: { $gt: 0 } }
        ];
      } else {
        query.status = status;
      }
    } else {
      // Show completed and pending payment rentals
      query.status = { $in: ['completed', 'returned_pending_payment'] };
    }

    // Add search functionality
    if (search) {
      const searchQuery = {
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { customerEmail: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } }
        ]
      };

      // Combine search with existing query
      if (Object.keys(query).length > 0) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }

    console.log('Query:', JSON.stringify(query, null, 2)); // Debug log

    const rentals = await Rental.find(query)
      .populate('productId', 'name rate rateType')
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
    console.error('Error in all-history:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete rental record
// @route   DELETE /api/rentals/:id
// @desc    Delete rental record
// @route   DELETE /api/rentals/:id
router.delete("/:id", async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('productId');
    
    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Check if rental is still active (has current quantity > 0)
    if (rental.currentQuantity > 0) {
      return res.status(400).json({ 
        message: "Cannot delete active rental. Please process returns first." 
      });
    }

    // Only adjust inventory if productId exists and is populated
    if (rental.productId && rental.productId._id) {
      // If rental had items returned, we need to handle inventory properly
      const returnedQuantity = rental.initialQuantity - rental.currentQuantity;
      
      if (returnedQuantity > 0) {
        // Since we're deleting the rental record, we need to subtract the returned quantity
        // from the product inventory to maintain consistency (reverse the return)
        await Product.findByIdAndUpdate(rental.productId._id, {
          $inc: { quantity: -returnedQuantity }
        });
      }
    } else {
      console.warn(`Rental ${rental._id} has no valid productId reference`);
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




module.exports = router;
