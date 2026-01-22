import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TSale, TCreateSale } from '../model/sales.types'

const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSales: build.query<TSale[], void>({
      query: () => ({
        url: '/sales',
        method: 'GET',
      }),
      providesTags: ['Sales'],
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

export const { useCreateSaleMutation, useGetSalesQuery } = salesApi
