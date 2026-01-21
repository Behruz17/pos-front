import type z from 'zod'
import type { returnDtoSchema, returnOneDetailSchema } from './returns.schemas'

export type TReturnDto = z.infer<typeof returnDtoSchema>
export type TReturnOneDetail = z.infer<typeof returnOneDetailSchema>

export type TReturnCreateCredentials = {
  customer_id?: number
  sale_id: number | null
  items: {
    product_id: number
    quantity: number
    unit_price: string
  }[]
}
export type TReturnItem = TReturnCreateCredentials['items'][0]
