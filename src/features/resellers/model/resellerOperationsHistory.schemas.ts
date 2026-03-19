import { z } from 'zod'

export const resellerOperationHistoryItemSchema = z.object({
  id: z.number(),
  reseller_id: z.number(),
  store_id: z.number(),
  store_name: z.string(),
  sum: z.string().transform((val) => parseFloat(val)),
  type: z.enum(['RECEIPT', 'SALE', 'RETURN']),
  note: z.string().nullable(),
  date: z.string(),
})

export const resellerInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  balance: z.string().transform((val) => parseFloat(val)),
})

export const resellerOperationsHistoryResponseSchema = z.object({
  reseller: resellerInfoSchema,
  operations: z.array(resellerOperationHistoryItemSchema),
})
