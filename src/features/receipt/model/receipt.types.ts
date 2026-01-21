import type z from 'zod'
import { oneReceiptGtoSchema, receiptGtoSchema } from './receipt.schemas'

export type TReceiptItem = {
  product_id: string
  boxes_qty: string
  pieces_per_box: string
  loose_pieces: string
  weight_kg: string
  volume_cbm: string
  amount: string
  purchase_cost: string
  selling_price: string
}
export type TReceiptItemResponse = {
  boxes_qty: string
  pieces_qty: string
  weight_kg: string
  amount: string

  purchase_cost: string
  selling_price: string
  product_query: string
  product_id: string | null
  pieces_per_box: string
  loose_pieces: string
  volume_cbm: string
}
export type TCreateReceipt = {
  warehouse_id: number
  items: TReceiptItem[]
}

export type TReceiptGto = z.infer<typeof receiptGtoSchema>
export type TOneReceiptGto = z.infer<typeof oneReceiptGtoSchema>
