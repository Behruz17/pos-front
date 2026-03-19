import { X, Save, PackagePlus, ShoppingCart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCreateResellerOperationMutation } from '@/features/resellers/api/resellers.api'
import type { TResellerOperationType, TResellerOperationItem } from '@/features/resellers/model/resellerOperations.types'
import { useGetProductsQuery, usePostProductMutation } from '@/features/products/api/products.api'
import { toast } from 'sonner'

type Props = {
  resellerId: number
  resellerName: string
  storeId: number
  onClose: () => void
}

interface TOperationItem {
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  price: number
}

const ResellerOperationModal = ({ resellerId, resellerName, storeId, onClose }: Props) => {
  const [operationType, setOperationType] = useState<TResellerOperationType>('RECEIPT')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<TOperationItem[]>([
    { product_id: 0, product_name: '', product_code: null, quantity: 1, price: 0 }
  ])

  const { data: products = [] } = useGetProductsQuery()
  const [createOperation, { isLoading }] = useCreateResellerOperationMutation()
  const [createProduct, { isLoading: isCreatingProduct }] = usePostProductMutation()

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

  const emptyItem: TOperationItem = { product_id: 0, product_name: '', product_code: null, quantity: 1, price: 0 }

  const addItem = () => setItems(prev => [...prev, emptyItem])
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))
  const updateItem = (index: number, patch: Partial<TOperationItem>) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...patch } : item
    ))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldType: 'product' | 'quantity' | 'price') => {
    if (e.key === 'Tab') return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (fieldType === 'product') {
        refs.current[rowIndex]?.quantityRef.current?.focus()
      } else if (fieldType === 'quantity') {
        refs.current[rowIndex]?.priceRef.current?.focus()
      } else if (fieldType === 'price') {
        if (rowIndex < items.length - 1) {
          refs.current[rowIndex + 1]?.productInputRef.current?.focus()
        } else {
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
    const selectedProduct = products.find((p) => p.id === productId)
    updateItem(rowIndex, {
      product_id: productId,
      product_name: productName,
      product_code: productCode,
      price: selectedProduct ? Number(selectedProduct.selling_price) : 0,
    })
    setTimeout(() => {
      refs.current[rowIndex]?.quantityRef.current?.focus()
    }, 0)
  }

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const isFormValid = () => {
    return items.every(item => 
      (item.product_id > 0 || (item.product_id === 0 && item.product_name.trim())) && 
      item.quantity > 0 && 
      item.price >= 0
    )
  }

  const isSaving = isLoading || isCreatingProduct

  const handleSubmit = async () => {
    if (!isFormValid()) return

    try {
      // Create a copy of items to modify
      const updatedItems = [...items]

      // Process each item to handle new product creation
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i]
        
        // Check if product_id is 0 (meaning it's a new product name that doesn't exist)
        if (item.product_id === 0 && item.product_name.trim()) {
          // This means user entered a product name that doesn't exist yet
          // Create the product first
          const formData = new FormData()
          formData.append('name', item.product_name.trim())
          
          // Only add product_code if it has a value (empty string causes duplicate error)
          const productCode = item.product_code?.trim()
          if (productCode) {
            formData.append('product_code', productCode)
          }
          
          try {
            const result = await createProduct(formData).unwrap()
            // Update the item with the newly created product ID
            updatedItems[i] = {
              ...item,
              product_id: result.id,
              product_name: result.name,
              product_code: productCode || '',
            }
            toast.success(`Продукт "${result.name}" успешно создан`)
          } catch (error) {
            return // Stop the process if product creation fails
          }
        }
      }

      // Convert TOperationItem to TResellerOperationItem for API
      const apiItems: TResellerOperationItem[] = updatedItems
        .filter(item => item.product_id > 0)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))

      await createOperation({
        resellerId,
        data: {
          type: operationType,
          store_id: storeId,
          note: note.trim() || undefined,
          items: apiItems
        }
      }).unwrap()

      onClose()
    } catch (error) {
      // Error handling
    }
  }

  const getOperationIcon = () => {
    switch (operationType) {
      case 'RECEIPT': return <PackagePlus size={20} />
      case 'SALE': return <ShoppingCart size={20} />
      // case 'RETURN': return <RotateCcw size={20} />
      default: return <PackagePlus size={20} />
    }
  }

  const getOperationTitle = () => {
    switch (operationType) {
      case 'RECEIPT': return 'Приход от реселлера'
      case 'SALE': return 'Продажа реселлеру'
      // case 'RETURN': return 'Возврат товаров'
      default: return 'Операция с реселлером'
    }
  }

  const getOperationDescription = () => {
    switch (operationType) {
      case 'RECEIPT': return 'Вы принимаете товары от реселлера на склад'
      case 'SALE': return 'Вы продаете товары реселлеру со склада'
      // case 'RETURN': return 'Товары возвращаются на склад'
      default: return 'Операция с товарами реселлера'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              {getOperationIcon()}
              {getOperationTitle()}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {getOperationDescription()} • Реселлер: {resellerName}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Operation Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Тип операции</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'RECEIPT' as const, label: 'Приход', color: 'green' },
                { value: 'SALE' as const, label: 'Продажа', color: 'blue' },
                // { value: 'RETURN' as const, label: 'Возврат', color: 'orange' }
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setOperationType(value)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    operationType === value
                      ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Комментарий</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Введите комментарий к операции..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-slate-700">Товары</label>
              <button
                onClick={addItem}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <PackagePlus size={16} />
                Добавить товар
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const filteredProducts = getFilteredProducts(item.product_name)
                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 relative">
                      <input
                        ref={refs.current[index]?.productInputRef}
                        type="text"
                        value={item.product_name}
                        onChange={(e) => updateItem(index, { product_name: e.target.value, product_id: 0, product_code: '' })}
                        onKeyDown={(e) => handleKeyDown(e, index, 'product')}
                        placeholder="Поиск товара..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      {/* Dropdown for product suggestions */}
                      {!item.product_id && item.product_name && filteredProducts.length > 0 && (
                        <div
                          ref={refs.current[index]?.productDropdownRef}
                          className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
                        >
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleProductSelect(product.id, product.name, product.product_code, index)}
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500">Артикул: {product.product_code}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.product_code || ''}
                        onChange={(e) => updateItem(index, { product_code: e.target.value })}
                        placeholder="Артикул"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        ref={refs.current[index]?.quantityRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => {
                          const value = e.target.value.replace(/^0+/, '') || '0'
                          const numValue = Number(value)
                          if (!isNaN(numValue) && numValue >= 0) {
                            updateItem(index, { quantity: numValue })
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                        placeholder="Кол-во"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        ref={refs.current[index]?.priceRef}
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*(.[0-9]+)?"
                        value={item.price === 0 ? '' : item.price}
                        onChange={(e) => {
                          const value = e.target.value.replace(/^0+(?=\d)/, '')
                          const numValue = Number(value)
                          if (!isNaN(numValue) && numValue >= 0) {
                            updateItem(index, { price: numValue })
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, 'price')}
                        onFocus={() => {
                          // Add a new row when this input gets focus in the last row
                          if (index === items.length - 1) {
                            addItem()
                          }
                        }}
                        placeholder="Цена"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-1">
                      {items.length > 1 && (
                        <button
                          ref={refs.current[index]?.removeButtonRef}
                          onClick={() => removeItem(index)}
                          className="w-full p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-800">Общая сумма:</span>
              <span className="text-xl font-bold text-blue-600">
                {getTotalAmount().toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-slate-50">
            <button
              onClick={onClose}
              className="cursor-pointer px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition"
            >
              Отмена
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSaving || !isFormValid()}
              className="
              cursor-pointer inline-flex items-center justify-center gap-2
                px-5 py-2 rounded-lg
                bg-blue-600 text-white text-sm font-medium
                hover:bg-blue-700
                disabled:opacity-50 
              "
            >
              <Save size={16} />
              {isSaving ? 'Сохранение...' : 'Выполнить'}
            </button>
          </div>
          </div>
      </div>
    </div>
  )
}

export default ResellerOperationModal
