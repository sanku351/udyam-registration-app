const prisma = require("../config/database")
const otpService = require("../services/otpService")
const formStructure = require("../../../udyam_form_structure.json")

class FormController {
  // Generate OTP for Aadhaar verification
  async generateAadhaarOtp(req, res, next) {
    try {
      const { aadhaarNumber } = req.validatedData

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { aadhaarNumber },
      })

      // Create user if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            aadhaarNumber,
          },
        })
      }

      // Generate OTP
      const otpResult = await otpService.createOtpVerification(user.id, "aadhaar_verification")

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "GENERATE_OTP",
          resource: "aadhaar_verification",
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          success: true,
        },
      })

      res.json({
        success: true,
        message: "OTP generated successfully",
        data: {
          userId: user.id,
          expiresAt: otpResult.expiresAt,
          // Include OTP in development mode only
          ...(process.env.NODE_ENV === "development" && {
            otp: otpResult.otpCode,
          }),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Verify Aadhaar OTP
  async verifyAadhaarOtp(req, res, next) {
    try {
      const { aadhaarNumber, otpCode } = req.validatedData

      // Find user
      const user = await prisma.user.findUnique({
        where: { aadhaarNumber },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Verify OTP
      const verificationResult = await otpService.verifyOtpCode(user.id, otpCode, "aadhaar_verification")

      if (!verificationResult.success) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "VERIFY_OTP",
            resource: "aadhaar_verification",
            resourceId: user.id,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
            success: false,
            errorMessage: verificationResult.message,
          },
        })

        return res.status(400).json({
          success: false,
          message: verificationResult.message,
        })
      }

      // Update user as Aadhaar verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          aadhaarVerified: true,
          aadhaarVerifiedAt: new Date(),
        },
      })

      // Log successful verification
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "VERIFY_OTP",
          resource: "aadhaar_verification",
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          success: true,
        },
      })

      res.json({
        success: true,
        message: "Aadhaar verified successfully",
        data: {
          userId: user.id,
          aadhaarVerified: true,
          nextStep: 2,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Verify PAN
  async verifyPan(req, res, next) {
    try {
      const { panNumber, nameAsPerPan } = req.validatedData

      // In a real application, you would verify PAN with government API
      // For demo purposes, we'll simulate verification
      const isPanValid = await this.simulatePanVerification(panNumber, nameAsPerPan)

      if (!isPanValid) {
        return res.status(400).json({
          success: false,
          message: "PAN verification failed. Please check your details.",
        })
      }

      // Check if user exists with this PAN
      let user = await prisma.user.findUnique({
        where: { panNumber },
      })

      if (!user) {
        // Create new user with PAN details
        user = await prisma.user.create({
          data: {
            panNumber,
            nameAsPerPan,
            panVerified: true,
            panVerifiedAt: new Date(),
          },
        })
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            nameAsPerPan,
            panVerified: true,
            panVerifiedAt: new Date(),
          },
        })
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "VERIFY_PAN",
          resource: "pan_verification",
          resourceId: user.id,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          success: true,
        },
      })

      res.json({
        success: true,
        message: "PAN verified successfully",
        data: {
          userId: user.id,
          panVerified: true,
          nameAsPerPan: user.nameAsPerPan,
          isComplete: user.aadhaarVerified && user.panVerified,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Submit form data
  async submitForm(req, res, next) {
    try {
      const { step, formData, ipAddress, userAgent } = req.validatedData

      // Create form submission record
      const submission = await prisma.formSubmission.create({
        data: {
          userId: formData.userId,
          step,
          formData,
          ipAddress: ipAddress || req.ip,
          userAgent: userAgent || req.get("User-Agent"),
          status: "COMPLETED",
        },
      })

      // Log the submission
      await prisma.auditLog.create({
        data: {
          userId: formData.userId,
          action: "SUBMIT_FORM",
          resource: "form_submission",
          resourceId: submission.id,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          metadata: { step },
          success: true,
        },
      })

      res.json({
        success: true,
        message: "Form submitted successfully",
        data: {
          submissionId: submission.id,
          step,
          status: submission.status,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // Get form progress for a user
  async getFormProgress(req, res, next) {
    try {
      const { userId } = req.params

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          formSubmissions: {
            orderBy: { createdAt: "desc" },
          },
        },
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      const progress = {
        userId: user.id,
        currentStep: this.getCurrentStep(user),
        steps: {
          1: {
            title: "Aadhaar Verification",
            completed: user.aadhaarVerified,
            completedAt: user.aadhaarVerifiedAt,
          },
          2: {
            title: "PAN Verification",
            completed: user.panVerified,
            completedAt: user.panVerifiedAt,
          },
        },
        isComplete: user.aadhaarVerified && user.panVerified,
        submissions: user.formSubmissions.length,
      }

      res.json({
        success: true,
        data: progress,
      })
    } catch (error) {
      next(error)
    }
  }

  // Get form structure
  async getFormStructure(req, res, next) {
    try {
      res.json({
        success: true,
        data: formStructure,
      })
    } catch (error) {
      next(error)
    }
  }

  // Helper methods
  getCurrentStep(user) {
    if (!user.aadhaarVerified) return 1
    if (!user.panVerified) return 2
    return 3 // Complete
  }

  async simulatePanVerification(panNumber, nameAsPerPan) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simple validation - in real app, call government API
    const panRegex = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/
    const nameRegex = /^[a-zA-Z\s]{2,100}$/

    return panRegex.test(panNumber) && nameRegex.test(nameAsPerPan)
  }
}

module.exports = new FormController()
