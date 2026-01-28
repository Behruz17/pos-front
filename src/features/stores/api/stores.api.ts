import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TStore, TCreateStore, TUpdateStore, TStoreWithCustomers, TStoreFinancialSummary, TAllStoresFinancialSummary } from '../model/stores.types'

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
    getStoreFinancialSummary: build.query<TStoreFinancialSummary, {storeId: number, month?: number, year?: number}>({
      query: ({storeId, month, year}) => {
        let url = `/stores/${storeId}/financial-summary`;
        const params = new URLSearchParams();
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());
        if (params.toString()) url += `?${params.toString()}`;
        
        return {
          url,
          method: 'GET',
        };
      },
      providesTags: ['Stores'],
    }),
    getAllStoresFinancialSummary: build.query<TAllStoresFinancialSummary, { month?: number, year?: number }>({
      query: ({ month, year }) => {
        let url = '/stores/financial-summary';
        const params = new URLSearchParams();
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());
        if (params.toString()) url += `?${params.toString()}`;
        
        return {
          url,
          method: 'GET',
        };
      },
      providesTags: ['Stores'],
    }),
  }),
})

export const { 
  useGetStoresQuery, 
  useCreateStoreMutation, 
  useUpdateStoreMutation, 
  useDeleteStoreMutation,
  useGetStoreCustomersQuery,
  useGetStoreFinancialSummaryQuery,
  useGetAllStoresFinancialSummaryQuery
} = storesApi
