export interface TExpense {
  id: number;
  amount: number;
  store_id: number;
  comment?: string;
  expense_date: string;
  store_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TCreateExpense {
  amount: number;
  store_id: number;
  comment?: string;
  expense_date?: string;
}

export interface TUpdateExpense {
  amount?: number;
  store_id?: number;
  comment?: string;
  expense_date?: string;
}