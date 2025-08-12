const otpService = require("../../src/services/otpService")
const bcrypt = require("bcryptjs")
const { mockPrisma } = require("../setup")
const { generateTestOtpVerification } = require("../utils/testHelpers")
const jest = require("jest") // Import jest to declare the variable

// Mock bcrypt
jest.mock("bcryptjs")

describe("OTP Service", () => {
  describe("generateOtp", () => {
    test("should generate 6-digit OTP", () => {
      const otp = otpService.generateOtp()

      expect(otp).toMatch(/^\d{6}$/)
      expect(otp.length).toBe(6)
    })

    test("should generate different OTPs", () => {
      const otp1 = otpService.generateOtp()
      const otp2 = otpService.generateOtp()

      // While there's a small chance they could be the same, it's very unlikely
      expect(otp1).not.toBe(otp2)
    })
  })

  describe("hashOtp", () => {
    test("should hash OTP correctly", async () => {
      const otp = "123456"
      const hashedOtp = "hashed_otp"

      bcrypt.hash.mockResolvedValue(hashedOtp)

      const result = await otpService.hashOtp(otp)

      expect(bcrypt.hash).toHaveBeenCalledWith(otp, 10)
      expect(result).toBe(hashedOtp)
    })
  })

  describe("verifyOtp", () => {
    test("should verify OTP correctly", async () => {
      const otp = "123456"
      const hash = "hashed_otp"

      bcrypt.compare.mockResolvedValue(true)

      const result = await otpService.verifyOtp(otp, hash)

      expect(bcrypt.compare).toHaveBeenCalledWith(otp, hash)
      expect(result).toBe(true)
    })

    test("should return false for invalid OTP", async () => {
      const otp = "123456"
      const hash = "hashed_otp"

      bcrypt.compare.mockResolvedValue(false)

      const result = await otpService.verifyOtp(otp, hash)

      expect(result).toBe(false)
    })
  })

  describe("createOtpVerification", () => {
    test("should create OTP verification record", async () => {
      const userId = "test-user-id"
      const otpVerification = generateTestOtpVerification()

      bcrypt.hash.mockResolvedValue("hashed_otp")
      mockPrisma.otpVerification.updateMany.mockResolvedValue({})
      mockPrisma.otpVerification.create.mockResolvedValue(otpVerification)

      const result = await otpService.createOtpVerification(userId)

      expect(mockPrisma.otpVerification.updateMany).toHaveBeenCalled()
      expect(mockPrisma.otpVerification.create).toHaveBeenCalled()
      expect(result).toHaveProperty("id")
      expect(result).toHaveProperty("expiresAt")
    })
  })

  describe("verifyOtpCode", () => {
    test("should verify valid OTP code", async () => {
      const userId = "test-user-id"
      const otpCode = "123456"
      const otpVerification = generateTestOtpVerification({
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      })

      mockPrisma.otpVerification.findFirst.mockResolvedValue(otpVerification)
      mockPrisma.otpVerification.update.mockResolvedValue({})
      bcrypt.compare.mockResolvedValue(true)

      const result = await otpService.verifyOtpCode(userId, otpCode)

      expect(result.success).toBe(true)
      expect(result.message).toBe("OTP verified successfully")
    })

    test("should reject expired OTP", async () => {
      const userId = "test-user-id"
      const otpCode = "123456"

      mockPrisma.otpVerification.findFirst.mockResolvedValue(null)

      const result = await otpService.verifyOtpCode(userId, otpCode)

      expect(result.success).toBe(false)
      expect(result.message).toContain("expired")
    })

    test("should reject OTP after max attempts", async () => {
      const userId = "test-user-id"
      const otpCode = "123456"
      const otpVerification = generateTestOtpVerification({
        attempts: 3,
        maxAttempts: 3,
      })

      mockPrisma.otpVerification.findFirst.mockResolvedValue(otpVerification)

      const result = await otpService.verifyOtpCode(userId, otpCode)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Maximum OTP attempts exceeded")
    })

    test("should reject invalid OTP code", async () => {
      const userId = "test-user-id"
      const otpCode = "123456"
      const otpVerification = generateTestOtpVerification({ attempts: 0 })

      mockPrisma.otpVerification.findFirst.mockResolvedValue(otpVerification)
      mockPrisma.otpVerification.update.mockResolvedValue({})
      bcrypt.compare.mockResolvedValue(false)

      const result = await otpService.verifyOtpCode(userId, otpCode)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Invalid OTP")
    })
  })
})
