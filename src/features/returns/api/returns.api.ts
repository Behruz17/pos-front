import { baseApi } from '@/shared/request/baseApi'
import type { TDefaultResponse } from '@/shared/types'
import type { TReturn, TCreateReturn } from '../model/returns.types'

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
        url: '/returns',
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
  }),
})

export const { useCreateReturnMutation, useGetReturnsQuery, useGetOneDetailReturnQuery } = returnsApi
