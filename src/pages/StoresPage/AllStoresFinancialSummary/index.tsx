import { useState } from 'react'
import { useGetAllStoresFinancialSummaryQuery } from '@/features/stores/api/stores.api'
import { formatCurrency } from '@/shared/formatDateTime'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const AllStoresFinancialSummary = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>()
  const [selectedYear, setSelectedYear] = useState<number>()
  
  const { data, isLoading, isError } = useGetAllStoresFinancialSummaryQuery({
    month: selectedMonth,
    year: selectedYear
  })

  const months = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const calculateProfit = (sales: number, debts: number, expenses: number) => {
    return sales - debts - expenses
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-slate-500">Не удалось загрузить финансовую сводку</div>
        </div>
      </div>
    )
  }

  const totalSales = data.stores.reduce((sum, store) => sum + store.total_sales, 0)
  const totalDebts = data.stores.reduce((sum, store) => sum + store.total_debts, 0)
  const totalExpenses = data.stores.reduce((sum, store) => sum + store.total_expenses, 0)
  const totalProfit = calculateProfit(totalSales, totalDebts, totalExpenses)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Месяц</label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все месяцы</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все годы</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          {(selectedMonth || selectedYear) && (
            <button
              onClick={() => {
                setSelectedMonth(undefined)
                setSelectedYear(undefined)
              }}
              className="self-end text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Общие продажи</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(totalSales)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Общие долги</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(totalDebts)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="text-red-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Общие расходы</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Minus className="text-orange-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Финансовая сводка по магазинам
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Всего магазинов: {data.total_stores}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Магазин
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Продажи
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Долги
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Расходы
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Прибыль
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.stores.map((store) => {
                const profit = calculateProfit(store.total_sales, store.total_debts, store.total_expenses)
                return (
                  <tr key={store.store_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{store.store_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-green-600 font-medium">
                        {formatCurrency(store.total_sales)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-red-600 font-medium">
                        {formatCurrency(store.total_debts)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-orange-600 font-medium">
                        {formatCurrency(store.total_expenses)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`font-semibold ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(profit)}
                      </div>
                    </td>
                  </tr>
                )
              })}
              
              {/* Total Row */}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-slate-800">ИТОГО</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-green-600">
                    {formatCurrency(totalSales)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-red-600">
                    {formatCurrency(totalDebts)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-orange-600">
                    {formatCurrency(totalExpenses)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(totalProfit)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}