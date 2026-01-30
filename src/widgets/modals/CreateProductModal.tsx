import { usePostProductMutation } from '@/features/products/api/products.api'
import { useGetProductsQuery } from '@/features/products/api/products.api'
import { Plus, X, Upload, Copy, PackagePlus } from 'lucide-react'
import { Upload as AntUpload, Button } from 'antd'
import { useState, useRef, useEffect } from 'react'

interface ProductFormData {
  name: string
  manufacturer: string
  product_code: string
  notification_threshold: string
  image: File | null
}

export const CreateProductModal = ({ onClose }: { onClose: () => void }) => {
  const [products, setProducts] = useState<ProductFormData[]>([{ name: '', manufacturer: '', product_code: '', notification_threshold: '', image: null }])
  const [createProduct, { isLoading }] = usePostProductMutation()
  const { data: existingProducts = [] } = useGetProductsQuery()

  // Refs for Excel-like navigation
  const inputRefs = useRef<Map<number, Map<string, HTMLInputElement | null>>>(new Map())

  // Initialize refs array
  useEffect(() => {
    // Clear existing refs
    inputRefs.current.clear()

    // Initialize refs for each item and each field
    products.forEach((_, index) => {
      const fieldMap = new Map<string, HTMLInputElement | null>()
      const fieldNames = ['name', 'manufacturer', 'product_code', 'notification_threshold']

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

  // Function to check if a product code is duplicate
  const isDuplicateCode = (index: number, code: string) => {
    if (!code.trim()) return false; // Empty codes are not considered duplicates
    
    // Check against other products in the form
    for (let i = 0; i < products.length; i++) {
      if (i !== index && products[i].product_code.trim() === code.trim()) {
        return true;
      }
    }
    
    // Check against existing products from the database
    if (existingProducts.some(existing => existing.product_code === code.trim())) {
      return true;
    }
    
    return false;
  }

  const addProduct = () => setProducts((p) => [...p, { name: '', manufacturer: '', product_code: '', notification_threshold: '', image: null }])

  const removeProduct = (i: number) => setProducts((p) => p.filter((_, idx) => idx !== i))

  const duplicateRow = (index: number) => {
    const productToDuplicate = { ...products[index] } // Spread all properties
    setProducts((prev) => [...prev, productToDuplicate])
  }



  // Function to check if at least one product has all required fields filled
  const isAnyProductValid = () => {
    return products.some(product => 
      product.name.trim() !== '' && product.product_code.trim() !== ''
    );
  };

  // Excel-like keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    // Handle Enter key to move to next row
    if (e.key === 'Enter') {
      e.preventDefault()

      // If it's the last field in the row, add a new row
      const fieldOrder = ['name', 'manufacturer', 'product_code', 'notification_threshold']
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
    // Validate that at least one product has a name and product code
    const validProducts = products.filter((product) => product.name.trim() !== '' && product.product_code.trim() !== '')

    if (validProducts.length === 0) {
      alert('Пожалуйста, введите название и артикул хотя бы для одного товара')
      return
    }

    // Check that all valid products have a product code
    for (const product of validProducts) {
      if (!product.product_code.trim()) {
        alert('Артикул обязателен для всех товаров');
        return;
      }
    }

    // Validate each product individually
    for (const product of validProducts) {
      if (!product.name.trim()) {
        alert('Название товара обязательно');
        return;
      }
      if (!product.product_code.trim()) {
        alert('Артикул обязателен');
        return;
      }
    }

    // Check for duplicate product codes in the current form
    const productCodes = validProducts.map(p => p.product_code.trim()).filter(code => code !== '');
    const uniqueCodes = new Set(productCodes);
    if (productCodes.length !== uniqueCodes.size) {
      alert('Ошибка: Обнаружены повторяющиеся артикулы в форме');
      return;
    }

    // Check for duplicate product codes against existing products
    for (const product of validProducts) {
      if (product.product_code.trim() && 
          existingProducts.some(existing => existing.product_code === product.product_code.trim())) {
        alert(`Ошибка: Артикул "${product.product_code}" уже существует`);
        return;
      }
    }

    for (const product of validProducts) {
      if (!product.name.trim()) continue

      const formData = new FormData()
      formData.append('name', product.name)
      formData.append('product_code', product.product_code)
      if (product.notification_threshold.trim()) {
        formData.append('notification_threshold', product.notification_threshold)
      }
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



        {/* Products table header */}
        <div className="grid grid-cols-12 gap-4 bg-slate-100 border p-3 rounded-lg font-semibold text-sm mb-2 hidden lg:grid">
          <div className="col-span-3">Название товара</div>
          <div className="col-span-2">Артикул *</div>
          <div className="col-span-2">Производитель</div>
          <div className="col-span-2">Порог уведомления</div>
          <div className="col-span-1">Изображение</div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {products.map((product, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 bg-white border p-3 rounded-xl">
              <div className="col-span-12 lg:col-span-4">
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

              <div className="col-span-12 lg:col-span-2">
                <label className="text-xs text-slate-500 lg:hidden">Артикул *</label>
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
                  placeholder="Артикул товара *"
                  required
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    isDuplicateCode(i, product.product_code)
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300'
                  }`}
                />
                {isDuplicateCode(i, product.product_code) && (
                  <p className="text-xs text-red-600 mt-1">Артикул уже существует</p>
                )}
              </div>

              <div className="col-span-12 lg:col-span-2">
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

              <div className="col-span-12 lg:col-span-2">
                <label className="text-xs text-slate-500 lg:hidden">Порог уведомления</label>
                <input
                  ref={(el) => {
                    if (el) {
                      const rowMap = inputRefs.current.get(i)
                      if (rowMap) {
                        rowMap.set('notification_threshold', el)
                      }
                    }
                  }}
                  value={product.notification_threshold}
                  onChange={(e) => updateProduct(i, { notification_threshold: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, i, 'notification_threshold')}
                  placeholder="Порог уведомления"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="col-span-12 lg:col-span-1 flex flex-col">
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
              disabled={isLoading || !isAnyProductValid()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PackagePlus size={16} />
              Добавить все
            </button>
          </div>
        </div>
        
        {!isAnyProductValid() && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">
            Заполните хотя бы одну строку с названием и артикулом
          </div>
        )}

        <div className="mt-2 text-sm text-slate-600 text-right">Всего товаров: {products.length}</div>
      </div>
    </div>
  )
}
