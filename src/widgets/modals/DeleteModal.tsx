const DeleteModal = ({
  onClose,
  isLoading,
  onDelete,
}: {
  onClose: () => void
  isLoading: boolean
  onDelete: () => Promise<void>
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800">Удалить?</h3>

        <div className="flex gap-3">
          <button
            disabled={isLoading}
            onClick={onDelete}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
          >
            Удалить
          </button>
          <button onClick={() => onClose()} className="flex-1 bg-slate-200 py-2 rounded-lg hover:bg-slate-300">
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
