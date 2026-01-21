import type z from 'zod'
import type { customerDtoSchema, oneCustomerDtoSchema } from './customers.schemas'
import type { TId } from '@/shared/types'

export type TCustomerDto = z.infer<typeof customerDtoSchema>
export type TCreateCustomerSuccessResponse = Omit<TCustomerDto, 'created_at' | 'updated_at'> & {
  message: string
}
export type TUpdateCustomersSuccessResponse = TCustomerDto & {
  message: string
}
export type TCreateCustomerCredentials = {
  full_name: string
  phone?: string
  city?: string
}
export type TUpdateCustomerCredentials = TCreateCustomerCredentials & { id: TId }
export type TUpdateBalanceCredentials = {
  amount: number
  operation: 'add' | 'subtract'
  reason?: string
} & { id: TId }
export type TUpdateBalanceCustomerSuccessResponse = {
  new_balance: number
  message: string
} & { id: TId }

export type TCustomerDtoWithTransactions = z.infer<typeof oneCustomerDtoSchema>
