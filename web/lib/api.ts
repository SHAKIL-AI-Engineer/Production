import type { ApiResponse } from "@/types/api"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "")

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface ApiClientOptions {
  baseUrl?: string
  headers?: Record<string, string>
}

interface RequestOptions {
  headers?: Record<string, string>
  cache?: RequestCache
}

/**
 * Typed API client.
 * - Automatically attaches `Authorization: Bearer <token>` when set via `setAuthToken`.
 * - Parses JSON responses into `ApiResponse<T>`.
 * - Throws on non-ok responses so callers can use try/catch.
 */
class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor({ baseUrl = API_BASE_URL, headers = {} }: ApiClientOptions = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = { "Content-Type": "application/json", ...headers }
  }

  /** Attach or remove a Bearer auth token on all subsequent requests. */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`
    } else {
      delete this.defaultHeaders["Authorization"]
    }
  }

  private async request<T>(
    method: RequestMethod,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = { ...this.defaultHeaders, ...options.headers }

    const res = await fetch(url, {
      method,
      headers,
      body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      cache: options.cache ?? "no-store",
    })

    const contentType = res.headers.get("content-type") ?? ""
    let raw: unknown = null
    if (contentType.includes("application/json")) {
      raw = await res.json()
    } else {
      raw = await res.text()
    }

    const data = raw as Record<string, unknown> | unknown[] | null
    const isSuccess = res.ok

    let responseData: T | null = null
    let responseMessage = isSuccess ? "Success" : res.statusText
    let responseError: string | null = isSuccess ? null : res.statusText

    if (data && typeof data === "object") {
      if (!Array.isArray(data) && "data" in data) {
        responseData = (data as Record<string, unknown>).data as T
      } else {
        responseData = data as T
      }

      if (!Array.isArray(data)) {
        if ("message" in data && typeof data.message === "string") {
          responseMessage = data.message
        }
        if ("error" in data && typeof data.error === "string") {
          responseError = data.error
        }
      }
    } else if (raw !== null) {
      responseData = raw as T
    }

    const response: ApiResponse<T> = {
      success: isSuccess,
      data: isSuccess ? responseData : null,
      message: responseMessage,
      error: responseError,
      statusCode: res.status,
      timestamp: new Date().toISOString(),
    }

    if (!res.ok) {
      const err = new Error(responseError || response.message) as Error & {
        response: ApiResponse<T>
        statusCode: number
      }
      err.response = response
      err.statusCode = response.statusCode
      throw err
    }

    return response
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>("GET", path, undefined, options)
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("POST", path, body, options)
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PUT", path, body, options)
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PATCH", path, body, options)
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>("DELETE", path, undefined, options)
  }
}

export const api = new ApiClient()

export type { ApiResponse, RequestMethod }
export { API_BASE_URL }
