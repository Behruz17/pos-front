import { useParams, useNavigate } from 'react-router'
import { useGetCustomerOperationsQuery } from '@/features/customers/api/customers.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { Calendar, Plus, DollarSign } from 'lucide-react'
import { CustomerSalesForm } from '@/features/sales/ui/CustomerSalesForm'
import { useState } from 'react'
import { CustomerPaymentModal } from '@/widgets/modals/CustomerPaymentModal'

export const CustomerSalesPage = () => {
  const { customerId, storeId } = useParams<{ customerId: string; storeId: string }>()
  const navigate = useNavigate()
  const [showSalesForm, setShowSalesForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(new Date().getFullYear())
  const [selectedType, setSelectedType] = useState<'PAID' | 'DEBT' | 'PAYMENT' | undefined>(undefined)
  
  const { data, isLoading, isError } = useGetCustomerOperationsQuery({ 
    customerId: Number(customerId),
    store_id: Number(storeId),
    month: selectedMonth,
    year: selectedYear,
    type: selectedType
  })

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка покупок клиента…</div>
  }

  if (isError || !data) {
    return <div className="flex justify-center py-20 text-red-500">Ошибка загрузки данных покупок</div>
  }

  const { operations: sales } = data
  const customerName = 'customer' in data ? data.customer.full_name : 'Операции магазина'

  return (
    <div className="space-y-6">
      <ButtonBack onBack={() => navigate(-1)} />
      
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{customerName}</h1>
        <p className="text-sm text-slate-500">Операции клиента</p>
      </div>

      {/* Add Sales Form Toggle Button */}
      <div className="flex justify-end gap-3 mb-4">
        <button 
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <DollarSign size={16} />
          Оплата
        </button>
        <button 
          onClick={() => setShowSalesForm(!showSalesForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Создать продажу
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Тип операции</label>
            <select
              value={selectedType ?? ''}
              onChange={(e) => setSelectedType(e.target.value as 'PAID' | 'DEBT' | 'PAYMENT' | undefined)}
              className="border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="">Все типы</option>
              <option value="PAID">Оплачено</option>
              <option value="DEBT">В долг</option>
              <option value="PAYMENT">Оплата</option>
            </select>
          </div>
          <button 
            onClick={() => {
              setSelectedMonth(undefined);
              setSelectedYear(undefined);
              setSelectedType(undefined);
            }}
            className="mt-6 text-sm text-slate-600 hover:text-slate-800"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Total Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-blue-800">
            <span className="font-semibold">Остаток долга: </span>
            <span className="text-xl font-bold">
              {sales
                .reduce((total, operation) => {
                  if (operation.type === 'DEBT') {
                    return total + Number(operation.sum);
                  } else if (operation.type === 'PAYMENT') {
                    return total - Number(operation.sum);
                  }
                  return total;
                }, 0)
                .toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-blue-600">
            {sales.length} операций
          </div>
        </div>
      </div>

      {/* Sales Form */}
      {showSalesForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Создать продажу</h2>
            <button 
              onClick={() => setShowSalesForm(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              Закрыть
            </button>
          </div>
          <CustomerSalesForm 
            initialCustomerId={Number(customerId)} 
            initialStoreId={Number(storeId)} 
            onClose={() => setShowSalesForm(false)}
          />
        </div>
      )}

      {/* Payment Modal */}
      <CustomerPaymentModal
        customerId={Number(customerId)}
        storeId={Number(storeId)}
        customerName={customerName}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={() => {
          // Refresh the data after payment
          window.location.reload();
        }}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Список операций</h2>
        
        {sales.length === 0 ? (
          <div className="text-center py-10 text-slate-500">У клиента пока нет операций</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Сумма
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Магазин
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{sale.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(sale.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {sale.sum.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${sale.type === 'DEBT' ? 'bg-red-100 text-red-800' : sale.type === 'PAYMENT' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {sale.type === 'DEBT' ? 'В долг' : sale.type === 'PAYMENT' ? 'Оплата' : 'Оплачено'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {sale.store_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerSalesPage