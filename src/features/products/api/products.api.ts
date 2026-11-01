import { baseApi } from '@/shared/request/baseApi'
import type {
  TPostProductResponseSuccess,
  TProductDto,
  TPutProductCredentials,
  TMissingProduct,
  TProductStatsParams,
  TProductStatsResponse,
} from '../model/products.types'
import { productDtoSchema, missingProductSchema } from '../model/products.schemas'
import type { TDefaultResponse } from '@/shared/types'

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<TProductDto[], void>({
      query: () => ({
        url: '/products',
        method: 'GET',
      }),
      transformResponse: (response) => productDtoSchema.array().parseAsync(response),
      providesTags: ['Products'],
    }),
    postProduct: build.mutation<TPostProductResponseSuccess, FormData>({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: build.mutation<TDefaultResponse, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
    putProduct: build.mutation<TDefaultResponse, TPutProductCredentials>({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Products', 'ProductDetails'],
    }),
    patchProductCurrency: build.mutation<TDefaultResponse, { id: number; currency: string }>({
      query: ({ id, currency }) => ({
        url: `/products/${id}/currency`,
        method: 'PATCH',
        body: { currency },
      }),
      invalidatesTags: ['Products', 'ProductDetails'],
    }),
    getMissingProducts: build.query<TMissingProduct[], void>({
      query: () => ({
        url: '/products/missing',
        method: 'GET',
      }),
      transformResponse: (response) => missingProductSchema.array().parse(response),
      providesTags: ['Products'],
    }),
    getProductStatistics: build.query<TProductStatsResponse, TProductStatsParams>({
      query: (params) => ({
        url: '/products/statistics',
        method: 'GET',
        // Drop empty values so the backend treats them as "not set"
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
      }),
      providesTags: ['Products'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  usePostProductMutation,
  useDeleteProductMutation,
  usePutProductMutation,
  usePatchProductCurrencyMutation,
  useGetMissingProductsQuery,
  useGetProductStatisticsQuery,
} = productsApi
