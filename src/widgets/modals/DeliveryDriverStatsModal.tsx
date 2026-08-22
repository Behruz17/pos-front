import { ChevronDown, X } from 'lucide-react'
import { useGetDeliveryOperationsQuery } from '@/features/delivery-operations/hooks/delivery-operations.hooks'
import type { DeliveryOperation } from '@/features/delivery-operations/model/delivery-operations.schemas'
import { calculateDeliveryStats } from '@/features/delivery-operations/lib/calculateDeliveryStats'
import { MONTH_NAMES, MONTH_SHORT_NAMES, formatDateParam } from '@/features/delivery-operations/lib/dateFilters'
import { useEffect, useMemo, useRef, useState } from 'react'

interface DeliveryDriverStatsModalProps {
  isOpen: boolean
  onClose: () => void
  driverId: number
  driverName: string
}

export const DeliveryDriverStatsModal = ({ isOpen, onClose, driverId, driverName }: DeliveryDriverStatsModalProps) => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonths, setSelectedMonths] = useState<number[]>([])
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const monthDropdownRef = useRef<HTMLDivElement>(null)

  const dateFilters = useMemo(() => {
    if (!selectedYear) return {}
    const start = new Date(selectedYear, 0, 1)
    const end = new Date(selectedYear, 11, 31)
    return { start_date: formatDateParam(start), end_date: formatDateParam(end) }
  }, [selectedYear])

  const { data: rawOperations, isLoading, isError } = useGetDeliveryOperationsQuery(
    { driverId, ...dateFilters },
    { skip: !isOpen }
  )

  const operations = useMemo(() => {
    if (!rawOperations || selectedMonths.length === 0) return rawOperations
    return rawOperations.filter((op: DeliveryOperation) => selectedMonths.includes(new Date(op.date).getMonth() + 1))
  }, [rawOperations, selectedMonths])

  const stats = useMemo(() => calculateDeliveryStats(operations), [operations])

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

  const cards: { label: string; value: string; suffix?: string; className: string }[] = [
    { label: 'Сумма прихода', value: stats.totalReceiptAmount ?? '', className: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Общая сумма', value: stats.totalSum ?? '', className: 'bg-slate-100 border-slate-200 text-slate-700' },
    { label: 'Сумма оплаты', value: stats.totalPayment ?? '', className: 'bg-red-50 border-red-200 text-red-700' },
    { label: 'Общая конв. сумма', value: stats.totalConvertedSum ?? '', className: 'bg-violet-50 border-violet-200 text-violet-700' },
    { label: 'Средний %', value: stats.averagePercentage ?? '', suffix: '%', className: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Взвешенный %', value: stats.weightedAveragePercentage ?? '', suffix: '%', className: 'bg-indigo-50 border-indigo-200 text-indigo-700' }
  ].filter((card) => card.value)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Статистика доставщика</h2>
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
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin inline-block w-6 h-6 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
              <span className="ml-3 text-slate-600">Загрузка статистики...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              Ошибка загрузки статистики
            </div>
          ) : cards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map((card) => (
                <div key={card.label} className={`border rounded-xl p-4 ${card.className}`}>
                  <div className="text-sm font-medium">{card.label}</div>
                  <div className="text-2xl font-bold mt-1">{card.value}{card.suffix ?? ''}</div>
                </div>
              ))}
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
