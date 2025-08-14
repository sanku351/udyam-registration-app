export interface FormField {
  name: string
  type: string
  label: string
  required: boolean
  maxLength?: number
  pattern?: string
  placeholder?: string
}

export interface FormStep {
  step: number
  title: string
  fields: FormField[]
}

export interface FormStructure {
  steps: FormStep[]
  validation_rules: Record<string, ValidationRule>
  ui_components: UIComponents
}

export interface ValidationRule {
  pattern: string
  message: string
}

export interface UIComponents {
  buttons: Button[]
  progress_indicator: ProgressIndicator
}

export interface Button {
  type: string
  text: string
  step: number
}

export interface ProgressIndicator {
  total_steps: number
  step_labels: string[]
}

export interface FormData {
  // Step 1
  aadhaarNumber?: string
  otp?: string

  // Step 2
  panNumber?: string
  nameAsPerPan?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface UserProgress {
  userId: string
  currentStep: number
  steps: {
    [key: number]: {
      title: string
      completed: boolean
      completedAt?: string
    }
  }
  isComplete: boolean
  submissions: number
}
