import { ChevronDown, X, ArrowUpCircle, ArrowDownCircle, Edit2, Save, X as XIcon, BarChart3 } from 'lucide-react'
import { useGetDeliveryOperationsQuery, useUpdateDeliveryCostMutation } from '@/features/delivery-operations/hooks/delivery-operations.hooks'
import type { DeliveryOperation } from '@/features/delivery-operations/model/delivery-operations.schemas'
import { calculateDeliveryStats } from '@/features/delivery-operations/lib/calculateDeliveryStats'
import { MONTH_NAMES, MONTH_SHORT_NAMES, formatDateParam } from '@/features/delivery-operations/lib/dateFilters'
import { DeliveryDriverStatsModal } from '@/widgets/modals/DeliveryDriverStatsModal'
import { OperationDetailsModal } from '@/widgets/modals/OperationDetailsModal'
import { useEffect, useMemo, useRef, useState } from 'react'

interface DeliveryOperationsModalProps {
  isOpen: boolean
  onClose: () => void
  driverId: number
  driverName: string
  onBalanceUpdate?: (newBalance: number) => void
}

export const DeliveryOperationsModal = ({ isOpen, onClose, driverId, driverName, onBalanceUpdate }: DeliveryOperationsModalProps) => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonths, setSelectedMonths] = useState<number[]>([])
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<{ id: number; type: string; date: string; sum: number; receipt_id?: number } | null>(null)
  const monthDropdownRef = useRef<HTMLDivElement>(null)

  const dateFilters = useMemo(() => {
    if (!selectedYear) return {}
    const start = new Date(selectedYear, 0, 1)
    const end = new Date(selectedYear, 11, 31)
    return { start_date: formatDateParam(start), end_date: formatDateParam(end) }
  }, [selectedYear])

  const { data: rawOperations, isLoading, isError } = useGetDeliveryOperationsQuery({ driverId, ...dateFilters })
  const [updateDeliveryCost] = useUpdateDeliveryCostMutation()
  const [editingOperation, setEditingOperation] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ delivery_cost: '', currency: '', rate: '' })

  const operations = useMemo(() => {
    if (!rawOperations || selectedMonths.length === 0) return rawOperations
    return rawOperations.filter((op: DeliveryOperation) => selectedMonths.includes(new Date(op.date).getMonth() + 1))
  }, [rawOperations, selectedMonths])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleYearChange = (value: string) => {
    setSelectedYear(value ? parseInt(value) : null)
    if (!value) setSelectedMonths([])
  }

  const toggleMonth = (month: number) => {
    setSelectedMonths((prev) => prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b))
  }

  const monthDropdownLabel = selectedMonths.length === 0
    ? 'Все месяцы'
    : selectedMonths.length === 1
      ? MONTH_NAMES[selectedMonths[0] - 1]
      : `Выбрано: ${selectedMonths.length}`

  if (!isOpen) return null

  const handleEdit = (operation: DeliveryOperation) => {
    setEditingOperation(operation.id)
    setEditForm({
      delivery_cost: operation.sum,
      currency: operation.currency || '',
      rate: operation.rate?.toString() || ''
    })
  }

  const handleSave = async (operation: DeliveryOperation) => {
    try {
      const result = await updateDeliveryCost({
        receiptId: operation.stock_receipt_id!,
        delivery_cost: parseFloat(editForm.delivery_cost),
        currency: editForm.currency || undefined,
        rate: editForm.rate ? parseFloat(editForm.rate) : undefined,
        delivery_driver_id: operation.delivery_driver_id
      }).unwrap()
      
      // Call the callback with the new balance if it's provided
      if (onBalanceUpdate && result.new_balance !== undefined) {
        onBalanceUpdate(result.new_balance)
      }
      
      setEditingOperation(null)
      setEditForm({ delivery_cost: '', currency: '', rate: '' })
    } catch (error) {
      console.error('Failed to update delivery cost:', error)
    }
  }

  const handleCancel = () => {
    setEditingOperation(null)
    setEditForm({ delivery_cost: '', currency: '', rate: '' })
  }

  const handleOperationClick = (operation: DeliveryOperation) => {
    setSelectedOperation({
      id: operation.id,
      type: operation.type,
      date: operation.date,
      sum: parseFloat(operation.sum) || 0,
      receipt_id: operation.stock_receipt_id ?? undefined
    })
  }

  const formatCurrency = (amount: string | null, currency: string | null = null) => {
    if (!amount) return '—'
    const formattedAmount = parseFloat(amount).toFixed(2)
    if (currency) {
      return `${formattedAmount} ${currency}`
    }
    return `${formattedAmount}`
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

  const calculatePercentage = (deliveryCost: string, convertedSum: number | null) => {
    if (!convertedSum || !deliveryCost) return null
    const delivery = parseFloat(deliveryCost)
    const converted = parseFloat(String(convertedSum))
    if (!converted || isNaN(delivery)) return null
    return ((delivery / converted) * 100).toFixed(2)
  }

  const deliveryStats = useMemo(() => calculateDeliveryStats(operations), [operations])

  const stats: { label: string; value: string; suffix?: string; className: string }[] = [
    { label: 'Средний %', value: deliveryStats.averagePercentage ?? '', suffix: '%', className: 'bg-blue-50 text-blue-700' },
    { label: 'Взвешенный %', value: deliveryStats.weightedAveragePercentage ?? '', suffix: '%', className: 'bg-violet-50 text-violet-700' },
    { label: 'Общая сумма', value: deliveryStats.totalSum ?? '', className: 'bg-slate-100 text-slate-700' },
    { label: 'Общая конв. сумма', value: deliveryStats.totalConvertedSum ?? '', className: 'bg-violet-50 text-violet-700' }
  ].filter((stat) => stat.value)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Операции доставщика</h2>
            <p className="text-sm text-slate-500 mt-1">{driverName}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <select
                value={selectedYear ?? ''}
                onChange={(e) => handleYearChange(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white"
              >
                <option value="">Все годы</option>
                {Array.from({ length: 6 }, (_, i) => currentYear - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="relative" ref={monthDropdownRef}>
                <button
                  type="button"
                  onClick={() => selectedYear && setIsMonthDropdownOpen((v) => !v)}
                  disabled={!selectedYear}
                  className="flex items-center gap-1 px-2 py-1 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {monthDropdownLabel}
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {isMonthDropdownOpen && selectedYear && (
                  <div className="absolute z-10 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5">
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_SHORT_NAMES.map((name, i) => {
                        const month = i + 1
                        const isSelected = selectedMonths.includes(month)
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleMonth(month)}
                            className={`px-2 py-1.5 rounded-lg text-sm font-medium transition ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedMonths(MONTH_NAMES.map((_, i) => i + 1))}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Выбрать всё
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMonths([])}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Сбросить
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {(selectedYear || selectedMonths.length > 0) && (
                <button
                  onClick={() => { setSelectedYear(null); setSelectedMonths([]) }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Сбросить
                </button>
              )}
            </div>
            {stats.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${stat.className}`}
                  >
                    <span className="opacity-70 font-normal">{stat.label}:</span>
                    <span>{stat.value}{stat.suffix ?? ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
            >
              <BarChart3 size={16} />
              Статистика
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
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
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Курс</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Сумма прихода</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Конвертированная сумма</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Ср. %</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map((operation: DeliveryOperation) => (
                      <tr
                        key={operation.id}
                        className="border-t hover:bg-slate-50 transition cursor-pointer"
                        onClick={() => handleOperationClick(operation)}
                      >
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
                          {formatCurrency(operation.sum, null)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {operation.rate ? parseFloat(operation.rate).toFixed(2) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(operation.receipt_amount, null)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {operation.converted_sum ? formatCurrency(operation.converted_sum.toString(), null) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {operation.type === 'RECEIPT' ? (
                            calculatePercentage(operation.sum, operation.converted_sum) ? (
                              <span className="font-medium text-blue-600">
                                {calculatePercentage(operation.sum, operation.converted_sum)}%
                              </span>
                            ) : (
                              '—'
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                                <input
                                  type="number"
                                  value={editForm.rate}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                                  className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
                                  placeholder="Курс"
                                  step="0.01"
                                />
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
                  <div
                    key={operation.id}
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => handleOperationClick(operation)}
                  >
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
                        {formatCurrency(operation.sum, null)}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(operation.date)}
                    </div>
                    {operation.rate && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500">Курс: </span>
                        <span className="font-medium text-slate-700">{parseFloat(operation.rate).toFixed(2)}</span>
                      </div>
                    )}
                    {operation.receipt_amount && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500">Сумма прихода: </span>
                        <span className="font-medium text-slate-700">{formatCurrency(operation.receipt_amount, null)}</span>
                      </div>
                    )}
                    {operation.converted_sum && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500">Конвертированная сумма: </span>
                        <span className="font-medium text-slate-700">{formatCurrency(operation.converted_sum.toString(), null)}</span>
                      </div>
                    )}
                    {operation.type === 'RECEIPT' && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500">Ср. %: </span>
                        {calculatePercentage(operation.sum, operation.converted_sum) ? (
                          <span className="font-medium text-blue-600">
                            {calculatePercentage(operation.sum, operation.converted_sum)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    )}
                    {operation.type === 'RECEIPT' && operation.stock_receipt_id && (
                      <div className="mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
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
                              <span className="text-sm text-slate-600">Курс:</span>
                              <input
                                type="number"
                                value={editForm.rate}
                                onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                placeholder="Курс"
                                step="0.01"
                              />
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

      <DeliveryDriverStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        driverId={driverId}
        driverName={driverName}
      />

      {selectedOperation && (
        <OperationDetailsModal
          isOpen={!!selectedOperation}
          onClose={() => setSelectedOperation(null)}
          operation={selectedOperation}
          supplierId={0}
          warehouseId={0}
        />
      )}
    </div>
  )
}
