import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAadhaar(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "")

  // Limit to 12 digits
  const limited = digits.slice(0, 12)

  // Format as XXXX XXXX XXXX
  return limited.replace(/(\d{4})(?=\d)/g, "$1 ")
}

export function formatPan(value: string): string {
  // Remove spaces and convert to uppercase
  return value.replace(/\s/g, "").toUpperCase()
}

export function maskAadhaar(aadhaar: string): string {
  if (aadhaar.length !== 12) return aadhaar
  return `XXXX XXXX ${aadhaar.slice(-4)}`
}

export function validateStep(step: number, data: any): boolean {
  switch (step) {
    case 1:
      return !!(data.aadhaarNumber && data.otp)
    case 2:
      return !!(data.panNumber && data.nameAsPerPan)
    default:
      return false
  }
}

export function getStepTitle(step: number): string {
  const titles = {
    1: "Aadhaar Verification",
    2: "PAN Verification",
  }
  return titles[step as keyof typeof titles] || "Unknown Step"
}
