import type z from 'zod'

import type { supplierDtoSchema } from './suppliers.schemas'

import type { TId } from '@/shared/types'



export type TSupplierDto = z.infer<typeof supplierDtoSchema>

export type TCreateSupplierSuccessResponse = Omit<TSupplierDto, 'created_at' | 'updated_at'> & {

  message: string

}

export type TUpdateSupplierSuccessResponse = TSupplierDto & {

  message: string

}

export type TCreateSupplierCredentials = {

  name: string

  phone?: string

  balance?: number

  currency?: string

  status?: number

  warehouse_id: number

}

export type TUpdateSupplierCredentials = TCreateSupplierCredentials & { id: TId }

export type TGetSupplierOperations = {

  supplier: {

    id: number

    name: string

  }

  operations: Array<{

    id: number

    supplier_id: number

    supplier_name: string

    warehouse_id: number

    warehouse_name: string

    sum: number

    type: 'RECEIPT' | 'PAYMENT'

    date: string

    receipt_id: number | null

  }>

}

export type TSupplierStatsSummary = {
  total_receipts: number
  total_payments: number
  remaining_balance: number
  active_suppliers: number
}

export type TSupplierStats = {
  supplier_id: number
  supplier_name: string
  currency?: string | null
  total_receipts: string | number
  total_payments: string | number
  remaining_balance: string | number
  receipt_count: number
  payment_count: number
}

export type TSupplierStatsResponse = {
  summary: TSupplierStatsSummary
  suppliers: TSupplierStats[]
}