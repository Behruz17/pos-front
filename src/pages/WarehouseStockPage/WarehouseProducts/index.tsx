import { useGetWarehouseProductsQuery, useGetWarehouseSuppliersQuery } from '@/features/warehouses/api/warehouses.api'
import { useGetSupplierOperationsQuery } from '@/features/suppliers/api/suppliers.api'
import { SupplierPaymentModal } from '@/widgets/modals/SupplierPaymentModal';
import ButtonBack from '@/shared/ui/ButtonBack'
import { ProductImage } from '@/shared/ui/ProductImageю'
import { Td, Th } from '@/shared/ui/Table'
import { Package, Search, Truck, ArrowLeft, DollarSign } from 'lucide-react'
import { useMemo, useState } from 'react'

export const WarehouseProducts = ({
  warehouseId,
  onBack,
  onSelectProduct,
}: {
  warehouseId: number
  onBack: () => void
  onSelectProduct: (id: number) => void
}) => {
  const { data, isLoading, isError, error } = useGetWarehouseProductsQuery(warehouseId)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'products' | 'suppliers'>('products')
  const [selectedSupplier, setSelectedSupplier] = useState<{id: number, name: string} | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const { 
    data: suppliersData, 
    isLoading: suppliersLoading,
    isError: suppliersError,
    error: suppliersErrorMsg
  } = useGetWarehouseSuppliersQuery(warehouseId)

  const { 
    data: receiptsData, 
    isLoading: receiptsLoading,
    isError: receiptsError,
    error: receiptsErrorMsg,
    refetch
  } = useGetSupplierOperationsQuery({ 
    supplierId: selectedSupplier?.id || 0, 
    warehouseId 
  }, { 
    skip: !selectedSupplier 
  })

  // Debug output for errors
  if (isError) {
    console.error('Error fetching warehouse products:', error);
  }
  
  if (suppliersError) {
    console.error('Error fetching warehouse suppliers:', suppliersErrorMsg);
  }

  const products = useMemo(() => {
    if (!data) return []
    return data.products.filter((p) => p.product_name.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  if (isLoading) {
    return <div className="text-sm text-slate-500">Загрузка…</div>
  }

  if (!data) return null

  const TabComponent = ({
    active,
    onClick,
    icon,
    label,
  }: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
  }) => (
    <button
      onClick={onClick}
      className={`
          flex items-center justify-center gap-2
          px-4 py-2 rounded-xl sm:rounded-none
          text-sm font-medium transition
          w-full sm:w-auto
    
          ${
            active
              ? 'bg-blue-50 text-blue-600 sm:bg-transparent sm:border-b-2 sm:border-blue-600'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 sm:hover:bg-transparent sm:border-b-2 sm:border-transparent'
          }
        `}
    >
      <span className="hidden sm:inline-flex">{icon}</span>
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ButtonBack onBack={onBack} />

        <div className="text-sm text-slate-500">
          Склад: <span className="font-semibold text-slate-700">{data.warehouse.name}</span>
        </div>

      </div>

      <div className="flex gap-2 sm:gap-4 sm:border-b sm:border-slate-200">
        <TabComponent
          active={tab === 'products'}
          onClick={() => {
            setTab('products');
            setSelectedSupplier(null);
          }}
          icon={<Package size={16} />}
          label="Товары"
        />

        <TabComponent
          active={tab === 'suppliers'}
          onClick={() => {
            setTab('suppliers');
            setSelectedSupplier(null);
          }}
          icon={<Truck size={16} />}
          label="Поставщики"
        />
      </div>

      {tab === 'products' && (
        <div>
          <div className="relative max-w-sm mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товара…"
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Товар</Th>
                    <Th>Производитель</Th>
                    <Th right>Закупка</Th>
                    <Th right>Продажа</Th>
                    <Th right>Штук</Th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProduct(p.product_id)}
                      className="border-t cursor-pointer hover:bg-blue-50 transition"
                    >
                      <Td>
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductImage src={p.image} alt={p.product_name} />

                          <span className="font-medium text-slate-800 truncate">{p.product_name}</span>
                        </div>
                      </Td>

                      <Td className="text-slate-500 truncate">{p.manufacturer || '—'}</Td>

                      <Td right className="text-slate-600">
                        {p.purchase_cost.toFixed(2)} с
                      </Td>

                      <Td right className="font-semibold text-emerald-600">
                        {p.selling_price.toFixed(2)} с
                      </Td>

                      <Td right className="font-semibold text-slate-700">
                        {p.total_pieces}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!products.length && <div className="px-4 py-6 text-sm text-slate-400 text-center">Товары не найдены</div>}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProduct(p.product_id)}
                  className="w-full rounded-xl border border-slate-200 p-4 hover:bg-blue-50 transition"
                >
                  <div className="flex gap-3">
                    <img src={p.image} alt={p.product_name} className="w-16 h-16 rounded-xl object-cover border" />

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{p.product_name}</div>

                      <div className="text-xs text-slate-500 mt-1">{p.manufacturer || '—'}</div>

                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-slate-500">
                          Закупка: <span className="text-slate-700">{p.purchase_cost.toFixed(2)} с</span>
                        </span>

                        <span className="font-semibold text-emerald-600">{p.selling_price.toFixed(2)} с</span>
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-700">Штук: {p.total_pieces}</div>
                    </div>
                  </div>
                </button>
              ))}

              {!products.length && <div className="py-6 text-sm text-slate-400 text-center">Товары не найдены</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'suppliers' && !selectedSupplier && (
        <div>
          <div className="relative max-w-sm mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск поставщика…"
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {suppliersLoading ? (
            <div className="text-sm text-slate-500">Загрузка поставщиков…</div>
          ) : suppliersError ? (
            <div className="text-center py-10 text-red-500">
              Ошибка загрузки поставщиков: {JSON.stringify(suppliersErrorMsg) || 'Неизвестная ошибка'}
            </div>
          ) : suppliersData?.suppliers && suppliersData.suppliers.length > 0 ? (
            <div className="space-y-4">
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Поставщик</Th>
                      <Th>Телефон</Th>
                      <Th>Баланс</Th>
                      <Th>Последняя поставка</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersData.suppliers
                      .filter((supplier: any) => 
                        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
                        supplier.phone.includes(search)
                      )
                      .map((supplier: any) => (
                      <tr 
                        key={supplier.id} 
                        className="border-t hover:bg-slate-50 transition cursor-pointer"
                        onClick={() => setSelectedSupplier({id: supplier.id, name: supplier.name})}
                      >
                        <Td>
                          <div className="font-medium text-slate-800">{supplier.name}</div>
                        </Td>
                        <Td className="text-slate-600">{supplier.phone}</Td>
                        <Td right className="font-semibold text-slate-700">
                          {supplier.balance.toFixed(2)} с
                        </Td>
                        <Td right className="text-slate-500 text-sm">
                            —
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {suppliersData.suppliers
                  .filter((supplier: any) => 
                    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
                    supplier.phone.includes(search)
                  )
                  .map((supplier: any) => (
                  <div 
                    key={supplier.id} 
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setSelectedSupplier({id: supplier.id, name: supplier.name})}
                  >
                    <div className="font-medium text-slate-800">{supplier.name}</div>
                    <div className="text-sm text-slate-600 mt-1">{supplier.phone}</div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-slate-500">Баланс:</span>
                      <span className="font-semibold text-slate-700">{supplier.balance.toFixed(2)} с</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Последняя поставка: —
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              {search ? 'Поставщики не найдены' : `Нет поставщиков для склада: ${data?.warehouse.name}`}
            </div>
          )}
        </div>
      )}

      {tab === 'suppliers' && selectedSupplier && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft size={16} />
                Назад к списку поставщиков
              </button>
              <div className="text-lg font-semibold text-slate-800">
                Операции от {selectedSupplier.name}
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <DollarSign size={16} />
              Выполнить оплату
            </button>
          </div>

          {receiptsLoading ? (
            <div className="text-sm text-slate-500">Загрузка приходов…</div>
          ) : receiptsError ? (
            <div className="text-center py-10 text-red-500">
              Ошибка загрузки операций: {JSON.stringify(receiptsErrorMsg) || 'Неизвестная ошибка'}
            </div>
          ) : receiptsData?.operations && receiptsData.operations.length > 0 ? (
            <div className="space-y-4">
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>№</Th>
                      <Th>Тип операции</Th>
                      <Th>Дата</Th>
                      <Th>Сумма</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptsData.operations.map((operation: any, index: number) => (
                      <tr key={operation.id} className="border-t hover:bg-slate-50 transition">
                        <Td>
                          <div className="font-medium text-slate-800">{index + 1}</div>
                        </Td>
                        <Td className="text-slate-600">
                          {operation.type === 'RECEIPT' ? 'Приход' : operation.type === 'PAYMENT' ? 'Оплата' : operation.type}
                        </Td>
                        <Td className="text-slate-600">
                          {new Date(operation.date).toLocaleDateString('ru-RU')}
                        </Td>
                        <Td right className="font-semibold text-slate-700">
                          {operation.sum.toFixed(2)} с
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {receiptsData.operations.map((operation: any) => (
                  <div key={operation.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-slate-800">{operation.type === 'RECEIPT' ? 'Приход' : operation.type === 'PAYMENT' ? 'Оплата' : operation.type} #{operation.id}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {new Date(operation.date).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div className="font-semibold text-slate-700">
                        {operation.sum.toFixed(2)} с
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              Нет операций от поставщика {selectedSupplier.name} на этот склад
            </div>
          )}
        </div>
      )}

      {selectedSupplier && (
        <SupplierPaymentModal
          supplierId={selectedSupplier.id}
          supplierName={selectedSupplier.name}
          warehouseId={warehouseId}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            // Refresh the operations data after successful payment
            refetch();
          }}
        />
      )}
    </div>
  )
}