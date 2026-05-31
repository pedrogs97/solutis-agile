export interface Permission {
  id: number
  module: string
  model: string
  action: string
  description: string
}

export interface Group {
  id: number
  name: string
  permissions: Permission[]
}
