import { usePostProductMutation } from '@/features/products/api/products.api'
import { Plus, X, Upload, Copy, PackagePlus } from 'lucide-react'
import { Upload as AntUpload, Button } from 'antd'
import { useState, useRef, useEffect } from 'react'

interface ProductFormData {
  name: string
  manufacturer: string
  product_code: string
  image: File | null
}

export const CreateProductModal = ({ onClose }: { onClose: () => void }) => {
  const [products, setProducts] = useState<ProductFormData[]>([{ name: '', manufacturer: '', product_code: '', image: null }])
  const [createProduct, { isLoading }] = usePostProductMutation()
  const [bulkAddCount, setBulkAddCount] = useState(5)
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  // Refs for Excel-like navigation
  const inputRefs = useRef<Map<number, Map<string, HTMLInputElement | null>>>(new Map())

  // Initialize refs array
  useEffect(() => {
    // Clear existing refs
    inputRefs.current.clear()

    // Initialize refs for each item and each field
    products.forEach((_, index) => {
      const fieldMap = new Map<string, HTMLInputElement | null>()
      const fieldNames = ['name', 'manufacturer', 'product_code']

      fieldNames.forEach((fieldName) => {
        fieldMap.set(fieldName, null)
      })

      inputRefs.current.set(index, fieldMap)
    })
  }, [products])

  const updateProduct = (index: number, patch: Partial<ProductFormData>) => {
    setProducts((prev) =>
      prev.map((product, i) => {
        if (i !== index) return product

        return {
          ...product,
          ...patch,
        }
      })
    )
  }

  const addProduct = () => setProducts((p) => [...p, { name: '', manufacturer: '', product_code: '', image: null }])

  const addMultipleProducts = (count: number) => {
    if (count <= 0 || count > 1000) return

    const newProducts = Array(count).fill({ name: '', manufacturer: '', product_code: '', image: null })
    setProducts((prev) => [...prev, ...newProducts])
  }

  const removeProduct = (i: number) => setProducts((p) => p.filter((_, idx) => idx !== i))

  const duplicateRow = (index: number) => {
    const productToDuplicate = { ...products[index] } // Spread all properties
    setProducts((prev) => [...prev, productToDuplicate])
  }

  const clearAllProducts = () => {
    if (window.confirm('Вы уверены, что хотите очистить все товары?')) {
      setProducts([{ name: '', manufacturer: '', product_code: '', image: null }])
    }
  }

  // Excel-like keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    // Handle Enter key to move to next row
    if (e.key === 'Enter') {
      e.preventDefault()

      // If it's the last field in the row, add a new row
      const fieldOrder = ['name', 'manufacturer', 'product_code']
      const currentIndex = fieldOrder.indexOf(fieldName)

      if (currentIndex === fieldOrder.length - 1) {
        // Last field in the row - add new row if it's the last row
        if (rowIndex === products.length - 1) {
          addProduct()
          // Focus on the first field of the new row after a small delay
          setTimeout(() => {
            const nextRowRefMap = inputRefs.current.get(rowIndex + 1)
            if (nextRowRefMap) {
              const nextRowFirstField = nextRowRefMap.get('name')
              nextRowFirstField?.focus()
            }
          }, 10)
        } else {
          // Move to first field of next row
          const nextRowRefMap = inputRefs.current.get(rowIndex + 1)
          if (nextRowRefMap) {
            const nextRowFirstField = nextRowRefMap.get('name')
            nextRowFirstField?.focus()
          }
        }
      } else {
        // Move to next field in the same row
        const nextFieldName = fieldOrder[currentIndex + 1]
        const currentRowRefMap = inputRefs.current.get(rowIndex)
        if (currentRowRefMap) {
          const nextField = currentRowRefMap.get(nextFieldName)
          nextField?.focus()
        }
      }
    }
    // Handle Tab key to move to next field
    else if (e.key === 'Tab') {
      // We'll let the default tab behavior work, but we can customize if needed
    }
  }

  const onCreate = async () => {
    // Validate that at least one product has a name
    const validProducts = products.filter((product) => product.name.trim() !== '')

    if (validProducts.length === 0) {
      alert('Пожалуйста, введите хотя бы один товар')
      return
    }

    for (const product of validProducts) {
      if (!product.name.trim()) continue

      const formData = new FormData()
      formData.append('name', product.name)
      formData.append('product_code', product.product_code)
      if (product.manufacturer.trim()) {
        formData.append('manufacturer', product.manufacturer)
      }
      if (product.image) {
        formData.append('image', product.image)
      }

      try {
        await createProduct(formData).unwrap()
      } catch (error) {
        console.error('Error creating product:', error)
        // Optionally show error message to user
      }
    }

    onClose()
  }

  // Handle bulk addition
  const handleBulkAdd = () => {
    if (bulkAddCount > 0 && bulkAddCount <= 1000) {
      addMultipleProducts(bulkAddCount)
      setIsBulkAdding(false)
    }
  }

  return (
    <div
      style={{
        overflow: 'auto',
      }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Добавить продукты (Excel-режим)</h2>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Bulk operations toolbar */}
        <div className="flex flex-wrap gap-3 items-center p-3 bg-slate-50 rounded-lg border mb-4">
          <span className="text-sm font-medium">Массовое добавление:</span>

          {!isBulkAdding ? (
            <button
              onClick={() => setIsBulkAdding(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} /> Добавить несколько строк
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={bulkAddCount}
                onChange={(e) => setBulkAddCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                className="border rounded px-2 py-1 w-20"
              />
              <span>шт.</span>
              <button onClick={handleBulkAdd} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                OK
              </button>
              <button onClick={() => setIsBulkAdding(false)} className="text-gray-500 hover:text-gray-700">
                Отмена
              </button>
            </div>
          )}

          <button
            onClick={() => addMultipleProducts(10)}
            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
          >
            <Plus size={14} /> 10 строк
          </button>

          <button
            onClick={() => addMultipleProducts(50)}
            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
          >
            <Plus size={14} /> 50 строк
          </button>

          <button
            onClick={clearAllProducts}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
          >
            <X size={14} /> Очистить все
          </button>
        </div>

        {/* Products table header */}
        <div className="grid grid-cols-12 gap-4 bg-slate-100 border p-3 rounded-lg font-semibold text-sm mb-2 hidden lg:grid">
          <div className="col-span-4">Название товара</div>
          <div className="col-span-3">Артикул</div>
          <div className="col-span-3">Производитель</div>
          <div className="col-span-2">Изображение</div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {products.map((product, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl">
              <div className="col-span-12 lg:col-span-5">
                <label className="text-xs text-slate-500 lg:hidden">Название товара</label>
                <input
                  ref={(el) => {
                    if (el) {
                      const rowMap = inputRefs.current.get(i)
                      if (rowMap) {
                        rowMap.set('name', el)
                      }
                    }
                  }}
                  value={product.name}
                  onChange={(e) => updateProduct(i, { name: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'name')}
                  placeholder="Название товара"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  autoFocus={i === 0}
                />
              </div>

              <div className="col-span-12 lg:col-span-3">
                <label className="text-xs text-slate-500 lg:hidden">Артикул</label>
                <input
                  ref={(el) => {
                    if (el) {
                      const rowMap = inputRefs.current.get(i)
                      if (rowMap) {
                        rowMap.set('product_code', el)
                      }
                    }
                  }}
                  value={product.product_code}
                  onChange={(e) => updateProduct(i, { product_code: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'product_code')}
                  placeholder="Артикул товара"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="col-span-12 lg:col-span-3">
                <label className="text-xs text-slate-500 lg:hidden">Производитель</label>
                <input
                  ref={(el) => {
                    if (el) {
                      const rowMap = inputRefs.current.get(i)
                      if (rowMap) {
                        rowMap.set('manufacturer', el)
                      }
                    }
                  }}
                  value={product.manufacturer}
                  onChange={(e) => updateProduct(i, { manufacturer: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'manufacturer')}
                  placeholder="Производитель (опционально)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="col-span-12 lg:col-span-2 flex flex-col">
                <label className="text-xs text-slate-500 lg:hidden mb-1">Изображение</label>
                <AntUpload
                  maxCount={1}
                  accept="image/*"
                  beforeUpload={(file) => {
                    updateProduct(i, { image: file })
                    return false
                  }}
                  onRemove={() => updateProduct(i, { image: null })}
                >
                  <Button icon={<Upload size={16} />}>Загрузить</Button>
                </AntUpload>
                {product.image && <div className="text-xs text-slate-500 truncate mt-1">{product.image.name}</div>}

                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => duplicateRow(i)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded text-xs"
                    title="Копировать строку"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => removeProduct(i)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded text-xs"
                    title="Удалить строку"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={addProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-sm"
          >
            <Plus size={16} />
            Добавить строку
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100">
              Отмена
            </button>

            <button
              onClick={onCreate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50"
            >
              <PackagePlus size={16} />
              Добавить все
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-slate-600 text-right">Всего товаров: {products.length}</div>
      </div>
    </div>
  )
}
