const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// OTP generation rate limiting (stricter)
const otpGeneration = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 5 minutes before requesting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const aadhaar = req.body?.aadhaarNumber || "";
    // Use ipKeyGenerator for IPv6-safe IP
    return `${ipKeyGenerator(req)}-${aadhaar}`;
  },
});

// OTP verification rate limiting
const otpVerification = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many OTP verification attempts. Please wait 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// PAN verification rate limiting
const panVerification = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many PAN verification attempts. Please wait 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpGeneration,
  otpVerification,
  panVerification,
};
