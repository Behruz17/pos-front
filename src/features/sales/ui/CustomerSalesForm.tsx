import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, PackagePlus } from 'lucide-react'
import { useCreateSaleMutation } from '../api/sales.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { toast } from 'sonner'

interface TSaleItem {
  product_id: number
  product_name: string
  product_code: string  // Adding product_code as required by the interface
  quantity: number
  unit_price: number
}

const emptyItem: TSaleItem = {
  product_id: 0,
  product_name: '',
  product_code: '',
  quantity: 1,
  unit_price: 0,
}

interface CustomerSalesFormProps {
  initialCustomerId: number;
  initialStoreId: number;
}

export const CustomerSalesForm = ({ initialCustomerId, initialStoreId }: CustomerSalesFormProps) => {
  const [payment_status, setPaymentStatus] = useState<'PAID' | 'DEBT'>('DEBT')
  const [items, setItems] = useState<TSaleItem[]>([emptyItem])
  const [createSale, { isLoading }] = useCreateSaleMutation()
  const { data: products = [] } = useGetProductsQuery()

  // Refs for keyboard navigation
  const refs = useRef<
    {
      productInputRef: React.MutableRefObject<HTMLInputElement | null>
      productDropdownRef: React.MutableRefObject<HTMLDivElement | null>
      quantityRef: React.MutableRefObject<HTMLInputElement | null>
      priceRef: React.MutableRefObject<HTMLInputElement | null>
      removeButtonRef: React.MutableRefObject<HTMLButtonElement | null>
    }[]
  >([])

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
    if (isInvalid) return

    try {
      await createSale({
        customer_id: initialCustomerId, // Use the initial customer ID
        store_id: initialStoreId,       // Use the initial store ID
        payment_status,
        items: items.map((item) => {
          // Find the product to get its product_code
          const product = products.find(p => p.id === item.product_id);
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product_code: product?.product_code || '', // Include product_code in the submission
          }
        }),
      }).unwrap()

      toast.success('Продажа успешно создана')
      // Reset form
      setItems([emptyItem])
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
  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products
    return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Handle product selection
  const handleProductSelect = (productId: number, productName: string, productCode: string, rowIndex: number) => {
    // Set the selected product but clear the search term to hide the dropdown
    updateItem(rowIndex, { 
      product_id: productId, 
      product_name: productName,
      product_code: productCode
    })
    setTimeout(() => {
      refs.current[rowIndex]?.quantityRef.current?.focus()
    }, 0)
  }

  return (
    <div className="bg-gray-50 border rounded-2xl p-6 space-y-6">
      <div className="mb-4">
        <label className="text-sm font-medium">Статус оплаты</label>
        <select
          value={payment_status}
          onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'DEBT')}
          className="w-full border rounded-lg px-3 py-2.5 mt-1"
        >
          <option value="DEBT">В долг</option>
          <option value="PAID">Оплачено</option>
        </select>
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
                  onChange={(e) => updateItem(i, { product_name: e.target.value, product_id: 0, product_code: '' })}
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
                        onClick={() => handleProductSelect(product.id, product.name, product.product_code, i)}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500">Артикул: {product.product_code}</div>
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
                  onFocus={() => {
                    // Add a new row when this input gets focus in the last row
                    if (i === items.length - 1) {
                      addItem();
                    }
                  }}
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
          disabled={isInvalid || isLoading}
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400 ml-auto"
        >
          <PackagePlus size={16} /> Создать продажу
        </button>
      </div>
    </div>
  )
}