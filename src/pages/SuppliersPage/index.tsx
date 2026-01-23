import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { useDeleteSupplierMutation, useGetSuppliersQuery } from '@/features/suppliers/api/suppliers.api'
import { Plus, Trash2, Pencil, Truck, Phone, Wallet } from 'lucide-react'
import { useState } from 'react'

import CreateSupplierModal from '@/widgets/modals/CreateSupplierModal'
import DeleteModal from '@/widgets/modals/DeleteModal'

const SuppliersPage = () => {
  const { data: allSuppliers = [], isLoading, refetch, isError, error } = useGetSuppliersQuery()
  const suppliers = allSuppliers.filter(supplier => supplier.status === 1)
  const [deleteSupplier, { isLoading: deleteLoading }] = useDeleteSupplierMutation()
  const { isAdmin } = useAuth()
  const [modalId, setModalId] = useState<number | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteSupplier(deleteId).unwrap()
    setDeleteId(null)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Поставщики</h1>
          <p className="text-sm text-slate-500">Управление поставщиками и их балансами</p>
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
            Добавить поставщика
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-slate-500">Загрузка поставщиков…</div>
      ) : isError ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-red-500">
          Ошибка загрузки поставщиков: {error ? ('status' in error ? error.status : 'Network error') : 'Неизвестная ошибка'}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-slate-500">Поставщики пока не добавлены</div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">Поставщик</th>
                  <th className="px-4 py-3 font-medium">Контакты</th>
                  <th className="px-4 py-3 font-medium text-right">Баланс</th>

                  {isAdmin && <th className="px-4 py-3 font-medium text-right">Действия</th>}
                </tr>
              </thead>

              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-slate-400" />
                        {s.name}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{s.phone ?? '—'}</td>

                    <td className="px-4 py-3 text-right font-semibold">{s.balance} сомони</td>



                    <td className="px-4 py-3 text-right space-x-2">
                      {/* View button would be here if we had a detail page */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setModalId(s.id)}
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
                            onClick={() => setDeleteId(s.id)}
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
            {suppliers.map((s) => (
              <div key={s.id} className="bg-white border rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Truck size={16} className="text-slate-400" />
                  {s.name}
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    {s.phone ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Wallet size={14} />
                    {s.balance} сомони
                  </div>

                </div>

                <div className="flex gap-2 pt-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setModalId(s.id)}
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
                        onClick={() => setDeleteId(s.id)}
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
        <CreateSupplierModal 
          supplierId={modalId} 
          onClose={() => {
            setModalId(undefined)
            refetch()
          }} 
        />
      )}

      {deleteId && isAdmin && (
        <DeleteModal isLoading={deleteLoading} onClose={() => setDeleteId(null)} onDelete={handleDelete} />
      )}
    </div>
  )
}

export default SuppliersPage