import { useParams, useNavigate } from 'react-router'
import { useGetStoreCustomersQuery } from '@/features/stores/api/stores.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { paths } from '@/app/routers/constants'
import { Package, Phone, MapPin, Users, Coins, Plus, ShoppingCart, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useGetExpensesQuery, useCreateExpenseMutation } from '@/features/expenses/api/expenses.api'
import { useGetSalesQuery } from '@/features/sales/api/sales.api'
import { useGetStoreFinancialSummaryQuery } from '@/features/stores/api/stores.api'
import { toast } from 'sonner'

export const StoreCustomersPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'customers' | 'expenses' | 'sales' | 'statistics'>('customers')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(new Date().getFullYear())
  
  const { data, isLoading, isError } = useGetStoreCustomersQuery(Number(storeId))
  const { data: expenses = [], isLoading: isExpensesLoading, refetch } = useGetExpensesQuery({
    store_id: Number(storeId),
    month: selectedMonth,
    year: selectedYear,
  })
  const { data: storeSales = [], isLoading: isSalesLoading } = useGetSalesQuery({
    store_id: Number(storeId),
    month: selectedMonth,
    year: selectedYear,
  })
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation()
  
  // Fetch financial summary data
  const { data: financialSummary, isLoading: isFinancialSummaryLoading } = useGetStoreFinancialSummaryQuery({
    storeId: Number(storeId),
    month: selectedMonth,
    year: selectedYear,
  })

  if (isLoading || isExpensesLoading || isSalesLoading || isFinancialSummaryLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка данных…</div>
  }

  if (isError || !data) {
    return <div className="flex justify-center py-20 text-red-500">Ошибка загрузки данных клиентов</div>
  }

  const { store, customers } = data

  // Filter sales by store_id (already done server-side, but keeping for safety)
  // const storeSales = allSales.filter(sale => sale.store_id === Number(storeId))

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error('Пожалуйста, введите сумму');
      return;
    }
    
    try {
      await createExpense({
        amount: parseFloat(amount),
        store_id: Number(storeId),
        comment: comment || undefined,
      }).unwrap();
      
      toast.success('Расход успешно создан');
      setAmount('');
      setComment('');
      setShowExpenseForm(false);
      refetch(); // Refresh expenses list
    } catch (error) {
      toast.error('Ошибка при создании расхода');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <ButtonBack onBack={() => navigate(-1)} />
      
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{store.name}</h1>
        <p className="text-sm text-slate-500">Управление магазином</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'customers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} />
          Клиенты
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'expenses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Coins size={18} />
          Расходы
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'sales' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ShoppingCart size={18} />
          Продажи
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'statistics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart3 size={18} />
          Статистика
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {activeTab === 'customers' ? (
          customers.length === 0 ? (
            <div className="text-center py-10 text-slate-500">В этом магазине пока нет клиентов</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {customers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => storeId && navigate(paths.customerSales(customer.id.toString(), storeId))}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Package size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{customer.full_name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Phone size={14} />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{customer.city}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium ${customer.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {customer.balance.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Баланс</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-3 text-xs text-slate-500">
                    <div>
                      Регистрация: {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      Обновлено: {new Date(customer.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'expenses' ? (
          /* Expenses Tab Content */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Расходы магазина</h3>
              <button 
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                Добавить расход
              </button>
            </div>
            
            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Месяц</label>
                  <select
                    value={selectedMonth ?? ''}
                    onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все месяцы</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>
                        {new Date(2023, month - 1, 1).toLocaleString('ru-RU', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
                  <select
                    value={selectedYear ?? ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все годы</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => {
                    setSelectedMonth(undefined);
                    setSelectedYear(undefined);
                  }}
                  className="mt-6 text-sm text-slate-600 hover:text-slate-800"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
            
            {/* Total Expenses Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-blue-800">
                  <span className="font-semibold">Итого расходов: </span>
                  <span className="text-xl font-bold">
                    {expenses
                      .reduce((total, expense) => {
                        const amount = typeof expense.amount === 'number' 
                          ? expense.amount 
                          : parseFloat(String(expense.amount)) || 0;
                        return total + amount;
                      }, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-blue-600">
                  {expenses.length} операций
                </div>
              </div>
            </div>
            
            {/* Expense Creation Form */}
            {showExpenseForm && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Создать новый расход</h4>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Сумма *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Комментарий
                      </label>
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Введите комментарий"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-slate-400"
                    >
                      <Plus size={16} />
                      Создать расход
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExpenseForm(false);
                        setAmount('');
                        setComment('');
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {expenses.length === 0 ? (
              <div className="text-center py-10 text-slate-500">У этого магазина нет расходов по выбранным фильтрам</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Сумма</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {expenses
                      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
                      .slice(0, 10)
                      .map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {new Date(expense.expense_date).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {(typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(String(expense.amount)).toFixed(2))}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {expense.comment || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'statistics' ? (
          /* Statistics Tab Content */
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Статистика магазина</h3>
            
            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Месяц</label>
                  <select
                    value={selectedMonth ?? ''}
                    onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все месяцы</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>
                        {new Date(2023, month - 1, 1).toLocaleString('ru-RU', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
                  <select
                    value={selectedYear ?? ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все годы</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => {
                    setSelectedMonth(undefined);
                    setSelectedYear(undefined);
                  }}
                  className="mt-6 text-sm text-slate-600 hover:text-slate-800"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Общая сумма продаж</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {financialSummary ? financialSummary.total_sales.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Coins className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Общие расходы</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {financialSummary ? financialSummary.total_expenses.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600">Общая сумма долгов</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {financialSummary ? financialSummary.total_debts.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Sales Tab Content */
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Продажи магазина</h3>
            
            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Месяц</label>
                  <select
                    value={selectedMonth ?? ''}
                    onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все месяцы</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>
                        {new Date(2023, month - 1, 1).toLocaleString('ru-RU', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Год</label>
                  <select
                    value={selectedYear ?? ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все годы</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => {
                    setSelectedMonth(undefined);
                    setSelectedYear(undefined);
                  }}
                  className="mt-6 text-sm text-slate-600 hover:text-slate-800"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
            {/* Total Sales Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-green-800">
                  <span className="font-semibold">Итого продаж (оплачено - в долг): </span>
                  <span className="text-xl font-bold">
                    {(
                      storeSales
                        .filter(sale => sale.payment_status === 'PAID')
                        .reduce((total, sale) => total + (Number(sale.total_amount) || 0), 0) -
                      storeSales
                        .filter(sale => sale.payment_status === 'DEBT')
                        .reduce((total, sale) => total + (Number(sale.total_amount) || 0), 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-green-600">
                  {storeSales.length} операций
                </div>
              </div>
            </div>
            
            {storeSales.length === 0 ? (
              <div className="text-center py-10 text-slate-500">У этого магазина нет продаж</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Клиент</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Сумма</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Статус оплаты</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Создал</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {[...storeSales]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 10)
                      .map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {new Date(sale.created_at).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                            {sale.customer_name || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {(Number(sale.total_amount) || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${sale.payment_status === 'DEBT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {sale.payment_status === 'DEBT' ? 'В долг' : 'Оплачено'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {sale.created_by_name || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StoreCustomersPage