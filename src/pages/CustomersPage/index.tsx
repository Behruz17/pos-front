import { paths } from '@/app/routers/constants'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { useDeleteCustomerMutation, useGetCustomersQuery } from '@/features/customers/api/customers.api'
import CustomerFormModal from '@/widgets/modals/CustomerFormModal'
import DeleteModal from '@/widgets/modals/DeleteModal'
import { Plus, Trash2, Pencil, User, Phone, MapPin, Wallet, Eye } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

const CustomersPage = () => {
  const { data: customers = [], isLoading } = useGetCustomersQuery()
  const [deleteCustomer, { isLoading: deleteLoading }] = useDeleteCustomerMutation()
  const { isAdmin } = useAuth()
  const [modalId, setModalId] = useState<number | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const navigate = useNavigate()
  const handleDelete = async () => {
    if (!deleteId) return
    await deleteCustomer(deleteId).unwrap()
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Клиенты</h1>
          <p className="text-sm text-slate-500">Управление клиентами и их балансами</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalId(null)}
            className="
            inline-flex items-center justify-center gap-2
            px-4 py-2 rounded-xl
            bg-blue-600 text-white text-sm font-medium
            hover:bg-blue-700 transition
          "
          >
            <Plus size={16} />
            Добавить клиента
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-slate-500">Загрузка клиентов…</div>
      ) : customers.length === 0 ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-slate-500">Клиенты пока не добавлены</div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Контакты</th>
                  <th className="px-4 py-3 font-medium">Город</th>
                  <th className="px-4 py-3 font-medium text-right">Баланс</th>
                  {isAdmin && <th className="px-4 py-3 font-medium text-right">Действия</th>}
                </tr>
              </thead>

              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <Link to={paths.customers(c.id.toString())}>{c.full_name}</Link>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>

                    <td className="px-4 py-3 text-slate-600">{c.city ?? '—'}</td>

                    <td className="px-4 py-3 text-right font-semibold">{c.balance} сомони</td>

                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => navigate(paths.customers(c.id.toString()))}
                        className="
                          inline-flex items-center justify-center
                          rounded-lg border px-2 py-2
                          text-slate-400 hover:text-blue-600 hover:border-blue-300
                        "
                        title="Посмотреть"
                      >
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setModalId(c.id)}
                            className="
                          inline-flex items-center justify-center
                          rounded-lg border px-2 py-2
                          text-slate-400 hover:text-blue-600 hover:border-blue-300
                        "
                            title="Редактировать"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="
                          inline-flex items-center justify-center
                          rounded-lg border px-2 py-2
                          text-slate-400 hover:text-red-500 hover:border-red-300
                        "
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {customers.map((c) => (
              <div key={c.id} className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Link to={paths.customers(c.id.toString())}>
                    <User size={16} className="text-slate-400" />
                    {c.full_name}
                  </Link>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    {c.phone ?? '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    {c.city ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Wallet size={14} />
                    {c.balance} сомони
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => navigate(paths.customers(c.id.toString()))}
                    className="
                          inline-flex items-center justify-center
                          rounded-lg border px-2 py-2
                          text-slate-400 hover:text-blue-600 hover:border-blue-300
                        "
                    title="Посмотреть"
                  >
                    <Eye size={16} />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setModalId(c.id)}
                        className="
                      flex-1 inline-flex items-center justify-center gap-2
                      rounded-xl border px-3 py-2
                      text-sm text-blue-600 border-blue-200
                      hover:bg-blue-50
                    "
                      >
                        <Pencil size={14} />
                        Редактировать
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="
                      inline-flex items-center justify-center
                      rounded-xl border px-3 py-2
                      text-red-600 border-red-200
                      hover:bg-red-50
                    "
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalId !== undefined && isAdmin && (
        <CustomerFormModal customerId={modalId} onClose={() => setModalId(undefined)} />
      )}

      {deleteId && isAdmin && (
        <DeleteModal isLoading={deleteLoading} onClose={() => setDeleteId(null)} onDelete={handleDelete} />
      )}
    </div>
  )
}

export default CustomersPage
