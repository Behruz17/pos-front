export interface DeliveryOperation {
  id: number;
  delivery_driver_id: number;
  stock_receipt_id: number | null;
  sum: string;
  currency: string | null;
  rate: string | null;
  converted_sum: number | null;
  type: 'RECEIPT' | 'PAYMENT';
  date: string;
  driver_name: string;
  receipt_amount: string | null;
}

export interface DeliveryOperationsFilters {
  type?: 'RECEIPT' | 'PAYMENT';
  start_date?: string;
  end_date?: string;
}
