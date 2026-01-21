import { NavLink, useNavigate } from 'react-router'
import { LogOut, Package, History, ShoppingCart, Warehouse, X, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { paths } from '@/app/routers/constants'
import { useLogoutMutation } from '@/features/auth/api/auth.api'
import Cookie from 'js-cookie'
import LoaderPage from '@/shared/ui/LoaderPage'

type Props = {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const navigation = [
  {
    to: paths.home(),
    label: 'Склады',
    icon: Warehouse,
  },
  {
    to: paths.receipt(),
    label: 'Приход товара',
    icon: Package,
  },
  {
    to: paths.transaction(),
    label: 'транзакция',
    icon: ShoppingCart,
  },

  {
    to: paths.stockHistory(),
    label: 'История изменений',
    icon: History,
  },
  {
    to: paths.customers(),
    label: 'Клиенты',
    icon: History,
  },
  {
    to: paths.workers(),
    label: 'Пользователи',
    icon: Users,
  },
]

const Sidebar = ({ sidebarOpen, toggleSidebar }: Props) => {
  const { isAuth } = useAuth()
  const [logount, { isLoading }] = useLogoutMutation()
  const navigate = useNavigate()
  const handleLogout = async () => {
    await logount().unwrap()
    Cookie.remove('token')
    navigate(paths.auth(), { replace: true })
  }

  if (!isAuth) return null
  if (isLoading) return <LoaderPage />

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-50 w-64
        bg-slate-900 text-slate-100
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Package size={20} />
          </div>

          <div>
            <div className="text-sm font-semibold leading-none">Система складов</div>
            <div className="text-xs text-slate-400">управления и учёта товаров</div>
          </div>
        </div>

        <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="mt-6 space-y-1">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={toggleSidebar}
            className={({ isActive }) =>
              `
              group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              transition-all
              ${isActive ? 'bg-blue-600/15 text-blue-400' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
            `
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`
                    h-8 w-1 rounded-full transition-all
                    ${isActive ? 'bg-blue-500' : 'bg-transparent'}
                  `}
                />
                <Icon size={18} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-2 rounded-lg
            text-slate-300 hover:bg-slate-800 hover:text-white
            transition-colors
          "
        >
          <LogOut size={18} />
          <span className="text-sm">Выйти</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
