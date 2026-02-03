import { useState, useRef, useEffect } from 'react'
import { Modal } from './Modal'
import { Trash2, Plus, ShoppingCart } from 'lucide-react'
import { useCreateRetailCashReturnMutation, useCreateRetailDebtReturnMutation } from '@/features/returns/api/returns.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { useGetStoresQuery } from '@/features/stores/api/stores.api'
import { useGetRetailDebtorsQuery } from '@/features/sales/api/sales.api'
import { toast } from 'sonner'

type TRetailReturnItemForm = {
  product_id: number | 0
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
}

const emptyItem: TRetailReturnItemForm = {
  product_id: 0,
  product_name: '',
  product_code: null,
  quantity: 1,
  unit_price: 0,
}

type ReturnType = 'cash' | 'debt' | null

export const CreateRetailReturnModal = ({
  open,
  onClose,
  onSuccess,
  storeId,
}: {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  storeId: number
}) => {
  const { data: products = [] } = useGetProductsQuery()
  const { data: stores = [] } = useGetStoresQuery()
  const { data: retailDebtors = [] } = useGetRetailDebtorsQuery({ store_id: storeId })
  const [createRetailCashReturn, { isLoading: isCashLoading }] = useCreateRetailCashReturnMutation()
  const [createRetailDebtReturn, { isLoading: isDebtLoading }] = useCreateRetailDebtReturnMutation()

  const [returnType, setReturnType] = useState<ReturnType>(null)
  const [selectedDebtorId, setSelectedDebtorId] = useState<number | ''>('')
  const [items, setItems] = useState<TRetailReturnItemForm[]>([emptyItem])

  const refs = useRef<
    {
      productInputRef: React.MutableRefObject<HTMLInputElement | null>
      productDropdownRef: React.MutableRefObject<HTMLDivElement | null>
      quantityRef: React.MutableRefObject<HTMLInputElement | null>
      priceRef: React.MutableRefObject<HTMLInputElement | null>
      removeButtonRef: React.MutableRefObject<HTMLButtonElement | null>
    }[]
  >([])

  useEffect(() => {
    if (refs.current.length < items.length) {
      for (let i = refs.current.length; i < items.length; i++) {
        refs.current[i] = {
          productInputRef: { current: null },
          productDropdownRef: { current: null },
          quantityRef: { current: null },
          priceRef: { current: null },
          removeButtonRef: { current: null },
        }
      }
    } else if (refs.current.length > items.length) {
      refs.current = refs.current.slice(0, items.length)
    }
  }, [items])

  const updateItem = (index: number, patch: Partial<TRetailReturnItemForm>) =>
    setItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, ...patch } : it)))

  const addItem = () => setItems((p) => [...p, emptyItem])
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products
    const s = searchTerm.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(s) || (p.product_code && p.product_code.toLowerCase().includes(s)))
  }

  const handleProductSelect = (productId: number, rowIndex: number) => {
    const p = products.find((x) => x.id === productId)
    updateItem(rowIndex, {
      product_id: productId,
      product_name: p?.name || '',
      product_code: p?.product_code || null,
      unit_price: p ? Number(p.selling_price) : 0,
    })
    setTimeout(() => refs.current[rowIndex]?.quantityRef.current?.focus(), 0)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    field: 'product' | 'quantity' | 'price'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (field === 'product') refs.current[rowIndex]?.quantityRef.current?.focus()
      else if (field === 'quantity') refs.current[rowIndex]?.priceRef.current?.focus()
      else if (field === 'price') {
        if (rowIndex < items.length - 1) refs.current[rowIndex + 1]?.productInputRef.current?.focus()
        else {
          addItem()
          setTimeout(() => refs.current[rowIndex + 1]?.productInputRef.current?.focus(), 0)
        }
      }
    }
  }

  const isInvalid = items.some((i) => !i.product_id || i.quantity <= 0 || i.unit_price <= 0)
  const total = items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
  const isLoading = isCashLoading || isDebtLoading

  const handleSubmit = async () => {
    if (!returnType || isInvalid) return
    if (returnType === 'debt' && !selectedDebtorId) {
      toast.error('Выберите должника')
      return
    }

    try {
      if (returnType === 'cash') {
        await createRetailCashReturn({
          store_id: storeId,
          items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price })),
        }).unwrap()

        toast.success('Возврат наличными создан')
      } else {
        await createRetailDebtReturn({
          retail_debtor_id: selectedDebtorId as number,
          store_id: storeId,
          items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price })),
        }).unwrap()

        toast.success('Возврат в долг создан')
      }

      setItems([emptyItem])
      setReturnType(null)
      setSelectedDebtorId('')
      onClose()
      onSuccess?.()
    } catch (err) {
      console.error(err)
      toast.error('Ошибка при создании возврата')
    }
  }

  const getStoreName = (id: number) => stores.find((s) => s.id === id)?.name || ''

  // If return type not selected, show selection screen
  if (!returnType) {
    return (
      <Modal open={open} onClose={onClose} title="Тип возврата">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Выберите тип возврата для магазина <strong>{getStoreName(storeId)}</strong>
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setReturnType('cash')}
              className="p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition"
            >
              <div className="text-xl font-semibold text-blue-600 mb-2">💰 Наличные</div>
              <div className="text-sm text-slate-600">Возврат товара наличными</div>
            </button>

            <button
              onClick={() => setReturnType('debt')}
              className="p-6 border-2 border-orange-300 rounded-lg hover:bg-orange-50 transition"
            >
              <div className="text-xl font-semibold text-orange-600 mb-2">📋 В долг</div>
              <div className="text-sm text-slate-600">Возврат в счет погашения долга</div>
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setReturnType(null)
        onClose()
      }}
      title={returnType === 'cash' ? 'Возврат наличными' : 'Возврат в долг'}
      size="4xl"
    >
      <div className="space-y-4">
        {returnType === 'debt' && (
          <div>
            <label className="text-sm font-medium">Должник *</label>
            <select
              value={selectedDebtorId}
              onChange={(e) => setSelectedDebtorId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border rounded-lg px-3 py-2.5"
            >
              <option value="">Выберите должника</option>
              {retailDebtors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.customer_name} (Долг: {d.remaining_balance})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 bg-gray-100 border p-3 rounded-lg font-semibold text-sm hidden lg:grid">
            <div className="col-span-3">Товар</div>
            <div className="col-span-2">Артикул</div>
            <div className="col-span-2">Количество</div>
            <div className="col-span-2">Цена за единицу</div>
            <div className="col-span-1">Сумма</div>
            <div className="col-span-2">Действия</div>
          </div>

          {items.map((item, i) => {
            const filtered = getFilteredProducts(item.product_name)
            return (
              <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl relative">
                <div className="col-span-12 lg:col-span-3 relative">
                  <label className="text-xs text-gray-500 lg:hidden">Товар</label>
                  <input
                    ref={refs.current[i]?.productInputRef}
                    type="text"
                    value={item.product_name}
                    onChange={(e) => updateItem(i, { product_name: e.target.value, product_id: 0, product_code: null })}
                    onKeyDown={(e) => handleKeyDown(e, i, 'product')}
                    placeholder="Поиск товара..."
                    className="w-full border rounded-lg px-3 py-2.5"
                  />

                  {!item.product_id && item.product_name && filtered.length > 0 && (
                    <div ref={refs.current[i]?.productDropdownRef} className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {filtered.map((p) => (
                        <div key={p.id} className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0" onClick={() => handleProductSelect(p.id, i)}>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">Артикул: {p.product_code}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <label className="text-xs text-gray-500 lg:hidden">Артикул</label>
                  <div className="w-full border rounded-lg px-3 py-2.5 bg-gray-50">{item.product_code || '—'}</div>
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <label className="text-xs text-gray-500 lg:hidden">Количество</label>
                  <input
                    ref={refs.current[i]?.quantityRef}
                    type="text"
                    inputMode="numeric"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => {
                      const v = e.target.value.replace(/^0+/, '') || '0'
                      const n = Number(v)
                      if (!isNaN(n) && n >= 0) updateItem(i, { quantity: n })
                    }}
                    onKeyDown={(e) => handleKeyDown(e, i, 'quantity')}
                    className="w-full border rounded-lg px-3 py-2.5"
                  />
                </div>

                <div className="col-span-6 lg:col-span-2">
                  <label className="text-xs text-gray-500 lg:hidden">Цена за единицу</label>
                  <input
                    ref={refs.current[i]?.priceRef}
                    type="text"
                    inputMode="decimal"
                    value={item.unit_price === 0 ? '' : item.unit_price}
                    onChange={(e) => {
                      const v = e.target.value.replace(/^0+(?=\d)/, '')
                      const n = Number(v)
                      if (!isNaN(n) && n >= 0) updateItem(i, { unit_price: n })
                    }}
                    onKeyDown={(e) => handleKeyDown(e, i, 'price')}
                    onFocus={() => {
                      if (i === items.length - 1) addItem()
                    }}
                    className="w-full border rounded-lg px-3 py-2.5"
                  />
                </div>

                <div className="col-span-6 lg:col-span-1 flex items-end">
                  <div className="w-full text-center font-semibold py-2.5">{(item.quantity * item.unit_price).toLocaleString()}</div>
                </div>

                <div className="col-span-12 lg:col-span-2 flex items-end">
                  {items.length > 1 && (
                    <button ref={refs.current[i]?.removeButtonRef} onClick={() => removeItem(i)} className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-600 rounded-lg py-2.5">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          <button type="button" onClick={addItem} className="inline-flex items-center gap-2 text-sm text-blue-600">
            <Plus size={16} /> Добавить товар
          </button>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-slate-600">
            Итого: <span className="font-semibold">{total.toLocaleString()}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setReturnType(null)}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Назад
            </button>
            <button onClick={handleSubmit} disabled={isInvalid || isLoading || (returnType === 'debt' && !selectedDebtorId)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white disabled:bg-gray-400">
              <ShoppingCart size={16} /> {returnType === 'cash' ? 'Вернуть наличными' : 'Вернуть в долг'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CreateRetailReturnModal
