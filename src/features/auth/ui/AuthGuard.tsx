import { Navigate } from 'react-router'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import LoaderPage from '@/shared/ui/LoaderPage'
import { paths } from '@/app/routers/constants'

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, isLoading } = useAuth()

  if (isLoading) return <LoaderPage />

  if (!isAuth) {
    return <Navigate to={paths.auth()} replace />
  }

  return <>{children}</>
}
