import { z } from 'zod'

export const saleDtoSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable(),
  customer_name: z.string().nullable(),
  phone: z.string().nullable(),
  total_amount: z.string(),
  created_by: z.number(),
  created_by_name: z.string(),
  created_at: z.string().datetime(),
  store_id: z.number(),
  warehouse_id: z.number().nullable(),
  store_name: z.string().nullable(),
  warehouse_name: z.string().nullable(),
})

const saleItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  product_name: z.string(),
  product_code: z.string(),
  manufacturer: z.string().nullable(),
  quantity: z.number(),
  unit_price: z.string(),
  total_price: z.string(),
})

export const saleOneDetailSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable(),
  customer_name: z.string().nullable(),
  phone: z.string().nullable(),
  total_amount: z.string(),
  created_by: z.number(),
  created_by_name: z.string(),
  created_at: z.string().datetime(),
  items: z.array(saleItemSchema),
})
