import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { 
  useCreateStoreMutation, 
  useUpdateStoreMutation 
} from '@/features/stores/api/stores.api'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'

interface Store {
  id: number
  name: string
  city: string | null
  warehouse_id: number
  warehouse_name: string
}

interface StoreFormProps {
  store?: Store | null
  onClose: () => void
}

export const StoreForm = ({ store, onClose }: StoreFormProps) => {
  const { data: warehouses = [] } = useGetWarehousesQuery()
  const [name, setName] = useState(store?.name || '')
  const [city, setCity] = useState(store?.city || '')
  const [warehouseId, setWarehouseId] = useState(store?.warehouse_id.toString() || '')
  const [createStore] = useCreateStoreMutation()
  const [updateStore] = useUpdateStoreMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (store) {
        // Update existing store
        await updateStore({
          id: store.id,
          body: {
            name,
            city: city || undefined,
            warehouse_id: Number(warehouseId),
          },
        }).unwrap()
      } else {
        // Create new store
        await createStore({
          name,
          city: city || undefined,
          warehouse_id: Number(warehouseId),
        }).unwrap()
      }
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Название магазина *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Город</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Склад *</label>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Выберите склад</option>
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
          Отмена
        </button>
        <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
          <PackagePlus size={16} />
          {store ? 'Сохранить изменения' : 'Создать магазин'}
        </button>
      </div>
    </form>
  )
}