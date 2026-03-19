import { z } from 'zod'

export const supplierDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  balance: z.union([z.number(), z.string()]).transform(Number),
  currency: z.string().nullable(),
  status: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const supplierOperationsSchema = z.object({
  supplier: z.object({
    id: z.number(),
    name: z.string(),
  }),
  operations: z.array(
    z.object({
      id: z.number(),
      supplier_id: z.number(),
      supplier_name: z.string(),
      warehouse_id: z.number(),
      warehouse_name: z.string(),
      sum: z.coerce.number(),
      type: z.string(),
      date: z.string(),
      receipt_id: z.number().nullable(),
    }).refine((operation) => {
      // receipt_id is required for RECEIPT operations, optional for PAYMENT operations
      if (operation.type === 'RECEIPT') {
        return operation.receipt_id !== null && operation.receipt_id !== undefined;
      }
      return true; // PAYMENT operations can have null receipt_id
    }, {
      message: 'receipt_id is required for RECEIPT operations',
      path: ['receipt_id'],
    })
  ),
})

export const supplierStatsSchema = z.object({
  summary: z.object({
    total_receipts: z.coerce.number(),
    total_payments: z.coerce.number(),
    remaining_balance: z.coerce.number(),
    active_suppliers: z.coerce.number(),
  }),
  suppliers: z.array(
    z.object({
      supplier_id: z.coerce.number(),
      supplier_name: z.string(),
      currency: z.string().nullable(),
      total_receipts: z.coerce.number(),
      total_payments: z.coerce.number(),
      remaining_balance: z.coerce.number(),
      receipt_count: z.coerce.number(),
      payment_count: z.coerce.number(),
    })
  ),
})