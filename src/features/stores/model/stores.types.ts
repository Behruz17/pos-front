export interface TStore {
  id: number
  name: string
  city: string | null
  warehouse_id: number
  warehouse_name: string
}

export interface TCreateStore {
  name: string
  city?: string
  warehouse_id: number
}

export interface TUpdateStore {
  name?: string
  city?: string
  warehouse_id?: number
}

export interface TStoreCustomer {
  id: number
  full_name: string
  phone: string
  city: string
  balance: number
  created_at: string
  updated_at: string
}

export interface TStoreWithCustomers {
  store: {
    id: number
    name: string
    warehouse_id: number
  }
  customers: TStoreCustomer[]
}

export interface TStoreFinancialSummary {
  store_id: number;
  store_name: string;
  total_sales: number;
  total_debts: number;
  total_expenses: number;
}

export interface TAllStoresFinancialSummary {
  stores: TStoreFinancialSummary[];
  total_stores: number;
}
