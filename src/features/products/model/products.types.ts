import type z from 'zod'
import { productDtoSchema } from './products.schemas'
import type { TId } from '@/shared/types'

export type TProductDto = z.infer<typeof productDtoSchema>
export type TSaleItemForm = {
  product_id: string
  quantity: string
  last_unit_price: string
  purchase_cost: string
  selling_price: string
}
export type TPostProductCredentials = {
  name: string
  manufacturer: string | null
  image: File | null
}
export type TPutProductCredentials = {
  id: TId
  body: FormData
}
export type TPostProductResponseSuccess = {
  id: number
  name: string
  manufacturer?: string
  message: string
}
