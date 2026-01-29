import { useParams, useNavigate } from 'react-router'
import { useGetCustomerOperationsQuery } from '@/features/customers/api/customers.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { Calendar, Plus, DollarSign } from 'lucide-react'
import { CustomerSalesForm } from '@/features/sales/ui/CustomerSalesForm'
import { useState } from 'react'
import { CustomerPaymentModal } from '@/widgets/modals/CustomerPaymentModal'
import { SalesDetailModal } from '@/widgets/modals/SalesDetailModal'

export const CustomerSalesPage = () => {
  const { customerId, storeId } = useParams<{ customerId: string; storeId: string }>()
  const navigate = useNavigate()
  const [showSalesForm, setShowSalesForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<typeof sales[0] | null>(null)
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
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
                  <tr 
                    key={sale.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      if (sale.sale_id) {
                        setSelectedSaleId(sale.sale_id);
                      } else {
                        setSelectedOperation(sale);
                      }
                    }}
                  >
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
      
      {/* Operation Details Modal (for operations without sale_id) */}
      {selectedOperation && !selectedOperation.sale_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Детали операции</h2>
                <p className="text-sm text-slate-500">Полная информация об операции</p>
              </div>
              
              <button 
                onClick={() => setSelectedOperation(null)} 
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-5 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Дата</label>
                      <div className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-slate-50">
                        {new Date(selectedOperation.date).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Тип операции</label>
                      <div className={`w-full rounded-lg border px-3 py-2 font-semibold ${selectedOperation.type === 'DEBT' ? 'bg-red-50 border-red-300 text-red-700' : selectedOperation.type === 'PAYMENT' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-blue-50 border-blue-300 text-blue-700'}`}>
                        {selectedOperation.type === 'DEBT' ? 'В долг' : selectedOperation.type === 'PAYMENT' ? 'Оплата' : 'Оплачено'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Сумма</label>
                    <div className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 font-semibold text-lg">
                      {selectedOperation.sum.toLocaleString()} сомони
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Клиент</label>
                      <div className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-slate-50">
                        {selectedOperation.customer_name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Магазин</label>
                      <div className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-slate-50">
                        {selectedOperation.store_name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-slate-50">
              <button
                onClick={() => setSelectedOperation(null)}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sales Detail Modal (for operations with sale_id) */}
      <SalesDetailModal
        isOpen={!!selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
        saleId={selectedSaleId || 0}
      />
    </div>
  )
}

export default CustomerSalesPage