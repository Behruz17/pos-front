import { baseApi } from '@/shared/request/baseApi'
import type { TReturnCreateCredentials, TReturnDto, TReturnOneDetail } from '../model/returns.types'
import { returnDtoSchema, returnOneDetailSchema } from '../model/returns.schemas'

const returnsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReturns: build.query<TReturnDto[], void>({
      query: () => ({
        url: '/returns',
        method: 'GET',
      }),
      providesTags: ['Returns'],
      transformErrorResponse: (response: unknown) => returnDtoSchema.array().parseAsync(response),
    }),
    createReturn: build.mutation<void, TReturnCreateCredentials>({
      query: (data) => ({
        url: '/returns',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Returns'],
    }),
    getOneDetailReturn: build.query<TReturnOneDetail, number>({
      query: (id) => ({
        url: `/returns/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => returnOneDetailSchema.parseAsync(response),
    }),
  }),
})
export const { useCreateReturnMutation, useGetReturnsQuery, useGetOneDetailReturnQuery } = returnsApi
