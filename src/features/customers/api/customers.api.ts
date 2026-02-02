import { baseApi } from '@/shared/request/baseApi'
import type {
  TCreateCustomerCredentials,
  TCreateCustomerSuccessResponse,
  TCustomerDto,
  TCustomerDtoWithTransactions,
  TUpdateBalanceCredentials,
  TUpdateBalanceCustomerSuccessResponse,
  TUpdateCustomerCredentials,
  TUpdateCustomersSuccessResponse,
  TCustomerSales,
  TCustomerPayment,
  TCustomerOperations,
} from '../model/customers.types'
import { customerDtoSchema, oneCustomerDtoSchema } from '../model/customers.schemas'
import type { TDefaultResponse, TId } from '@/shared/types'

const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomers: build.query<TCustomerDto[], void>({
      query: () => ({
        url: '/customers',
        method: 'GET',
      }),
      transformResponse: (response) => customerDtoSchema.array().parseAsync(response),
      providesTags: ['Customers'],
    }),
    getOneCustomer: build.query<TCustomerDto, TId>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => customerDtoSchema.parseAsync(response),
    }),
    createCustomer: build.mutation<TCreateCustomerSuccessResponse, TCreateCustomerCredentials>({
      query: (data) => ({
        url: '/customers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomer: build.mutation<TUpdateCustomersSuccessResponse, TUpdateCustomerCredentials>({
      query: (data) => ({
        url: `/customers/${data.id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),
    deleteCustomer: build.mutation<TDefaultResponse, TId>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customers'],
    }),
    updateBalanceCustomer: build.mutation<TUpdateBalanceCustomerSuccessResponse, TUpdateBalanceCredentials>({
      query: (data) => ({
        url: `/customers/${data.id}/update-balance`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),
    getOneUserDetail: build.query<TCustomerDtoWithTransactions, TId>({
      query: (id) => ({
        url: `customers/${id}/details`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => oneCustomerDtoSchema.parseAsync(response),
    }),
    getCustomerSales: build.query<TCustomerSales, { customerId: number, storeId: number }>({
      query: ({ customerId, storeId }) => ({
        url: `/customers/${customerId}/sales/${storeId}`,
        method: 'GET',
      }),
      providesTags: ['Customers'],
    }),
    getCustomerOperations: build.query<TCustomerOperations, { customerId?: number; store_id: number; type?: 'PAID' | 'DEBT' | 'PAYMENT' | 'RETURN'; month?: number; year?: number }>({
      query: ({ customerId, store_id, type, month, year }) => {
        const params = new URLSearchParams();
        params.append('store_id', store_id.toString());
        if (type) params.append('type', type);
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());
        
        const queryString = params.toString();
        const basePath = customerId ? `/customers/${customerId}/operations` : '/customers/operations';
        return {
          url: `${basePath}${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Customers'],
    }),
    createCustomerPayment: build.mutation<TCustomerPayment & TDefaultResponse, { id: number; body: { amount: number; payment_method?: 'CASH' | 'CARD' | 'TRANSFER'; note?: string; store_id?: number } }>({
      query: ({ id, body }) => ({
        url: `/customers/${id}/payment`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customers'],
    }),
  }),
})
export const {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
  useGetOneCustomerQuery,
  useUpdateCustomerMutation,
  useUpdateBalanceCustomerMutation,
  useGetOneUserDetailQuery,
  useGetCustomerSalesQuery,
  useGetCustomerOperationsQuery,
  useCreateCustomerPaymentMutation,
} = customersApi
