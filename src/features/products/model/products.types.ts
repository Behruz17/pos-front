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
  product_code: string
  notification_threshold?: number
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

export type TMissingProduct = {
  id: number
  name: string
  manufacturer: string | null
  product_code: string | null
  image: string | null
  notification_threshold: number
  total_stock: number
  last_supplier_id: number | null
}

export type TProductStatsItem = {
  product_id: number
  name: string
  product_code: string | null
  image: string | null
  deleted: boolean
  stock: number
  received: number
  sold_qty: number
  returned_qty: number
  revenue: number
  unit_cost: number | null
  cost: number | null
  profit: number | null
  profit_percent: number | null
}

export type TProductStatsResponse = {
  from: string | null
  to: string | null
  totals: {
    stock: number
    received: number
    sold_qty: number
    revenue: number
    cost: number
    profit: number
    profit_percent: number | null
    products_without_cost: number
  }
  items: TProductStatsItem[]
}

export type TProductStatsParams = {
  from?: string
  to?: string
}
