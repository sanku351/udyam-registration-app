"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormInput } from "@/components/ui/form-input"
import { Button } from "@/components/ui/button"
import { validationSchemas, type PanFormData } from "@/lib/validation"
import { formApi } from "@/lib/api"
import { formatPan } from "@/lib/utils"
import { CreditCard, User } from "lucide-react"

interface Step2Props {
  onStepComplete: (data: any) => void
  initialData?: any
}

export function Step2PanForm({ onStepComplete, initialData }: Step2Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const form = useForm<PanFormData>({
    resolver: zodResolver(validationSchemas.pan),
    defaultValues: {
      panNumber: initialData?.panNumber || "",
      nameAsPerPan: initialData?.nameAsPerPan || "",
    },
  })

  const handleSubmit = async (data: PanFormData) => {
    setLoading(true)
    setError("")

    try {
      const response = await formApi.verifyPan(data.panNumber, data.nameAsPerPan)

      if (response.success) {
        onStepComplete({
          panNumber: data.panNumber,
          nameAsPerPan: data.nameAsPerPan,
          userId: response.data?.userId,
          isComplete: response.data?.isComplete,
        })
      } else {
        setError(response.message || "PAN verification failed")
      }
    } catch (err: any) {
      setError(err.message || "PAN verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PAN Verification</h2>
        <p className="text-gray-600">Enter your PAN details to complete the verification process</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormInput
          label="PAN Number"
          placeholder="Enter PAN number (e.g., ABCDE1234F)"
          maxLength={10}
          {...form.register("panNumber")}
          onChange={(e) => {
            const formatted = formatPan(e.target.value)
            form.setValue("panNumber", formatted)
            e.target.value = formatted
          }}
          error={form.formState.errors.panNumber?.message}
          helperText="Enter your 10-character PAN number"
          required
        />

        <FormInput
          label="Name as per PAN"
          placeholder="Enter name exactly as on PAN card"
          {...form.register("nameAsPerPan")}
          error={form.formState.errors.nameAsPerPan?.message}
          helperText="Enter your name exactly as it appears on your PAN card"
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Verify PAN
        </Button>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <User className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure your PAN number is correct</li>
              <li>Name should match exactly with your PAN card</li>
              <li>This information will be verified with government records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
