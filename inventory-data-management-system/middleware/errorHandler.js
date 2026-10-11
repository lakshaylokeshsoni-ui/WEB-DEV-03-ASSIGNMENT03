function errorHandler(err, req, res, next) {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ message: "Validation failed", errors });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "A product with this SKU already exists"
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid product ID or field value" });
  }

  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
}

module.exports = errorHandler;