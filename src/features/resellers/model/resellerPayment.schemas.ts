import { z } from 'zod'

export const createResellerPaymentSchema = z.object({
  amount: z.number().min(0.01),
  payment_type: z.enum(['PAYMENT_TO_RESELLER', 'PAYMENT_FROM_RESELLER']),
  store_id: z.number(),
  note: z.string().optional(),
})

export const resellerPaymentDtoSchema = z.object({
  operation_id: z.number(),
  reseller_id: z.number(),
  amount: z.string().transform((val) => parseFloat(val)),
  payment_type: z.enum(['PAYMENT_TO_RESELLER', 'PAYMENT_FROM_RESELLER']),
  new_balance: z.string().transform((val) => parseFloat(val)),
  message: z.string(),
})
