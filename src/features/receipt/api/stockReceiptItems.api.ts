import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import { z } from 'zod'

// Schema for stock receipt items
export const stockReceiptItemSchema = z.object({
  id: z.number(),
  receipt_id: z.number(),
  product_id: z.number(),
  product_name: z.string(),
  manufacturer: z.string().nullable(),
  image: z.string().nullable(),
  product_code: z.string(),
  boxes_qty: z.number().nullable(),
  pieces_per_box: z.number().nullable(),
  loose_pieces: z.number().nullable(),
  total_pieces: z.number().nullable(),
  weight_kg: z.string().nullable(),
  volume_cbm: z.string().nullable(),
  amount: z.string().nullable(),
  purchase_cost: z.string().nullable(),
  selling_price: z.string().nullable(),
})

export type TStockReceiptItem = z.infer<typeof stockReceiptItemSchema>

const stockReceiptItemsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStockReceiptItems: build.query<TStockReceiptItem[], {
      receipt_id?: number
      supplier_id?: number
      warehouse_id?: number
    }>({
      query: ({ receipt_id, supplier_id, warehouse_id }) => {
        const params = new URLSearchParams()
        if (receipt_id) params.append('receipt_id', receipt_id.toString())
        if (supplier_id) params.append('supplier_id', supplier_id.toString())
        if (warehouse_id) params.append('warehouse_id', warehouse_id.toString())
        
        return {
          url: `/stock-receipt-items?${params.toString()}`,
          method: 'GET',
        }
      },
      transformResponse: (response: unknown) => {
        return stockReceiptItemSchema.array().parse(response)
      },
    }),
  }),
})

export const { useGetStockReceiptItemsQuery } = stockReceiptItemsApi