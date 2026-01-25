import type z from 'zod'
import type { supplierDtoSchema, supplierOperationsSchema } from './suppliers.schemas'
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
  status?: number
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