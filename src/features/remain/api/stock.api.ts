import { baseApi } from '@/shared/request/baseApi'
import type { TEditStockDto, THistoryStock, TPostMoveCredentials, TWarehouseStock } from '../model/stock.types'
import { historyStockSchema, warehouseStockSchema } from '../model/stock.schemas'
import type { TDefaultResponse } from '@/shared/types'

const stockApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWarehouseStock: build.query<TWarehouseStock, void>({
      query: () => ({
        url: '/warehouse/stock',
        method: 'GET',
      }),
      providesTags: ['WarehouseStock'],
      transformErrorResponse: (response) => warehouseStockSchema.array().parseAsync(response),
    }),
    putWarehouseStock: build.mutation<TDefaultResponse, { id: number; body: TEditStockDto }>({
      query: ({ id, body }) => ({
        url: `/warehouse/stock/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['WarehouseStock'],
    }),
    postMoveStock: build.mutation<{ message: string }, TPostMoveCredentials>({
      query: (body) => ({
        url: '/warehouse/stock/move',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WarehouseStock', 'ProductDetails'],
    }),
    getHistoryStock: build.query<THistoryStock[], void>({
      query: () => ({
        url: '/stock/history',
        method: 'GET',
      }),
      providesTags: ['WarehouseStock'],
      transformErrorResponse: (response) => historyStockSchema.array().parseAsync(response),
    }),
    getHistoryStickDetail: build.query<THistoryStock, string>({
      query: (id) => ({
        url: `/stock/history/${id}`,
        method: 'GET',
      }),
      providesTags: ['WarehouseStock'],
      transformErrorResponse: (response) => historyStockSchema.array().parseAsync(response),
    }),
  }),
})

export const {
  useGetWarehouseStockQuery,
  usePutWarehouseStockMutation,
  usePostMoveStockMutation,
  useGetHistoryStockQuery,
  useGetHistoryStickDetailQuery,
} = stockApi
