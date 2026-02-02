import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TReturn, TCreateReturn, TCreateRetailCashReturn, TCreateRetailDebtReturn } from '../model/returns.types'

const returnsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReturns: build.query<TReturn[], void>({
      query: () => ({
        url: '/returns',
        method: 'GET',
      }),
      providesTags: ['Returns'],
    }),
    createReturn: build.mutation<TReturn & TDefaultResponse, TCreateReturn>({
      query: (body) => ({
        url: '/returns/client',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Returns'],
    }),
    getOneDetailReturn: build.query<TReturn, number>({
      query: (id) => ({
        url: `/returns/${id}`,
        method: 'GET',
      }),
    }),
    createRetailCashReturn: build.mutation<TReturn & TDefaultResponse, TCreateRetailCashReturn>({
      query: (body) => ({
        url: '/returns/retail-cash',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Returns'],
    }),
    createRetailDebtReturn: build.mutation<TReturn & TDefaultResponse, TCreateRetailDebtReturn>({
      query: (body) => ({
        url: '/returns/retail-debt',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Returns'],
    }),
  }),
})

export const { useCreateReturnMutation, useGetReturnsQuery, useGetOneDetailReturnQuery, useCreateRetailCashReturnMutation, useCreateRetailDebtReturnMutation } = returnsApi
