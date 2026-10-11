const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number"
      },
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: [0, "Low-stock threshold cannot be negative"],
      default: 5
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);