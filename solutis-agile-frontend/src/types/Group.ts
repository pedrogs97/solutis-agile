export interface GroupWithPermissions {
  id: number
  name: string
  permissions: { id: number; description: string }[]
}
