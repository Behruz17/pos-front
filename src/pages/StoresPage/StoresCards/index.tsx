import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { 
  useGetStoresQuery, 
  useDeleteStoreMutation 
} from '@/features/stores/api/stores.api'
import { useState } from 'react'
import { Package, Trash2, Pencil, Plus } from 'lucide-react'
import DeleteModal from '@/widgets/modals/DeleteModal'
import { Modal } from '@/widgets/modals/Modal'
import { StoreForm } from '../StoreForm'
import { useNavigate } from 'react-router'
import { paths } from '@/app/routers/constants'

interface Store {
  id: number
  name: string
  city: string | null
  warehouse_id: number
  warehouse_name: string
}

export const StoresCards = () => {
  const { data: stores = [], isLoading } = useGetStoresQuery()
  const [deleteStore, { isLoading: deleteLoading }] = useDeleteStoreMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteStore(deleteId).unwrap()
      setDeleteId(null)
    } catch (error) {
      console.error('Failed to delete store:', error)
    }
  }

  const openCreateModal = () => {
    setEditingStore(null)
    setModalOpen(true)
  }

  const openEditModal = (store: Store) => {
    setEditingStore(store)
    setModalOpen(true)
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">Загрузка магазинов…</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Выберите магазин</h2>
          <p className="text-xs sm:text-sm text-slate-500">Список доступных магазинов</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
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
            <span className="hidden sm:inline ">Добавить магазин</span>
          </button>
        )}
      </div>

      <div
        className="
            grid gap-3 sm:gap-4 lg:gap-6
            grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
          "
      >
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => navigate(paths.storeCustomers(store.id.toString()))}
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
              <Package size={22} className="text-slate-400 group-hover:text-blue-600 transition" />
            </div>

            <div className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-slate-800">{store.name}</div>

            <div className="mt-1 text-xs text-slate-400">{store.warehouse_name}</div>
            
            {store.city && (
              <div className="mt-1 text-xs text-slate-500">{store.city}</div>
            )}

            {/* Action Icons */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal(store)
                }}
                className="
                  p-1.5 rounded-lg
                  bg-white border border-slate-200
                  text-slate-400 hover:text-blue-600 hover:border-blue-500
                  transition-all duration-200
                  opacity-0 group-hover:opacity-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteId(store.id)
                }}
                className="
                  p-1.5 rounded-lg
                  bg-white border border-slate-200
                  text-slate-400 hover:text-red-600 hover:border-red-500
                  transition-all duration-200
                  opacity-0 group-hover:opacity-100
                  focus:outline-none focus:ring-2 focus:ring-red-500
                "
              >
                <Trash2 size={14} />
              </button>
            </div>
          </button>
        ))}
      </div>
      
      {modalOpen && (
        <Modal
          title={editingStore ? 'Редактировать магазин' : 'Добавить магазин'}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditingStore(null)
          }}
        >
          <StoreForm
            store={editingStore}
            onClose={() => {
              setModalOpen(false)
              setEditingStore(null)
            }}
          />
        </Modal>
      )}
      
      {deleteId && (
        <DeleteModal 
          onClose={() => setDeleteId(null)} 
          isLoading={deleteLoading}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}