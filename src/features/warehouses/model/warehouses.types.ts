import type z from 'zod'
import { 
  warehouseSchema, 
  warehouseProductsSchema, 
  warehouseProductsDetailSchema,
  deliveryDriverSchema, 
  warehouseDeliveryDriversSchema, 
  createDeliveryDriverRequestSchema,
  createDeliveryDriverSchema, 
  updateDeliveryDriverRequestSchema,
  updateDeliveryDriverSchema 
} from './warehouses.schemas'
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
export type TGetWarehousesSuppliers = {
  warehouse: TWarehouse;
  suppliers: Array<{
    id: number;
    name: string;
    phone: string;
    balance: number;
    currency?: string | null;
  }>;
}
export type TStock = TGetWarehousesProductDetail['stock']

export type TDeliveryDriver = z.infer<typeof deliveryDriverSchema>
export type TGetWarehouseDeliveryDrivers = z.infer<typeof warehouseDeliveryDriversSchema>
export type TCreateDeliveryDriverResponse = z.infer<typeof createDeliveryDriverSchema>
export type TUpdateDeliveryDriverResponse = z.infer<typeof updateDeliveryDriverSchema>

export type TCreateDeliveryDriverRequest = z.infer<typeof createDeliveryDriverRequestSchema>
export type TUpdateDeliveryDriverRequest = z.infer<typeof updateDeliveryDriverRequestSchema>
