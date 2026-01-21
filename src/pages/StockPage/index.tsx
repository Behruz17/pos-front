/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit2, Move, Search, Warehouse, Package } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useGetWarehouseStockQuery } from '@/features/remain/api/stock.api'
import EditStockModal from '@/widgets/modals/EditStockModal'
import MoveStockModal from '@/widgets/modals/MoveStockModal'
import { formatDateTime } from '@/shared/formatDateTime'
import { Loading } from '@/shared/ui/Loading'
import type { TPutWarehouseStock } from '@/features/remain/model/stock.types'
import { ActionButton, Td, Th } from '@/shared/ui/Table'

const StockPage = () => {
  const { data, isLoading } = useGetWarehouseStockQuery()
  const [search, setSearch] = useState('')
  const [selectedStock, setSelectedStock] = useState<TPutWarehouseStock | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    return data.filter((i) => i.product_name.toLowerCase().includes(q) || i.warehouse_name.toLowerCase().includes(q))
  }, [data, search])

  if (isLoading) return <Loading text="остатков" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Остатки на складах</h1>
          <p className="text-sm text-slate-500">Количество и стоимость товаров по складам</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по товару или складу"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <Warehouse size={16} className="text-slate-400" />
              {item.warehouse_name}
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Package size={14} />
              {item.product_name}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Всего штук" value={item.total_pieces} />
              <Info label="Вес" value={`${item.weight_kg} кг`} />
              <Info label="Объём" value={`${item.volume_cbm} м³`} />
              <Info label="Закупка" value={`${item.purchase_cost} с`} />
              <Info label="Продажа" value={`${item.selling_price} с`} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-xs text-slate-500">{formatDateTime(item.updated_at)}</span>

              <div className="flex gap-1">
                <ActionButton
                  icon={<Edit2 size={16} />}
                  onClick={() => {
                    setSelectedStock(item)
                    setIsEditModalOpen(true)
                  }}
                />
                <ActionButton
                  icon={<Move size={16} />}
                  onClick={() => {
                    setSelectedStock(item)
                    setIsMoveModalOpen(true)
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {!filtered.length && <EmptyState />}
      </div>

      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <Th>Склад</Th>
              <Th>Товар</Th>
              <Th right>Штук</Th>
              <Th right>Вес (кг)</Th>
              <Th right>Объём (м³)</Th>
              <Th right>Закупка</Th>
              <Th right>Продажа</Th>
              <Th right>Обновлено</Th>
              <Th right>Действия</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Warehouse size={16} className="text-slate-400" />
                    {item.warehouse_name}
                  </div>
                </td>

                <td className="px-4 py-3 font-medium">{item.product_name}</td>
                <Td right>{item.total_pieces}</Td>
                <Td right>{item.weight_kg}</Td>
                <Td right>{item.volume_cbm}</Td>
                <Td right>{item.purchase_cost}</Td>
                <Td right>{item.selling_price}</Td>
                <Td right className="text-xs text-slate-500">
                  {formatDateTime(item.updated_at)}
                </Td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <ActionButton
                      icon={<Edit2 size={16} />}
                      onClick={() => {
                        setSelectedStock(item)
                        setIsEditModalOpen(true)
                      }}
                    />
                    <ActionButton
                      icon={<Move size={16} />}
                      onClick={() => {
                        setSelectedStock(item)
                        setIsMoveModalOpen(true)
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-500">
                  Остатки не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && <EditStockModal stock={selectedStock} onClose={() => setIsEditModalOpen(false)} />}

      {isMoveModalOpen && <MoveStockModal stock={selectedStock} onClose={() => setIsMoveModalOpen(false)} />}
    </div>
  )
}

export default StockPage
const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
)

const EmptyState = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500">Остатки не найдены</div>
)
