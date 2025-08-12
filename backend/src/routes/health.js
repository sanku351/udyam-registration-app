const express = require("express")
const router = express.Router()
const prisma = require("../config/database")

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    res.json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Server is unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// Database health check
router.get("/db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT version()`
    res.json({
      success: true,
      message: "Database is healthy",
      database: result[0],
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Database is unhealthy",
      error: error.message,
    })
  }
})

module.exports = router
