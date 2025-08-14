import { z } from "zod"

export const validationSchemas = {
  aadhaar: z.object({
    aadhaarNumber: z
      .string()
      .min(1, "Aadhaar number is required")
      .transform((val) => val.replace(/\s/g, ""))
      .refine((val) => /^[0-9]{12}$/.test(val), {
        message: "Aadhaar number must be 12 digits",
    }),
  }),

  otp: z.object({
    aadhaarNumber: z.string().regex(/^[0-9]{12}$/),
    otpCode: z
      .string()
      .min(1, "OTP is required")
      .regex(/^[0-9]{6}$/, "OTP must be 6 digits"),
  }),

  pan: z.object({
    panNumber: z
      .string()
      .min(1, "PAN number is required")
      .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, "PAN must be in format: 5 letters, 4 digits, 1 letter")
      .transform((val) => val.toUpperCase()),
    nameAsPerPan: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces")
      .transform((val) => val.trim()),
  }),
}

export type AadhaarFormData = z.infer<typeof validationSchemas.aadhaar>
export type OtpFormData = z.infer<typeof validationSchemas.otp>
export type PanFormData = z.infer<typeof validationSchemas.pan>
