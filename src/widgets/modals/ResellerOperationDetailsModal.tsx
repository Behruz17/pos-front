import { useState } from 'react'
import { X, Package, Coins, Store } from 'lucide-react'
import { ProductImage } from '@/shared/ui/ProductImageю'

interface ResellerOperationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  operation: {
    id: number
    reseller_id: number
    store_id: number
    store_name: string
    sum: number
    type: string
    note?: string
    date: string
    items?: Array<{
      id: number
      product_id: number
      product_name: string
      manufacturer?: string
      image?: string
      quantity: number
      price: number
      total: number
    }>
  }
}

export const ResellerOperationDetailsModal = ({
  isOpen,
  onClose,
  operation
}: ResellerOperationDetailsModalProps) => {
  const [showAllItems, setShowAllItems] = useState(false)

  if (!isOpen) return null

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

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'text-green-600'
      case 'SALE': return 'text-blue-600'
      case 'RETURN': return 'text-orange-600'
      case 'PAYMENT_FROM_RESELLER': return 'text-purple-600'
      case 'PAYMENT_TO_RESELLER': return 'text-indigo-600'
      default: return 'text-gray-600'
    }
  }

  const displayedItems = showAllItems ? operation.items : operation.items?.slice(0, 3)
  const hasMoreItems = operation.items && operation.items.length > 3

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Детали операции #{operation.id}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              <span className={getOperationColor(operation.type)}>
                {getOperationTypeLabel(operation.type)}
              </span>
              {' • '}
              {formatDate(operation.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Operation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Store size={16} />
                <span className="text-sm">Магазин</span>
              </div>
              <div className="text-lg font-semibold text-slate-800">
                {operation.store_name}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Coins size={16} />
                <span className="text-sm">Сумма</span>
              </div>
              <div className={`text-2xl font-semibold ${getOperationColor(operation.type)}`}>
                {(operation.type === 'SALE' || operation.type === 'PAYMENT_TO_RESELLER' ? '-' : '+')}
                {operation.sum.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Package size={16} />
                <span className="text-sm">Товаров</span>
              </div>
              <div className="text-2xl font-semibold text-slate-800">
                {operation.items?.length || 0}
              </div>
            </div>
          </div>

          {/* Note */}
          {operation.note && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Примечание</h3>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                {operation.note}
              </div>
            </div>
          )}

          {/* Items */}
          {operation.items && operation.items.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Список товаров
              </h3>
              <div className="space-y-3">
                {displayedItems?.map((item) => (
                  <div 
                    key={item.id} 
                    className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {item.image ? (
                          <ProductImage 
                            src={item.image} 
                            alt={item.product_name}
                            size={64}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package size={24} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-slate-800 truncate">
                              {item.product_name}
                            </h4>
                            {item.manufacturer && (
                              <div className="text-sm text-slate-500 mt-1">
                                Производитель: {item.manufacturer}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-slate-800">
                              {item.total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                            </div>
                            <div className="text-sm text-slate-500">
                              {item.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽/шт
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <div className="text-xs text-slate-500">Количество</div>
                            <div className="font-medium text-slate-800">
                              {item.quantity} шт
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Цена за единицу</div>
                            <div className="font-medium text-slate-800">
                              {item.price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Общая сумма</div>
                            <div className="font-medium text-slate-800">
                              {item.total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMoreItems && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {showAllItems ? 'Показать меньше' : `Показать все ${operation.items.length} товаров`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <Package size={48} className="text-slate-300 mx-auto mb-4" />
              <div className="text-lg font-medium text-slate-800 mb-2">
                Нет товаров в операции
              </div>
              <div className="text-sm text-slate-500">
                Для данной операции отсутствует список товаров
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
