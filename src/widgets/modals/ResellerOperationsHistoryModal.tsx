import { useState } from 'react'
import { X, History, PackagePlus, ShoppingCart, RotateCcw } from 'lucide-react'
import { useGetResellerOperationsQuery } from '@/features/resellers/api/resellers.api'
import { ResellerOperationDetailsModal } from './ResellerOperationDetailsModal'

type Props = {
  resellerId: number
  resellerName: string
  storeId: number
  onClose: () => void
}

const ResellerOperationsHistoryModal = ({ resellerId, resellerName, storeId, onClose }: Props) => {
  const [selectedOperation, setSelectedOperation] = useState<any>(null)
  
  const { data, isLoading, isError, error } = useGetResellerOperationsQuery({
    resellerId,
    store_id: storeId,
    limit: 50,
  })

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT': return <PackagePlus size={16} className="text-green-600" />
      case 'SALE': return <ShoppingCart size={16} className="text-blue-600" />
      case 'RETURN': return <RotateCcw size={16} className="text-orange-600" />
      case 'PAYMENT_FROM_RESELLER': return <ShoppingCart size={16} className="text-purple-600" />
      case 'PAYMENT_TO_RESELLER': return <PackagePlus size={16} className="text-indigo-600" />
      default: return <History size={16} className="text-gray-600" />
    }
  }

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'Приход'
      case 'SALE': return 'Продажа'
      case 'RETURN': return 'Возврат'
      case 'PAYMENT_FROM_RESELLER': return 'Оплата от реселлера'
      case 'PAYMENT_TO_RESELLER': return 'Оплата реселлеру'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <History size={20} />
              История операций
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Реселлер: {resellerName}
              {data && (
                <span className="ml-2">
                  • Баланс: <span className="font-medium">{data.reseller.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</span>
                </span>
              )}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Загрузка истории...</p>
            </div>
          )}

          {isError && (
            <div className="text-center py-8">
              <p className="text-red-600">Ошибка при загрузке истории операций</p>
              <p className="text-sm text-red-600 mt-2">
                {(error as any)?.data?.message || 'Не удалось загрузить историю операций. Попробуйте обновить страницу.'}
              </p>
            </div>
          )}

          {data && data.operations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет операций для отображения</p>
            </div>
          )}

          {data && data.operations.length > 0 && (
            <div className="space-y-3">
              {data.operations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => setSelectedOperation(operation)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                    {getOperationIcon(operation.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {getOperationTypeLabel(operation.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{operation.id}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {operation.store_name}
                    </div>
                    {operation.note && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {operation.note}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold ${
                      operation.type === 'RECEIPT' ? 'text-green-600' :
                      operation.type === 'SALE' ? 'text-blue-600' :
                      operation.type === 'RETURN' ? 'text-orange-600' :
                      operation.type === 'PAYMENT_FROM_RESELLER' ? 'text-purple-600' :
                      operation.type === 'PAYMENT_TO_RESELLER' ? 'text-indigo-600' :
                      'text-gray-600'
                    }`}>
                      {operation.type === 'SALE' || operation.type === 'PAYMENT_TO_RESELLER' ? '-' : '+'}
                      {operation.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(operation.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="w-full cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-white border text-slate-700 hover:bg-slate-100 transition"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Operation Details Modal */}
      {selectedOperation && (
        <ResellerOperationDetailsModal
          isOpen={!!selectedOperation}
          operation={selectedOperation}
          onClose={() => setSelectedOperation(null)}
        />
      )}
    </div>
  )
}

export default ResellerOperationsHistoryModal
