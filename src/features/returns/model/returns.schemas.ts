import z from 'zod'

export const returnDtoSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable(),
  customer_name: z.string().nullable(),
  total_amount: z.string(),
  created_by: z.number(),
  created_by_name: z.string(),
  created_at: z.string(),
  sale_id: z.number().nullable(),
})

export const returnOneDetailSchema = returnDtoSchema.extend({
  items: z.array(
    z.object({
      id: z.number(),
      product_id: z.number(),
      product_name: z.string(),
      manufacturer: z.string().nullable(),
      quantity: z.number(),
      unit_price: z.string(),
      total_price: z.string(),
    })
  ),
})
