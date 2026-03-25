import { z } from 'zod'

export const resellerStatisticsSummarySchema = z.object({
  total_receipts: z.number(),
  total_sales: z.number(),
  my_payments: z.number(),
  reseller_payments: z.number(),
  total_debt_balance: z.number(),
  active_resellers: z.number(),
})

export const resellerStatisticsBreakdownSchema = z.object({
  receipts_from_operations: z.number(),
  sales_from_operations: z.number(),
  payments_made_to_resellers: z.number(),
  payments_received_from_resellers: z.number(),
  outstanding_debt_balance: z.number(),
})

export const resellerStatisticsResponseSchema = z.object({
  summary: resellerStatisticsSummarySchema,
  breakdown: resellerStatisticsBreakdownSchema,
})
