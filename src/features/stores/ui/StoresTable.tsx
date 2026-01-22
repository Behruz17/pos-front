import {
  useGetStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} from '../api/stores.api'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import { useState } from 'react'
import { Edit3, Trash2, Plus, PackagePlus } from 'lucide-react'
import { Modal } from '@/widgets/modals/Modal'
// import { toast } from 'sonner'

interface Store {
  id: number
  name: string
  city: string | null
  warehouse_id: number
  warehouse_name: string
}

export const StoresTable = () => {
  const { data: stores = [], isLoading, isError } = useGetStoresQuery()
  const { data: warehouses = [] } = useGetWarehousesQuery()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [deleteStore] = useDeleteStoreMutation()

  if (isLoading) return <div>Загрузка...</div>
  if (isError) return <div>Ошибка загрузки данных</div>

  const openCreateModal = () => {
    setEditingStore(null)
    setShowCreateModal(true)
  }

  const openEditModal = (store: Store) => {
    setEditingStore(store)
    setShowCreateModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот магазин?')) {
      try {
        await deleteStore(id).unwrap()
        // toast.success("Магазин успешно удален")
      } catch (error) {
        // toast.error("Ошибка при удалении магазина")
        console.error(error)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Управление магазинами</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Добавить магазин
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Название</th>
              <th className="py-3 px-4 text-left">Город</th>
              <th className="py-3 px-4 text-left">Склад</th>
              <th className="py-3 px-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{store.id}</td>
                <td className="py-3 px-4">{store.name}</td>
                <td className="py-3 px-4">{store.city || '-'}</td>
                <td className="py-3 px-4">{store.warehouse_name}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(store)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                      title="Редактировать"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editingStore) && (
        <Modal
          title={editingStore ? 'Редактировать магазин' : 'Добавить магазин'}
          open={showCreateModal || !!editingStore}
          onClose={() => {
            setShowCreateModal(false)
            setEditingStore(null)
          }}
        >
          <StoreForm
            store={editingStore}
            warehouses={warehouses}
            onClose={() => {
              setShowCreateModal(false)
              setEditingStore(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

interface StoreFormProps {
  store?: Store | null
  warehouses: { id: number; name: string }[]
  onClose: () => void
}

const StoreForm = ({ store, warehouses, onClose }: StoreFormProps) => {
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
        // toast.success("Магазин успешно обновлен")
      } else {
        // Create new store
        await createStore({
          name,
          city: city || undefined,
          warehouse_id: Number(warehouseId),
        }).unwrap()
        // toast.success("Магазин успешно создан")
      }
      onClose()
    } catch (error) {
      //   toast.error(store ? "Ошибка при обновлении магазина" : "Ошибка при создании магазина")
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
