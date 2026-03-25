import { baseApi } from '@/shared/request/baseApi'
import type {
  TCreateResellerCredentials,
  TCreateResellerSuccessResponse,
  TResellerDto,
  TUpdateResellerCredentials,
  TUpdateResellerSuccessResponse,
} from '../model/resellers.types'
import type {
  TCreateResellerOperationCredentials,
  TResellerOperationSuccessResponse,
} from '../model/resellerOperations.types'
import type {
  TCreateResellerPaymentCredentials,
  TResellerPaymentSuccessResponse,
} from '../model/resellerPayment.types'
import type {
  TGetResellerOperationsParams,
  TResellerOperationsHistoryResponse,
} from '../model/resellerOperationsHistory.types'
import { resellerDtoSchema } from '../model/resellers.schemas.js'
import type { TDefaultResponse, TId } from '@/shared/types'
import type {
  ResellerStatisticsResponse,
} from '../model/resellerStatistics.types'
import {
  resellerStatisticsResponseSchema,
} from '../model/resellerStatistics.schemas.js'

const resellersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getResellers: build.query<TResellerDto[], { store_id: number }>({
      query: ({ store_id }) => ({
        url: `/stores/${store_id}/resellers`,
        method: 'GET',
      }),
      transformResponse: (response: { resellers: TResellerDto[] }) => resellerDtoSchema.array().parseAsync(response.resellers),
      providesTags: ['Resellers'],
    }),
    getOneReseller: build.query<TResellerDto, TId>({
      query: (id) => ({
        url: `/resellers/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => resellerDtoSchema.parseAsync(response),
      providesTags: ['Resellers'],
    }),
    createReseller: build.mutation<TCreateResellerSuccessResponse, TCreateResellerCredentials>({
      query: (data) => ({
        url: '/resellers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Resellers'],
    }),
    updateReseller: build.mutation<TUpdateResellerSuccessResponse, TUpdateResellerCredentials>({
      query: (data) => ({
        url: `/resellers/${data.id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Resellers'],
    }),
    deleteReseller: build.mutation<TDefaultResponse, TId>({
      query: (id) => ({
        url: `/resellers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resellers'],
    }),
    createResellerOperation: build.mutation<TResellerOperationSuccessResponse, { resellerId: number; data: TCreateResellerOperationCredentials }>({
      query: ({ resellerId, data }) => ({
        url: `/resellers/${resellerId}/operations`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Resellers'],
    }),
    createResellerPayment: build.mutation<TResellerPaymentSuccessResponse, { resellerId: number; data: TCreateResellerPaymentCredentials }>({
      query: ({ resellerId, data }) => ({
        url: `/resellers/${resellerId}/payment`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Resellers'],
    }),
    getResellerOperations: build.query<TResellerOperationsHistoryResponse, TGetResellerOperationsParams>({
      query: ({ resellerId, type, store_id, limit }) => {
        const params = new URLSearchParams()
        if (type) params.append('type', type)
        if (store_id) params.append('store_id', store_id.toString())
        if (limit) params.append('limit', limit.toString())
        
        return {
          url: `/resellers/${resellerId}/operations?${params.toString()}`,
          method: 'GET',
        }
      },
      providesTags: ['Resellers'],
    }),
    getResellerStatistics: build.query<ResellerStatisticsResponse, { store_id: number }>({
      query: ({ store_id }) => ({
        url: `/resellers/statistics?store_id=${store_id}`,
        method: 'GET',
      }),
      transformResponse: (response) => resellerStatisticsResponseSchema.parseAsync(response),
      providesTags: ['Resellers'],
    }),
  }),
})

export const {
  useCreateResellerMutation,
  useDeleteResellerMutation,
  useGetResellersQuery,
  useGetOneResellerQuery,
  useUpdateResellerMutation,
  useCreateResellerOperationMutation,
  useCreateResellerPaymentMutation,
  useGetResellerOperationsQuery,
  useGetResellerStatisticsQuery,
} = resellersApi
