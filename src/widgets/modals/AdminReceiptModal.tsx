import { X } from 'lucide-react'

import AdminReceiptForm from '@/features/receipt/ui/AdminReceiptForm'

const AdminReceiptModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null

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
          w-full max-w-5xl
          max-h-[90vh]
          bg-white
          rounded-2xl
          border border-slate-200
          shadow-xl
          flex flex-col
        "
      >
        <div className="flex items-center justify-between px-6 py-4 ">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Оформление прихода</h2>
            <p className="text-sm text-slate-500">Добавление товаров на склад</p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        <AdminReceiptForm />
        <div className="flex justify-end gap-3 px-6 py-4 ">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100">
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminReceiptModal
