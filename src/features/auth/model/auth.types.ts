import type z from 'zod'
import { getMeDtoSchema, loginSuccessSchema, userSchema } from './auth.schemas'

export type TUserRole = 'ADMIN' | 'USER'
export type TUser = {
  name: string
  role: string
}
export type TInitialStateAuth = {
  me: TUser | null
  isLoading: boolean
  isInitialized: boolean
}
export type TLoginCredentials = {
  login: string
  password: string
}
export type TRegisterCredentials = TLoginCredentials & {
  name?: string
  role: TUserRole
}
export type TLoginSuccessResponse = z.infer<typeof loginSuccessSchema>
export type TRegisterSuccessResponse = TLoginSuccessResponse['user'] & {
  message: string
}
export type TGetMeDto = z.infer<typeof getMeDtoSchema>
export type TUsersSuccessResponse = z.infer<typeof userSchema>

export type TUserId = number
