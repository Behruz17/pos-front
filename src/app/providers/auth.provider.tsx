import { useAuthInit } from '@/features/auth/hooks/auth.hooks'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useAuthInit()

  return <>{children}</>
}
