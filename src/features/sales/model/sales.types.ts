export interface TSaleItem {
  id: number
  product_id: number
  product_name: string
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
  items: TSaleItem[]
  created_at: string
  created_by_name: string
  total_amount: number
}

export interface TCreateSale {
  customer_id?: number
  store_id: number
  payment_status?: 'PAID' | 'DEBT'
  items: Omit<TSaleItem, 'id' | 'product_name' | 'manufacturer' | 'total_price'>[]
}

export interface TReturnItem {
  id: number
  product_id: number
  product_name: string
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
