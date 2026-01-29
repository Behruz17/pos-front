import type z from 'zod'
import type { customerDtoSchema, oneCustomerDtoSchema } from './customers.schemas'
import type { TId } from '@/shared/types'

export type TCustomerDto = z.infer<typeof customerDtoSchema>
export type TCreateCustomerSuccessResponse = Omit<TCustomerDto, 'created_at' | 'updated_at'> & {
  message: string
}
export type TUpdateCustomersSuccessResponse = TCustomerDto & {
  message: string
}
export type TCreateCustomerCredentials = {
  full_name: string
  phone?: string
  city?: string
  store_id: number
}
export type TUpdateCustomerCredentials = TCreateCustomerCredentials & { id: TId }
export type TUpdateBalanceCredentials = {
  amount: number
  operation: 'add' | 'subtract'
  reason?: string
} & { id: TId }
export type TUpdateBalanceCustomerSuccessResponse = {
  new_balance: number
  message: string
} & { id: TId }

export interface TCustomerPayment {
  id: number;
  customer_id: number;
  customer_name: string;
  amount: number;
  payment_method: 'CASH' | 'CARD' | 'TRANSFER';
  note?: string;
  store_id: number;
  new_balance: number;
  message: string;
}

export interface TCustomerOperation {
  id: number;
  customer_id: number;
  customer_name: string;
  store_id: number;
  store_name: string;
  sum: number;
  type: 'PAID' | 'DEBT' | 'PAYMENT';
  date: string;
  sale_id?: number;
}

export interface TCustomerOperationsWithCustomer {
  customer: {
    id: number;
    full_name: string;
    phone: string;
    balance: number;
  };
  operations: TCustomerOperation[];
}

export interface TCustomerOperationsWithStore {
  store: {
    id: number;
    name: string;
  };
  operations: TCustomerOperation[];
}

export type TCustomerOperations = TCustomerOperationsWithCustomer | TCustomerOperationsWithStore;

export type TCustomerDtoWithTransactions = z.infer<typeof oneCustomerDtoSchema>

export interface TCustomerSale {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  payment_status: 'PAID' | 'DEBT';
  created_by: number;
  created_by_name: string;
  created_at: string;
  store_id: number;
  warehouse_id: number;
  store_name: string;
  warehouse_name: string;
}

export interface TCustomerSales {
  customer: {
    id: number;
    full_name: string;
    phone: string;
    city: string;
    balance: number;
  };
  store: {
    id: number;
    name: string;
    warehouse_id: number;
  };
  sales: TCustomerSale[];
}
