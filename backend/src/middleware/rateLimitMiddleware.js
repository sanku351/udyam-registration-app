const rateLimit = require("express-rate-limit")

// OTP generation rate limiting (stricter)
const otpGeneration = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes per IP
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 5 minutes before requesting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + Aadhaar number if available
    const aadhaar = req.body?.aadhaarNumber || ""
    return `${req.ip}-${aadhaar}`
  },
})

// OTP verification rate limiting
const otpVerification = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per 15 minutes
  message: {
    success: false,
    message: "Too many OTP verification attempts. Please wait 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// PAN verification rate limiting
const panVerification = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 PAN verification attempts per 10 minutes
  message: {
    success: false,
    message: "Too many PAN verification attempts. Please wait 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  otpGeneration,
  otpVerification,
  panVerification,
}
