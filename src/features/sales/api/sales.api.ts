import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TSale, TCreateSale } from '../model/sales.types'

const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSales: build.query<TSale[], { store_id?: number; month?: number; year?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object') {
          if (params.store_id) searchParams.append('store_id', params.store_id.toString());
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
      providesTags: (result, error, id) => [{ type: 'Sales', id }],
    }),
    createSale: build.mutation<TSale & TDefaultResponse, TCreateSale>({
      query: (body) => ({
        url: '/sales',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sales'],
    }),
  }),
})

export const { useCreateSaleMutation, useGetSalesQuery, useGetSaleByIdQuery } = salesApi
