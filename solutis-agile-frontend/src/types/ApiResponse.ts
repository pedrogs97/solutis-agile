export interface ErrorResponse {
  field: string
  error: string
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pages: number
  size: number
  total: number
}
