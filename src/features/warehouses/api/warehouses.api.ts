import { baseApi } from '@/shared/request/baseApi'
import type {
  TGetWarehousesProductDetail,
  TGetWarehousesProducts,
  TGetWarehousesProductsCredentials,
  TGetWarehousesSuppliers,
  TMutateWarehouse,
  TPostWarehouseSuccess,
  TWarehouse,
} from '../model/warehouses.types'
import { warehouseProductsDetailSchema, warehouseProductsSchema, warehouseSchema, warehouseSuppliersSchema } from '../model/warehouses.schemas'
import type { TDefaultResponse, TId } from '@/shared/types'

const warehousesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWarehouses: build.query<TWarehouse[], void>({
      query: () => ({
        url: '/warehouses',
        method: 'GET',
      }),
      transformResponse: (response) => warehouseSchema.array().parseAsync(response),
      providesTags: ['Warehouses'],
    }),
    postWarehouse: build.mutation<TPostWarehouseSuccess, TMutateWarehouse>({
      query: (data) => ({
        url: '/warehouses',
        method: 'POST',
        body: { name: data.name },
      }),
      invalidatesTags: ['Warehouses'],
    }),
    deleteWarehouse: build.mutation<TDefaultResponse, number>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Warehouses'],
    }),
    putWarehouse: build.mutation<TPostWarehouseSuccess, { id: number; data: TMutateWarehouse }>({
      query: ({ id, data }) => ({
        url: `/warehouses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouses'],
    }),
    getWarehouseProducts: build.query<TGetWarehousesProducts, TId>({
      query: (id) => ({
        url: `/warehouses/${id}/products`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => {
        try {
          const result = warehouseProductsSchema.parse(response);
          console.log('Warehouse products parsed successfully:', result);
          return result;
        } catch (error) {
          console.error('Error parsing warehouse products:', error, 'Response:', response);
          // Return a default structure instead of throwing
          return {
            warehouse: { id: 0, name: 'Unknown' },
            products: [],
          } as TGetWarehousesProducts;
        }
      },
    }),
    getWarehouseProductsDetail: build.query<TGetWarehousesProductDetail, TGetWarehousesProductsCredentials>({
      query: (data) => ({
        url: `/warehouses/${data.warehouseId}/products/${data.productId}`,
        method: 'GET',
      }),
      providesTags: ['ProductDetails'],

      transformResponse: (response: unknown) => {
        try {
          const result = warehouseProductsDetailSchema.parse(response);
          console.log('Warehouse product detail parsed successfully:', result);
          return result;
        } catch (error) {
          console.error('Error parsing warehouse product detail:', error, 'Response:', response);
          // Return a minimal default structure
          return {
            warehouse: { id: 0, name: 'Unknown' },
            product: { id: 0, image: '', name: 'Unknown', product_code: null, manufacturer: null, created_at: null },
            stock: { id: 0, total_pieces: 0, weight_kg: null, volume_cbm: null, updated_at: null },
          } as TGetWarehousesProductDetail;
        }
      },
    }),
    getWarehouseSuppliers: build.query<TGetWarehousesSuppliers, TId>({
      query: (warehouseId) => ({
        url: `/warehouses/${warehouseId}/suppliers`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => {
        try {
          const parsed = warehouseSuppliersSchema.parse(response);
          return {
            warehouse: parsed.warehouse,
            suppliers: parsed.suppliers.map(supplier => ({
              id: supplier.id,
              name: supplier.name,
              phone: supplier.phone || '', // Convert null to empty string
              balance: supplier.balance,
            }))
          };
        } catch (error) {
          console.error('Error parsing warehouse suppliers:', error, 'Response:', response);
          // Return a default structure
          return {
            warehouse: { id: 0, name: 'Unknown' },
            suppliers: []
          };
        }
      },
    }),
  }),
})
export const {
  useGetWarehousesQuery,
  usePostWarehouseMutation,
  useDeleteWarehouseMutation,
  usePutWarehouseMutation,
  useGetWarehouseProductsDetailQuery,
  useGetWarehouseProductsQuery,
  useGetWarehouseSuppliersQuery,
} = warehousesApi
