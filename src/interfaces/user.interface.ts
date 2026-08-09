import type { TUserRole } from '@/constants/userRole'

export interface IUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
  updatedAt: string
  role: TUserRole
  staffRole?: string | null
  allowedModules?: string[]
  avatar?: string | null
  provider?: string
  hasPassword?: boolean
}
