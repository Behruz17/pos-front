import { useGetProductsQuery } from '@/features/products/api/products.api'
import { Modal } from './Modal'
import { useGetCustomersQuery } from '@/features/customers/api/customers.api'
import { useCreateSaleMutation } from '@/features/sales/api/sales.api'
import { useMemo, useState } from 'react'
import { Plus, ShoppingCart, Trash2, AlertTriangle } from 'lucide-react'

type TSaleItemForm = {
  product_id: string
  quantity: string
  last_unit_price: string
}

const emptyItem: TSaleItemForm = {
  product_id: '',
  quantity: '',
  last_unit_price: '',
}

export const CreateSaleModal = ({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) => {
  const { data: products = [] } = useGetProductsQuery()
  const { data: customers = [] } = useGetCustomersQuery()
  const [createSale, { isLoading }] = useCreateSaleMutation()

  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<TSaleItemForm[]>([emptyItem])
  const [showTotalStock, setShowTotalStock] = useState('')

  const updateItem = (i: number, patch: Partial<TSaleItemForm>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  const addItem = () => setItems((p) => [...p, emptyItem])
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const selectedProductIds = useMemo(() => items.map((i) => i.product_id).filter(Boolean), [items])

  const getProduct = (id: string) => products.find((p) => String(p.id) === id)

  const disabled =
    items.some((i) => !i.product_id || Number(i.quantity) <= 0 || Number(i.last_unit_price) <= 0) || isLoading

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.last_unit_price || 0), 0),
    [items]
  )

  const onSubmit = async () => {
    if (disabled) return

    await createSale({
      customer_id: customerId ? Number(customerId) : undefined,
      items: items.map((i) => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        unit_price: i.last_unit_price,
      })),
    }).unwrap()

    setCustomerId('')
    setItems([emptyItem])
    onSuccess?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая продажа">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Клиент</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Демо-клиент</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {items.map((item, i) => {
            const product = getProduct(item.product_id)
            const stockLeft = Number(product?.total_stock || 0)
            const stockError = Number(item.quantity) > stockLeft

            return (
              <div
                key={i}
                className={`
                  grid grid-cols-12 gap-3 rounded-xl p-4 border
                  ${stockError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}
                `}
              >
                <div className="col-span-12 lg:col-span-4 space-y-1">
                  <label className="text-xs text-slate-500">Товар</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => {
                      const p = products.find((x) => String(x.id) === e.target.value)
                      setShowTotalStock(p?.total_stock ?? '0')
                      updateItem(i, {
                        product_id: e.target.value,
                        last_unit_price: p?.last_unit_price ?? '',
                        quantity: '',
                      })
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">Выберите товар</option>
                    {products.map((p) => {
                      const isSelected = selectedProductIds.includes(String(p.id)) && item.product_id !== String(p.id)

                      return (
                        <option key={p.id} value={p.id} disabled={isSelected || Number(p.total_stock) === 0}>
                          {p.name} — остаток {p.total_stock}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="col-span-6 lg:col-span-3 space-y-1">
                  <label className="text-xs text-slate-500">Количество</label>
                  <input
                    placeholder={`Доступно: ${showTotalStock}`}
                    value={item.quantity}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      if (!/^\d*$/.test(v)) return
                      updateItem(i, { quantity: v })
                    }}
                    disabled={!product}
                    className={`
                      w-full rounded-lg border px-3 py-2 text-sm
                      ${stockError ? 'border-red-400 focus:ring-red-500' : ''}
                    `}
                  />
                </div>

                <div className="col-span-6 lg:col-span-3 space-y-1">
                  <label className="text-xs text-slate-500">Цена за единицу</label>
                  <input
                    placeholder="Цена"
                    value={item.last_unit_price}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      if (!/^\d*(\.\d*)?$/.test(v)) return
                      updateItem(i, { last_unit_price: v })
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 bg-slate-100 rounded-lg p-3">
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-500">Закупочная цена</div>
                    <div className="font-semibold text-slate-800">{product?.purchase_cost || '—'} с</div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-500">Цена продажи</div>
                    <div
                      className={`font-semibold ${
                        Number(product?.selling_price) < Number(product?.purchase_cost)
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {product?.selling_price || '—'} с
                    </div>
                  </div>
                </div>

                <div className="col-span-6 lg:col-span-1 flex items-end justify-end text-sm font-semibold">
                  {Number(item.quantity || 0) * Number(item.last_unit_price || 0)} с
                </div>

                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(i)}
                    className="col-span-6 lg:col-span-1 flex justify-center items-end text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                {/* Ошибка остатка */}
                {stockError && (
                  <div className="col-span-12 flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle size={14} />
                    На складе только {stockLeft}
                  </div>
                )}
              </div>
            )
          })}

          <button onClick={addItem} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
            <Plus size={18} />
            Добавить товар
          </button>
        </div>

        {/* Итог */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-slate-600">
            Итого: <span className="font-semibold">{total.toLocaleString()} с</span>
          </div>

          <button
            onClick={onSubmit}
            disabled={disabled}
            className="
              inline-flex items-center gap-2
              px-6 py-3 rounded-xl
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:bg-slate-200 disabled:text-slate-400
            "
          >
            <ShoppingCart size={18} />
            Оформить продажу
          </button>
        </div>
      </div>
    </Modal>
  )
}
