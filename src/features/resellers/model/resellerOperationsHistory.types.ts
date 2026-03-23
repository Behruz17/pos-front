export type TResellerOperationHistoryItem = {
  id: number
  reseller_id: number
  store_id: number
  store_name: string
  sum: number
  type: 'RECEIPT' | 'SALE' | 'RETURN' | 'PAYMENT_FROM_RESELLER' | 'PAYMENT_TO_RESELLER'
  note: string | null
  date: string
}

export type TResellerInfo = {
  id: number
  name: string
  balance: number
}

export type TResellerOperationsHistoryResponse = {
  reseller: TResellerInfo
  operations: TResellerOperationHistoryItem[]
}

export type TGetResellerOperationsParams = {
  resellerId: number
  type?: 'RECEIPT' | 'SALE' | 'RETURN' | 'PAYMENT_FROM_RESELLER' | 'PAYMENT_TO_RESELLER'
  store_id?: number
  limit?: number
}
