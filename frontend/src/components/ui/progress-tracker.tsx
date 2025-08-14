import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ProgressTrackerProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  completedSteps: number[]
}

export function ProgressTracker({ currentStep, totalSteps, stepLabels, completedSteps }: ProgressTrackerProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = completedSteps.includes(stepNumber)
          const isCurrent = stepNumber === currentStep
          const isActive = stepNumber <= currentStep

          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    {
                      "border-green-500 bg-green-500 text-white": isCompleted,
                      "border-blue-500 bg-blue-500 text-white": isCurrent && !isCompleted,
                      "border-gray-300 bg-white text-gray-500": !isActive,
                    },
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn("text-xs font-medium", {
                      "text-green-600": isCompleted,
                      "text-blue-600": isCurrent && !isCompleted,
                      "text-gray-500": !isActive,
                    })}
                  >
                    Step {stepNumber}
                  </div>
                  <div
                    className={cn("text-xs", {
                      "text-green-600": isCompleted,
                      "text-blue-600": isCurrent && !isCompleted,
                      "text-gray-400": !isActive,
                    })}
                  >
                    {stepLabels[index]}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div
                  className={cn("mx-4 h-0.5 w-16 transition-colors sm:w-24", {
                    "bg-green-500": stepNumber < currentStep || isCompleted,
                    "bg-gray-300": stepNumber >= currentStep && !isCompleted,
                  })}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
