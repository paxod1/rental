const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Rental = require("../models/Rental");

// @desc    Get dashboard analytics
// @route   GET /api/analytics
router.get("/", async (req, res) => {
  try {
    const [totalProducts, totalRentals, activeRentals] = await Promise.all([
      Product.countDocuments(),
      Rental.countDocuments(),
      Rental.countDocuments({ status: 'active' })
    ]);

    // Count unique customers
    const customers = await Rental.distinct('customerEmail');
    const totalCustomers = customers.filter(email => email).length;

    res.json({
      totalProducts,
      totalCustomers,
      totalRentals,
      activeRentals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
