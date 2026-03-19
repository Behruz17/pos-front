import { z } from 'zod'

export const resellerOperationItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1),
  price: z.number().min(0),
})

export const createResellerOperationSchema = z.object({
  type: z.enum(['RECEIPT', 'SALE']), // | 'RETURN'
  store_id: z.number(),
  note: z.string().optional(),
  items: z.array(resellerOperationItemSchema).min(1),
})

export const resellerOperationDtoSchema = z.object({
  id: z.number(),
  reseller_id: z.number(),
  type: z.enum(['RECEIPT', 'SALE', 'RETURN']), // Keep RETURN for API responses
  amount: z.string().transform((val) => parseFloat(val)),
  items_count: z.number(),
  note: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})
