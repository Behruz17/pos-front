import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import Cookie from 'js-cookie'
import { env } from '../env'
import { errorHandler } from './errorHandler'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.VITE_BASE_SERVER_URL,

  prepareHeaders(headers) {
    headers.set('Content-Type', 'application/json')

    const token = Cookie.get('token')

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error) {
    if (result.error.status === 401) {
      Cookie.remove('token')
    }

    errorHandler(result.error)
  }

  return result
}

export const baseApi = createApi({
  baseQuery: baseQueryWithAuth,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  tagTypes: [
    'Warehouses',
    'WarehouseStock',
    'Products',
    'Customers',
    'Receipts',
    'Sales',
    'HistoryStock',
    'Returns',
    'ProductDetails',
  ],
  endpoints: () => ({}),
})
