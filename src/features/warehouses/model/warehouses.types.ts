import type z from 'zod'
import { warehouseProductsDetailSchema, warehouseProductsSchema, warehouseSchema } from './warehouses.schemas'
import type { TId } from '@/shared/types'

export type TWarehouse = z.infer<typeof warehouseSchema>
export type TPostWarehouseSuccess = { id: number; message: string; name: string }

export type TMutateWarehouse = {
  name: string
}
export type TGetWarehousesProducts = z.infer<typeof warehouseProductsSchema>
export type TGetWarehousesProductDetail = z.infer<typeof warehouseProductsDetailSchema>
export type TGetWarehousesProductsCredentials = {
  warehouseId: TId
  productId: TId
}
export type TStock = TGetWarehousesProductDetail['stock']
