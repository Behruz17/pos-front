import z from 'zod'

export const productDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  manufacturer: z.string().nullable(),
  created_at: z.string(),
  last_unit_price: z.string(),
  total_stock: z.string(),
  purchase_cost: z.string(),
  selling_price: z.string(),
  boxes_qty: z.number().nullish(),
  pieces_qty: z.number().nullish(),
  total_pieces: z.number().optional(),
  image: z
    .string()
    .nullable()
    .transform(
      (val) =>
        val ?? 'https://avatars.mds.yandex.net/i?id=65925811af36ef930db4a09c96b0cbf1d2b0763c-5221533-images-thumbs&n=13'
    ),
})
