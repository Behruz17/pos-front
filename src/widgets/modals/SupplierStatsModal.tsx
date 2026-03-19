import { X } from 'lucide-react'

import { useGetSupplierStatsQuery } from '@/features/suppliers/api/suppliers.api'

import { Td, Th } from '@/shared/ui/Table'

const getCurrencySymbol = (currency?: string | null): string => {
  if (!currency) return '—';
  
  const currencyMap: Record<string, string> = {
    'yuan': '¥',
    'somoni': 'смн',
    'dollar': '$',
    'CNY': '¥',
    'TJS': 'смн',
    'USD': '$'
  };
  
  return currencyMap[currency.toLowerCase()] || currency;
};

const getSummaryByCurrency = (suppliers: any[]) => {
  const summary: Record<string, { receipts: number; payments: number; balance: number }> = {};
  
  suppliers.forEach(supplier => {
    const currency = supplier.currency || 'som';
    const receipts = Number(supplier.total_receipts) || 0;
    const payments = Number(supplier.total_payments) || 0;
    const balance = Number(supplier.remaining_balance) || 0;
    
    if (!summary[currency]) {
      summary[currency] = { receipts: 0, payments: 0, balance: 0 };
    }
    
    summary[currency].receipts += receipts;
    summary[currency].payments += payments;
    summary[currency].balance += balance;
  });
  
  return summary;
};



interface SupplierStatsModalProps {

  isOpen: boolean

  onClose: () => void

  warehouseId: number

}



export const SupplierStatsModal = ({ isOpen, onClose, warehouseId }: SupplierStatsModalProps) => {

  const { data: statsData, isLoading, isError, error } = useGetSupplierStatsQuery(

    { warehouse_id: warehouseId },

    { skip: !isOpen }

  )

  console.log('Stats data from API:', statsData)



  if (!isOpen) return null



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* Header */}

        <div className="flex items-center justify-between p-6 border-b border-slate-200">

          <h2 className="text-xl font-semibold text-slate-800">Статистика по поставщикам</h2>

          <button

            onClick={onClose}

            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"

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

            <div className="text-center py-10">

              <div className="text-red-500 font-semibold mb-2">Ошибка загрузки статистики</div>

              {error && (

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 text-sm">

                  <div className="font-mono text-red-800">

                    {JSON.stringify(error, null, 2)}

                  </div>

                </div>

              )}

            </div>

          ) : statsData ? (

            <div className="space-y-6">

              {/* Summary Cards */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-blue-600 text-sm font-medium">Общие приходы</div>
                  <div className="text-2xl font-bold text-blue-800 mt-1 space-y-1">
                    {Object.entries(getSummaryByCurrency(statsData.suppliers || [])).map(([currency, data]) => (
                      <div key={currency} className="flex justify-between">
                        <span>{data.receipts.toFixed(2)}</span>
                        <span>{getCurrencySymbol(currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-green-600 text-sm font-medium">Общие оплаты</div>
                  <div className="text-2xl font-bold text-green-800 mt-1 space-y-1">
                    {Object.entries(getSummaryByCurrency(statsData.suppliers || [])).map(([currency, data]) => (
                      <div key={currency} className="flex justify-between">
                        <span>{data.payments.toFixed(2)}</span>
                        <span>{getCurrencySymbol(currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="text-orange-600 text-sm font-medium">Остаток к оплате</div>
                  <div className="text-2xl font-bold text-orange-800 mt-1 space-y-1">
                    {Object.entries(getSummaryByCurrency(statsData.suppliers || [])).map(([currency, data]) => (
                      <div key={currency} className="flex justify-between">
                        <span>{data.balance.toFixed(2)}</span>
                        <span>{getCurrencySymbol(currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">

                  <div className="text-purple-600 text-sm font-medium">Активные поставщики</div>

                  <div className="text-2xl font-bold text-purple-800 mt-1">

                    {statsData.summary?.active_suppliers || 0}

                  </div>

                </div>

              </div>



              {/* Suppliers Table */}

              {(statsData.suppliers || []).length > 0 && (

                <div>

                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Детализация по поставщикам</h3>

                  

                  {/* Desktop Table */}

                  <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">

                    <table className="w-full border-collapse">

                      <thead className="bg-slate-50">

                        <tr>

                          <Th>Поставщик</Th>

                          <Th right>Приходы</Th>

                          <Th right>Оплаты</Th>

                          <Th right>Остаток</Th>

                          <Th right>Кол-во приходов</Th>

                          <Th right>Кол-во оплат</Th>

                        </tr>

                      </thead>

                      <tbody>

                        {(statsData.suppliers || []).map((supplier) => (

                          <tr key={supplier.supplier_id} className="border-t hover:bg-slate-50 transition">

                            <Td className="font-medium text-slate-800">

                              {supplier.supplier_name}

                            </Td>

                            <Td right className="text-blue-600 font-semibold">

                              {Number(supplier.total_receipts).toFixed(2)} {getCurrencySymbol(supplier.currency)}

                            </Td>

                            <Td right className="text-green-600 font-semibold">

                              {Number(supplier.total_payments).toFixed(2)} {getCurrencySymbol(supplier.currency)}

                            </Td>

                            <Td right className={`font-semibold ${
                              Number(supplier.remaining_balance) > 0 
                                ? 'text-orange-600' 
                                : Number(supplier.remaining_balance) < 0 
                                ? 'text-blue-600' 
                                : 'text-slate-600'
                            }`}>
                              {Number(supplier.remaining_balance).toFixed(2)} {getCurrencySymbol(supplier.currency)}
                            </Td>

                            <Td right className="text-slate-600">

                              {supplier.receipt_count}

                            </Td>

                            <Td right className="text-slate-600">

                              {supplier.payment_count}

                            </Td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>



                  {/* Mobile Cards */}

                  <div className="sm:hidden space-y-3">

                    {(statsData.suppliers || []).map((supplier) => (

                      <div key={supplier.supplier_id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">

                        <div className="font-medium text-slate-800 mb-3">{supplier.supplier_name}</div>

                        <div className="grid grid-cols-2 gap-3 text-sm">

                          <div>

                            <div className="text-slate-500">Приходы</div>

                            <div className="text-blue-600 font-semibold">{Number(supplier.total_receipts).toFixed(2)} {getCurrencySymbol(supplier.currency)}</div>

                          </div>

                          

                          <div>

                            <div className="text-slate-500">Оплаты</div>

                            <div className="text-green-600 font-semibold">{Number(supplier.total_payments).toFixed(2)} {getCurrencySymbol(supplier.currency)}</div>

                          </div>

                          

                          <div>

                            <div className="text-slate-500">Остаток</div>

                            <div className={`font-semibold ${
                              Number(supplier.remaining_balance) > 0 
                                ? 'text-orange-600' 
                                : Number(supplier.remaining_balance) < 0 
                                ? 'text-blue-600' 
                                : 'text-slate-600'
                            }`}>
                              {Number(supplier.remaining_balance).toFixed(2)} {getCurrencySymbol(supplier.currency)}
                            </div>

                          </div>

                          

                          <div>

                            <div className="text-slate-500">Операций</div>

                            <div className="text-slate-600">

                              {supplier.receipt_count + supplier.payment_count}
                            </div>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}



              {statsData.suppliers.length === 0 && (

                <div className="text-center py-10 text-slate-500">

                  Нет операций от поставщиков за выбранный период

                </div>

              )}

            </div>

          ) : null}

        </div>

      </div>

    </div>

  )

}
