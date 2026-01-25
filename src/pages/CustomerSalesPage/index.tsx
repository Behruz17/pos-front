import { useParams, useNavigate } from 'react-router'
import { useGetCustomerSalesQuery } from '@/features/customers/api/customers.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { CreditCard, Store, Package, User, Calendar, UserRound, Building } from 'lucide-react'
import { CustomerSalesForm } from '@/features/sales/ui/CustomerSalesForm'

export const CustomerSalesPage = () => {
  const { customerId, storeId } = useParams<{ customerId: string; storeId: string }>()
  const navigate = useNavigate()
  
  const { data, isLoading, isError } = useGetCustomerSalesQuery({ 
    customerId: Number(customerId), 
    storeId: Number(storeId) 
  })

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка покупок клиента…</div>
  }

  if (isError || !data) {
    return <div className="flex justify-center py-20 text-red-500">Ошибка загрузки данных покупок</div>
  }

  const { customer, store, sales } = data

  return (
    <div className="space-y-6">
      <ButtonBack onBack={() => navigate(-1)} />
      
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{customer.full_name}</h1>
        <p className="text-sm text-slate-500">Покупки в магазине "{store.name}"</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Информация о клиенте</h3>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <UserRound size={16} className="text-slate-400" />
                <span>{customer.full_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Package size={16} className="text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Building size={16} className="text-slate-400" />
                <span>{customer.city}</span>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <div className={`text-sm font-medium ${customer.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Баланс: {customer.balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Info Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Информация о магазине</h3>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-slate-400" />
                <span>{store.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Building size={16} className="text-slate-400" />
                <span>ID склада: {store.warehouse_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Summary Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Статистика покупок</h3>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Общее количество покупок:</span>
                <span className="font-medium">{sales.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Общая сумма покупок:</span>
                <span className="font-medium">
                  {sales.reduce((sum, sale) => sum + sale.total_amount, 0).toLocaleString()}
                </span>
              </div>
              
              {sales.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Последняя покупка:</span>
                    <span className="font-medium">
                      {new Date(sales[0].created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Первая покупка:</span>
                    <span className="font-medium">
                      {new Date(sales[sales.length - 1].created_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      {/* Sales Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Создать продажу</h2>
        <CustomerSalesForm initialCustomerId={Number(customerId)} initialStoreId={Number(storeId)} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Список покупок</h2>
        
        {sales.length === 0 ? (
          <div className="text-center py-10 text-slate-500">У клиента пока нет покупок в этом магазине</div>
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
                    Статус оплаты
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Магазин
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Сотрудник
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
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {sale.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${sale.payment_status === 'DEBT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {sale.payment_status === 'DEBT' ? 'В долг' : 'Оплачено'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {sale.store_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {sale.created_by_name}
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