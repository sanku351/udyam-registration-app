import axios from "axios"
import type { ApiResponse, FormData, UserProgress, FormStructure } from "@/types/form"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || "An error occurred"
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    })
  },
)

export const formApi = {
  // Step 1: Aadhaar verification
  generateOtp: async (aadhaarNumber: string): Promise<ApiResponse> => {
    return apiClient.post("/form/step1/generate-otp", { aadhaarNumber })
  },

  verifyOtp: async (aadhaarNumber: string, otpCode: string): Promise<ApiResponse> => {
    return apiClient.post("/form/step1/verify-otp", { aadhaarNumber, otpCode })
  },

  // Step 2: PAN verification
  verifyPan: async (panNumber: string, nameAsPerPan: string): Promise<ApiResponse> => {
    return apiClient.post("/form/step2/verify-pan", { panNumber, nameAsPerPan })
  },

  // Form submission
  submitForm: async (step: number, formData: FormData): Promise<ApiResponse> => {
    return apiClient.post("/form/submit", { step, formData })
  },

  // Get form progress
  getProgress: async (userId: string): Promise<ApiResponse<UserProgress>> => {
    return apiClient.get(`/form/progress/${userId}`)
  },

  // Get form structure
  getFormStructure: async (): Promise<ApiResponse<FormStructure>> => {
    return apiClient.get("/form/structure")
  },
}

export default apiClient
