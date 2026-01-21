import { baseApi } from '@/shared/request/baseApi'
import type { TCreateSaleCredentials, TSale, TSaleDetail } from '../model/sales.types'
import { saleDtoSchema, saleOneDetailSchema } from '../model/sales.schemas'
import type { TId } from '@/shared/types'

const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSales: build.query<TSale[], void>({
      query: () => ({
        url: '/sales',
        method: 'GET',
      }),
      providesTags: ['Sales'],
      transformResponse: (response: unknown) => saleDtoSchema.array().parseAsync(response),
    }),
    createSale: build.mutation<void, TCreateSaleCredentials>({
      query: (data) => ({
        url: '/sales',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sales'],
    }),
    getOneDetailSale: build.query<TSaleDetail, TId>({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => saleOneDetailSchema.parseAsync(response),
    }),
  }),
})
export const { useCreateSaleMutation, useGetSalesQuery, useGetOneDetailSaleQuery } = salesApi
