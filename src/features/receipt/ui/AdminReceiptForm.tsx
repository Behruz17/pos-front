/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGetProductsQuery, usePostProductMutation } from '@/features/products/api/products.api'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import { useGetSuppliersQuery } from '@/features/suppliers/api/suppliers.api'
import { usePostReceiptMutation } from '../api/receipt.api'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Plus, Trash2, PackagePlus, Copy, Upload, Download } from 'lucide-react'
import type { TReceiptItem } from '../model/receipt.types'
import * as XLSX from 'xlsx'
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
  product_code: '',
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

// Define expected Excel column mapping
interface ExcelReceiptItem {
  // Russian column names
  товар?: string
  коробки?: string | number
  'шт.'?: string | number
  'отд шт'?: string | number
  'цена зак'?: string | number
  'наценка %'?: string | number
  'цена прод'?: string | number
  сумма?: string | number
  'вес кг'?: string | number
  'объем м3'?: string | number
  // English column names (alternative)
  product_name?: string
  product_id?: string
  boxes_qty?: string | number
  pieces_per_box?: string | number
  loose_pieces?: string | number
  purchase_cost?: string | number
  markup_percent?: string | number
  selling_price?: string | number
  amount?: string | number
  weight_kg?: string | number
  volume_cbm?: string | number
}

const AdminReceiptForm = () => {
  const { data: warehouses = [] } = useGetWarehousesQuery()
  const { data: products = [] } = useGetProductsQuery()
  const { data: suppliers = [] } = useGetSuppliersQuery()
  const [createReceipt, { isLoading }] = usePostReceiptMutation()
  const [createProduct, { isLoading: isCreatingProduct }] = usePostProductMutation()

  const [supplierId, setSupplierId] = useState('')

  const [warehouseId, setWarehouseId] = useState('')
  const [items, setItems] = useState<(typeof emptyItem)[]>([emptyItem, emptyItem])

  // State for bulk operations
  const [bulkAddCount, setBulkAddCount] = useState(5)
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  // State for Excel import
  const [excelImporting, setExcelImporting] = useState(false)
  // State for Excel export
  const [excelExporting, setExcelExporting] = useState(false)

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
        'product_code',
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

        // Update product_name and product_code when product_id changes
        if (patch.product_id && !patch.product_name) {
          const product = products.find(p => p.id.toString() === patch.product_id)
          if (product) {
            next.product_name = product.name
            next.product_code = product.product_code || ''
          }
        }
        
        // If product_id is not a number, it means it's a new product name
        if (patch.product_id && isNaN(Number(patch.product_id))) {
          next.product_name = patch.product_id; // Ensure product_name matches the entered name
          next.product_code = ''; // Reset product_code for new products
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
    itemToDuplicate.product_code = '' // Reset product_code for new item
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
    () => !warehouseId || !supplierId || items.some((i) => !i.product_id || !i.product_name || (!i.product_code && isNaN(Number(i.product_id))) || !i.boxes_qty || !i.pieces_per_box || !i.purchase_cost || Number(i.boxes_qty) < 0 || Number(i.pieces_per_box) < 0 || Number(i.purchase_cost) <= 0),
    [warehouseId, supplierId, items]
  )

  // Handle bulk addition
  const handleBulkAdd = () => {
    if (bulkAddCount > 0 && bulkAddCount <= 1000) {
      addMultipleItems(bulkAddCount)
      setIsBulkAdding(false)
    }
  }

  // Handle Excel file import
  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setExcelImporting(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        // Assuming the first sheet contains the data
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const jsonData: ExcelReceiptItem[] = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
          alert('Excel файл не содержит данных или имеет неправильный формат')
          setExcelImporting(false)
          return
        }

        // Process imported data
        const processedItems = jsonData.map((row) => {
          // Find product by name if product_id is not provided
          let productId = row.product_id || row.товар || ''
          let productName = ''
          let productCode = ''
          
          if (!productId && (row.product_name || row.товар)) {
            const nameToFind = row.product_name || row.товар
            const foundProduct = products.find((p) => p.name.toLowerCase() === nameToFind!.toLowerCase())
            if (foundProduct) {
              productId = foundProduct.id.toString()
              productName = foundProduct.name
              productCode = foundProduct.product_code || ''
            } else {
              // If exact match not found, try partial match
              const partialMatch = products.find((p) => p.name.toLowerCase().includes(nameToFind!.toLowerCase()))
              if (partialMatch) {
                productId = partialMatch.id.toString()
                productName = partialMatch.name
                productCode = partialMatch.product_code || ''
              }
            }
          }

          // Calculate derived values with support for both English and Russian column names
          const purchaseCost = String(row.purchase_cost || row['цена зак'] || '0')
          const markupPercent = String(row.markup_percent || row['наценка %'] || '0')
          const boxesQty = String(row.boxes_qty || row.коробки || '0')
          const piecesPerBox = String(row.pieces_per_box || row['шт.'] || '0')
          const loosePieces = String(row.loose_pieces || row['отд шт'] || '0')
          const sellingPrice = String(
            row.selling_price || row['цена прод'] || calcSellingPrice(purchaseCost, markupPercent)
          )
          const amount = String(
            row.amount || row.сумма || calcAmount(boxesQty, piecesPerBox, purchaseCost, loosePieces)
          )
          const weightKg = String(row.weight_kg || row['вес кг'] || '')
          const volumeCbm = String(row.volume_cbm || row['объем м3'] || '')

          return {
            product_id: productId,
            product_name: productName,
            product_code: productCode,
            boxes_qty: boxesQty,
            pieces_per_box: piecesPerBox,
            loose_pieces: loosePieces,
            weight_kg: weightKg,
            volume_cbm: volumeCbm,
            purchase_cost: purchaseCost,
            selling_price: sellingPrice,
            amount: amount,
            markup_percent: markupPercent,
          }
        })

        // Update the items state
        setItems(processedItems)

        setExcelImporting(false)
        alert(`Импортировано ${processedItems.length} товаров из Excel файла`)
      }

      reader.onerror = () => {
        alert('Ошибка при чтении Excel файла')
        setExcelImporting(false)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error importing Excel:', error)
      alert('Произошла ошибка при импорте Excel файла')
      setExcelImporting(false)
    }
  }

  // Trigger file input click
  const triggerExcelImport = () => {
    const fileInput = document.getElementById('excel-upload') as HTMLInputElement
    fileInput?.click()
  }

  // Handle Excel file export
  const handleExcelExport = () => {
    setExcelExporting(true)
    
    try {
      // Prepare data for export
      const exportData = items.map((item, index) => ({
        '#': index + 1,
        'Товар': item.product_name || products.find(p => p.id.toString() === item.product_id)?.name || item.product_id || '',
        'Коробки': item.boxes_qty || 0,
        'Шт. в кор.': item.pieces_per_box || 0,
        'Отд. шт.': item.loose_pieces || 0,
        'Цена зак.': item.purchase_cost || 0,
        'Наценка %': item.markup_percent || 0,
        'Цена прод.': item.selling_price || 0,
        'Сумма': item.amount || 0,
        'Вес кг': item.weight_kg || '',
        'Объем м3': item.volume_cbm || ''
      }))
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        const amount = parseFloat(item.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      // Add total row to the export data
      exportData.push({
        '#': '',
        'Товар': 'ИТОГО:',
        'Коробки': '',
        'Шт. в кор.': '',
        'Отд. шт.': '',
        'Цена зак.': '',
        'Наценка %': '',
        'Цена прод.': '',
        'Сумма': totalAmount,
        'Вес кг': '',
        'Объем м3': ''
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Товары')
      
      // Generate filename with timestamp
      const fileName = `receipt_items_${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Export file
      XLSX.writeFile(workbook, fileName)
      
      toast.success('Файл успешно экспортирован')
      setExcelExporting(false)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Произошла ошибка при экспорте в Excel')
      setExcelExporting(false)
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
        'product_code',
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
          formData.append('product_code', item.product_code || ''); // Use the entered product code
          
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

        <button
          onClick={triggerExcelImport}
          disabled={excelImporting}
          className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm"
        >
          <Upload size={14} /> {excelImporting ? 'Импорт...' : 'Импорт из Excel'}
        </button>

        <button
          onClick={handleExcelExport}
          disabled={excelExporting || items.length === 0}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm"
        >
          <Download size={14} /> {excelExporting ? 'Экспорт...' : 'Экспорт в Excel'}
        </button>
      </div>

      {/* Hidden file input for Excel import */}
      <input id="excel-upload" type="file" accept=".xlsx, .xls" onChange={handleExcelImport} className="hidden" />

      {/* Items table header */}
      <div className="grid grid-cols-12 gap-2 bg-gray-100 border p-3 rounded-lg font-semibold text-sm hidden lg:grid">
        <div className="col-span-3">Товар</div>
        <div className="col-span-3">Артикул</div>
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
        <div key={i} className="grid grid-cols-12 gap-2 bg-white border p-2 rounded-xl">
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
                value={
                  item.product_id
                    ? products.find((p) => p.id.toString() === item.product_id)?.name || item.product_id
                    : ''
                }
                onChange={(e) => {
                  const query = e.target.value
                  // Check if this is a product name that needs to be converted to ID
                  const foundProduct = products.find((p) => p.name === query)
                  if (foundProduct) {
                    updateItem(i, { product_id: foundProduct.id.toString(), product_code: '' }) // Reset product_code when selecting existing product
                  } else {
                    // Update the input field with the query
                    updateItem(i, { product_id: query, product_code: '' }) // Reset product_code for new products
                  }
                }}
                onKeyDown={(e) => {
                  // Handle Enter key to select the first suggestion if available
                  if (e.key === 'Enter') {
                    const filteredProducts = products.filter(
                      (p) =>
                        p.name.toLowerCase().includes((item.product_id || '').toLowerCase()) &&
                        p.name.toLowerCase() !== (item.product_id || '').toLowerCase() // Don't re-select the same product
                    )
                    if (filteredProducts.length > 0) {
                      updateItem(i, { product_id: filteredProducts[0].id.toString(), product_name: filteredProducts[0].name, product_code: '' }) // Reset product_code when selecting existing product
                      e.preventDefault() // Prevent moving to next field
                    } else {
                      // Check if the entered value is not a product name that exists
                      const existingProduct = products.find(p => p.name.toLowerCase() === item.product_id.toLowerCase());
                      if (!existingProduct) {
                        // User entered a new product name, keep it as is
                        updateItem(i, { product_id: item.product_id, product_name: item.product_id, product_code: '' }); // Reset product_code for new products
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
                products.filter((p) => {
                  const searchValue = item.product_id || ''
                  return (
                    p.name.toLowerCase().includes(searchValue.toLowerCase()) &&
                    p.name.toLowerCase() !== searchValue.toLowerCase()
                  )
                }).length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes((item.product_id || '').toLowerCase()) &&
                          p.name.toLowerCase() !== (item.product_id || '').toLowerCase()
                      )
                      .slice(0, 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => updateItem(i, { product_id: p.id.toString(), product_code: '' })} // Reset product_code when selecting existing product
                        >
                          {p.name}
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <label className="text-xs text-gray-500 lg:hidden">Артикул</label>
            <input
              ref={(el) => {
                const rowMap = inputRefs.current.get(i)
                if (rowMap) {
                  rowMap.set('product_code', el)
                }
              }}
              value={item.product_code}
              onChange={(e) => updateItem(i, { product_code: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, i, 'product_code')}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="Введите артикул товара..."
              disabled={!!item.product_id && !isNaN(Number(item.product_id))} // Disable if existing product is selected
            />
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
              onFocus={() => {
                // Add a new row when this input gets focus
                if (i === items.length - 1) {
                  addItem();
                }
              }}
              className="w-full border bg-gray-100 rounded px-2 py-1.5 text-sm"
              placeholder="0"
            />
          </div>

          <div className="col-span-12 lg:col-span-1 flex gap-1 mt-1 lg:mt-0">
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
