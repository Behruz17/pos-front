import { X, ArrowUpCircle, ArrowDownCircle, Edit2, Save, X as XIcon } from 'lucide-react'
import { useGetDeliveryOperationsQuery, useUpdateDeliveryCostMutation } from '@/features/delivery-operations/hooks/delivery-operations.hooks'
import type { DeliveryOperation } from '@/features/delivery-operations/model/delivery-operations.schemas'
import { useState } from 'react'

interface DeliveryOperationsModalProps {
  isOpen: boolean
  onClose: () => void
  driverId: number
  driverName: string
  onBalanceUpdate?: (newBalance: number) => void
}

export const DeliveryOperationsModal = ({ isOpen, onClose, driverId, driverName, onBalanceUpdate }: DeliveryOperationsModalProps) => {
  const { data: operations, isLoading, isError } = useGetDeliveryOperationsQuery({ driverId })
  const [updateDeliveryCost] = useUpdateDeliveryCostMutation()
  const [editingOperation, setEditingOperation] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ delivery_cost: '', currency: '' })

  if (!isOpen) return null

  const handleEdit = (operation: DeliveryOperation) => {
    setEditingOperation(operation.id)
    setEditForm({
      delivery_cost: operation.sum,
      currency: operation.currency || ''
    })
  }

  const handleSave = async (operation: DeliveryOperation) => {
    try {
      const result = await updateDeliveryCost({
        receiptId: operation.stock_receipt_id!,
        delivery_cost: parseFloat(editForm.delivery_cost),
        currency: editForm.currency || undefined,
        delivery_driver_id: operation.delivery_driver_id
      }).unwrap()
      
      // Call the callback with the new balance if it's provided
      if (onBalanceUpdate && result.new_balance !== undefined) {
        onBalanceUpdate(result.new_balance)
      }
      
      setEditingOperation(null)
      setEditForm({ delivery_cost: '', currency: '' })
    } catch (error) {
      console.error('Failed to update delivery cost:', error)
    }
  }

  const handleCancel = () => {
    setEditingOperation(null)
    setEditForm({ delivery_cost: '', currency: '' })
  }

  const formatCurrency = (amount: string | null, currency: string | null = null) => {
    if (!amount) return '—'
    const formattedAmount = parseFloat(amount).toFixed(2)
    if (currency) {
      return `${formattedAmount} ${currency}`
    }
    return `${formattedAmount} с`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculatePercentage = (deliveryCost: string, receiptAmount: string | null) => {
    if (!receiptAmount || !deliveryCost) return null
    const delivery = parseFloat(deliveryCost)
    const receipt = parseFloat(receiptAmount)
    if (receipt === 0) return null
    return ((delivery / receipt) * 100).toFixed(2)
  }

  const calculateAveragePercentage = () => {
    if (!operations) return null
    const receiptOperations = operations.filter((op: DeliveryOperation) => op.type === 'RECEIPT' && op.receipt_amount && op.sum)
    if (receiptOperations.length === 0) return null
    
    const percentages = receiptOperations.map((op: DeliveryOperation) => {
      const percentage = calculatePercentage(op.sum, op.receipt_amount)
      return percentage ? parseFloat(percentage) : null
    }).filter((p: number | null): p is number => p !== null)
    
    if (percentages.length === 0) return null
    const average = percentages.reduce((sum: number, p: number) => sum + p, 0) / percentages.length
    return average.toFixed(2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Операции доставщика</h2>
            <p className="text-sm text-slate-500 mt-1">{driverName}</p>
            {calculateAveragePercentage() && (
              <div className="mt-2">
                <span className="text-sm text-slate-600">Средний процент доставки: </span>
                <span className="text-sm font-semibold text-blue-600">{calculateAveragePercentage()}%</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="text-sm text-slate-500">Загрузка операций...</div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              Ошибка загрузки операций
            </div>
          ) : operations && operations.length > 0 ? (
            <div className="space-y-4">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Тип</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Дата</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Сумма</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Валюта</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Сумма прихода</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">%</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map((operation: DeliveryOperation) => (
                      <tr key={operation.id} className="border-t hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {operation.type === 'RECEIPT' ? (
                              <>
                                <ArrowUpCircle size={16} className="text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">Приход</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownCircle size={16} className="text-red-600" />
                                <span className="text-sm font-medium text-red-700">Выплата</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(operation.date)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {formatCurrency(operation.sum, operation.currency)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {operation.currency || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(operation.receipt_amount, operation.currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {operation.type === 'RECEIPT' ? (
                            calculatePercentage(operation.sum, operation.receipt_amount) ? (
                              <span className="font-medium text-blue-600">
                                {calculatePercentage(operation.sum, operation.receipt_amount)}%
                              </span>
                            ) : (
                              '—'
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {operation.type === 'RECEIPT' && operation.stock_receipt_id ? (
                            editingOperation === operation.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  value={editForm.delivery_cost}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, delivery_cost: e.target.value }))}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                  placeholder="Сумма"
                                />
                                <select
                                  value={editForm.currency}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                                  className="px-2 py-1 border border-slate-300 rounded text-sm"
                                >
                                  <option value="somoni">смн</option>
                                  <option value="yuan">¥</option>
                                  <option value="dollar">$</option>
                                </select>
                                <button
                                  onClick={() => handleSave(operation)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 transition"
                                  title="Сохранить"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="p-1 text-red-600 hover:text-red-700 transition"
                                  title="Отмена"
                                >
                                  <XIcon size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(operation)}
                                className="p-1 text-blue-600 hover:text-blue-700 transition"
                                title="Редактировать"
                              >
                                <Edit2 size={14} />
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {operations.map((operation: DeliveryOperation) => (
                  <div key={operation.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {operation.type === 'RECEIPT' ? (
                          <ArrowUpCircle size={16} className="text-emerald-600" />
                        ) : (
                          <ArrowDownCircle size={16} className="text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          operation.type === 'RECEIPT' ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {operation.type === 'RECEIPT' ? 'Приход' : 'Выплата'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-700">
                        {formatCurrency(operation.sum, operation.currency)}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(operation.date)}
                    </div>
                    {operation.receipt_amount && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500">Сумма прихода: </span>
                        <span className="font-medium text-slate-700">{formatCurrency(operation.receipt_amount, operation.currency)}</span>
                      </div>
                    )}
                    {operation.type === 'RECEIPT' && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500">% доставки: </span>
                        {calculatePercentage(operation.sum, operation.receipt_amount) ? (
                          <span className="font-medium text-blue-600">
                            {calculatePercentage(operation.sum, operation.receipt_amount)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    )}
                    {operation.type === 'RECEIPT' && operation.stock_receipt_id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        {editingOperation === operation.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">Сумма:</span>
                              <input
                                type="number"
                                value={editForm.delivery_cost}
                                onChange={(e) => setEditForm(prev => ({ ...prev, delivery_cost: e.target.value }))}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                placeholder="Сумма"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">Валюта:</span>
                              <select
                                value={editForm.currency}
                                onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                              >
                                <option value="somoni">смн</option>
                                <option value="yuan">¥</option>
                                <option value="dollar">$</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(operation)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                              >
                                <Save size={14} />
                                Сохранить
                              </button>
                              <button
                                onClick={handleCancel}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                              >
                                <XIcon size={14} />
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(operation)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:text-blue-600 hover:border-blue-300 transition"
                          >
                            <Edit2 size={14} />
                            Редактировать сумму доставки
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              У этого доставщика пока нет операций
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
