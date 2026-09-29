import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    pages?: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = 
      process.env.NEXT_PUBLIC_API_URL || 
      'http://localhost:3001'
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response.data,
      (error: AxiosError<ApiResponse>) => {
        // Handle unauthorized errors
        if (error.response?.status === 401) {
          this.handleUnauthorized()
        }

        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error.message)
          return Promise.reject({
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error. Please check your connection.'
            }
          })
        }

        // Reject with response data
        return Promise.reject(error.response.data)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('auth_token')
    return token || null
  }

  private handleUnauthorized(): void {
    // Remove token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // POST request
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // PUT request
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data, config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // PATCH request
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // File upload
  async upload<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // GetAxiosInstance - for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

// Singleton instance
export const api = new ApiClient()
export default api
