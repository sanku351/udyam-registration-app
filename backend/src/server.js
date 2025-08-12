require("dotenv").config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")

const prisma = require("./config/database")
const errorHandler = require("./middleware/errorHandler")
const auditLogger = require("./middleware/auditLogger")

// Import routes
const authRoutes = require("./routes/auth")
const formRoutes = require("./routes/form")
const healthRoutes = require("./routes/health")

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"))
}

// Audit logging middleware
app.use(auditLogger)

// API Routes
app.use("/api/health", healthRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/form", formRoutes)

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Udyam Registration API Server",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      form: "/api/form",
    },
  })
})

// 404 handler
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)

  // Close database connections
  await prisma.$disconnect()

  process.exit(0)
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
  })
}

module.exports = app
