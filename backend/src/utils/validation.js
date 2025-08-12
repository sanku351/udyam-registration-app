const Joi = require("joi")

// Validation schemas based on scraped form structure
const validationSchemas = {
  aadhaar: Joi.object({
    aadhaarNumber: Joi.string()
      .pattern(/^[0-9]{12}$/)
      .required()
      .messages({
        "string.pattern.base": "Aadhaar number must be 12 digits",
        "any.required": "Aadhaar number is required",
      }),
  }),

  otp: Joi.object({
    otpCode: Joi.string()
      .pattern(/^[0-9]{6}$/)
      .required()
      .messages({
        "string.pattern.base": "OTP must be 6 digits",
        "any.required": "OTP is required",
      }),
    aadhaarNumber: Joi.string()
      .pattern(/^[0-9]{12}$/)
      .required(),
  }),

  pan: Joi.object({
    panNumber: Joi.string()
      .pattern(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/)
      .uppercase()
      .required()
      .messages({
        "string.pattern.base": "PAN must be in format: 5 letters, 4 digits, 1 letter",
        "any.required": "PAN number is required",
      }),
    nameAsPerPan: Joi.string()
      .pattern(/^[a-zA-Z\s]{2,100}$/)
      .trim()
      .required()
      .messages({
        "string.pattern.base": "Name must contain only letters and spaces",
        "any.required": "Name as per PAN is required",
      }),
  }),

  formSubmission: Joi.object({
    step: Joi.number().integer().min(1).max(2).required(),
    formData: Joi.object().required(),
    ipAddress: Joi.string().ip().optional(),
    userAgent: Joi.string().max(500).optional(),
  }),
}

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      })
    }

    req.validatedData = value
    next()
  }
}

module.exports = {
  validationSchemas,
  validateRequest,
}
