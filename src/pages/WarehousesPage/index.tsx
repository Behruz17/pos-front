// правка
import { useMemo, useState } from 'react'
import { Plus, Warehouse, Trash2, Search } from 'lucide-react'
import {
  useGetWarehousesQuery,
  usePostWarehouseMutation,
  useDeleteWarehouseMutation,
} from '@/features/warehouses/api/warehouses.api'
import DeleteModal from '@/widgets/modals/DeleteModal'
import { Loading } from '@/shared/ui/Loading'
import { useAuth } from '@/features/auth/hooks/auth.hooks'

const WarehousesPage = () => {
  const { data: warehouses = [], isLoading } = useGetWarehousesQuery()
  const [createWarehouse, { isLoading: isCreating }] = usePostWarehouseMutation()
  const [deleteWarehouse, { isLoading: isDeleting }] = useDeleteWarehouseMutation()
  const { isAdmin } = useAuth()
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return warehouses.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
  }, [warehouses, search])

  const onCreate = async () => {
    if (!name.trim()) return
    await createWarehouse({ name }).unwrap()
    setName('')
  }

  const onDelete = async () => {
    if (!deleteId) return
    await deleteWarehouse(deleteId).unwrap()
    setDeleteId(null)
  }

  if (isLoading) {
    return <Loading text="складов" />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Склады</h1>
          <p className="text-sm text-slate-500">Управление складскими помещениями</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по складу"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg
              border border-slate-300 text-sm
              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Добавить склад</h2>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название склада"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300
                text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={onCreate}
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                bg-blue-600 text-white text-sm font-medium
                hover:bg-blue-700 transition
                disabled:opacity-50"
            >
              <Plus size={16} />
              Добавить
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 md:hidden">
        {filtered.map((w) => (
          <div key={w.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Warehouse size={16} className="text-slate-400" />
                {w.name}
              </div>

              {isAdmin && (
                <button onClick={() => setDeleteId(w.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-500">ID: {w.id}</div>
          </div>
        ))}

        {!filtered.length && <div className="text-center text-slate-500 py-10">Склады не найдены</div>}
      </div>

      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-slate-600">ID</th>
              <th className="px-6 py-3 text-left text-slate-600">Склад</th>
              <th className="px-6 py-3 text-right text-slate-600">Действие</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-slate-500">{w.id}</td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Warehouse size={16} className="text-slate-400" />
                    {w.name}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  {/* <button onClick={() => setDeleteId(w.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button> */}
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td colSpan={3} className="py-10 text-center text-slate-500">
                  Склады не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId && <DeleteModal isLoading={isDeleting} onClose={() => setDeleteId(null)} onDelete={onDelete} />}
    </div>
  )
}

export default WarehousesPage
