const { PrismaClient } = require("@prisma/client")
const jest = require("jest")
const { beforeEach, afterAll } = require("@jest/globals")

// Mock Prisma client for testing
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  formSubmission: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  otpVerification: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
}

// Mock the Prisma client
jest.mock("../src/config/database", () => mockPrisma)

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})

// Global test teardown
afterAll(async () => {
  // Clean up any resources
})

module.exports = { mockPrisma }
