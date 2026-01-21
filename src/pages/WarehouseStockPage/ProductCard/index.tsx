import { useGetWarehouseProductsDetailQuery } from '@/features/warehouses/api/warehouses.api'
import { formatDateTime } from '@/shared/formatDateTime'
import ButtonBack from '@/shared/ui/ButtonBack'
import EditProductModal from '@/widgets/modals/EditProductModal'
import EditStockModal from '@/widgets/modals/EditStockModal'
import MoveStockModal from '@/widgets/modals/MoveStockModal'
import { Image, Space } from 'antd'
import { Edit, Edit2, Move } from 'lucide-react'
import { useState } from 'react'

export const ProductCard = ({
  warehouseId,
  productId,
  onBack,
}: {
  warehouseId: number
  productId: number
  onBack: () => void
}) => {
  const { data, isLoading } = useGetWarehouseProductsDetailQuery({
    warehouseId,
    productId,
  })

  const [editOpen, setEditOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(false)

  if (isLoading) {
    return <div className="text-sm text-slate-500">Загрузка товара…</div>
  }

  if (!data) return null

  const { product, stock, warehouse } = data
  const stockForm = {
    total_pieces: stock.total_pieces,
    weight_kg: stock.weight_kg,
    volume_cbm: stock.volume_cbm,
    warehouse_id: warehouse.id,
    warehouse_name: warehouse.name,
    product_name: product.name,
    product_id: product.id,
  }
  const editStockForm = {
    id: stock.id,
    total_pieces: stock.total_pieces,
    weight_kg: stock.weight_kg,
    volume_cbm: stock.volume_cbm,
    product_name: product.name,
    warehouse_name: warehouse.name,
  }

  return (
    <div className="space-y-6">
      <ButtonBack onBack={onBack} />
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="group relative aspect-square overflow-hidden rounded-2xl border bg-slate-50">
              <Image
                src={product.image}
                alt={product.name}
                className="
                  w-full h-full object-cover                   
                "
                preview={{
                  mask: true,
                  cover: (
                    <Space vertical align="center">
                      Просмотр
                    </Space>
                  ),
                }}
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
            </div>

            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
                Склад: <span className="font-medium">{warehouse.name}</span>
              </span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">{product.name}</h2>

              <div className="mt-1 text-sm text-slate-500 space-y-0.5">
                <div>
                  Производитель: <span className="text-slate-700 font-medium">{product.manufacturer || '—'}</span>
                </div>

                <div>
                  Добавлен: <span className="text-slate-700">{formatDateTime(product.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Всего штук" value={stock.total_pieces} />
              <Stat label="Вес, кг" value={stock.weight_kg} />
              <Stat label="Объём, м³" value={stock.volume_cbm} />
              <Stat label="Обновлено" value={formatDateTime(stock.updated_at)} small />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <ActionButton
                icon={<Edit2 size={16} />}
                label="Редактировать остаток"
                onClick={() => setEditOpen(true)}
              />

              <ActionButton icon={<Move size={16} />} label="Переместить" onClick={() => setMoveOpen(true)} />

              <ActionButton
                icon={<Edit size={16} />}
                label="Редактировать продукт"
                onClick={() => setEditProduct(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {editOpen && <EditStockModal stock={editStockForm} onClose={() => setEditOpen(false)} />}
      {moveOpen && <MoveStockModal stock={stockForm} onClose={() => setMoveOpen(false)} />}
      {editProduct && <EditProductModal product={product} onClose={() => setEditProduct(false)} />}
    </div>
  )
}

const Stat = ({ label, value, small }: { label: string; value: number | string; small?: boolean }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`font-semibold text-slate-800 ${small ? 'text-sm' : 'text-lg'}`}>{value}</div>
  </div>
)

const ActionButton = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="
      inline-flex items-center gap-2
      px-4 py-2 rounded-xl
      border border-slate-200
      text-sm font-medium text-slate-700
      hover:bg-slate-50
      transition
      disabled:opacity-50 disabled:cursor-not-allowed
    "
  >
    {icon}
    {label}
  </button>
)
