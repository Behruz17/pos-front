import { useEffect, useState } from 'react'
import { X, Package, Tag, Archive, Coins } from 'lucide-react'
import { useGetStockReceiptItemsQuery } from '@/features/receipt/api/stockReceiptItems.api'
import { Loading } from '@/shared/ui/Loading'
import { ProductImage } from '@/shared/ui/ProductImageю'


interface OperationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  operation: {
    id: number
    type: string
    date: string
    sum: number
    receipt_id?: number  // Add receipt_id field
  }
  supplierId: number
  warehouseId: number
}

export const OperationDetailsModal = ({
  isOpen,
  onClose,
  operation,
  supplierId,
  warehouseId
}: OperationDetailsModalProps) => {
  const [showAllItems, setShowAllItems] = useState(false)
  
  const { 
    data: receiptItems, 
    isLoading, 
    isError,
    error
  } = useGetStockReceiptItemsQuery({
    receipt_id: operation.receipt_id,  // Use receipt_id - it's required for RECEIPT operations
    supplier_id: supplierId,
    warehouse_id: warehouseId
  }, { 
    skip: !isOpen || operation.type !== 'RECEIPT' || !operation.receipt_id  // Skip if not RECEIPT or no receipt_id
  })



  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const displayedItems = showAllItems ? receiptItems : receiptItems?.slice(0, 3)
  const hasMoreItems = receiptItems && receiptItems.length > 3

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
              {operation.type === 'RECEIPT' ? 'Приход' : operation.type === 'PAYMENT' ? 'Оплата' : operation.type} •{' '}
              {new Date(operation.date).toLocaleDateString('ru-RU')}
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

          {operation.type === 'RECEIPT' ? (
            <>
              {(!operation.receipt_id) ? (
                <div className="text-center py-10 text-red-500">
                  Ошибка: Отсутствует ID чека для операции получения
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-10">
                  <Loading text="деталей операции" />
                </div>
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  Ошибка загрузки деталей: {(error as any)?.data?.message || 'Неизвестная ошибка'}
                </div>
              ) : receiptItems && receiptItems.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Package size={16} />
                        <span className="text-sm">Всего товаров</span>
                      </div>
                      <div className="text-2xl font-semibold text-slate-800">
                        {receiptItems.length}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Archive size={16} />
                        <span className="text-sm">Общее количество</span>
                      </div>
                      <div className="text-2xl font-semibold text-slate-800">
                        {receiptItems.reduce((sum, item) => sum + (item.total_pieces || 0), 0)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Coins size={16} />
                        <span className="text-sm">Общая сумма</span>
                      </div>
                      <div className="text-2xl font-semibold text-slate-800">
                        {operation.sum.toLocaleString()} с
                      </div>
                    </div>
                  </div>

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
                                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                    <Tag size={14} />
                                    <span>{item.product_code}</span>
                                  </div>
                                  {item.manufacturer && (
                                    <div className="text-sm text-slate-500 mt-1">
                                      Производитель: {item.manufacturer}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-slate-800">
                                    {(item.amount || 0).toLocaleString()} с
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {(item.purchase_cost || 0).toLocaleString()} с/шт
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
                                <div>
                                  <div className="text-xs text-slate-500">Упаковок</div>
                                  <div className="font-medium text-slate-800">
                                    {item.boxes_qty || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">Штук в упаковке</div>
                                  <div className="font-medium text-slate-800">
                                    {item.pieces_per_box || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">Рассыпных</div>
                                  <div className="font-medium text-slate-800">
                                    {item.loose_pieces || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">Всего штук</div>
                                  <div className="font-medium text-slate-800">
                                    {item.total_pieces || 0}
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
                          {showAllItems ? 'Показать меньше' : `Показать все ${receiptItems.length} товаров`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  Нет данных о товарах для этой операции
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-lg font-medium text-slate-800 mb-2">
                Операция #{operation.id}
              </div>
              <div className="text-slate-600">
                Тип: {operation.type === 'PAYMENT' ? 'Оплата' : operation.type}
              </div>
              <div className="text-slate-600 mt-1">
                Дата: {new Date(operation.date).toLocaleDateString('ru-RU')}
              </div>
              <div className="text-slate-600 mt-1">
                Сумма: {operation.sum.toLocaleString()} с
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