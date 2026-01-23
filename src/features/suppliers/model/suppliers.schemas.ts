import { z } from 'zod'

export const supplierDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  balance: z.union([z.number(), z.string()]).transform(Number),
  status: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const supplierOperationsSchema = z.object({
  supplier: z.object({
    id: z.number(),
    name: z.string(),
  }),
  operations: z.array(
    z.object({
      id: z.number(),
      supplier_id: z.number(),
      supplier_name: z.string(),
      warehouse_id: z.number(),
      warehouse_name: z.string(),
      sum: z.coerce.number(),
      type: z.string(),
      date: z.string(),
    })
  ),
})