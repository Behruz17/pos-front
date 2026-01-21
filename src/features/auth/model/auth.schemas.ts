import z from 'zod'

export const getMeDtoSchema = z.object({
  id: z.number(),
  login: z.string(),

  name: z.string(),
  role: z.enum(['ADMIN', 'USER']),
})
export const userSchema = getMeDtoSchema.extend({
  created_at: z.string(),
})

export const loginSuccessSchema = z.object({
  token: z.string(),
  user: getMeDtoSchema,
})
