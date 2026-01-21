import { baseApi } from '@/shared/request/baseApi'
import type { TPostProductResponseSuccess, TProductDto, TPutProductCredentials } from '../model/products.types'
import { productDtoSchema } from '../model/products.schemas'
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
  }),
})

export const { useGetProductsQuery, usePostProductMutation, useDeleteProductMutation, usePutProductMutation } =
  productsApi
