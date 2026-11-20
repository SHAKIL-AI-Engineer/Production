export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  message: string
  error: string | null
  statusCode: number
  timestamp: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T = unknown>
  extends Omit<ApiResponse<T[]>, "data"> {
  data: T[]
  meta: PaginationMeta
}

export interface ErrorResponse {
  success: false
  message: string
  error: string[]
  statusCode: number
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  status: "active" | "inactive"
  avatar: string | null
  createdAt: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  pendingOrders: number
}
