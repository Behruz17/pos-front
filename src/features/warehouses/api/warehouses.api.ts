import { baseApi } from '@/shared/request/baseApi'
import type {
  TGetWarehousesProductDetail,
  TGetWarehousesProducts,
  TGetWarehousesProductsCredentials,
  TMutateWarehouse,
  TPostWarehouseSuccess,
  TWarehouse,
} from '../model/warehouses.types'
import { warehouseProductsDetailSchema, warehouseProductsSchema, warehouseSchema } from '../model/warehouses.schemas'
import type { TDefaultResponse, TId } from '@/shared/types'

const warehousesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWarehouses: build.query<TWarehouse[], void>({
      query: () => ({
        url: '/warehouses',
        method: 'GET',
      }),
      transformResponse: (response) => warehouseSchema.array().parseAsync(response),
      providesTags: ['Warehouses'],
    }),
    postWarehouse: build.mutation<TPostWarehouseSuccess, TMutateWarehouse>({
      query: (data) => ({
        url: '/warehouses',
        method: 'POST',
        body: { name: data.name },
      }),
      invalidatesTags: ['Warehouses'],
    }),
    deleteWarehouse: build.mutation<TDefaultResponse, number>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Warehouses'],
    }),
    getWarehouseProducts: build.query<TGetWarehousesProducts, TId>({
      query: (id) => ({
        url: `/warehouses/${id}/products`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => warehouseProductsSchema.parseAsync(response),
    }),
    getWarehouseProductsDetail: build.query<TGetWarehousesProductDetail, TGetWarehousesProductsCredentials>({
      query: (data) => ({
        url: `/warehouses/${data.warehouseId}/products/${data.productId}`,
        method: 'GET',
      }),
      providesTags: ['ProductDetails'],

      transformResponse: (response: unknown) => warehouseProductsDetailSchema.parseAsync(response),
    }),
  }),
})
export const {
  useGetWarehousesQuery,
  usePostWarehouseMutation,
  useDeleteWarehouseMutation,
  useGetWarehouseProductsDetailQuery,
  useGetWarehouseProductsQuery,
} = warehousesApi
