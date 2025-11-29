const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// @desc    Get all products
// @route   GET /api/products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  
});

// @desc    Add a new product
// @route   POST /api/products
router.post("/", async (req, res) => {
  try {
    const { name, quantity, rate, rateType } = req.body;

    if (!name || !quantity || !rate || !rateType) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Validate rateType
    if (!['daily', 'weekly', 'monthly'].includes(rateType)) {
      return res.status(400).json({ message: "Rate type must be daily, weekly, or monthly" });
    }

    const product = await Product.create({
      name,
      quantity,
      rate,
      rateType,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
router.put("/:id", async (req, res) => {
  try {
    const { name, quantity, rate, rateType } = req.body;

    if (!name || !quantity || !rate || !rateType) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Validate rateType
    if (!['daily', 'weekly', 'monthly'].includes(rateType)) {
      return res.status(400).json({ message: "Rate type must be daily, weekly, or monthly" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        quantity,
        rate,
        rateType,
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
