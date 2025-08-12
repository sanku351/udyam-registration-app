const request = require("supertest")
const app = require("../../src/server")
const { expect } = require("@jest/globals") // Import expect from jest

// Test data generators
const generateTestUser = (overrides = {}) => ({
  id: "test-user-id",
  aadhaarNumber: "123456789012",
  panNumber: "ABCDE1234F",
  nameAsPerPan: "Test User",
  aadhaarVerified: false,
  panVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const generateTestOtpVerification = (overrides = {}) => ({
  id: "test-otp-id",
  userId: "test-user-id",
  otpCode: "123456",
  otpHash: "hashed-otp",
  purpose: "aadhaar_verification",
  isVerified: false,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date(),
  ...overrides,
})

const generateTestFormSubmission = (overrides = {}) => ({
  id: "test-submission-id",
  userId: "test-user-id",
  step: 1,
  status: "COMPLETED",
  formData: { aadhaarNumber: "123456789012" },
  createdAt: new Date(),
  ...overrides,
})

// API test helpers
const makeRequest = (method, endpoint, data = {}) => {
  const req = request(app)[method](endpoint)

  if (method === "post" || method === "put" || method === "patch") {
    req.send(data)
  }

  return req
}

// Validation test helpers
const expectValidationError = (response, field, message) => {
  expect(response.status).toBe(400)
  expect(response.body.success).toBe(false)
  expect(response.body.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        field,
        message: expect.stringContaining(message),
      }),
    ]),
  )
}

const expectSuccessResponse = (response, expectedData = {}) => {
  expect(response.status).toBe(200)
  expect(response.body.success).toBe(true)
  if (Object.keys(expectedData).length > 0) {
    expect(response.body.data).toMatchObject(expectedData)
  }
}

module.exports = {
  generateTestUser,
  generateTestOtpVerification,
  generateTestFormSubmission,
  makeRequest,
  expectValidationError,
  expectSuccessResponse,
}
