/**
 * Canonical browser API client. Envelope, origin, and consumer import rules:
 * see ./API_CONTRACT.md (STACK-F021).
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios'
import type { ApiFailure, ApiResponse } from '../types'

export type { ApiResponse, PaginationParams } from '../types'

function transportFailure(error: AxiosError<unknown>): ApiFailure {
  const body = error.response?.data
  if (body && typeof body === 'object' && 'success' in body && body.success === false &&
      'error' in body && body.error && typeof body.error === 'object' &&
      'code' in body.error && typeof body.error.code === 'string' &&
      'message' in body.error && typeof body.error.message === 'string') {
    return body as ApiFailure
  }
  return {
    success: false,
    error: {
      code: error.response ? 'HTTP_ERROR' : 'NETWORK_ERROR',
      message: error.response ? 'The API request failed.' : 'The local API could not be reached.',
      ...(error.response ? { status: error.response.status } : {}),
    },
  }
}

/** Same-origin cookie authentication. No browser credential storage or redirects. */
export class ApiClient {
  private readonly client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      withCredentials: true,
    })
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError<unknown>) => Promise.reject(transportFailure(error)),
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Axios supplies the FormData boundary in its browser/Node adapter.
    const headers = { ...config?.headers, 'Content-Type': 'multipart/form-data' }
    const response = await this.client.post<ApiResponse<T>>(url, formData, { ...config, headers })
    return response.data
  }

  /** Advanced callers receive the normal AxiosResponse transport contract. */
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

export const api = new ApiClient()
export default api
