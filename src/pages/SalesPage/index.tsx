/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { skipToken } from '@reduxjs/toolkit/query'
import { ShoppingCart } from 'lucide-react'

import { useGetOneDetailSaleQuery } from '@/features/sales/api/sales.api'
import { useCreateReturnMutation } from '@/features/returns/api/returns.api'
import type { TReturnItem } from '@/features/returns/model/returns.types'
import type { TSaleDetail } from '@/features/sales/model/sales.types'
import { paths } from '@/app/routers/constants'

type TReturnFormItem = TReturnItem & {
  product_name: string
  max_quantity: number
}

const SalesPage = () => {
  const { id } = useParams<{ id: string }>()

  const { data: sale, isLoading, isError } = useGetOneDetailSaleQuery(id ? Number(id) : skipToken, { skip: !id })
  const [createReturn, { isLoading: isSubmitting }] = useCreateReturnMutation()
  const navigate = useNavigate()
  const [items, setItems] = useState<TReturnFormItem[]>([])

  useEffect(() => {
    if (!sale) return

    setItems(
      sale.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: 0,
        max_quantity: Number(item.quantity),
      }))
    )
  }, [sale])

  const updateQuantity = (productId: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: Number(value) > item.max_quantity ? item.max_quantity : Number(value),
            }
          : item
      )
    )
  }

  const selectedItems = useMemo(() => items.filter((i) => Number(i.quantity) > 0), [items])

  const total = useMemo(
    () => selectedItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0),
    [selectedItems]
  )

  const disabled = !selectedItems.length || isSubmitting

  const onSubmit = async () => {
    if (!sale || disabled) return

    await createReturn({
      sale_id: sale.id,
      customer_id: sale.customer_id ?? undefined,
      items: selectedItems.map((i) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
        unit_price: i.unit_price,
      })),
    }).unwrap()

    navigate(paths.transaction())
  }

  if (isLoading) {
    return <div className="p-6 text-slate-500">Загрузка продажи…</div>
  }

  if (isError || !sale) {
    return <div className="p-6 text-red-600">Продажа не найдена</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <SaleHeader sale={sale} />
      <SaleItemsList sale={sale} />
      <ReturnForm items={items} onChange={updateQuantity} />
      <ReturnSummary total={total} disabled={disabled} loading={isSubmitting} onSubmit={onSubmit} />
    </div>
  )
}

const SaleHeader = ({ sale }: { sale: TSaleDetail }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Продажа №{sale.id}</h1>
        <p className="text-sm text-slate-500">Дата: {new Date(sale.created_at).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="text-slate-500">Клиент</div>
        <div className="font-medium">{sale.customer_name || 'Без клиента'}</div>

        <div className="text-slate-500">Оформил</div>
        <div className="font-medium">{sale.created_by_name}</div>

        <div className="text-slate-500">Сумма</div>
        <div className="text-lg font-semibold text-emerald-600">{Number(sale.total_amount).toLocaleString()} с</div>
      </div>
    </div>
  </div>
)

const SaleItemsList = ({ sale }: { sale: TSaleDetail }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
    <h2 className="text-lg font-semibold text-slate-800">Товары в продаже</h2>

    {sale.items.map((item) => (
      <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50 rounded-xl p-4">
        <div className="col-span-12 lg:col-span-5">
          <div className="font-medium">{item.product_name}</div>
          <div className="text-xs text-slate-500">{item.manufacturer}</div>
        </div>

        <div className="col-span-4 lg:col-span-2">{item.quantity} шт</div>

        <div className="col-span-4 lg:col-span-2">{Number(item.unit_price).toLocaleString()} с</div>

        <div className="col-span-4 lg:col-span-3 text-right font-semibold">
          {Number(item.total_price).toLocaleString()} с
        </div>
      </div>
    ))}
  </div>
)

const ReturnForm = ({
  items,
  onChange,
}: {
  items: TReturnFormItem[]
  onChange: (productId: number, value: string) => void
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-slate-800">Оформление возврата</h2>
      <p className="text-sm text-slate-500">Укажите количество возвращаемого товара</p>
    </div>

    <div className="space-y-4">
      {items.map((item) => (
        <ReturnItemRow key={item.product_id} item={item} onChange={(value) => onChange(item.product_id, value)} />
      ))}
    </div>
  </div>
)

const ReturnItemRow = ({ item, onChange }: { item: TReturnFormItem; onChange: (value: string) => void }) => {
  const subtotal = Number(item.quantity) * Number(item.unit_price)

  return (
    <div className="grid grid-cols-12 gap-3 items-center bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="col-span-12 lg:col-span-5">
        <div className="font-medium">{item.product_name}</div>
        <div className="text-xs text-slate-500">
          Куплено: {item.max_quantity} × {item.unit_price}
        </div>
      </div>

      <input
        value={item.quantity}
        onChange={(e) => onChange(e.target.value)}
        className="
          col-span-6 lg:col-span-3
          rounded-lg border border-slate-300
          px-3 py-2 text-sm
          focus:ring-2 focus:ring-red-500
        "
      />

      <div className="col-span-4 lg:col-span-2 text-right font-semibold">
        {subtotal ? subtotal.toLocaleString() : '—'} с
      </div>

      <div className="col-span-2 lg:col-span-2 text-right text-xs text-slate-400">max {item.max_quantity}</div>
    </div>
  )
}

const ReturnSummary = ({
  total,
  disabled,
  onSubmit,
  loading,
}: {
  total: number
  disabled: boolean
  loading: boolean
  onSubmit: () => void
}) => (
  <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <div className="text-sm text-slate-500">Сумма возврата</div>
      <div className="text-2xl font-semibold text-red-600">{total.toLocaleString()} с</div>
    </div>

    <button
      onClick={onSubmit}
      disabled={disabled || loading}
      className="
        inline-flex items-center gap-2
        px-8 py-3 rounded-xl
        bg-red-600 text-white font-medium
        hover:bg-red-700
        disabled:bg-slate-200 disabled:text-slate-400
      "
    >
      <ShoppingCart size={18} />
      Подтвердить возврат
    </button>
  </div>
)

export default SalesPage
