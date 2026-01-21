import z from 'zod'

export const warehouseStockSchema = z.object({
  id: z.number(),
  warehouse_id: z.number(),
  warehouse_name: z.string(),
  product_id: z.number(),
  product_name: z.string(),
  total_pieces: z.number(),
  weight_kg: z.number(),
  volume_cbm: z.number(),
  updated_at: z.string(),
  purchase_cost: z.number(),
  selling_price: z.number(),
})

export const historyStockSchema = z.object({
  id: z.number(),
  warehouse_id: z.number(),
  warehouse_name: z.string(),
  product_id: z.number(),
  product_name: z.string(),
  manufacturer: z.string().nullable(),
  image: z.string(),
  user_id: z.number(),
  user_name: z.string(),
  change_type: z.enum(['ADJUSTMENT', 'IN', 'OUT']).default('ADJUSTMENT'),
  old_total_pieces: z.number(),
  new_total_pieces: z.number(),
  old_weight_kg: z.number(),
  new_weight_kg: z.number(),
  old_volume_cbm: z.number(),
  new_volume_cbm: z.number(),
  reason: z.string(),
  created_at: z.string().datetime(),
})
