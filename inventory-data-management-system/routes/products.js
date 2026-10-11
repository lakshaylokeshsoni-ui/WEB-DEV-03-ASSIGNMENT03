const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/products - create a product
router.post("/", asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ message: "Product created", product });
}));

// GET /api/products - filter, sort and paginate
router.get("/", asyncHandler(async (req, res) => {
  const {
    category, search, minPrice, maxPrice, minQuantity, maxQuantity,
    sort = "createdAt", order = "desc", page = "1", limit = "10"
  } = req.query;

  const filter = {};
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: new RegExp(safeSearch, "i") },
      { sku: new RegExp(safeSearch, "i") },
      { description: new RegExp(safeSearch, "i") }
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }
  if (minQuantity !== undefined || maxQuantity !== undefined) {
    filter.quantity = {};
    if (minQuantity !== undefined) filter.quantity.$gte = Number(minQuantity);
    if (maxQuantity !== undefined) filter.quantity.$lte = Number(maxQuantity);
  }

  for (const key of ["minPrice", "maxPrice", "minQuantity", "maxQuantity"]) {
    if (req.query[key] !== undefined && (!Number.isFinite(Number(req.query[key])) || Number(req.query[key]) < 0)) {
      return res.status(400).json({ message: `${key} must be a non-negative number` });
    }
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const allowedSort = ["name", "category", "price", "quantity", "createdAt", "updatedAt", "sku"];
  const sortField = allowedSort.includes(sort) ? sort : "createdAt";
  const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter)
  ]);

  res.json({
    products,
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}));

// GET /api/products/low-stock - low-stock report
router.get("/low-stock", asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ["$quantity", "$lowStockThreshold"] }
  }).sort({ quantity: 1, name: 1 });

  res.json({ count: products.length, products });
}));

// GET /api/products/category-summary - aggregation report
router.get("/category-summary", asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        productCount: { $sum: 1 },
        totalUnits: { $sum: "$quantity" },
        inventoryValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        averagePrice: { $avg: "$price" }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        productCount: 1,
        totalUnits: 1,
        inventoryValue: { $round: ["$inventoryValue", 2] },
        averagePrice: { $round: ["$averagePrice", 2] }
      }
    }
  ]);
  res.json({ summary });
}));

// GET /api/products/:id - single product
router.get("/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
}));

// PATCH /api/products/:id/stock - safely restock or record a sale
router.patch("/:id/stock", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });

  const { operation, quantity } = req.body;
  if (!["restock", "sale"].includes(operation)) {
    return res.status(400).json({ message: 'operation must be "restock" or "sale"' });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: "quantity must be a positive whole number" });
  }

  const change = operation === "restock" ? quantity : -quantity;
  const conditions = { _id: req.params.id };
  if (operation === "sale") conditions.quantity = { $gte: quantity };

  const product = await Product.findOneAndUpdate(
    conditions,
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: "Product not found" });
    return res.status(400).json({ message: "Sale quantity exceeds available stock" });
  }

  res.json({ message: operation === "restock" ? "Stock restocked" : "Sale recorded", product });
}));

// PUT /api/products/:id - update product details
router.put("/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product updated", product });
}));

// DELETE /api/products/:id - delete product
router.delete("/:id", asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted", product });
}));

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;