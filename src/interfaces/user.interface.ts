import type { TUserRole } from '@/constants/userRole'

export interface IUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
  updatedAt: string
  role: TUserRole
  avatar?: string | null
  provider?: string
}
