import { z } from 'zod'

export const resellerDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  balance: z.string().transform((val) => parseFloat(val)),
  status: z.number(),
  store_id: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
