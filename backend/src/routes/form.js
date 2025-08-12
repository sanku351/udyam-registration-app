const express = require("express")
const router = express.Router()

const formController = require("../controllers/formController")
const { validateRequest, validationSchemas } = require("../utils/validation")
const rateLimitMiddleware = require("../middleware/rateLimitMiddleware")

// Step 1: Aadhaar verification routes
router.post(
  "/step1/generate-otp",
  rateLimitMiddleware.otpGeneration,
  validateRequest(validationSchemas.aadhaar),
  formController.generateAadhaarOtp,
)

router.post(
  "/step1/verify-otp",
  rateLimitMiddleware.otpVerification,
  validateRequest(validationSchemas.otp),
  formController.verifyAadhaarOtp,
)

// Step 2: PAN verification routes
router.post(
  "/step2/verify-pan",
  rateLimitMiddleware.panVerification,
  validateRequest(validationSchemas.pan),
  formController.verifyPan,
)

// Form submission routes
router.post("/submit", validateRequest(validationSchemas.formSubmission), formController.submitForm)

// Get form progress
router.get("/progress/:userId", formController.getFormProgress)

// Get form structure (from scraped data)
router.get("/structure", formController.getFormStructure)

module.exports = router
