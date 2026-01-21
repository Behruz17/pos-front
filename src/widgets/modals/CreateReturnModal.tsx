// Модалка не используется, правка

import { useGetProductsQuery } from '@/features/products/api/products.api'
import { Modal } from './Modal'
import { useGetCustomersQuery } from '@/features/customers/api/customers.api'
import { useMemo, useState } from 'react'
import { Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCreateReturnMutation } from '@/features/returns/api/returns.api'

type TSaleItemForm = {
  product_id: string
  quantity: string
  unit_price: string
}
const emptyItem = {
  product_id: '',
  quantity: '',
  unit_price: '',
}

export const CreateReturnModal = ({
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
  const [createReturn, { isLoading }] = useCreateReturnMutation()
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<TSaleItemForm[]>([emptyItem])

  const updateItem = (i: number, field: keyof TSaleItemForm, value: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)))

  const addItem = () => setItems((p) => [...p, emptyItem])
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const disabled = items.some((i) => !i.product_id || Number(i.quantity) <= 0 || Number(i.unit_price) <= 0) || isLoading
  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unit_price || 0), 0),
    [items]
  )
  const onSubmit = async () => {
    if (disabled) return

    await createReturn({
      customer_id: customerId ? Number(customerId) : undefined,
      sale_id: null,
      items: items.map((i) => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        unit_price: i.unit_price,
      })),
    }).unwrap()

    setCustomerId('')
    setItems([emptyItem])
    onSuccess?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый возврат">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Клиент</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <select
                value={item.product_id}
                onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                className="col-span-12 lg:col-span-4 rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Товар</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {[
                ['quantity', 'Кол-во'],
                ['unit_price', 'Цена'],
              ].map(([field, label]) => (
                <input
                  key={field}
                  placeholder={label}
                  value={item[field as keyof TSaleItemForm]}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    if (!/^\d*(\.\d*)?$/.test(v)) return
                    updateItem(i, field as keyof TSaleItemForm, v)
                  }}
                  className="col-span-6 lg:col-span-3 rounded-lg border px-3 py-2 text-sm"
                />
              ))}

              <div className="col-span-6 lg:col-span-1 flex items-center justify-end text-sm font-semibold">
                {Number(item.quantity || 0) * Number(item.unit_price || 0)} с
              </div>

              {items.length > 1 && (
                <button
                  onClick={() => removeItem(i)}
                  className="col-span-12 lg:col-span-1 flex justify-center items-center text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}

          <button onClick={addItem} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
            <Plus size={18} />
            Добавить товар
          </button>
        </div>

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
            Оформить возврат
          </button>
        </div>
      </div>
    </Modal>
  )
}
