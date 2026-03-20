import {

  createApi,

  fetchBaseQuery,

  type BaseQueryFn,

  type FetchArgs,

  type FetchBaseQueryError,

} from '@reduxjs/toolkit/query/react'

import Cookie from 'js-cookie'

import { env } from '../env'

// import { errorHandler } from './errorHandler'



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

      // errorHandler(result.error)

    }

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

    'Suppliers',

    'Stores',

    'RetailDebtors',

    'Expenses',

    'MissingProducts',

    'DeliveryOperations',

  ],

  endpoints: (builder) => ({

    getDeliveryOperations: builder.query<any, { driverId: number; type?: string; start_date?: string; end_date?: string }>({

      query: ({ driverId, ...filters }) => {

        const params = new URLSearchParams()

        Object.entries(filters).forEach(([key, value]) => {

          if (value !== undefined) {

            params.append(key, value.toString())

          }

        })

        const queryString = params.toString()

        return `delivery-operations/${driverId}${queryString ? `?${queryString}` : ''}`

      },

      providesTags: ['DeliveryOperations'],

    }),

    updateDeliveryCost: builder.mutation<any, { receiptId: number; delivery_cost: number; currency?: string; delivery_driver_id: number }>({

      query: ({ receiptId, ...body }) => ({

        url: `delivery-operations/receipt/${receiptId}/delivery-cost`,

        method: 'PUT',

        body,

      }),

      invalidatesTags: ['DeliveryOperations'],

    }),

  }),

})

export const { useGetDeliveryOperationsQuery, useUpdateDeliveryCostMutation } = baseApi
