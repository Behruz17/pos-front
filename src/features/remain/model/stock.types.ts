import type z from 'zod'
import { historyStockSchema, warehouseStockSchema } from './stock.schemas'

export type TWarehouseStock = z.infer<typeof warehouseStockSchema>[]
export type TPutWarehouseStock = z.infer<typeof warehouseStockSchema>

export type THistoryStock = z.infer<typeof historyStockSchema>
export type TEditStockDto = {
  total_pieces: number
  weight_kg: number
  volume_cbm: number
  reason?: string
}
export type TMoveStockItem = {
  product_id: number
  total_pieces: number
  weight_kg: number
  volume_cbm: number
}
export type TPostSingleMoveCredentials = {
  from_warehouse_id: number
  to_warehouse_id: number
  product_id: number
  total_pieces: number
  weight_kg: number
  volume_cbm: number
  reason: string
}
export type TPostMultiMoveCredentials = {
  from_warehouse_id: number
  to_warehouse_id: number
  items: TMoveStockItem[]
  reason: string
}
export type TPostMoveCredentials = TPostSingleMoveCredentials | TPostMultiMoveCredentials

export type TStockChangeType = THistoryStock['change_type']
