import type z from 'zod'
import type { resellerDtoSchema } from './resellers.schemas.js'
import type { TId } from '@/shared/types'

export type TResellerDto = z.infer<typeof resellerDtoSchema>
export type TCreateResellerSuccessResponse = Omit<TResellerDto, 'created_at' | 'updated_at'> & {
  message: string
}
export type TUpdateResellerSuccessResponse = TResellerDto & {
  message: string
}
export type TCreateResellerCredentials = {
  name: string
  phone: string
  balance: number
  status: number
  store_id: number
}
export type TUpdateResellerCredentials = TCreateResellerCredentials & { id: TId }
