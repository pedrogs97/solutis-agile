export interface User {
  id: number

  employeeId?: number

  roleId?: number

  password: string
  username: string
  email: string
  department: string
  manager: string
  fullName?: string
  group?:
    | {
        id: number
        name: string
      }
    | string

  isStaff: boolean
  isActive: boolean

  lastLoginIn?: Date | null
}
