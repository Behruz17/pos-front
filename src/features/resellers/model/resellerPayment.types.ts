export type TResellerPaymentType = 'PAYMENT_TO_RESELLER' | 'PAYMENT_FROM_RESELLER'

export type TCreateResellerPaymentCredentials = {
  amount: number
  payment_type: TResellerPaymentType
  store_id: number
  note?: string
}

export type TResellerPaymentSuccessResponse = {
  operation_id: number
  reseller_id: number
  amount: number
  payment_type: TResellerPaymentType
  new_balance: number
  message: string
}
