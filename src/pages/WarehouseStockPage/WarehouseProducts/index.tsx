import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { useDeleteWarehouseMutation, useGetWarehouseProductsQuery } from '@/features/warehouses/api/warehouses.api'
import ButtonBack from '@/shared/ui/ButtonBack'
import { ProductImage } from '@/shared/ui/ProductImageю'
import { Td, Th } from '@/shared/ui/Table'
import AdminReceiptModal from '@/widgets/modals/AdminReceiptModal'
import DeleteModal from '@/widgets/modals/DeleteModal'
import { Plus, Search, Trash2 } from 'lucide-react'
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
  const { data, isLoading } = useGetWarehouseProductsQuery(warehouseId)
  const isAdmin = useAuth()

  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [openReceipt, setOpenReceipt] = useState(false)

  const products = useMemo(() => {
    if (!data) return []
    return data.products.filter((p) => p.product_name.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  const [deleteWarehouse, { isLoading: isDeleting }] = useDeleteWarehouseMutation()

  const onDelete = async () => {
    if (!deleteId) return
    await deleteWarehouse(deleteId).unwrap()
    setDeleteId(null)
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">Загрузка…</div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ButtonBack onBack={onBack} />

        <div className="text-sm text-slate-500">
          Склад: <span className="font-semibold text-slate-700">{data.warehouse.name}</span>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenReceipt(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Добавить</span>
            </button>

            <button
              onClick={() => setDeleteId(data.warehouse.id)}
              className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск товара…"
          className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

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

      {deleteId && <DeleteModal isLoading={isDeleting} onClose={() => setDeleteId(null)} onDelete={onDelete} />}

      <AdminReceiptModal open={openReceipt} onClose={() => setOpenReceipt(false)} />
    </div>
  )
}
