const prisma = require("../config/database")

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Log error to audit log
  if (req.user?.id) {
    prisma.auditLog
      .create({
        data: {
          userId: req.user.id,
          action: "ERROR",
          resource: req.route?.path || req.path,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          success: false,
          errorMessage: err.message,
          metadata: {
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
        },
      })
      .catch(console.error)
  }

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this information already exists",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.details,
    })
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    })
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || "Internal server error"

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
}

module.exports = errorHandler
