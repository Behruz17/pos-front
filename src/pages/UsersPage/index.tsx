import { paths } from '@/app/routers/constants'
import { useGetUsersQuery, useDeleteUserMutation } from '@/features/auth/api/auth.api'
import { UserForm } from '@/features/auth/forms/UserForm'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { formatDateTime } from '@/shared/formatDateTime'
import { Loading } from '@/shared/ui/Loading'
import { Trash2, User, Shield } from 'lucide-react'
import { useNavigate } from 'react-router'

const UsersPage = () => {
  const { data: users, isLoading } = useGetUsersQuery()
  const [deleteUser] = useDeleteUserMutation()
  const navigate = useNavigate()
  const { isAdmin, me } = useAuth()

  const onDelete = async (id?: number) => {
    if (!id) return
    await deleteUser(id).unwrap()
  }

  if (!isAdmin) {
    navigate(paths.home())
  }

  if (isLoading) return <Loading text="работников" />

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Работники</h1>
      </div>

      {!users || users.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Пользователей пока нет
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">Логин</th>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Дата создания</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Действия</th>}
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-700">{u.login}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(u.created_at)}</td>

                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {u.id !== me?.id && (
                          <button
                            onClick={() => onDelete(u.id)}
                            className="inline-flex items-center text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.login}</div>
                    </div>
                  </div>

                  <RoleBadge role={u.role} />
                </div>

                <div className="text-xs text-slate-500">Создан: {formatDateTime(u.created_at)}</div>

                {isAdmin && u.id !== me?.id && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => onDelete(u.id)}
                      className="inline-flex items-center gap-1 text-red-600 text-sm"
                    >
                      <Trash2 size={14} />
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <UserForm />
    </div>
  )
}

export default UsersPage

const RoleBadge = ({ role }: { role: 'ADMIN' | 'USER' }) => {
  const map = {
    ADMIN: 'bg-purple-100 text-purple-700',
    USER: 'bg-slate-100 text-slate-700',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${map[role]}`}>
      {role === 'ADMIN' && <Shield size={12} />}
      {role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
    </span>
  )
}
