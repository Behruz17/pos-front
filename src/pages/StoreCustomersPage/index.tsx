import { useParams, useNavigate } from 'react-router'
import { useGetStoreCustomersQuery } from '@/features/stores/api/stores.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { paths } from '@/app/routers/constants'
import { Package, Phone, MapPin, Users, Coins, Plus, ShoppingCart, BarChart3, Pencil, User, Wallet } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useGetExpensesQuery, useCreateExpenseMutation } from '@/features/expenses/api/expenses.api'
import { useGetSalesQuery, useGetRetailDebtorsQuery, useCreateRetailDebtorPaymentMutation, useGetRetailDebtorDetailQuery } from '@/features/sales/api/sales.api'
import { useGetStoreFinancialSummaryQuery } from '@/features/stores/api/stores.api'
import { toast } from 'sonner'
import { skipToken } from '@reduxjs/toolkit/query'
import { useCreateSaleMutation } from '@/features/sales/api/sales.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'

import { SalesDetailModal } from '@/widgets/modals/SalesDetailModal'
import { Trash2, PackagePlus, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import CustomerFormModal from '@/widgets/modals/CustomerFormModal'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import CreateRetailReturnModal from '@/widgets/modals/CreateRetailReturnModal'

export const StoreCustomersPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'customers' | 'expenses' | 'sales' | 'statistics' | 'retailDebts'>('customers')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showSalesForm, setShowSalesForm] = useState(false)
  const [showRetailReturnModal, setShowRetailReturnModal] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null)
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)

  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [selectedDay, setSelectedDay] = useState<number | undefined>(new Date().getDate())
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(new Date().getFullYear())
  const { me, isAdmin } = useAuth()

  const { data, isLoading, isError } = useGetStoreCustomersQuery(Number(storeId))
  const { data: expenses = [], isLoading: isExpensesLoading, refetch: refetchExpenses } = useGetExpensesQuery({
    store_id: Number(storeId),
    month: selectedMonth,
    year: selectedYear,
  })
  const salesQueryParams = {
    store_id: Number(storeId),
    day: selectedDay,
    month: selectedMonth,
    year: selectedYear,
  };

  const { data: storeSales = [], isLoading: isSalesLoading, refetch: refetchSales } = useGetSalesQuery(salesQueryParams)
  const { data: retailDebtors = [], isLoading: isRetailDebtorsLoading } = useGetRetailDebtorsQuery({ store_id: Number(storeId) })
  const [createRetailDebtorPayment, { isLoading: isCreatingRetailPayment }] = useCreateRetailDebtorPaymentMutation()

  // State for payment modal
  const [selectedDebtorId, setSelectedDebtorId] = useState<number | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // State for debtor details
  const [selectedDebtorDetailsId, setSelectedDebtorDetailsId] = useState<number | null>(null)
  const { data: debtorDetail, isLoading: isDebtorDetailLoading } = useGetRetailDebtorDetailQuery(selectedDebtorDetailsId || skipToken)

  // State for sale details
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation()

  // Fetch financial summary data
  const { data: financialSummary, isLoading: isFinancialSummaryLoading } = useGetStoreFinancialSummaryQuery({
    storeId: Number(storeId),
    month: selectedMonth,
    year: selectedYear,
  })

  if (isLoading || isExpensesLoading || isSalesLoading || isFinancialSummaryLoading || isRetailDebtorsLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка данных…</div>
  }

  if (isError || !data) {
    return <div className="flex justify-center py-20 text-red-500">Ошибка загрузки данных клиентов</div>
  }

  const { store, customers } = data

  // Compute sales/returns totals and counts. Treat RETURN as a payment.
  const salesCount = storeSales.filter(t => t.type === 'SALE').length
  const paymentsAndReturnsCount = storeSales.filter(t => t.type === 'PAYMENT' || t.type === 'RETURN').length

  const totalSalesSum = (
    storeSales.filter(t => t.type === 'SALE').reduce((total, t) => total + Number(t.amount || 0), 0) -
    storeSales.filter(t => t.type === 'RETURN').reduce((total, t) => total + Number(t.amount || 0), 0)
  )

  const paidSum = storeSales
    .filter(t => (t.type === 'SALE' && t.payment_status === 'PAID') || t.type === 'PAYMENT' || t.type === 'RETURN')
    .reduce((total, t) => total + Number(t.amount || 0), 0)

  const debtSum = storeSales
    .filter(t => t.type === 'SALE' && t.payment_status === 'DEBT')
    .reduce((total, t) => total + Number(t.amount || 0), 0)

  const paidCount = storeSales.filter(t => (t.type === 'SALE' && t.payment_status === 'PAID') || t.type === 'PAYMENT' || t.type === 'RETURN').length
  const debtCount = storeSales.filter(t => t.type === 'SALE' && t.payment_status === 'DEBT').length


  // Filter sales by store_id (already done server-side, but keeping for safety)
  // const storeSales = allSales.filter(sale => sale.store_id === Number(storeId))

  // Handle sales export to Excel
  const handleExportSales = () => {
    if (storeSales.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    try {
      // Prepare data for export
      const exportData = storeSales.map((sale, index) => ({
        '#': (index + 1).toString(),
        'Дата': new Date(sale.created_at).toLocaleDateString('ru-RU'),
        'Клиент': sale.customer_name || '—',
        'Сумма': Number(sale.total_amount).toFixed(2),
        'Статус оплаты': sale.payment_status === 'DEBT' ? 'В долг' : 'Оплачено',
        'Создал': sale.created_by_name || '—',
      }));

      // Add total row
      const totalSum = storeSales
        .reduce((total, sale) => total + (Number(sale.total_amount) || 0), 0);

      exportData.push({
        '#': 'ИТОГО',
        'Дата': '',
        'Клиент': '',
        'Сумма': totalSum.toFixed(2),
        'Статус оплаты': '',
        'Создал': '',
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Продажи');

      // Generate filename with timestamp
      const fileName = `sales_${store.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, fileName);

      toast.success('Файл успешно экспортирован');
    } catch (error) {
      console.error('Error exporting sales:', error);
      toast.error('Произошла ошибка при экспорте в Excel');
    }
  };

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
      refetchExpenses(); // Refresh expenses list
    } catch (error) {
      toast.error('Ошибка при создании расхода');
      console.error(error);
    }
  };

  const handleRecordPayment = async (debtorId: number) => {
    if (!paymentAmount.trim()) {
      toast.error('Пожалуйста, введите сумму оплаты');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Пожалуйста, введите корректную сумму оплаты');
      return;
    }

    try {
      await createRetailDebtorPayment({
        id: debtorId,
        amount: amount,
        description: paymentDescription || undefined,
      }).unwrap();

      toast.success('Оплата успешно записана');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentDescription('');
      setSelectedDebtorId(null);
    } catch (error) {
      toast.error('Ошибка при записи оплаты');
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
        <button
          onClick={() => setActiveTab('retailDebts')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'retailDebts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <User size={18} />
          Долги в розницу
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {activeTab === 'customers' ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Клиенты магазина</h3>
              <button
                onClick={() => setShowCreateCustomerModal(true)}
                disabled={!isAdmin && me?.store_id !== Number(storeId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isAdmin || me?.store_id === Number(storeId)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                title={!isAdmin && me?.store_id !== Number(storeId) ? 'Вы можете добавлять клиентов только в свой магазин' : ''}
              >
                <Plus size={16} />
                Добавить клиента
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-10 text-slate-500">В этом магазине пока нет клиентов</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer relative"
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

                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${Number(customer.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {Number(customer.balance).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">Баланс</div>
                        </div>

                        {/* Edit Icon - Always Visible */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustomerId(customer.id);
                          }}
                          className="
                          p-1.5 rounded-lg
                          bg-white border border-slate-200
                          text-slate-400 hover:text-blue-600 hover:border-blue-500
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          self-start mt-1
                        "
                          title="Редактировать клиента"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'expenses' ? (
          /* Expenses Tab Content */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Расходы магазина</h3>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                disabled={!isAdmin && me?.store_id !== Number(storeId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isAdmin || me?.store_id === Number(storeId)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                title={!isAdmin && me?.store_id !== Number(storeId) ? 'Вы можете добавлять расходы только в свой магазин' : ''}
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
                        return total + Number(expense.amount || 0);
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
                    {[...expenses]
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
                            {Number(expense.amount).toFixed(2)}
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
                      {financialSummary ? Number(financialSummary.total_sales).toFixed(2) : '0.00'}
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
                      {financialSummary ? Number(financialSummary.total_expenses).toFixed(2) : '0.00'}
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
                      {financialSummary ? Number(financialSummary.total_debts).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : activeTab === 'retailDebts' ? (
          /* Retail Debts Tab Content */
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Долги в розницу</h3>

            {/* Total Remaining Balance Summary */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-red-800">
                  <span className="font-semibold">Итоговый остаток всех должников: </span>
                  <span className="text-xl font-bold">
                    {retailDebtors
                      .reduce((total, debtor) => total + Number(debtor.remaining_balance || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-red-600">
                  {retailDebtors.length} должник(ов)
                </div>
              </div>
            </div>

            {retailDebtors.length === 0 ? (
              <div className="text-center py-10 text-slate-500">Нет розничных должников</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Имя клиента</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Телефон</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Общая задолженность</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Оплачено</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Остаток</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата создания</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {[...retailDebtors]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((debtor) => (
                        <tr key={debtor.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => {
                          setSelectedDebtorDetailsId(debtor.id);
                        }}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {debtor.customer_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {debtor.phone}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {Number(debtor.total_debt).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {Number(debtor.total_paid).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <span className={`px-2 py-1 rounded-full text-xs ${Number(debtor.remaining_balance) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {Number(debtor.remaining_balance).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {new Date(debtor.created_at).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click event
                                setSelectedDebtorId(debtor.id);
                                setShowPaymentModal(true);
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              disabled={isCreatingRetailPayment}
                            >
                              <Wallet size={16} />
                              Оплатить
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Sales Tab Content */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Продажи магазина</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportSales}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Download size={16} />
                  Экспорт в Excel
                </button>
                <button
                  onClick={() => setShowRetailReturnModal(true)}
                  disabled={!isAdmin && me?.store_id !== Number(storeId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isAdmin || me?.store_id === Number(storeId)
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  title={!isAdmin && me?.store_id !== Number(storeId) ? 'Вы можете создавать возвраты только в свой магазин' : ''}
                >
                  <Plus size={16} />
                  Возврат
                </button>
                <button
                  onClick={() => setShowSalesForm(!showSalesForm)}
                  disabled={!isAdmin && me?.store_id !== Number(storeId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isAdmin || me?.store_id === Number(storeId)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  title={!isAdmin && me?.store_id !== Number(storeId) ? 'Вы можете создавать продажи только в свой магазин' : ''}
                >
                  <Plus size={16} />
                  Создать продажу
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">День</label>
                  <select
                    value={selectedDay ?? ''}
                    onChange={(e) => setSelectedDay(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Все дни</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
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
                    setSelectedDay(undefined);
                    setSelectedMonth(undefined);
                    setSelectedYear(undefined);
                  }}
                  className="mt-6 text-sm text-slate-600 hover:text-slate-800"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>

            {/* Sales Form */}
            {showSalesForm && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Создать продаж</h2>
                  <button
                    onClick={() => {
                      setShowSalesForm(false);
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Закрыть
                  </button>
                </div>
                <StoreSalesForm
                  initialStoreId={Number(storeId)}
                  onClose={() => {
                    setShowSalesForm(false);
                  }}
                />
              </div>
            )}

            {/* Total Sales Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-green-800">
                  <span className="font-semibold">Итого продаж: </span>
                  <span className="text-xl font-bold">{totalSalesSum.toFixed(2)}</span>
                  <div className="text-sm mt-1">
                    <span className="text-green-600">Оплачено: {paidSum.toFixed(2)}</span>
                    <span className="mx-2 text-slate-400">|</span>
                    <span className="text-red-600">В долг: {debtSum.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-sm text-green-600">
                  {salesCount} продаж
                  <div className="text-xs text-slate-500 mt-1">
                    Оплачено: {paidCount} |
                    В долг: {debtCount} |
                    Оплат: {paymentsAndReturnsCount}
                  </div>
                </div>
              </div>
            </div>

            {storeSales.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                {selectedDay || selectedMonth || selectedYear
                  ? 'Нет продаж, соответствующих выбранным фильтрам'
                  : 'У этого магазина нет продаж'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Клиент</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Тип</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Сумма</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Склад</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Создал</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {[...storeSales]
                      .filter(transaction => transaction.type === 'SALE' || transaction.type === 'PAYMENT' || transaction.type === 'RETURN')
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 15)
                      .map((transaction) => (
                        <tr
                          key={transaction.transaction_id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            // Try to find the sale ID in different possible fields
                            const saleId = transaction.id || (transaction as any).sale_id || transaction.transaction_id;
                            if (transaction.type === 'SALE' && saleId) {
                              setSelectedSaleId(saleId);
                            }
                          }}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {new Date(transaction.created_at).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                            {transaction.customer_name || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {transaction.type === 'SALE' ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Продажа</span>
                            ) : transaction.type === 'RETURN' ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Возврат</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Оплата</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {Number(transaction.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {transaction.payment_status === 'REFUND' ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Возврат</span>
                            ) : transaction.type === 'SALE' ? (
                              <span className={`px-2 py-1 rounded-full text-xs ${transaction.payment_status === 'DEBT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {transaction.payment_status === 'DEBT' ? 'В долг' : 'Оплачено'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Оплачено</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {transaction.warehouse_name || (transaction.warehouse_id ? `Склад #${transaction.warehouse_id}` : '—')}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {transaction.created_by_name || '—'}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedDebtorId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Оплата по долгам</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                  setPaymentDescription('');
                  setSelectedDebtorId(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Сумма оплаты *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Описание
                </label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Введите описание оплаты"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleRecordPayment(selectedDebtorId)}
                  disabled={isCreatingRetailPayment}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {isCreatingRetailPayment ? 'Обработка...' : 'Записать оплату'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentDescription('');
                    setSelectedDebtorId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debtor Details Modal */}
      {selectedDebtorDetailsId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Детали должника</h3>
              <button
                onClick={() => {
                  setSelectedDebtorDetailsId(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isDebtorDetailLoading ? (
              <div className="flex justify-center py-10 text-slate-500">Загрузка информации...</div>
            ) : debtorDetail ? (
              <div className="space-y-6">
                {/* Debtor Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Общая задолженность</div>
                    <div className="text-xl font-bold text-red-600">
                      {Number(debtorDetail.total_debt).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Оплачено</div>
                    <div className="text-xl font-bold text-green-600">
                      {Number(debtorDetail.total_paid).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Остаток</div>
                    <div className={`text-xl font-bold ${Number(debtorDetail.remaining_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Number(debtorDetail.remaining_balance).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Operations History */}
                <div>
                  <h4 className="text-md font-semibold text-slate-800 mb-3">История операций</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Тип</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Сумма</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Описание</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {debtorDetail.operations.map((operation) => (
                          <tr key={operation.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <span className={`px-2 py-1 rounded-full text-xs ${operation.type === 'DEBT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {operation.type === 'DEBT' ? 'Долг' : 'Оплата'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                              {Number(operation.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                              {operation.description || '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                              {new Date(operation.created_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {debtorDetail.operations.length === 0 && (
                    <div className="text-center py-10 text-slate-500">Нет операций для этого должника</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">Ошибка загрузки информации</div>
            )}
          </div>
        </div>
      )}

      {/* Sales Detail Modal */}
      <SalesDetailModal
        isOpen={!!selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
        saleId={selectedSaleId || 0}
      />

      {/* Customer Edit Modal */}
      {editingCustomerId && (
        <CustomerFormModal
          customerId={editingCustomerId}
          storeId={Number(storeId)}
          onClose={() => {
            setEditingCustomerId(null);
            // Refresh customer data after editing
            window.location.reload();
          }}
        />
      )}

      {/* Customer Create Modal */}
      {showCreateCustomerModal && (
        <CustomerFormModal
          customerId={null}
          storeId={Number(storeId)}
          onClose={() => {
            setShowCreateCustomerModal(false);
            // Refresh customer data after creating
            window.location.reload();
          }}
        />
      )}

      <CreateRetailReturnModal
        open={showRetailReturnModal}
        onClose={() => setShowRetailReturnModal(false)}
        onSuccess={() => {
          refetchSales()
        }}
        storeId={Number(storeId)}
      />
    </div>
  )
}

// StoreSalesForm component - similar to CustomerSalesForm but with optional customer ID
interface StoreSaleItem {
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
}

const emptyItem: StoreSaleItem = {
  product_id: 0,
  product_name: '',
  product_code: null,
  quantity: 1,
  unit_price: 0,
}

interface StoreSalesFormProps {
  initialStoreId: number;
  onClose?: () => void;
}

const StoreSalesForm = ({ initialStoreId, onClose }: StoreSalesFormProps) => {
  const [payment_status, setPaymentStatus] = useState<'PAID' | 'DEBT'>('PAID')
  const [items, setItems] = useState<StoreSaleItem[]>([emptyItem])
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [createSale, { isLoading }] = useCreateSaleMutation()
  const { data: products = [] } = useGetProductsQuery()

  // Refs for keyboard navigation
  const refs = useRef<{
    productInputRef: React.MutableRefObject<HTMLInputElement | null>
    productDropdownRef: React.MutableRefObject<HTMLDivElement | null>
    quantityRef: React.MutableRefObject<HTMLInputElement | null>
    priceRef: React.MutableRefObject<HTMLInputElement | null>
    removeButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  }[]>([])

  // Initialize refs array
  useEffect(() => {
    // Make sure refs array has the same length as items array
    if (refs.current.length < items.length) {
      // Add new refs for new items
      for (let i = refs.current.length; i < items.length; i++) {
        refs.current[i] = {
          productInputRef: { current: null },
          productDropdownRef: { current: null },
          quantityRef: { current: null },
          priceRef: { current: null },
          removeButtonRef: { current: null },
        }
      }
    } else if (refs.current.length > items.length) {
      // Trim refs array if items were removed
      refs.current = refs.current.slice(0, items.length)
    }
  }, [items])

  const updateItem = (index: number, patch: Partial<StoreSaleItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        return {
          ...item,
          ...patch,
        }
      })
    )
  }

  const addItem = () => setItems((p) => [...p, emptyItem])
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const isInvalid = items.some((i) => !i.product_id || i.quantity <= 0 || i.unit_price <= 0)

  const handleSubmit = async () => {
    if (isInvalid) return

    try {
      // Validate customer fields for DEBT payments
      if (payment_status === 'DEBT') {
        if (!customerName.trim()) {
          toast.error('Пожалуйста, введите имя клиента для продажи в долг');
          return;
        }
        if (!phone.trim()) {
          toast.error('Пожалуйста, введите телефон клиента для продажи в долг');
          return;
        }
      }

      await createSale({
        store_id: initialStoreId,
        payment_status,
        customer_name: payment_status === 'DEBT' ? customerName : undefined,
        phone: payment_status === 'DEBT' ? phone : undefined,
        items: items.map((item) => {
          // Find the product to get its product_code
          const product = products.find(p => p.id === item.product_id);
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product_code: product?.product_code || '', // Include product_code in the submission
          }
        }),
      }).unwrap()

      toast.success('Продажа успешно создана')
      // Reset form
      setItems([emptyItem])
      setCustomerName('')
      setPhone('')

      // Close the form if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast.error('Ошибка при создании продажи')
      console.error(error)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldType: 'product' | 'quantity' | 'price') => {
    if (e.key === 'Tab') {
      // Allow default Tab behavior
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      if (fieldType === 'product') {
        // Move to quantity field in the same row
        refs.current[rowIndex]?.quantityRef.current?.focus()
      } else if (fieldType === 'quantity') {
        // Move to price field in the same row
        refs.current[rowIndex]?.priceRef.current?.focus()
      } else if (fieldType === 'price') {
        // Move to next row's product field or add a new row
        if (rowIndex < items.length - 1) {
          refs.current[rowIndex + 1]?.productInputRef.current?.focus()
        } else {
          // Add a new row and focus on the new row's product field
          setTimeout(() => {
            addItem()
            setTimeout(() => {
              if (refs.current[rowIndex + 1]) {
                refs.current[rowIndex + 1].productInputRef.current?.focus()
              }
            }, 0)
          }, 0)
        }
      }
    }
  }

  // Filter products based on input (search by name or code)
  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products
    const lowerSearchTerm = searchTerm.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(lowerSearchTerm) ||
      (p.product_code && p.product_code.toLowerCase().includes(lowerSearchTerm))
    )
  }

  // Handle product selection
  const handleProductSelect = (productId: number, productName: string, productCode: string | null, rowIndex: number) => {
    // Find the selected product to get its sales price
    const selectedProduct = products.find(p => p.id === productId);

    // Set the selected product with auto-populated sales price
    updateItem(rowIndex, {
      product_id: productId,
      product_name: productName,
      product_code: productCode || undefined,
      unit_price: selectedProduct ? Number(selectedProduct.selling_price) : 0
    })
    setTimeout(() => {
      refs.current[rowIndex]?.quantityRef.current?.focus()
    }, 0)
  }

  return (
    <div className="bg-gray-50 border rounded-2xl p-6 space-y-6">
      <div className="mb-4">
        <label className="text-sm font-medium">Статус оплаты</label>
        <select
          value={payment_status}
          onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'DEBT')}
          className="w-full border rounded-lg px-3 py-2.5 mt-1"
        >
          <option value="PAID">Оплачено</option>
          <option value="DEBT">В долг</option>
        </select>
      </div>

      {/* Customer fields for DEBT payments */}
      {payment_status === 'DEBT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Имя клиента *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Введите имя клиента"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Телефон клиента *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Введите телефон клиента"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 bg-gray-100 border p-3 rounded-lg font-semibold text-sm hidden lg:grid">
          <div className="col-span-3">Товар</div>
          <div className="col-span-2">Артикул</div>
          <div className="col-span-2">Количество</div>
          <div className="col-span-2">Цена за единицу</div>
          <div className="col-span-1">Сумма</div>
          <div className="col-span-2">Действия</div>
        </div>

        {items.map((item, i) => {
          const filteredProducts = getFilteredProducts(item.product_name)
          return (
            <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl relative">
              <div className="col-span-12 lg:col-span-3 relative">
                <label className="text-xs text-gray-500 lg:hidden">Товар</label>
                <input
                  ref={(el) => {
                    if (refs.current[i]) {
                      refs.current[i].productInputRef.current = el;
                    }
                  }}
                  type="text"
                  value={item.product_name}
                  onChange={(e) => updateItem(i, { product_name: e.target.value, product_id: 0, product_code: '' })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'product')}
                  placeholder="Поиск товара..."
                  className="w-full border rounded-lg px-3 py-2.5"
                />

                {/* Dropdown for product suggestions */}
                {!item.product_id && item.product_name && filteredProducts.length > 0 && (
                  <div
                    ref={(el) => {
                      if (refs.current[i]) {
                        refs.current[i].productDropdownRef.current = el;
                      }
                    }}
                    className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
                  >
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleProductSelect(product.id, product.name, product.product_code, i)}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500">Артикул: {product.product_code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-6 lg:col-span-2">
                <label className="text-xs text-gray-500 lg:hidden">Артикул</label>
                <div className="w-full border rounded-lg px-3 py-2.5 bg-gray-50">
                  {item.product_code || '—'}
                </div>
              </div>

              <div className="col-span-6 lg:col-span-2">
                <label className="text-xs text-gray-500 lg:hidden">Количество</label>
                <input
                  ref={(el) => {
                    if (refs.current[i]) {
                      refs.current[i].quantityRef.current = el;
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={item.quantity === 0 ? '' : item.quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+/, '') || '0';
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(i, { quantity: numValue });
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 'quantity')}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>

              <div className="col-span-6 lg:col-span-2">
                <label className="text-xs text-gray-500 lg:hidden">Цена за единицу</label>
                <input
                  ref={(el) => {
                    if (refs.current[i]) {
                      refs.current[i].priceRef.current = el;
                    }
                  }}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*(.[0-9]+)?"
                  value={item.unit_price === 0 ? '' : item.unit_price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '');
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(i, { unit_price: numValue });
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 'price')}
                  onFocus={() => {
                    // Add a new row when this input gets focus in the last row
                    if (i === items.length - 1) {
                      addItem();
                    }
                  }}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>

              <div className="col-span-6 lg:col-span-1 flex items-end">
                <div className="w-full text-center font-semibold py-2.5">
                  {(item.quantity * item.unit_price).toLocaleString()}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-2 flex items-end">
                {items.length > 1 && (
                  <button
                    ref={(el) => {
                      if (refs.current[i]) {
                        refs.current[i].removeButtonRef.current = el;
                      }
                    }}
                    onClick={() => removeItem(i)}
                    className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-600 rounded-lg py-2.5"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isInvalid || isLoading}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400 ml-auto"
        >
          <PackagePlus size={16} /> Создать продажу
        </button>
      </div>
    </div>
  )
};

export default StoreCustomersPage