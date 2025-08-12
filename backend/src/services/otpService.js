const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const prisma = require("../config/database")

class OtpService {
  constructor() {
    this.OTP_EXPIRY_MINUTES = Number.parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
    this.MAX_ATTEMPTS = Number.parseInt(process.env.OTP_MAX_ATTEMPTS) || 3
  }

  // Generate a 6-digit OTP
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Hash OTP for secure storage
  async hashOtp(otp) {
    return await bcrypt.hash(otp, 10)
  }

  // Verify OTP against hash
  async verifyOtp(otp, hash) {
    return await bcrypt.compare(otp, hash)
  }

  // Create OTP verification record
  async createOtpVerification(userId, purpose = "aadhaar_verification") {
    const otpCode = this.generateOtp()
    const otpHash = await this.hashOtp(otpCode)
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000)

    // Invalidate any existing OTP for this user and purpose
    await prisma.otpVerification.updateMany({
      where: {
        userId,
        purpose,
        isVerified: false,
      },
      data: {
        isVerified: true, // Mark as used/expired
        verifiedAt: new Date(),
      },
    })

    // Create new OTP verification
    const otpVerification = await prisma.otpVerification.create({
      data: {
        userId,
        otpCode: otpCode, // Store plain text temporarily for demo
        otpHash,
        purpose,
        expiresAt,
        maxAttempts: this.MAX_ATTEMPTS,
      },
    })

    // In production, send OTP via SMS/Email
    // For demo purposes, we'll return the OTP
    console.log(`OTP for user ${userId}: ${otpCode}`)

    return {
      id: otpVerification.id,
      expiresAt,
      // Remove otpCode in production
      otpCode: process.env.NODE_ENV === "development" ? otpCode : undefined,
    }
  }

  // Verify OTP
  async verifyOtpCode(userId, otpCode, purpose = "aadhaar_verification") {
    const otpVerification = await prisma.otpVerification.findFirst({
      where: {
        userId,
        purpose,
        isVerified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!otpVerification) {
      return {
        success: false,
        message: "No valid OTP found or OTP has expired",
      }
    }

    // Check attempts
    if (otpVerification.attempts >= otpVerification.maxAttempts) {
      return {
        success: false,
        message: "Maximum OTP attempts exceeded",
      }
    }

    // Increment attempts
    await prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: { attempts: otpVerification.attempts + 1 },
    })

    // Verify OTP
    const isValid = await this.verifyOtp(otpCode, otpVerification.otpHash)

    if (isValid) {
      // Mark as verified
      await prisma.otpVerification.update({
        where: { id: otpVerification.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      })

      return {
        success: true,
        message: "OTP verified successfully",
      }
    } else {
      return {
        success: false,
        message: "Invalid OTP",
      }
    }
  }
}

module.exports = new OtpService()
