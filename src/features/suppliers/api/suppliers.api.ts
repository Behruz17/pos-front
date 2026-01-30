import { baseApi } from '@/shared/request/baseApi'
import type {
  TCreateSupplierCredentials,
  TCreateSupplierSuccessResponse,
  TGetSupplierOperations,
  TSupplierDto,
  TUpdateSupplierCredentials,
  TUpdateSupplierSuccessResponse,
} from '../model/suppliers.types'
import { supplierDtoSchema, supplierOperationsSchema } from '../model/suppliers.schemas'
import type { TDefaultResponse, TId } from '@/shared/types'

const suppliersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSuppliers: build.query<TSupplierDto[], void>({
      query: () => ({
        url: '/suppliers',
        method: 'GET',
      }),
      transformResponse: (response) => supplierDtoSchema.array().parse(response),
      providesTags: ['Suppliers'],
    }),
    getOneSupplier: build.query<TSupplierDto, TId>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => supplierDtoSchema.parse(response),
    }),
    createSupplier: build.mutation<TCreateSupplierSuccessResponse, TCreateSupplierCredentials>({
      query: (data) => ({
        url: '/suppliers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    updateSupplier: build.mutation<TUpdateSupplierSuccessResponse, TUpdateSupplierCredentials>({
      query: (data) => ({
        url: `/suppliers/${data.id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    deleteSupplier: build.mutation<TDefaultResponse, TId>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Suppliers'],
    }),
    getSupplierOperations: build.query<TGetSupplierOperations, { supplierId: TId; warehouseId: TId }>({
      query: ({ supplierId, warehouseId }) => ({
        url: `/suppliers/${supplierId}/operations?warehouseId=${warehouseId}`,
        method: 'GET',
      }),
      transformResponse: (response: unknown) => {
        const parsed = supplierOperationsSchema.parse(response);
        return {
          ...parsed,
          operations: parsed.operations.map(op => ({
            ...op,
            type: op.type as 'RECEIPT' | 'PAYMENT'
          }))
        };
      },
    }),
    createSupplierPayment: build.mutation<{
      operation_id: number;
      supplier_id: number;
      amount: number;
      new_balance: number;
      message: string;
    }, { id: TId; data: { amount: number; warehouse_id?: number; note?: string } }>({
      query: ({ id, data }) => ({
        url: `/suppliers/${id}/payment`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
  }),
})

export const {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSuppliersQuery,
  useGetOneSupplierQuery,
  useUpdateSupplierMutation,
  useGetSupplierOperationsQuery,
  useCreateSupplierPaymentMutation,
} = suppliersApi