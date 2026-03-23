export type TResellerOperationType = 'RECEIPT' | 'SALE' | 'RETURN' | 'PAYMENT_FROM_RESELLER' | 'PAYMENT_TO_RESELLER'

export type TResellerOperationItem = {
  product_id: number
  quantity: number
  price: number
}

export type TCreateResellerOperationCredentials = {
  type: TResellerOperationType
  store_id: number
  note?: string
  items: TResellerOperationItem[]
}

export type TResellerOperationSuccessResponse = {
  operation_id: number
  reseller_id: number
  type: TResellerOperationType
  amount: number
  items_count: number
  new_balance: number
  message: string
}

export type TResellerOperationDto = {
  id: number
  reseller_id: number
  type: TResellerOperationType
  amount: number
  items_count: number
  note?: string
  created_at: string
  updated_at?: string
}
