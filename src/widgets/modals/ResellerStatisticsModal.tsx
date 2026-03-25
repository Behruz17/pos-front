import { X, BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useGetResellerStatisticsQuery } from '@/features/resellers/api/resellers.api'

interface ResellerStatisticsModalProps {
  isOpen: boolean
  onClose: () => void
  storeId: number
}

export const ResellerStatisticsModal: React.FC<ResellerStatisticsModalProps> = ({ isOpen, onClose, storeId }) => {
  const { data: statistics, isLoading, isError } = useGetResellerStatisticsQuery({ store_id: storeId })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Статистика реселлеров</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Загрузка статистики...</div>
            </div>
          ) : isError ? (
            <div className="flex justify-center py-12">
              <div className="text-red-500">Ошибка загрузки статистики</div>
            </div>
          ) : statistics ? (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Общая сводка</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ArrowUpRight size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Общий приход</p>
                        <p className="text-xl font-bold text-slate-800">
                          {statistics.summary.total_receipts.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600">Общие продажи</p>
                        <p className="text-xl font-bold text-slate-800">
                          {statistics.summary.total_sales.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <ArrowDownRight size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600">Мои платежи реселлерам</p>
                        <p className="text-xl font-bold text-slate-800">
                          {statistics.summary.my_payments.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <ArrowUpRight size={18} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600">Платежи от реселлеров</p>
                        <p className="text-xl font-bold text-slate-800">
                          {statistics.summary.reseller_payments.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <DollarSign size={18} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-red-600">Общий баланс долгов</p>
                        <p className="text-xl font-bold text-slate-800">
                          {statistics.summary.total_debt_balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Users size={18} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-teal-600">Активные реселлеры</p>
                        <p className="text-xl font-bold text-slate-800">
                          {statistics.summary.active_resellers}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Детализация операций</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-700">Финансовые потоки</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Приход от операций:</span>
                          <span className="font-medium text-slate-800">
                            {statistics.breakdown.receipts_from_operations.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Продажи от операций:</span>
                          <span className="font-medium text-slate-800">
                            {statistics.breakdown.sales_from_operations.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Платежи реселлерам:</span>
                          <span className="font-medium text-slate-800">
                            {statistics.breakdown.payments_made_to_resellers.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Получено от реселлеров:</span>
                          <span className="font-medium text-slate-800">
                            {statistics.breakdown.payments_received_from_resellers.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                          <span className="text-sm font-medium text-slate-700">Непогашенный баланс:</span>
                          <span className="font-bold text-red-600">
                            {statistics.breakdown.outstanding_debt_balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
