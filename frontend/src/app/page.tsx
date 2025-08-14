"use client"

import { useState, useEffect } from "react"
import { ProgressTracker } from "@/components/ui/progress-tracker"
import { Step1AadhaarForm } from "@/components/forms/step1-aadhaar"
import { Step2PanForm } from "@/components/forms/step2-pan"
import { CheckCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormData {
  aadhaarNumber?: string
  otp?: string
  panNumber?: string
  nameAsPerPan?: string
  userId?: string
}

export default function UdyamRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [isComplete, setIsComplete] = useState(false)

  const stepLabels = ["Aadhaar Verification", "PAN Verification"]
  const totalSteps = 2

  useEffect(() => {
    // Load saved progress from localStorage
    const savedData = localStorage.getItem("udyam_form_data")
    const savedStep = localStorage.getItem("udyam_current_step")
    const savedCompleted = localStorage.getItem("udyam_completed_steps")

    if (savedData) {
      setFormData(JSON.parse(savedData))
    }
    if (savedStep) {
      setCurrentStep(Number.parseInt(savedStep))
    }
    if (savedCompleted) {
      setCompletedSteps(JSON.parse(savedCompleted))
    }
  }, [])

  const saveProgress = (step: number, data: FormData, completed: number[]) => {
    localStorage.setItem("udyam_form_data", JSON.stringify(data))
    localStorage.setItem("udyam_current_step", step.toString())
    localStorage.setItem("udyam_completed_steps", JSON.stringify(completed))
  }

  const handleStep1Complete = (stepData: any) => {
    const updatedData = { ...formData, ...stepData }
    const updatedCompleted = [...completedSteps, 1]

    setFormData(updatedData)
    setCompletedSteps(updatedCompleted)
    setCurrentStep(2)

    saveProgress(2, updatedData, updatedCompleted)
  }

  const handleStep2Complete = (stepData: any) => {
    const updatedData = { ...formData, ...stepData }
    const updatedCompleted = [...completedSteps, 2]

    setFormData(updatedData)
    setCompletedSteps(updatedCompleted)
    setIsComplete(true)

    saveProgress(3, updatedData, updatedCompleted)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setCompletedSteps([])
    setFormData({})
    setIsComplete(false)

    localStorage.removeItem("udyam_form_data")
    localStorage.removeItem("udyam_current_step")
    localStorage.removeItem("udyam_completed_steps")
  }

  const renderCurrentStep = () => {
    if (isComplete) {
      return (
        <div className="text-center space-y-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h2>
            <p className="text-gray-600">Your Aadhaar and PAN verification has been completed successfully.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="font-medium text-green-800 mb-2">Verified Details:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>Aadhaar: {formData.aadhaarNumber ? `****-****-${formData.aadhaarNumber.slice(-4)}` : "N/A"}</p>
              <p>PAN: {formData.panNumber || "N/A"}</p>
              <p>Name: {formData.nameAsPerPan || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button size="lg" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Continue to Full Registration
            </Button>

            <Button variant="outline" size="lg" className="w-full bg-transparent" onClick={handleReset}>
              Start New Registration
            </Button>
          </div>
        </div>
      )
    }

    switch (currentStep) {
      case 1:
        return <Step1AadhaarForm onStepComplete={handleStep1Complete} initialData={formData} />
      case 2:
        return <Step2PanForm onStepComplete={handleStep2Complete} initialData={formData} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Udyam Registration</h1>
          <p className="text-gray-600">Complete your business registration in simple steps</p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <ProgressTracker
            currentStep={isComplete ? totalSteps + 1 : currentStep}
            totalSteps={totalSteps}
            stepLabels={stepLabels}
            completedSteps={completedSteps}
          />
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">{renderCurrentStep()}</div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This is a demo application. No real government verification is performed.</p>
        </div>
      </div>
    </div>
  )
}
