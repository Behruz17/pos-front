import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, PackageMinus } from 'lucide-react'
import { useCreateReturnMutation } from '../api/returns.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { useGetStoresQuery } from '@/features/stores/api/stores.api'
import { useGetCustomersQuery } from '@/features/customers/api/customers.api'
import { useGetSalesQuery } from '@/features/sales/api/sales.api'
import { toast } from 'sonner'

interface TReturnItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

const emptyItem: TReturnItem = {
  product_id: 0,
  product_name: '',
  quantity: 1,
  unit_price: 0,
}

export const CreateReturnForm = () => {
  const [customer_id, setCustomerId] = useState<number | undefined>(undefined)
  const [sale_id, setSaleId] = useState<number | undefined>(undefined)
  const [store_id, setStoreId] = useState<number | undefined>(undefined)
  const [items, setItems] = useState<TReturnItem[]>([emptyItem])
  const [createReturn, { isLoading }] = useCreateReturnMutation()
  const { data: products = [] } = useGetProductsQuery()
  const { data: stores = [] } = useGetStoresQuery()
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: sales = [] } = useGetSalesQuery()

  // Refs for keyboard navigation
  const customerRef = useRef<HTMLSelectElement>(null)
  const saleRef = useRef<HTMLSelectElement>(null)
  const storeRef = useRef<HTMLSelectElement>(null)

  // Initialize refs array properly
  const refs = useRef<{
    productInputRef: React.MutableRefObject<HTMLInputElement | null>
    productDropdownRef: React.MutableRefObject<HTMLDivElement | null>
    quantityRef: React.MutableRefObject<HTMLInputElement | null>
    priceRef: React.MutableRefObject<HTMLInputElement | null>
    removeButtonRef: React.MutableRefObject<HTMLButtonElement | null>
  }[]>([])

  // Initialize refs array
  useEffect(() => {
    // Make sure refs array has the same length as items array
    if (refs.current.length < items.length) {
      // Add new refs for new items
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
      // Trim refs array if items were removed
      refs.current = refs.current.slice(0, items.length)
    }
  }, [items])

  const updateItem = (index: number, patch: Partial<TReturnItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        return {
          ...item,
          ...patch,
        }
      })
    )
  }

  const addItem = () => setItems((p) => [...p, emptyItem])
  const addMultipleItems = (count: number) => {
    const newItems = Array(count).fill(emptyItem)
    setItems((prev) => [...prev, ...newItems])
  }
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const isInvalid = items.some((i) => !i.product_id || i.quantity <= 0 || i.unit_price <= 0)

  const handleSubmit = async () => {
    if (isInvalid || (!sale_id && !store_id)) return

    try {
      await createReturn({
        customer_id,
        sale_id,
        store_id,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }).unwrap()

      toast.success('Возврат успешно создан')
      // Reset form
      setItems([emptyItem])
      setSaleId(undefined)
      setStoreId(undefined)
      setCustomerId(undefined)
    } catch (error) {
      toast.error('Ошибка при создании возврата')
      console.error(error)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldType: 'product' | 'quantity' | 'price') => {
    if (e.key === 'Tab') {
      // Allow default Tab behavior
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()

      if (fieldType === 'product') {
        // Move to quantity field in the same row
        refs.current[rowIndex]?.quantityRef.current?.focus()
      } else if (fieldType === 'quantity') {
        // Move to price field in the same row
        refs.current[rowIndex]?.priceRef.current?.focus()
      } else if (fieldType === 'price') {
        // Move to next row's product field or add a new row
        if (rowIndex < items.length - 1) {
          refs.current[rowIndex + 1]?.productInputRef.current?.focus()
        } else {
          // Add a new row and focus on the new row's product field
          setTimeout(() => {
            addItem()
            setTimeout(() => {
              if (refs.current[rowIndex + 1]) {
                refs.current[rowIndex + 1].productInputRef.current?.focus()
              }
            }, 0)
          }, 0)
        }
      }
    }
  }

  // Filter products based on input
  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products
    return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Handle product selection
  const handleProductSelect = (productId: number, productName: string, rowIndex: number) => {
    updateItem(rowIndex, { product_id: productId, product_name: productName })
    setTimeout(() => {
      refs.current[rowIndex]?.quantityRef.current?.focus()
    }, 0)
  }

  return (
    <div className="bg-gray-50 border rounded-2xl p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Клиент (необязательно)</label>
          <select
            ref={customerRef}
            value={customer_id || ''}
            onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border rounded-lg px-3 py-2.5"
          >
            <option value="">Демо-клиент</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Продажа (вариант А)</label>
          <select
            ref={saleRef}
            value={sale_id || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : undefined
              setSaleId(value)
              if (value) setStoreId(undefined) // Clear store_id when selecting sale_id
            }}
            className="w-full border rounded-lg px-3 py-2.5"
          >
            <option value="">Не выбрана</option>
            {sales.map((s) => (
              <option key={s.id} value={s.id}>
                Продажа #{s.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Магазин (вариант Б)</label>
          <select
            ref={storeRef}
            value={store_id || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : undefined
              setStoreId(value)
              if (value) setSaleId(undefined) // Clear sale_id when selecting store_id
            }}
            className="w-full border rounded-lg px-3 py-2.5"
            disabled={!!sale_id} // Disable if sale_id is selected
          >
            <option value="">Не выбран</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk operations toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addMultipleItems(10)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          +10 строк
        </button>
        <button
          type="button"
          onClick={() => addMultipleItems(50)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          +50 строк
        </button>
        <button
          type="button"
          onClick={() => addMultipleItems(100)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          +100 строк
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 bg-gray-100 border p-3 rounded-lg font-semibold text-sm hidden lg:grid">
          <div className="col-span-5">Товар</div>
          <div className="col-span-2">Количество</div>
          <div className="col-span-3">Цена за единицу</div>
          <div className="col-span-2">Действия</div>
        </div>

        {items.map((item, i) => {
          const filteredProducts = getFilteredProducts(item.product_name)
          return (
            <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl relative">
              <div className="col-span-12 lg:col-span-5 relative">
                <label className="text-xs text-gray-500 lg:hidden">Товар</label>
                <input
                  ref={refs.current[i]?.productInputRef}
                  type="text"
                  value={item.product_name}
                  onChange={(e) => updateItem(i, { product_name: e.target.value, product_id: 0 })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'product')}
                  placeholder="Поиск товара..."
                  className="w-full border rounded-lg px-3 py-2.5"
                />

                {/* Dropdown for product suggestions */}
                {!item.product_id && item.product_name && filteredProducts.length > 0 && (
                  <div
                    ref={refs.current[i]?.productDropdownRef}
                    className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
                  >
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleProductSelect(product.id, product.name, i)}
                      >
                        <div className="font-medium">{product.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-6 lg:col-span-2">
                <label className="text-xs text-gray-500 lg:hidden">Количество</label>
                <input
                  ref={refs.current[i]?.quantityRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={item.quantity === 0 ? '' : item.quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+/, '') || '0';
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(i, { quantity: numValue });
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 'quantity')}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>

              <div className="col-span-6 lg:col-span-3">
                <label className="text-xs text-gray-500 lg:hidden">Цена за единицу</label>
                <input
                  ref={refs.current[i]?.priceRef}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*(.[0-9]+)?"
                  value={item.unit_price === 0 ? '' : item.unit_price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '');
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(i, { unit_price: numValue });
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 'price')}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>

              <div className="col-span-12 lg:col-span-2 flex items-end">
                {items.length > 1 && (
                  <button
                    ref={refs.current[i]?.removeButtonRef}
                    onClick={() => removeItem(i)}
                    className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-600 rounded-lg py-2.5"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-blue-600">
          <Plus size={16} /> Добавить товар
        </button>

        <button
          type="button"
          disabled={isInvalid || isLoading || (!sale_id && !store_id)}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400 ml-auto"
        >
          <PackageMinus size={16} /> Создать возврат
        </button>
      </div>
    </div>
  )
}
