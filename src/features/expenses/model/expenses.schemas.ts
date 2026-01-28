import { z } from 'zod';

export const expenseDtoSchema = z.object({
  id: z.number(),
  amount: z.number(),
  store_id: z.number(),
  comment: z.string().optional(),
  expense_date: z.string().datetime(),
  store_name: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createExpenseSchema = z.object({
  amount: z.number(),
  store_id: z.number(),
  comment: z.string().optional(),
  expense_date: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  amount: z.number().optional(),
  store_id: z.number().optional(),
  comment: z.string().optional(),
  expense_date: z.string().optional(),
});