import { baseApi } from '@/shared/request/baseApi'
import type { TCreateReceipt, TOneReceiptGto, TReceiptGto } from '../model/receipt.types'
import { oneReceiptGtoSchema, receiptGtoSchema } from '../model/receipt.schemas'
import type { TDefaultResponse } from '@/shared/types'

const receiptApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    postReceipt: build.mutation<TDefaultResponse, TCreateReceipt>({
      query: (body) => ({
        url: '/inventory/receipt',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Receipts', 'WarehouseStock'],
    }),
    getReceipts: build.query<TReceiptGto[], void>({
      query: () => ({
        url: '/inventory/receipts',
        method: 'GET',
      }),
      transformResponse: (response) => receiptGtoSchema.array().parseAsync(response),
      providesTags: ['Receipts'],
    }),
    getOneReceipt: build.query<TOneReceiptGto, string>({
      query: (id) => ({
        url: `/inventory/receipt/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => oneReceiptGtoSchema.parseAsync(response),
    }),
  }),
})

export const { usePostReceiptMutation, useGetReceiptsQuery, useGetOneReceiptQuery } = receiptApi
