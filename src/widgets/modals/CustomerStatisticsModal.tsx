import { X, BarChart3, ShoppingCart, Wallet, Scale } from 'lucide-react'
import { useState } from 'react'
import { useGetCustomerOperationsQuery } from '@/features/customers/api/customers.api'

interface CustomerStatisticsModalProps {
  isOpen: boolean
  onClose: () => void
  storeId: number
  customerId?: number
  customerName?: string
}

export const CustomerStatisticsModal = ({ isOpen, onClose, storeId, customerId, customerName }: CustomerStatisticsModalProps) => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | undefined>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1)

  const { data, isLoading, isError } = useGetCustomerOperationsQuery(
    { store_id: storeId, customerId, year: selectedYear, month: selectedMonth },
    { skip: !isOpen }
  )

  if (!isOpen) return null

  const operations = data?.operations ?? []

  const purchaseSum = operations
    .filter((op) => op.type === 'PAID' || op.type === 'DEBT')
    .reduce((sum, op) => sum + Number(op.sum || 0), 0)

  const paymentSum = operations
    .filter((op) => op.type === 'PAID' || op.type === 'PAYMENT' || op.type === 'RETURN')
    .reduce((sum, op) => sum + Number(op.sum || 0), 0)

  const remainingSum = purchaseSum - paymentSum

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                {customerId ? 'Статистика клиента' : 'Статистика клиентов'}
              </h2>
            </div>
            {customerId && customerName && (
              <p className="text-sm text-slate-500 mt-1">{customerName}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <select
                value={selectedYear ?? ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white"
              >
                <option value="">Все годы</option>
                {Array.from({ length: 6 }, (_, i) => currentYear - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={selectedMonth ?? ''}
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white"
              >
                <option value="">Все месяцы</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <option key={month} value={month}>
                    {new Date(2023, month - 1, 1).toLocaleString('ru-RU', { month: 'long' })}
                  </option>
                ))}
              </select>
              {(selectedYear || selectedMonth) && (
                <button
                  onClick={() => { setSelectedYear(undefined); setSelectedMonth(undefined) }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin inline-block w-6 h-6 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
              <span className="ml-3 text-slate-600">Загрузка статистики...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500">Ошибка загрузки статистики</div>
          ) : operations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Нет операций за выбранный период</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Сумма покупки</p>
                    <p className="text-xl font-bold text-slate-800">
                      {purchaseSum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Сумма оплаты</p>
                    <p className="text-xl font-bold text-slate-800">
                      {paymentSum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Scale size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-red-600">Остаток</p>
                    <p className="text-xl font-bold text-slate-800">
                      {remainingSum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
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
