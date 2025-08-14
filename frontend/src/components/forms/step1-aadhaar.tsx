"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormInput } from "@/components/ui/form-input"
import { Button } from "@/components/ui/button"
import { validationSchemas, type AadhaarFormData, type OtpFormData } from "@/lib/validation"
import { formApi } from "@/lib/api"
import { formatAadhaar, maskAadhaar } from "@/lib/utils"
import { Shield, Clock } from "lucide-react"

interface Step1Props {
  onStepComplete: (data: any) => void
  initialData?: any
}

export function Step1AadhaarForm({ onStepComplete, initialData }: Step1Props) {
  const [stage, setStage] = useState<"aadhaar" | "otp">("aadhaar")
  const [aadhaarData, setAadhaarData] = useState<string>("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [countdown, setCountdown] = useState(0)

  // Aadhaar form
  const aadhaarForm = useForm<AadhaarFormData>({
    resolver: zodResolver(validationSchemas.aadhaar),
    defaultValues: {
      aadhaarNumber: initialData?.aadhaarNumber || "",
    },
  })

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(validationSchemas.otp),
  })

  const handleAadhaarSubmit = async (data: AadhaarFormData) => {
    setLoading(true)
    setError("")

    try {
      const response = await formApi.generateOtp(data.aadhaarNumber)

      if (response.success) {
        setAadhaarData(data.aadhaarNumber)
        setStage("otp")
        setOtpSent(true)
        startCountdown()

        // Set aadhaar number in OTP form
        otpForm.setValue("aadhaarNumber", data.aadhaarNumber)
      } else {
        setError(response.message || "Failed to generate OTP")
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (data: OtpFormData) => {
    setLoading(true)
    setError("")

    try {
      const response = await formApi.verifyOtp(data.aadhaarNumber, data.otpCode)

      if (response.success) {
        onStepComplete({
          aadhaarNumber: data.aadhaarNumber,
          otp: data.otpCode,
          userId: response.data?.userId,
        })
      } else {
        setError(response.message || "Invalid OTP")
      }
    } catch (err: any) {
      setError(err.message || "OTP verification failed")
    } finally {
      setLoading(false)
    }
  }

  const startCountdown = () => {
    setCountdown(300) // 5 minutes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return

    setLoading(true)
    try {
      await formApi.generateOtp(aadhaarData)
      startCountdown()
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  if (stage === "aadhaar") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aadhaar Verification</h2>
          <p className="text-gray-600">Enter your 12-digit Aadhaar number to proceed with registration</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={aadhaarForm.handleSubmit(handleAadhaarSubmit)} className="space-y-4">
          <FormInput
            label="Aadhaar Number"
            placeholder="Enter 12-digit Aadhaar number"
            maxLength={14} // Including spaces
            {...aadhaarForm.register("aadhaarNumber")}
            onChange={(e) => {
              const formatted = formatAadhaar(e.target.value)
              aadhaarForm.setValue("aadhaarNumber", formatted.replace(/\s/g, ""))
              e.target.value = formatted
            }}
            error={aadhaarForm.formState.errors.aadhaarNumber?.message}
            helperText="Your Aadhaar number will be used for verification only"
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Generate OTP
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>By proceeding, you agree to share your Aadhaar details for verification purposes only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
        <p className="text-gray-600">Enter the 6-digit OTP sent to your registered mobile number</p>
        <p className="text-sm text-gray-500 mt-2">Aadhaar: {maskAadhaar(aadhaarData)}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
        <FormInput
          label="Enter OTP"
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          {...otpForm.register("otpCode")}
          error={otpForm.formState.errors.otpCode?.message}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Verify OTP
        </Button>
      </form>

      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-gray-500">Resend OTP in {formatCountdown(countdown)}</p>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            disabled={loading}
          >
            Resend OTP
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setStage("aadhaar")}
        className="text-sm text-gray-600 hover:text-gray-800 underline"
      >
        Change Aadhaar Number
      </button>
    </div>
  )
}
