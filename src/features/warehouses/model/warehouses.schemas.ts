import z from 'zod'

export const warehouseSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export const warehouseProductsSchema = z.object({
  warehouse: warehouseSchema,
  products: z.array(
    z.object({
      id: z.number(),
      product_id: z.number(),
      product_name: z.string(),
      product_code: z.string().nullable(),
      manufacturer: z.string().nullable(),
      notification_threshold: z.number().optional(),

      total_pieces: z.coerce.number(),

      weight_kg: z.coerce.number(),
      volume_cbm: z.coerce.number(),

      purchase_cost: z.coerce.number(),
      selling_price: z.coerce.number(),

      image: z
        .string()
        .nullable()
        .transform(
          (val) =>
            val ??
            'https://avatars.mds.yandex.net/i?id=65925811af36ef930db4a09c96b0cbf1d2b0763c-5221533-images-thumbs&n=13'
        ),
      updated_at: z.string().nullable(),
    })
  ),
})

export const warehouseProductsDetailSchema = z.object({
  warehouse: warehouseSchema,

  product: z.object({
    id: z.number(),
    image: z
      .string()
      .nullable()
      .transform(
        (val) =>
          val ??
          'https://avatars.mds.yandex.net/i?id=65925811af36ef930db4a09c96b0cbf1d2b0763c-5221533-images-thumbs&n=13'
      ),
    name: z.string(),
    product_code: z.string().nullable(),
    manufacturer: z.string().nullable(),
    created_at: z.string().nullable(),
    notification_threshold: z.number().optional(),
  }),

  stock: z.object({
    id: z.number(),

    total_pieces: z.number(),

    weight_kg: z.union([z.string(), z.number()]).nullable(),
    volume_cbm: z.union([z.string(), z.number()]).nullable(),
   
    updated_at: z.string().nullable(),
  }),
})

export const warehouseSuppliersSchema = z.object({
  warehouse: warehouseSchema,
  suppliers: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      phone: z.string(),
      balance: z.coerce.number(),
      status: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    })
  ),
})
