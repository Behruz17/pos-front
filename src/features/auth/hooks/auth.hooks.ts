import { useGetMeQuery } from '../api/auth.api'
import Cookie from 'js-cookie'

export const useAuth = () => {
  const { data, isLoading, isError } = useGetMeQuery()

  return {
    me: data ?? null,
    isAuth: Boolean(data),
    isLoading,
    isError,
    isAdmin: data?.role === 'ADMIN',
  }
}

export const useAuthInit = () => {
  const token = Cookie.get('token')

  useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: false,
  })
}
