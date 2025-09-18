const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    rateType: { 
      type: String, 
      required: true,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Products1", productSchema);
