const { validationSchemas, validateRequest } = require("../src/utils/validation")

describe("Validation Schemas", () => {
  describe("Aadhaar Validation", () => {
    test("should accept valid 12-digit Aadhaar number", () => {
      const validData = { aadhaarNumber: "123456789012" }
      const result = validationSchemas.aadhaar.validate(validData)

      expect(result.error).toBeUndefined()
      expect(result.value).toEqual(validData)
    })

    test("should reject Aadhaar number with less than 12 digits", () => {
      const invalidData = { aadhaarNumber: "12345678901" }
      const result = validationSchemas.aadhaar.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("12 digits")
    })

    test("should reject Aadhaar number with more than 12 digits", () => {
      const invalidData = { aadhaarNumber: "1234567890123" }
      const result = validationSchemas.aadhaar.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("12 digits")
    })

    test("should reject Aadhaar number with non-numeric characters", () => {
      const invalidData = { aadhaarNumber: "12345678901a" }
      const result = validationSchemas.aadhaar.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("12 digits")
    })

    test("should reject empty Aadhaar number", () => {
      const invalidData = { aadhaarNumber: "" }
      const result = validationSchemas.aadhaar.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("required")
    })
  })

  describe("OTP Validation", () => {
    test("should accept valid 6-digit OTP", () => {
      const validData = {
        aadhaarNumber: "123456789012",
        otpCode: "123456",
      }
      const result = validationSchemas.otp.validate(validData)

      expect(result.error).toBeUndefined()
      expect(result.value).toEqual(validData)
    })

    test("should reject OTP with less than 6 digits", () => {
      const invalidData = {
        aadhaarNumber: "123456789012",
        otpCode: "12345",
      }
      const result = validationSchemas.otp.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("6 digits")
    })

    test("should reject OTP with non-numeric characters", () => {
      const invalidData = {
        aadhaarNumber: "123456789012",
        otpCode: "12345a",
      }
      const result = validationSchemas.otp.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("6 digits")
    })
  })

  describe("PAN Validation", () => {
    test("should accept valid PAN format", () => {
      const validData = {
        panNumber: "ABCDE1234F",
        nameAsPerPan: "Test User",
      }
      const result = validationSchemas.pan.validate(validData)

      expect(result.error).toBeUndefined()
      expect(result.value.panNumber).toBe("ABCDE1234F")
    })

    test("should convert PAN to uppercase", () => {
      const validData = {
        panNumber: "abcde1234f",
        nameAsPerPan: "Test User",
      }
      const result = validationSchemas.pan.validate(validData)

      expect(result.error).toBeUndefined()
      expect(result.value.panNumber).toBe("ABCDE1234F")
    })

    test("should reject invalid PAN format - wrong pattern", () => {
      const invalidData = {
        panNumber: "1234567890",
        nameAsPerPan: "Test User",
      }
      const result = validationSchemas.pan.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("5 letters, 4 digits, 1 letter")
    })

    test("should reject invalid name format", () => {
      const invalidData = {
        panNumber: "ABCDE1234F",
        nameAsPerPan: "Test123",
      }
      const result = validationSchemas.pan.validate(invalidData)

      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain("letters and spaces")
    })

    test("should trim name whitespace", () => {
      const validData = {
        panNumber: "ABCDE1234F",
        nameAsPerPan: "  Test User  ",
      }
      const result = validationSchemas.pan.validate(validData)

      expect(result.error).toBeUndefined()
      expect(result.value.nameAsPerPan).toBe("Test User")
    })
  })
})
