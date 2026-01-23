/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGetProductsQuery, usePostProductMutation } from '@/features/products/api/products.api'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import { useGetSuppliersQuery } from '@/features/suppliers/api/suppliers.api'
import { usePostReceiptMutation } from '../api/receipt.api'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Plus, Trash2, PackagePlus, Copy } from 'lucide-react'
import type { TReceiptItem } from '../model/receipt.types'
import { toast } from 'sonner'

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
  product_name: '',
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
  const { data: suppliers = [] } = useGetSuppliersQuery()
  const [createReceipt, { isLoading }] = usePostReceiptMutation()
  const [createProduct, { isLoading: isCreatingProduct }] = usePostProductMutation()

  const [supplierId, setSupplierId] = useState('')

  const [warehouseId, setWarehouseId] = useState('')
  const [items, setItems] = useState<(typeof emptyItem)[]>([emptyItem])

  // State for bulk operations
  const [bulkAddCount, setBulkAddCount] = useState(5)
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  // Refs for Excel-like navigation
  const inputRefs = useRef<Map<number, Map<string, HTMLInputElement | HTMLSelectElement | null>>>(new Map())

  // Initialize refs array
  useEffect(() => {
    // Clear existing refs
    inputRefs.current.clear()

    // Initialize refs for each item and each field
    items.forEach((_, index) => {
      const fieldMap = new Map<string, HTMLInputElement | HTMLSelectElement | null>()
      const fieldNames = [
        'product_id',
        'boxes_qty',
        'pieces_per_box',
        'loose_pieces',
        'purchase_cost',
        'markup_percent',
      ]

      fieldNames.forEach((fieldName) => {
        fieldMap.set(fieldName, null)
      })

      inputRefs.current.set(index, fieldMap)
    })
  }, [items])

  const updateItem = (index: number, patch: Partial<typeof emptyItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        const next = { ...item, ...patch }

        // Update product_name when product_id changes
        if (patch.product_id && !patch.product_name) {
          const product = products.find(p => p.id.toString() === patch.product_id)
          if (product) {
            next.product_name = product.name
          }
        }
        
        // If product_id is not a number, it means it's a new product name
        if (patch.product_id && isNaN(Number(patch.product_id))) {
          next.product_name = patch.product_id; // Ensure product_name matches the entered name
        }

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

  const addMultipleItems = (count: number) => {
    if (count <= 0 || count > 1000) return

    const newItems = Array(count).fill(emptyItem)
    setItems((prev) => [...prev, ...newItems])
  }

  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))

  const duplicateRow = (index: number) => {
    const itemToDuplicate = { ...items[index] }
    // Reset IDs and calculated fields
    itemToDuplicate.product_id = ''
    itemToDuplicate.selling_price = ''
    itemToDuplicate.amount = ''
    setItems((prev) => [...prev, itemToDuplicate])
  }

  const clearAllItems = () => {
    if (window.confirm('Вы уверены, что хотите очистить все товары?')) {
      setItems([emptyItem])
    }
  }

  const isInvalid = useMemo(
    () => !warehouseId || !supplierId || items.some((i) => !i.product_id || !i.product_name || !i.boxes_qty || !i.pieces_per_box || !i.purchase_cost || Number(i.boxes_qty) < 0 || Number(i.pieces_per_box) < 0 || Number(i.purchase_cost) <= 0),
    [warehouseId, supplierId, items]
  )

  // Handle bulk addition
  const handleBulkAdd = () => {
    if (bulkAddCount > 0 && bulkAddCount <= 1000) {
      addMultipleItems(bulkAddCount)
      setIsBulkAdding(false)
    }
  }

  // Excel-like keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    // Handle Enter key to move to next row
    if (e.key === 'Enter') {
      e.preventDefault()

      // If it's the last field in the row, add a new row
      const fieldOrder = [
        'product_id',
        'boxes_qty',
        'pieces_per_box',
        'loose_pieces',
        'purchase_cost',
        'markup_percent',
      ]
      const currentIndex = fieldOrder.indexOf(fieldName)

      if (currentIndex === fieldOrder.length - 1) {
        // Last field in the row - add new row if it's the last row
        if (rowIndex === items.length - 1) {
          addItem()
          // Focus on the first field of the new row after a small delay
          setTimeout(() => {
            const nextRowRefMap = inputRefs.current.get(rowIndex + 1)
            if (nextRowRefMap) {
              const nextRowFirstField = nextRowRefMap.get('product_id')
              nextRowFirstField?.focus()
            }
          }, 10)
        } else {
          // Move to first field of next row
          const nextRowRefMap = inputRefs.current.get(rowIndex + 1)
          if (nextRowRefMap) {
            const nextRowFirstField = nextRowRefMap.get('product_id')
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

  const onSubmit = async () => {
    if (isInvalid) return

    try {
      // Check if any items have non-existent products and create them first
      let updatedItems = [...items];
      
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        // Check if the product_id is actually a name (not a number)
        const productIdNum = Number(item.product_id);
        if (isNaN(productIdNum)) {
          // This means user entered a product name that doesn't exist yet
          // Create the product first
          const formData = new FormData();
          formData.append('name', item.product_id); // Use the entered name as product name
          
          try {
            const result = await createProduct(formData).unwrap();
            // Update the item with the newly created product ID
            updatedItems[i] = {
              ...item,
              product_id: result.id.toString(),
              product_name: result.name,
            };
            toast.success(`Продукт "${result.name}" успешно создан`);
          } catch (error) {
            console.error('Error creating product:', error);
            toast.error('Ошибка при создании продукта');
            return; // Stop the process if product creation fails
          }
        }
      }

      await createReceipt({
        warehouse_id: Number(warehouseId),
        supplier_id: Number(supplierId),
        items: updatedItems,
      }).unwrap()

      toast.success('Приход успешно оформлен');
      setWarehouseId('');
      setSupplierId('');
      setItems([emptyItem]);
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error('Ошибка при оформлении прихода');
    }
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

      <div>
        <label className="text-sm font-medium">Поставщик</label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2.5"
        >
          <option value="">Выберите поставщика</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk operations toolbar */}
      <div className="flex flex-wrap gap-3 items-center p-3 bg-white rounded-lg border">
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
          onClick={() => addMultipleItems(10)}
          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
        >
          <Plus size={14} /> 10 строк
        </button>

        <button
          onClick={() => addMultipleItems(50)}
          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
        >
          <Plus size={14} /> 50 строк
        </button>

        <button onClick={clearAllItems} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm">
          <Trash2 size={14} /> Очистить все
        </button>
      </div>

      {/* Items table header */}
      <div className="grid grid-cols-12 gap-2 bg-gray-100 border p-3 rounded-lg font-semibold text-sm hidden lg:grid">
        <div className="col-span-3">Товар</div>
        <div className="col-span-1">Коробки</div>
        <div className="col-span-1">Шт. в кор.</div>
        <div className="col-span-1">Отд. шт.</div>
        <div className="col-span-1">Цена зак.</div>
        <div className="col-span-1">Наценка %</div>
        <div className="col-span-1">Цена прод.</div>
        <div className="col-span-1">Сумма</div>
        <div className="col-span-2">Действия</div>
      </div>

      {items.map((item, i) => (
        <div key={`${i}-${item.product_id}`} className="grid grid-cols-12 gap-2 bg-white border p-2 rounded-xl">
          <div className="col-span-12 lg:col-span-3">
            <label className="text-xs text-gray-500 lg:hidden">Товар</label>
            <div className="relative">
              <input
                ref={(el) => {
                  if (el) {
                    const rowMap = inputRefs.current.get(i)
                    if (rowMap) {
                      rowMap.set('product_id', el)
                    }
                  }
                }}
                value={item.product_name || item.product_id}
                onChange={(e) => {
                  const query = e.target.value
                  // Update the input field with the query
                  updateItem(i, { product_id: query, product_name: query })
                }}
                onKeyDown={(e) => {
                  // Handle Enter key to select the first suggestion if available
                  if (e.key === 'Enter') {
                    const filteredProducts = products.filter(
                      (p) =>
                        p.name.toLowerCase().includes(item.product_id.toLowerCase()) &&
                        p.name.toLowerCase() !== item.product_id.toLowerCase() // Don't re-select the same product
                    )
                    if (filteredProducts.length > 0) {
                      updateItem(i, { product_id: filteredProducts[0].id.toString(), product_name: filteredProducts[0].name })
                      e.preventDefault() // Prevent moving to next field
                    } else {
                      // Check if the entered value is not a product name that exists
                      const existingProduct = products.find(p => p.name.toLowerCase() === item.product_id.toLowerCase());
                      if (!existingProduct) {
                        // User entered a new product name, keep it as is
                        updateItem(i, { product_id: item.product_id, product_name: item.product_id });
                      }
                      handleKeyDown(e, i, 'product_id') // Continue with normal navigation
                    }
                  } else {
                    handleKeyDown(e, i, 'product_id')
                  }
                }}
                className="w-full border rounded px-2 py-1.5 text-sm"
                placeholder="Начните вводить название товара..."
                autoFocus={i === 0}
              />
              {item.product_id &&
                products.filter(
                  (p) =>
                    p.name.toLowerCase().includes(item.product_id.toLowerCase()) &&
                    p.name.toLowerCase() !== item.product_id.toLowerCase()
                ).length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(item.product_id.toLowerCase()) &&
                          p.name.toLowerCase() !== item.product_id.toLowerCase()
                      )
                      .slice(0, 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => updateItem(i, { product_id: p.id.toString() })}
                        >
                          {p.name}
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Коробки</label>
            <input
              ref={(el) => {
                const rowMap = inputRefs.current.get(i)
                if (rowMap) {
                  rowMap.set('boxes_qty', el)
                }
              }}
              value={item.boxes_qty}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                updateItem(i, { boxes_qty: e.target.value })
              }}
              onKeyDown={(e) => handleKeyDown(e, i, 'boxes_qty')}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Шт. в кор.</label>
            <input
              ref={(el) => {
                const rowMap = inputRefs.current.get(i)
                if (rowMap) {
                  rowMap.set('pieces_per_box', el)
                }
              }}
              value={item.pieces_per_box}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                updateItem(i, { pieces_per_box: e.target.value })
              }}
              onKeyDown={(e) => handleKeyDown(e, i, 'pieces_per_box')}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Отд. шт.</label>
            <input
              ref={(el) => {
                const rowMap = inputRefs.current.get(i)
                if (rowMap) {
                  rowMap.set('loose_pieces', el)
                }
              }}
              value={item.loose_pieces}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                updateItem(i, { loose_pieces: e.target.value })
              }}
              onKeyDown={(e) => handleKeyDown(e, i, 'loose_pieces')}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Цена зак.</label>
            <input
              ref={(el) => {
                const rowMap = inputRefs.current.get(i)
                if (rowMap) {
                  rowMap.set('purchase_cost', el)
                }
              }}
              value={item.purchase_cost}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                updateItem(i, { purchase_cost: e.target.value })
              }}
              onKeyDown={(e) => handleKeyDown(e, i, 'purchase_cost')}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Наценка %</label>
            <input
              ref={(el) => {
                const rowMap = inputRefs.current.get(i)
                if (rowMap) {
                  rowMap.set('markup_percent', el)
                }
              }}
              value={item.markup_percent}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                updateItem(i, { markup_percent: e.target.value })
              }}
              onKeyDown={(e) => handleKeyDown(e, i, 'markup_percent')}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Цена прод.</label>
            <input
              value={item.selling_price}
              readOnly
              className="w-full border bg-gray-100 rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-6 lg:col-span-1">
            <label className="text-xs text-gray-500 lg:hidden">Сумма</label>
            <input
              value={item.amount}
              readOnly
              className="w-full border bg-gray-100 rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-12 lg:col-span-2 flex gap-1 mt-1 lg:mt-0">
            <button
              onClick={() => duplicateRow(i)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded text-sm"
              title="Копировать строку"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => removeItem(i)}
              className="p-2 text-red-600 hover:bg-red-100 rounded text-sm"
              title="Удалить строку"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3 pt-4">
        <button onClick={addItem} className="flex gap-2 text-blue-600">
          <Plus /> Добавить товар
        </button>

        <button
          disabled={isInvalid || isLoading || isCreatingProduct}
          onClick={onSubmit}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400"
        >
          <PackagePlus /> {isCreatingProduct ? 'Создание продукта...' : 'Оформить приход'}
        </button>

        <div className="ml-auto text-sm text-gray-600">Всего товаров: {items.length}</div>
      </div>
    </div>
  )
}

export default AdminReceiptForm
