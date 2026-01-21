import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { Menu } from 'lucide-react'

export const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { me } = useAuth()
  if (!me) {
    return <div />
  }

  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between">
      <button onClick={toggleSidebar} className="md:hidden text-gray-700">
        <Menu size={24} />
      </button>
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{me.name}</p>
          <p className="text-xs text-gray-600 capitalize">{me.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {me.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
