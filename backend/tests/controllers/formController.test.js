const request = require("supertest")
const app = require("../../src/server")
const { mockPrisma } = require("../setup")
const jest = require("jest") // Declaring jest variable
const otpService = require("../../src/services/otpService")
const {
  generateTestUser,
  generateTestOtpVerification,
  expectValidationError,
  expectSuccessResponse,
} = require("../utils/testHelpers")

// Mock OTP service
jest.mock("../../src/services/otpService")

describe("Form Controller", () => {
  describe("POST /api/form/step1/generate-otp", () => {
    test("should generate OTP for valid Aadhaar number", async () => {
      const testUser = generateTestUser()
      const otpResult = {
        id: "otp-id",
        expiresAt: new Date(),
        otpCode: "123456",
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(testUser)
      mockPrisma.auditLog.create.mockResolvedValue({})
      otpService.createOtpVerification.mockResolvedValue(otpResult)

      const response = await request(app).post("/api/form/step1/generate-otp").send({ aadhaarNumber: "123456789012" })

      expectSuccessResponse(response, {
        userId: testUser.id,
        expiresAt: otpResult.expiresAt,
      })
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { aadhaarNumber: "123456789012" },
      })
    })

    test("should return validation error for invalid Aadhaar", async () => {
      const response = await request(app).post("/api/form/step1/generate-otp").send({ aadhaarNumber: "123" })

      expectValidationError(response, "aadhaarNumber", "12 digits")
    })

    test("should use existing user if Aadhaar already exists", async () => {
      const existingUser = generateTestUser()
      const otpResult = { id: "otp-id", expiresAt: new Date() }

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)
      mockPrisma.auditLog.create.mockResolvedValue({})
      otpService.createOtpVerification.mockResolvedValue(otpResult)

      const response = await request(app).post("/api/form/step1/generate-otp").send({ aadhaarNumber: "123456789012" })

      expectSuccessResponse(response)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe("POST /api/form/step1/verify-otp", () => {
    test("should verify valid OTP", async () => {
      const testUser = generateTestUser({ aadhaarVerified: false })
      const verificationResult = { success: true, message: "OTP verified" }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockPrisma.user.update.mockResolvedValue({ ...testUser, aadhaarVerified: true })
      mockPrisma.auditLog.create.mockResolvedValue({})
      otpService.verifyOtpCode.mockResolvedValue(verificationResult)

      const response = await request(app).post("/api/form/step1/verify-otp").send({
        aadhaarNumber: "123456789012",
        otpCode: "123456",
      })

      expectSuccessResponse(response, {
        userId: testUser.id,
        aadhaarVerified: true,
        nextStep: 2,
      })
    })

    test("should return error for invalid OTP", async () => {
      const testUser = generateTestUser()
      const verificationResult = { success: false, message: "Invalid OTP" }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockPrisma.auditLog.create.mockResolvedValue({})
      otpService.verifyOtpCode.mockResolvedValue(verificationResult)

      const response = await request(app).post("/api/form/step1/verify-otp").send({
        aadhaarNumber: "123456789012",
        otpCode: "123456",
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Invalid OTP")
    })

    test("should return 404 for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const response = await request(app).post("/api/form/step1/verify-otp").send({
        aadhaarNumber: "123456789012",
        otpCode: "123456",
      })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe("User not found")
    })
  })

  describe("POST /api/form/step2/verify-pan", () => {
    test("should verify valid PAN details", async () => {
      const testUser = generateTestUser({ panVerified: false })

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(testUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      const response = await request(app).post("/api/form/step2/verify-pan").send({
        panNumber: "ABCDE1234F",
        nameAsPerPan: "Test User",
      })

      expectSuccessResponse(response, {
        userId: testUser.id,
        panVerified: true,
        nameAsPerPan: "Test User",
      })
    })

    test("should return validation error for invalid PAN format", async () => {
      const response = await request(app).post("/api/form/step2/verify-pan").send({
        panNumber: "123456789",
        nameAsPerPan: "Test User",
      })

      expectValidationError(response, "panNumber", "5 letters, 4 digits, 1 letter")
    })

    test("should return validation error for invalid name", async () => {
      const response = await request(app).post("/api/form/step2/verify-pan").send({
        panNumber: "ABCDE1234F",
        nameAsPerPan: "Test123",
      })

      expectValidationError(response, "nameAsPerPan", "letters and spaces")
    })
  })

  describe("GET /api/form/progress/:userId", () => {
    test("should return user progress", async () => {
      const testUser = generateTestUser({
        aadhaarVerified: true,
        panVerified: false,
        formSubmissions: [],
      })

      mockPrisma.user.findUnique.mockResolvedValue(testUser)

      const response = await request(app).get(`/api/form/progress/${testUser.id}`)

      expectSuccessResponse(response, {
        userId: testUser.id,
        currentStep: 2,
        isComplete: false,
      })
    })

    test("should return 404 for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const response = await request(app).get("/api/form/progress/non-existent-id")

      expect(response.status).toBe(404)
      expect(response.body.message).toBe("User not found")
    })
  })

  describe("GET /api/form/structure", () => {
    test("should return form structure", async () => {
      const response = await request(app).get("/api/form/structure")

      expectSuccessResponse(response)
      expect(response.body.data).toHaveProperty("steps")
      expect(response.body.data).toHaveProperty("validation_rules")
      expect(response.body.data).toHaveProperty("ui_components")
    })
  })
})
