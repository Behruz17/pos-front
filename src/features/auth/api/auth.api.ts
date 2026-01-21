import type {
  TGetMeDto,
  TLoginCredentials,
  TLoginSuccessResponse,
  TRegisterCredentials,
  TRegisterSuccessResponse,
  TUserId,
  TUsersSuccessResponse,
} from '../model/auth.types'
import { getMeDtoSchema, loginSuccessSchema, userSchema } from '../model/auth.schemas'
import { baseApi } from '@/shared/request/baseApi'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<TGetMeDto, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      transformResponse: (response: unknown) => getMeDtoSchema.parseAsync(response),
    }),
    login: build.mutation<TLoginSuccessResponse, TLoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: unknown) => loginSuccessSchema.parseAsync(response),
    }),
    register: build.mutation<TRegisterSuccessResponse, TRegisterCredentials>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: build.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getUsers: build.query<TUsersSuccessResponse[], void>({
      query: () => ({
        url: '/users',
        method: 'GET',
      }),
      transformResponse: (response: unknown) => userSchema.array().parseAsync(response),
    }),
    deleteUser: build.mutation<{ message: string }, TUserId>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
})
export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
} = authApi
