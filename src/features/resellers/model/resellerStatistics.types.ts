export interface ResellerStatisticsSummary {
  total_receipts: number
  total_sales: number
  my_payments: number
  reseller_payments: number
  total_debt_balance: number
  active_resellers: number
}

export interface ResellerStatisticsBreakdown {
  receipts_from_operations: number
  sales_from_operations: number
  payments_made_to_resellers: number
  payments_received_from_resellers: number
  outstanding_debt_balance: number
}

export interface ResellerStatisticsResponse {
  summary: ResellerStatisticsSummary
  breakdown: ResellerStatisticsBreakdown
}
