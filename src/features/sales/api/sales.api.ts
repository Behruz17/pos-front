import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TSale, TCreateSale, TRetailDebtor, TRetailDebtorPayment, TRetailDebtorOperation, TRetailDebtorDetail } from '../model/sales.types'

const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSales: build.query<TSale[], { store_id?: number; day?: number; month?: number; year?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.store_id) searchParams.append('store_id', params.store_id.toString());
          if (params.day) searchParams.append('day', params.day.toString());
          if (params.month) searchParams.append('month', params.month.toString());
          if (params.year) searchParams.append('year', params.year.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/sales${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Sales'],
    }),
    getSaleById: build.query<TSale, number>({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Sales', id }],
    }),
    createSale: build.mutation<TSale & TDefaultResponse, TCreateSale>({
      query: (body) => ({
        url: '/sales',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sales'],
    }),
    getRetailDebtors: build.query<TRetailDebtor[], void>({
      query: () => ({
        url: '/retail-debtors',
        method: 'GET',
      }),
      providesTags: ['RetailDebtors'],
    }),
    createRetailDebtorPayment: build.mutation<TRetailDebtorPayment, { id: number; amount: number; description?: string }>({
      query: ({ id, ...body }) => ({
        url: `/retail-debtors/${id}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RetailDebtors'],
    }),
    getRetailDebtorOperations: build.query<TRetailDebtorOperation[], number>({
      query: (id) => ({
        url: `/retail-debtors/${id}/operations`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'RetailDebtors', id }],
    }),
    getRetailDebtorDetail: build.query<TRetailDebtorDetail, number>({
      query: (id) => ({
        url: `/retail-debtors/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'RetailDebtors', id }],
    }),
  }),
})

export const { useCreateSaleMutation, useGetSalesQuery, useGetSaleByIdQuery, useGetRetailDebtorsQuery, useCreateRetailDebtorPaymentMutation, useGetRetailDebtorOperationsQuery, useGetRetailDebtorDetailQuery } = salesApi
