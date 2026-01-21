/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import { usePostReceiptMutation } from '../api/receipt.api'
import { useMemo, useState } from 'react'
import { Plus, Trash2, PackagePlus } from 'lucide-react'
import type { TReceiptItem } from '../model/receipt.types'

const num = (v: string) => (v ? Number(v) : 0)
const onlyNumber = (v: string) => /^\d*(\.\d*)?$/.test(v)

const calcSellingPrice = (purchase: string, markup: string) => {
  if (!purchase) return ''
  return (num(purchase) * (1 + num(markup) / 100)).toFixed(2)
}

const calcAmount = (boxes: string, perBox: string, purchase: string, loose: string) => {
  if (!boxes || !perBox || !purchase || !loose) return ''
  return ((num(boxes) + num(loose)) * num(perBox) * num(purchase)).toFixed(2)
}

const emptyItem: TReceiptItem & { markup_percent: string } = {
  product_id: '',
  boxes_qty: '',
  pieces_per_box: '',
  loose_pieces: '0',
  weight_kg: '',
  volume_cbm: '',
  purchase_cost: '',
  selling_price: '',
  amount: '',
  markup_percent: '',
}

const AdminReceiptForm = () => {
  const { data: warehouses = [] } = useGetWarehousesQuery()
  const { data: products = [] } = useGetProductsQuery()
  const [createReceipt, { isLoading }] = usePostReceiptMutation()

  const [warehouseId, setWarehouseId] = useState('')
  const [items, setItems] = useState<(typeof emptyItem)[]>([emptyItem])

  const updateItem = (index: number, patch: Partial<typeof emptyItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        const next = { ...item, ...patch }

        const selling = calcSellingPrice(next.purchase_cost, next.markup_percent)

        return {
          ...next,
          selling_price: selling,
          amount: calcAmount(next.boxes_qty, next.pieces_per_box, next.purchase_cost, next.loose_pieces),
        }
      })
    )
  }

  const addItem = () => setItems((p) => [...p, emptyItem])
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const isInvalid = useMemo(
    () => !warehouseId || items.some((i) => !i.product_id || !i.boxes_qty || !i.pieces_per_box || !i.purchase_cost),
    [warehouseId, items]
  )

  const onSubmit = async () => {
    if (isInvalid) return

    await createReceipt({
      warehouse_id: Number(warehouseId),
      items,
    }).unwrap()

    setWarehouseId('')
    setItems([emptyItem])
  }

  return (
    <div className="bg-gray-50 border rounded-2xl p-6 space-y-6">
      <div>
        <label className="text-sm font-medium">Склад</label>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2.5"
        >
          <option value="">Выберите склад</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-5 rounded-xl">
          <div className="col-span-12 lg:col-span-3">
            <label className="text-sm font-medium">Товар</label>
            <select
              value={item.product_id}
              onChange={(e) => updateItem(i, { product_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5"
            >
              <option value="">Выберите товар</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {[
            ['boxes_qty', 'Коробки (шт)'],
            ['pieces_per_box', 'Штук в коробке'],
            ['loose_pieces', 'Отдельные штуки'],
            ['weight_kg', 'Вес (кг)'],
            ['volume_cbm', 'Объём (м³)'],
            ['purchase_cost', 'Цена закупки'],
            ['markup_percent', 'Наценка %'],
          ].map(([key, label]) => (
            <div key={key} className="col-span-6 lg:col-span-2">
              <label className="text-sm font-medium">{label}</label>
              <input
                value={(item as any)[key]}
                onChange={(e) => {
                  if (!onlyNumber(e.target.value)) return
                  updateItem(i, { [key]: e.target.value } as any)
                }}
                className="w-full border rounded-lg px-3 py-2.5"
              />
            </div>
          ))}

          <div className="col-span-6 lg:col-span-2">
            <label className="text-sm font-medium">Цена продажи</label>
            <input
              value={item.selling_price}
              onChange={(e) => updateItem(i, { selling_price: e.target.value })}
              className="w-full border bg-gray-100 rounded-lg px-3 py-2.5"
            />
          </div>

          <div className="col-span-6 lg:col-span-2">
            <label className="text-sm font-medium">Сумма</label>
            <input value={item.amount} readOnly className="w-full border bg-gray-100 rounded-lg px-3 py-2.5" />
          </div>

          {items.length > 1 && (
            <button onClick={() => removeItem(i)} className="col-span-12 flex justify-end text-red-600">
              <Trash2 />
            </button>
          )}
        </div>
      ))}

      <button onClick={addItem} className="flex gap-2 text-blue-600">
        <Plus /> Добавить товар
      </button>

      <button
        disabled={isInvalid || isLoading}
        onClick={onSubmit}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400"
      >
        <PackagePlus /> Оформить приход
      </button>
    </div>
  )
}

export default AdminReceiptForm
