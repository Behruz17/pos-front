import { useState, useRef, useEffect } from 'react'
import { Trash2, PackagePlus, AlertTriangle, X } from 'lucide-react'
import { useCreateSaleMutation } from '../api/sales.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { toast } from 'sonner'

interface TSaleItem {
  product_id: number
  product_name: string
  product_code: string | null // Adding product_code as required by the interface
  quantity: number
  unit_price: number
}

const emptyItem: TSaleItem = {
  product_id: 0,
  product_name: '',
  product_code: null,
  quantity: 1,
  unit_price: 0,
}

interface CustomerSalesFormProps {
  initialCustomerId: number
  initialStoreId: number
  onClose?: () => void
  onSaleCreated?: () => void
}

interface StockError {
  productId: number
  productName: string
  requested: number
  available: number
}

export const CustomerSalesForm = ({
  initialCustomerId,
  initialStoreId,
  onClose,
  onSaleCreated,
}: CustomerSalesFormProps) => {
  const [payment_status, setPaymentStatus] = useState<'PAID' | 'DEBT'>('DEBT')
  const [items, setItems] = useState<TSaleItem[]>([emptyItem])
  const [stockErrors, setStockErrors] = useState<StockError[]>([])
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
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const isInvalid = items.some((i) => !i.product_id || i.quantity <= 0 || i.unit_price <= 0)

  const handleSubmit = async () => {
    if (isInvalid) return

    try {
      await createSale({
        customer_id: initialCustomerId, // Use the initial customer ID
        store_id: initialStoreId, // Use the initial store ID
        payment_status,
        items: items.map((item) => {
          // Find the product to get its product_code
          const product = products.find((p) => p.id === item.product_id)
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
      setStockErrors([])

      // Call the onSaleCreated callback if provided
      onSaleCreated?.()

      // Close the form if onClose is provided
      if (onClose) {
        onClose()
      }
    } catch (error: any) {
      console.error(error)
      
      // Check if it's a stock error
      if (error?.data?.error && error.data.error.includes('Not enough stock')) {
        // Parse the error message to extract product information
        const errorMatch = error.data.error.match(/product ID: (\d+).*?Requested: (\d+).*?Available: (\d+)/)
        if (errorMatch) {
          const productId = parseInt(errorMatch[1])
          const requested = parseInt(errorMatch[2])
          const available = parseInt(errorMatch[3])
          
          // Find the product name
          const product = products.find((p) => p.id === productId)
          const productName = product?.name || `Товар #${productId}`
          
          setStockErrors([{
            productId,
            productName,
            requested,
            available
          }])
          
          toast.error('Недостаточно товара на складе')
        } else {
          toast.error('Ошибка при создании продажи')
        }
      } else {
        toast.error('Ошибка при создании продажи')
      }
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

  // Filter products based on input (search by name or code)
  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm) return products
    const lowerSearchTerm = searchTerm.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        (p.product_code && p.product_code.toLowerCase().includes(lowerSearchTerm))
    )
  }

  // Handle product selection
  const handleProductSelect = (
    productId: number,
    productName: string,
    productCode: string | null,
    rowIndex: number
  ) => {
    // Find the selected product to get its sales price
    const selectedProduct = products.find((p) => p.id === productId)

    // Set the selected product with auto-populated sales price
    updateItem(rowIndex, {
      product_id: productId,
      product_name: productName,
      product_code: productCode,
      unit_price: selectedProduct ? Number(selectedProduct.selling_price) : 0,
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
          <option value="PAID">Оплачено</option>
          <option value="DEBT">В долг</option>
        </select>
      </div>

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
          const filteredProducts = getFilteredProducts(item.product_name)
          return (
            <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl relative">
              <div className="col-span-12 lg:col-span-3 relative">
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
                <label className="text-xs text-gray-500 lg:hidden">Артикул</label>
                <div className="w-full border rounded-lg px-3 py-2.5 bg-gray-50">{item.product_code || '—'}</div>
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
                    const value = e.target.value.replace(/^0+/, '') || '0'
                    const numValue = Number(value)
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(i, { quantity: numValue })
                    }
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
                  pattern="[0-9]*(.[0-9]+)?"
                  value={item.unit_price === 0 ? '' : item.unit_price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^0+(?=\d)/, '')
                    const numValue = value as any
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(i, { unit_price: numValue })
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, i, 'price')}
                  onFocus={() => {
                    // Add a new row when this input gets focus in the last row
                    if (i === items.length - 1) {
                      addItem()
                    }
                  }}
                  className="w-full border rounded-lg px-3 py-2.5"
                />
              </div>

              <div className="col-span-6 lg:col-span-1 flex items-end">
                <div className="w-full text-center font-semibold py-2.5">
                  {(item.quantity * item.unit_price).toLocaleString()}
                </div>
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

      {/* Total Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-blue-800">
            <span className="font-semibold">Итого : </span>
            <span className="text-xl font-bold">
              {items.reduce((total, item) => total + item.quantity * item.unit_price, 0).toLocaleString()} с
            </span>
          </div>
          <div className="text-sm text-blue-600">
            {items.length} товар{items.length !== 1 ? 'ов' : ''}
          </div>
        </div>
      </div>

      {/* Stock Error Display */}
      {stockErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-red-800">
                  Недостаточно товара на складе
                </h3>
                <button
                  onClick={() => setStockErrors([])}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                {stockErrors.map((error, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{error.productName}</span>
                      <span className="text-sm text-gray-500">ID: {error.productId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Запрошено:</span>
                        <span className="ml-2 font-semibold text-red-600">{error.requested} шт.</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Доступно:</span>
                        <span className="ml-2 font-semibold text-green-600">{error.available} шт.</span>
                      </div>
                    </div>
                    {error.available === 0 && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        Товар полностью отсутствует на складе
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-red-100 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Рекомендация:</strong> Уменьшите количество товара или выберите другой товар для продолжения продажи.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
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
