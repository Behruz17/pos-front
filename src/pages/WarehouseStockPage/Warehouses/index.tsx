import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import CreateWarehouseModal from '@/widgets/modals/CreateWarehouse'
import { Plus, Warehouse } from 'lucide-react'
import { useState } from 'react'

export const Warehouses = ({ onSelect }: { onSelect: (id: number) => void }) => {
  const { data: warehouses = [], isLoading } = useGetWarehousesQuery()
  const [modalOpen, setModalOpen] = useState(false)
  const { isAdmin } = useAuth()
  if (isLoading) {
    return <div className="text-sm text-slate-500">Загрузка складов…</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Выберите склад</h2>
          <p className="text-xs sm:text-sm text-slate-500">Список доступных складов</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="
            cursor-pointer
        inline-flex items-center gap-1
        px-3 py-2  
        rounded-xl
        border border-slate-300
        bg-white
        text-sm font-medium text-slate-700
        hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition
      "
          >
            <Plus size={16} />
            <span className="hidden sm:inline ">Добавить склад</span>
          </button>
        )}
      </div>

      <div
        className="
            grid gap-3 sm:gap-4 lg:gap-6
            grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
          "
      >
        {warehouses.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className="
                cursor-pointer
                group relative rounded-xl sm:rounded-2xl
                border border-slate-200 bg-white
                p-4 sm:p-5
                text-left transition
  
                hover:border-blue-500 hover:shadow-md
                active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
          >
            <div
              className="
                  inline-flex items-center justify-center
                  w-10 h-10 sm:w-12 sm:h-12
                  rounded-lg bg-slate-100
                  group-hover:bg-blue-50 transition
                "
            >
              <Warehouse size={22} className="text-slate-400 group-hover:text-blue-600 transition" />
            </div>

            <div className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-slate-800">{w.name}</div>

            <div className="mt-1 text-xs text-slate-400">Нажмите для просмотра</div>
          </button>
        ))}
      </div>
      {modalOpen && <CreateWarehouseModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}
