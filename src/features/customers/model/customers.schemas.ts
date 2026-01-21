import { z } from 'zod'

export const customerDtoSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  balance: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
const transactionsSchema = z.object({
  id: z.number(),
  amount: z.string(),
  date: z.string(),
  type: z.enum(['sale', 'return']),
})

export const oneCustomerDtoSchema = customerDtoSchema.extend({
  transactions: z.array(transactionsSchema),
})
