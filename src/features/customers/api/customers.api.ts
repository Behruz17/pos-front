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
} = customersApi
