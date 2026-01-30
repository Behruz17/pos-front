import { baseApi } from '@/shared/request/baseApi';
import type { TDefaultResponse, TId } from '@/shared/types';
import type { TExpense, TCreateExpense, TUpdateExpense } from '../model/expenses.types';

const expensesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getExpenses: build.query<TExpense[], { month?: number; year?: number; store_id?: number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.month) queryParams.append('month', params.month.toString());
        if (params?.year) queryParams.append('year', params.year.toString());
        if (params?.store_id) queryParams.append('store_id', params.store_id.toString());
        
        return {
          url: `/expenses${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Expenses'],
    }),
    getExpenseById: build.query<TExpense, TId>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Expenses', id: id.toString() }],
    }),
    createExpense: build.mutation<TExpense & TDefaultResponse, TCreateExpense>({
      query: (body) => ({
        url: '/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses'],
    }),
    updateExpense: build.mutation<TExpense & TDefaultResponse, { id: TId; data: TUpdateExpense }>({
      query: ({ id, data }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Expenses', id: id.toString() },
        'Expenses',
      ],
    }),
    deleteExpense: build.mutation<TDefaultResponse, TId>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expenses'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;