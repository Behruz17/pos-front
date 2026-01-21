import type z from 'zod'
import type { saleDtoSchema, saleOneDetailSchema } from './sales.schemas'

export type TCreateSaleCredentials = {
  customer_id?: number
  items: {
    product_id: number
    quantity: number
    unit_price: string
  }[]
}
export type TSaleItemForm = TCreateSaleCredentials['items'][number]
export type TSale = z.infer<typeof saleDtoSchema>
export type TSaleDetail = z.infer<typeof saleOneDetailSchema>
