import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { usePostWarehouseMutation } from '@/features/warehouses/api/warehouses.api'

const CreateWarehouseModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('')
  const [createWarehouse, { isLoading }] = usePostWarehouseMutation()

  const onCreate = async () => {
    if (!name.trim()) return

    await createWarehouse({ name }).unwrap()
    onClose()
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 backdrop-blur-sm
      "
      style={{
        overflow: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-md
          bg-white
          rounded-2xl
          border border-slate-200
          shadow-xl
          p-6
          animate-in fade-in zoom-in
        "
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Добавить склад</h2>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Название склада</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Основной склад"
              className="
                w-full px-4 py-2.5
                rounded-xl
                border border-slate-300
                text-sm
                focus:ring-2 focus:ring-blue-500
                focus:border-transparent
              "
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="
              px-4 py-2
              rounded-xl
              text-sm font-medium
              text-slate-600
              hover:bg-slate-100
              transition
            "
          >
            Отмена
          </button>

          <button
            onClick={onCreate}
            disabled={isLoading || !name.trim()}
            className="
              inline-flex items-center gap-2
              px-5 py-2
              rounded-xl
              bg-blue-600
              text-white
              text-sm font-medium
              hover:bg-blue-700
              disabled:bg-slate-200
              disabled:text-slate-400
              transition
            "
          >
            <Plus size={16} />
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateWarehouseModal
