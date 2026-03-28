export interface TSaleItem {
  id: number
  product_id: number
  product_name: string
  product_code: string
  manufacturer?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface TSale {
  id: number
  customer_id?: number
  customer_name?: string
  store_id: number
  payment_status?: 'PAID' | 'DEBT' | 'REFUND'
  items: TSaleItem[]
  created_at: string
  created_by_name: string
  total_amount: number
  store_name?: string
  warehouse_id?: number
  warehouse_name?: string
  type?: 'SALE' | 'PAYMENT' | 'RETURN'
  amount?: number
  transaction_id?: number
}

export interface TCreateSale {
  customer_id?: number
  customer_name?: string
  phone?: string
  store_id: number
  payment_status?: 'PAID' | 'DEBT'
  items: Omit<TSaleItem, 'id' | 'product_name' | 'manufacturer' | 'total_price'>[]
}

export interface TReturnItem {
  id: number
  product_id: number
  product_name: string
  product_code: string
  manufacturer?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface TReturn {
  id: number
  customer_id?: number
  customer_name?: string
  sale_id?: number
  store_id?: number
  items: TReturnItem[]
  created_at: string
  created_by_name: string
  total_amount: number
}

export interface TCreateReturn {
  customer_id?: number
  sale_id?: number
  store_id?: number
  items: Omit<TReturnItem, 'id' | 'product_name' | 'manufacturer' | 'total_price'>[]
}

export interface TRetailDebtor {
  id: number
  customer_name: string
  phone: string
  created_at: string
  total_debt: number
  total_paid: number
  remaining_balance: number
}

export interface TRetailDebtorPayment {
  id: number
  retail_debtor_id: number
  amount: number
  type: string
  description?: string
  message: string
}

export interface TRetailDebtorOperation {
  id: number
  type: 'DEBT' | 'PAYMENT' | 'RETURN'
  amount: number
  description: string | null
  created_at: string
  sale_id: number | null
  sale_amount: number | null
}

export interface TRetailDebtorDetail extends TRetailDebtor {
  operations: TRetailDebtorOperation[]
}

// Sale Draft types
export interface TSaleDraftItem {
  product_id: number
  quantity: number
  unit_price: number
}

export interface TSaleDraft {
  id: number
  store_id: number
  warehouse_id: number
  customer_id?: number
  customer_name?: string
  phone?: string
  items: TSaleDraftItem[]
  total_amount: number
  payment_status: 'PAID' | 'DEBT' | 'UNPAID'
  notes?: string
  created_at: string
  updated_at: string
  store_name?: string
  warehouse_name?: string
}

export interface TCreateSaleDraft {
  store_id: number
  warehouse_id: number
  customer_id?: number
  customer_name?: string
  phone?: string
  items: TSaleDraftItem[]
  payment_status?: 'PAID' | 'DEBT' | 'UNPAID'
  notes?: string
}

export interface TSaleDraftResponse {
  id: number
  message: string
  draft: TSaleDraft
}
