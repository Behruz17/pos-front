import { useState, useRef, useEffect, RefObject } from 'react'
import { Plus, Trash2, PackagePlus } from 'lucide-react'
import { useCreateSaleMutation } from '../api/sales.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { useGetStoresQuery } from '@/features/stores/api/stores.api'
import { useGetCustomersQuery } from '@/features/customers/api/customers.api'
import { toast } from 'sonner'

interface TSaleItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

const emptyItem: TSaleItem = {
  product_id: 0,
  product_name: '',
  quantity: 1,
  unit_price: 0,
}

export const CreateSaleForm = () => {
  const [customer_id, setCustomerId] = useState<number | undefined>(undefined)
  const [store_id, setStoreId] = useState<number>(0)
  const [items, setItems] = useState<TSaleItem[]>([emptyItem])
  const [createSale, { isLoading }] = useCreateSaleMutation()
  const { data: products = [] } = useGetProductsQuery()
  const { data: stores = [] } = useGetStoresQuery()
  const { data: customers = [] } = useGetCustomersQuery()

  // Refs for keyboard navigation
  const customerRef = useRef<HTMLSelectElement>(null)
  const storeRef = useRef<HTMLSelectElement>(null)
  const refs = useRef<
    Array<{
      productInputRef: React.RefObject<HTMLInputElement>
      productDropdownRef: React.RefObject<HTMLDivElement>
      quantityRef: React.RefObject<HTMLInputElement>
      priceRef: React.RefObject<HTMLInputElement>
      removeButtonRef: React.RefObject<HTMLButtonElement>
    }>
  >([])

  // Initialize refs array
  useEffect(() => {
    // Initialize refs for each item
    for (let i = refs.current.length; i < items.length; i++) {
      refs.current.push({
        productInputRef: { current: null },
        productDropdownRef: { current: null },
        quantityRef: { current: null },
        priceRef: { current: null },
        removeButtonRef: { current: null },
      })
    }

    // Trim refs array if items were removed
    refs.current = refs.current.slice(0, items.length)
  }, [items])

  const updateItem = (index: number, patch: Partial<TSaleItem>) => {
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
    if (isInvalid || !store_id) return

    try {
      await createSale({
        customer_id,
        store_id,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }).unwrap()

      toast.success('Продажа успешно создана')
      // Reset form
      setItems([emptyItem])
      setStoreId(0)
      setCustomerId(undefined)
    } catch (error) {
      toast.error('Ошибка при создании продажи')
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
  const getFilteredProducts = (searchTerm: string, rowIndex: number) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="text-sm font-medium">Магазин *</label>
          <select
            ref={storeRef}
            value={store_id}
            onChange={(e) => setStoreId(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2.5"
            required
          >
            <option value={0}>Выберите магазин</option>
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
          const filteredProducts = getFilteredProducts(item.product_name, i)
          return (
            <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl relative">
              <div className="col-span-12 lg:col-span-5 relative">
                <label className="text-xs text-gray-500 lg:hidden">Товар</label>
                <input
                  ref={refs.current[i]?.productInputRef}
                  type="text"
                  value={item.product_name}
                  onChange={(e) => updateItem(i, { product_name: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'product')}
                  placeholder="Поиск товара..."
                  className="w-full border rounded-lg px-3 py-2.5"
                />

                {/* Dropdown for product suggestions */}
                {item.product_name && filteredProducts.length > 0 && (
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
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'quantity')}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>

              <div className="col-span-6 lg:col-span-3">
                <label className="text-xs text-gray-500 lg:hidden">Цена за единицу</label>
                <input
                  ref={refs.current[i]?.priceRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
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
          disabled={isInvalid || isLoading || !store_id}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400 ml-auto"
        >
          <PackagePlus size={16} /> Создать продажу
        </button>
      </div>
    </div>
  )
}
