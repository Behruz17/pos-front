import { useParams, useNavigate } from 'react-router'
import { useGetStoreCustomersQuery } from '@/features/stores/api/stores.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { paths } from '@/app/routers/constants'
import { Package, Phone, MapPin, Wallet } from 'lucide-react'

export const StoreCustomersPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  
  const { data, isLoading, isError } = useGetStoreCustomersQuery(Number(storeId))

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка клиентов магазина…</div>
  }

  if (isError || !data) {
    return <div className="flex justify-center py-20 text-red-500">Ошибка загрузки данных клиентов</div>
  }

  const { store, customers } = data

  return (
    <div className="space-y-6">
      <ButtonBack onBack={() => navigate(-1)} />
      
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{store.name}</h1>
        <p className="text-sm text-slate-500">Клиенты магазина</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {customers.length === 0 ? (
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
        )}
      </div>
    </div>
  )
}

export default StoreCustomersPage