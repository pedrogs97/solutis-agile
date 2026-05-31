import { type User } from './User'

export interface Log {
  id: number
  user: User
  module: string
  model: string
  operation: string
  identifier: number
  loggedIn: string
}
