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

export type TStoreIncomeChartItem = {
  /** YYYY-MM-DD for days, YYYY-MM for months */
  key: string
  cash: number
  debt_payments: number
  total: number
  cash_count: number
  payments_count: number
}

export type TStoreIncomeChart = {
  store_id: number
  year: number
  month: number | null
  granularity: 'day' | 'month'
  totals: { cash: number; debt_payments: number; total: number }
  items: TStoreIncomeChartItem[]
}
