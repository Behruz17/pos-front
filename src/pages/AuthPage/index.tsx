import { useEffect, useState } from 'react'
import './index.css'
import { useLoginMutation } from '@/features/auth/api/auth.api'
import Cookie from 'js-cookie'
import { useNavigate } from 'react-router'
import { paths } from '@/app/routers/constants'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { Eye, EyeOff } from 'lucide-react'

const AuthPage = () => {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginTrigger, { isLoading }] = useLoginMutation()
  const navigate = useNavigate()
  const { isAuth } = useAuth()

  useEffect(() => {
    if (isAuth) {
      navigate(paths.home(), { replace: true })
    }
  }, [isAuth, navigate])
  const onSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const accessToken = Cookie.get('token')
    if (accessToken) return

    if (!login || !password) return
    const { token } = await loginTrigger({ login, password }).unwrap()
    Cookie.set('token', token)
    navigate(paths.home())
  }

  return (
    <div className="auth-wrapper">
      <div className="container active">
        <div className="form-box login">
          <form onSubmit={onSubmitLogin}>
            <h1>Вход</h1>

            <div className="input-box">
              <input
                type="text"
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="input-box password-box">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Входим...' : 'Войти'}
            </button>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-right">
            <h1>Войдите в систему</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
