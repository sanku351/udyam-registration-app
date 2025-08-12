const express = require("express")
const router = express.Router()

// Basic auth routes (can be extended later)
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "Auth service is running",
    authenticated: false, // Will be true when JWT middleware is added
  })
})

module.exports = router
