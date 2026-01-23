import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TStore, TCreateStore, TUpdateStore, TStoreWithCustomers } from '../model/stores.types'

const storesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStores: build.query<TStore[], void>({
      query: () => ({
        url: '/stores',
        method: 'GET',
      }),
      providesTags: ['Stores'],
    }),
    createStore: build.mutation<TStore & TDefaultResponse, TCreateStore>({
      query: (body) => ({
        url: '/stores',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stores'],
    }),
    updateStore: build.mutation<TStore & TDefaultResponse, { id: number; body: TUpdateStore }>({
      query: ({ id, body }) => ({
        url: `/stores/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Stores'],
    }),
    deleteStore: build.mutation<TDefaultResponse, number>({
      query: (id) => ({
        url: `/stores/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stores'],
    }),
    getStoreCustomers: build.query<TStoreWithCustomers, number>({
      query: (storeId) => ({
        url: `/stores/${storeId}/customers`,
        method: 'GET',
      }),
      providesTags: ['Stores'],
    }),
  }),
})

export const { 
  useGetStoresQuery, 
  useCreateStoreMutation, 
  useUpdateStoreMutation, 
  useDeleteStoreMutation,
  useGetStoreCustomersQuery
} = storesApi
