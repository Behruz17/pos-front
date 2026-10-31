/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGetProductsQuery, usePostProductMutation, usePutProductMutation } from '@/features/products/api/products.api'
import { useGetSuppliersQuery } from '@/features/suppliers/api/suppliers.api'
import { useGetWarehouseDeliveryDriversQuery } from '@/features/warehouses/api/warehouses.api'
import { usePostReceiptMutation } from '../api/receipt.api'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Trash2, PackagePlus, Upload, Download, RotateCw, Printer, Share2, Loader2 } from 'lucide-react'
import type { TReceiptItem } from '../model/receipt.types'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { printRows, shareRowsAsImage } from '@/shared/utils/documentActions'

const num = (v: string) => (v ? Number(v) : 0)

const CURRENCY_SHORT: Record<string, string> = { yuan: '¥', dollar: '$', somoni: 'сомони' }
const onlyNumber = (v: string) => /^\d*(\.\d*)?$/.test(v)

// Both rates are entered by the user:
//   rateToUsd   — 1 $ = X of the supplier's currency (yuan 6.5, dollar 1)
//   usdToSomoni — 1 $ = X somoni (9.3)
// Example: 100 ¥ ÷ 6.5 × 9.3 = 143.08 смн, +20% delivery = 171.69, +10% markup = 188.86 → 189
type TPricing = { rateToUsd: number; usdToSomoni: number; deliveryPct: number }

const hasRates = (p: TPricing) => p.rateToUsd > 0 && p.usdToSomoni > 0

// Purchase cost including the delivery share; in somoni when both rates are set,
// otherwise in the supplier's currency (old behaviour)
const calcLandedCost = (purchase: string, p: TPricing) => {
  if (!purchase) return 0
  const base = hasRates(p) ? (num(purchase) / p.rateToUsd) * p.usdToSomoni : num(purchase)
  return base * (1 + p.deliveryPct / 100)
}

const calcSellingPrice = (purchase: string, markup: string, p: TPricing) => {
  if (!purchase) return ''
  const selling = calcLandedCost(purchase, p) * (1 + num(markup) / 100)
  // Prices in somoni are rounded to whole somoni
  return hasRates(p) ? String(Math.round(selling)) : selling.toFixed(2)
}

const calcAmount = (boxes: string, perBox: string, purchase: string, loose: string) => {
  if (!boxes || !perBox || !purchase) return ''
  return ((num(boxes) * num(perBox) + num(loose)) * num(purchase)).toFixed(2)
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
  // Russian column names (exact match from your data)
  Товар?: string
  Артикул?: string
  Коробки?: string | number
  'Шт. в кор.'?: string | number
  'Отд. шт.'?: string | number
  'Цена зак.'?: string | number
  'Наценка %'?: string | number
  'Цена прод.'?: string | number
  Сумма?: string | number
  'Вес кг'?: string | number
  'Объем м3'?: string | number
  // Russian column names (lowercase variations)
  товар?: string
  артикул?: string
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
  product_code?: string
  boxes_qty?: string | number
  pieces_per_box?: string | number
  loose_pieces?: string | number
  purchase_cost?: string | number
  markup_percent?: string | number
  selling_price?: string | number
  amount?: string | number
  weight_kg?: string | number
  volume_cbm?: string | number
  // Index signature for dynamic access
  [key: string]: any
}

const AdminReceiptForm = ({ 
  preselectedWarehouseId
}: { 
  preselectedWarehouseId?: string;
} = {}) => {

  const { data: products = [] } = useGetProductsQuery()
  const { data: suppliers = [] } = useGetSuppliersQuery()
  const { data: deliveryDriversData } = useGetWarehouseDeliveryDriversQuery(preselectedWarehouseId ? Number(preselectedWarehouseId) : 0)
  const [createReceipt, { isLoading }] = usePostReceiptMutation()
  const [createProduct, { isLoading: isCreatingProduct }] = usePostProductMutation()
  const [updateProduct] = usePutProductMutation()

  const [supplierId, setSupplierId] = useState('')
  const [deliveryDriverId, setDeliveryDriverId] = useState('')
  const [globalMarkup, setGlobalMarkup] = useState('')
  const [rateToUsd, setRateToUsd] = useState('')
  const [usdToSomoni, setUsdToSomoni] = useState('')
  const [deliveryCost, setDeliveryCost] = useState('')
  const [items, setItems] = useState<(typeof emptyItem)[]>([emptyItem])

  const supplierCurrency = suppliers.find((s) => s.id.toString() === supplierId)?.currency || ''

  // Receipt total is in the supplier's currency; delivery (рохкиро) is always in USD
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const rateToUsdNum = num(rateToUsd)
  const usdToSomoniNum = num(usdToSomoni)
  const totalUsd = rateToUsdNum > 0 ? totalAmount / rateToUsdNum : 0
  const deliveryPct = totalUsd > 0 && deliveryDriverId ? (num(deliveryCost) / totalUsd) * 100 : 0

  const pricedItems = useMemo(() => {
    const pricing: TPricing = { rateToUsd: rateToUsdNum, usdToSomoni: usdToSomoniNum, deliveryPct }
    return items.map((item) => ({
      ...item,
      landed_cost: item.purchase_cost ? calcLandedCost(item.purchase_cost, pricing).toFixed(2) : '',
      selling_price: calcSellingPrice(item.purchase_cost, item.markup_percent, pricing),
    }))
  }, [items, rateToUsdNum, usdToSomoniNum, deliveryPct])
  const pricesInSomoni = rateToUsdNum > 0 && usdToSomoniNum > 0
  const [selectedProductIndices, setSelectedProductIndices] = useState<Set<number>>(new Set())
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for Excel import
  const [excelImporting, setExcelImporting] = useState(false)
  // State for Excel export
  const [excelExporting, setExcelExporting] = useState(false)
  const [sharing, setSharing] = useState(false)

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
            // Always update product_code from the selected product
            next.product_code = product.product_code || ''
            // Mark this index as having a selected product to hide suggestions
            setSelectedProductIndices(prev => new Set(prev).add(index))
          }
        }
        
        // If product_id is not a number, it means it's a new product name
        if (patch.product_id && isNaN(Number(patch.product_id))) {
          next.product_name = patch.product_id; // Ensure product_name matches the entered name
          next.product_code = ''; // Reset product_code for new products
          // Remove this index from selected products to show suggestions for new products
          setSelectedProductIndices(prev => {
            const newSet = new Set(prev)
            newSet.delete(index)
            return newSet
          })
        }

        // selling_price is derived in pricedItems (depends on rates and delivery % of the whole receipt)
        return {
          ...next,
          amount: calcAmount(next.boxes_qty, next.pieces_per_box, next.purchase_cost, next.loose_pieces),
        }
      })
    )
  }

  // Apply the common markup to every row; rows can still be edited individually afterwards
  const applyGlobalMarkup = (markup: string) => {
    setGlobalMarkup(markup)
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        markup_percent: markup,
      }))
    )
  }

  const addItem = () => {
    setItems((p) => [...p, { ...emptyItem, markup_percent: globalMarkup }])
    // Clear selected state for the new item
    setSelectedProductIndices(prev => {
      const newSet = new Set(prev)
      newSet.delete(items.length) // The new item will be at index items.length
      return newSet
    })
  }

  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i))



  const clearAllItems = () => {
    if (window.confirm('Вы уверены, что хотите очистить все товары?')) {
      setItems([{ ...emptyItem, markup_percent: globalMarkup }])
      setSelectedProductIndices(new Set())
    }
  }

  // Function to check if a product code is duplicate for NEW products only
  const isDuplicateCode = (index: number, code: string, productId: string) => {
    if (!code.trim()) return false; // Empty codes are not considered duplicates
    
    // If this is an existing product (product_id is a number), don't check for duplicates
    if (productId && !isNaN(Number(productId))) {
      return false;
    }
    
    // Check against other items in the form (for new products only)
    for (let i = 0; i < items.length; i++) {
      if (i !== index) {
        const otherItem = items[i];
        // Only check items that are new products (not existing ones)
        if (!otherItem.product_id || isNaN(Number(otherItem.product_id))) {
          if (otherItem.product_code.trim() === code.trim()) {
            return true;
          }
        }
      }
    }
    
    // Check against existing products from the database (for new products only)
    if (products.some(existing => existing.product_code === code.trim())) {
      return true;
    }
    
    return false;
  }

  const isInvalid = useMemo(
    () => !supplierId || items.some((i) => !i.product_id || !i.product_name || !i.boxes_qty || !i.pieces_per_box || !i.purchase_cost || Number(i.boxes_qty) < 0 || Number(i.pieces_per_box) < 0 || Number(i.purchase_cost) <= 0),
    [supplierId, items]
  )

  // Handle Excel file import
  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setExcelImporting(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })

          // Assuming the first sheet contains the data
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Convert to JSON
          const jsonData: ExcelReceiptItem[] = XLSX.utils.sheet_to_json(worksheet)

          console.log('Imported Excel data:', jsonData); // Debug log

          if (jsonData.length === 0) {
            toast.error('Excel файл не содержит данных или имеет неправильный формат')
            setExcelImporting(false)
            return
          }

          // Process imported data
          const processedItems: (typeof emptyItem)[] = []
          const errors: string[] = []
          const warnings: string[] = []

          jsonData.forEach((row, index) => {
            try {
              // Find product by name or code
              let productId = ''
              let productName = ''
              let productCode = ''
              
              // Try to find product by various identifiers
              const productIdentifier = row.product_id || row['Товар'] || row['товар'] || row.product_name || ''
              
              if (productIdentifier) {
                // Try exact match first
                let foundProduct = products.find((p) => 
                  p.name.toLowerCase() === productIdentifier.toLowerCase() ||
                  p.product_code?.toLowerCase() === productIdentifier.toLowerCase()
                )
                
                // If not found, try partial match
                if (!foundProduct) {
                  foundProduct = products.find((p) => 
                    p.name.toLowerCase().includes(productIdentifier.toLowerCase()) ||
                    p.product_code?.toLowerCase().includes(productIdentifier.toLowerCase())
                  )
                }
                
                if (foundProduct) {
                  productId = foundProduct.id.toString()
                  productName = foundProduct.name
                  productCode = String(row.product_code || row['Артикул'] || row['артикул'] || foundProduct.product_code || '')
                } else {
                  // Product not found - treat as new product
                  productId = productIdentifier
                  productName = productIdentifier
                  productCode = String(row.product_code || row['Артикул'] || row['артикул'] || '')
                  warnings.push(`Строка ${index + 1}: Товар "${productIdentifier}" не найден, будет создан как новый`)
                }
              } else {
                errors.push(`Строка ${index + 1}: Не указан товар`)
                return
              }

              // Validate and process numeric values
              const purchaseCost = String(row.purchase_cost || row['Цена зак.'] || row['цена зак'] || '0')
              const markupPercent = String(row.markup_percent || row['Наценка %'] || row['наценка %'] || '0')
              const boxesQty = String(row.boxes_qty || row['Коробки'] || row['коробки'] || '0')
              const piecesPerBox = String(row.pieces_per_box || row['Шт. в кор.'] || row['шт.'] || '0')
              const loosePieces = String(row.loose_pieces || row['Отд. шт.'] || row['отд шт'] || '0')
              
              // Validate required fields
              if (Number(boxesQty) <= 0 && Number(piecesPerBox) <= 0 && Number(loosePieces) <= 0) {
                errors.push(`Строка ${index + 1}: Должно быть указано количество (коробки, шт. в кор. или отд. шт.)`)
                return
              }
              
              if (Number(purchaseCost) <= 0) {
                errors.push(`Строка ${index + 1}: Цена закупки должна быть больше 0`)
                return
              }

              // Calculate derived values
              // Selling price is always recalculated from purchase, rates, delivery and markup
              const sellingPrice = ''
              const amount = String(
                row.amount || row['Сумма'] || row['сумма'] || calcAmount(boxesQty, piecesPerBox, purchaseCost, loosePieces)
              )
              const weightKg = String(row.weight_kg || row['Вес кг'] || row['вес кг'] || '')
              const volumeCbm = String(row.volume_cbm || row['Объем м3'] || row['объем м3'] || '')

              processedItems.push({
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
              })
            } catch (rowError) {
              errors.push(`Строка ${index + 1}: Ошибка обработки данных - ${rowError}`)
            }
          })

          console.log('Processed items:', processedItems); // Debug log
          console.log('Errors:', errors); // Debug log
          console.log('Warnings:', warnings); // Debug log

          // Show results
          if (errors.length > 0) {
            toast.error(`Импорт завершен с ошибками:\n${errors.join('\n')}`)
          } else if (warnings.length > 0) {
            toast.warning(`Импорт успешен с предупреждениями:\n${warnings.join('\n')}`)
          } else {
            toast.success(`Успешно импортировано ${processedItems.length} товаров из Excel файла`)
          }

          // Update the items state if we have valid items
          if (processedItems.length > 0) {
            setItems(processedItems)
          }

        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError)
          toast.error('Ошибка при разборе Excel файла. Проверьте формат файла.')
        }

        setExcelImporting(false)
      }

      reader.onerror = () => {
        toast.error('Ошибка при чтении Excel файла')
        setExcelImporting(false)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error importing Excel:', error)
      toast.error('Произошла ошибка при импорте Excel файла')
      setExcelImporting(false)
    }
  }

  // Trigger file input click
  const triggerExcelImport = () => {
    const fileInput = document.getElementById('excel-upload') as HTMLInputElement
    fileInput?.click()
  }

  // Build the export rows shared by Excel export, print and share
  const buildReceiptExportData = (): Record<string, string | number>[] => {
    const exportData: Record<string, string | number>[] = pricedItems.map((item, index) => ({
      '#': (index + 1).toString(),
      'Товар': item.product_name || products.find(p => p.id.toString() === item.product_id)?.name || item.product_id || '',
      'Коробки': item.boxes_qty || 0,
      'Шт. в кор.': item.pieces_per_box || 0,
      'Отд. шт.': item.loose_pieces || 0,
      'Цена зак.': item.purchase_cost || 0,
      'С дост.': item.landed_cost || 0,
      'Наценка %': item.markup_percent || 0,
      'Цена прод.': item.selling_price || 0,
      'Сумма': item.amount || 0,
      'Вес кг': item.weight_kg || '',
      'Объем м3': item.volume_cbm || ''
    }))

    const totalAmount = items.reduce((sum, item) => {
      const amount = parseFloat(item.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    exportData.push({
      '#': 'ИТОГО',
      'Товар': 'ИТОГО:',
      'Коробки': '',
      'Шт. в кор.': '',
      'Отд. шт.': '',
      'Цена зак.': '',
      'С дост.': '',
      'Наценка %': '',
      'Цена прод.': '',
      'Сумма': totalAmount.toString(),
      'Вес кг': '',
      'Объем м3': ''
    });

    return exportData
  }

  const buildReceiptWorkbook = () => {
    const worksheet = XLSX.utils.json_to_sheet(buildReceiptExportData())
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Товары')
    const fileName = `receipt_items_${new Date().toISOString().split('T')[0]}.xlsx`
    return { workbook, fileName }
  }

  // Handle Excel file export
  const handleExcelExport = () => {
    setExcelExporting(true)

    try {
      const { workbook, fileName } = buildReceiptWorkbook()
      XLSX.writeFile(workbook, fileName)

      toast.success('Файл успешно экспортирован')
      setExcelExporting(false)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Произошла ошибка при экспорте в Excel')
      setExcelExporting(false)
    }
  }

  const handlePrintReceipt = () => {
    printRows('Приход товаров', buildReceiptExportData())
  }

  const handleShareReceipt = async () => {
    setSharing(true)
    try {
      await shareRowsAsImage('Приход товаров', buildReceiptExportData(), `receipt_items_${new Date().toISOString().split('T')[0]}`)
    } finally {
      setSharing(false)
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
    console.log('onSubmit called', { isInvalid, isSubmitting, supplierId, preselectedWarehouseId, items })
    if (isInvalid || isSubmitting) {
      console.log('Early return due to validation', { isInvalid, isSubmitting })
      return;
    }

    // Product code is now optional for new products

    if (!preselectedWarehouseId) {
      toast.error('Склад не выбран');
      return;
    }

    // Check for duplicate product codes in the form
    const productCodes = items.map(item => item.product_code.trim()).filter(code => code !== '');
    const uniqueCodes = new Set(productCodes);
    console.log('Duplicate check', { productCodes, uniqueCodes, productCodesLength: productCodes.length, uniqueCodesSize: uniqueCodes.size })
    if (productCodes.length !== uniqueCodes.size) {
      console.log('Duplicate codes found, showing error toast')
      // Find which codes are duplicated
      const codeCounts = productCodes.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const duplicatedCodes = Object.entries(codeCounts).filter(([_, count]) => count > 1)
      const errorMessage = `Ошибка: Обнаружены повторяющиеся артикулы в форме:\n${duplicatedCodes.map(([code, count]) => `- "${code}" (${count} раз)`).join('\n')}`
      console.log('Duplicated codes:', duplicatedCodes)
      toast.error(errorMessage);
      alert(errorMessage)
      return;
    }

    // Skip checking for duplicate product codes against existing products
    // Only check for duplicates within the form items themselves

    console.log('Setting isSubmitting to true')
    setIsSubmitting(true)

    try {
      console.log('Starting product creation/update loop')
      // Check if any items have non-existent products and create them first
      const updatedItems = [...items];
      
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
        } else {
          // Existing product - check if product_code was modified
          const originalProduct = products.find(p => p.id.toString() === item.product_id);
          if (originalProduct && originalProduct.product_code !== item.product_code) {
            // Product code was modified - update the product
            const formData = new FormData();
            formData.append('name', originalProduct.name);
            formData.append('product_code', item.product_code || '');
            
            try {
              await updateProduct({ 
                id: Number(item.product_id), 
                body: formData 
              }).unwrap();
              toast.success(`Артикул для "${originalProduct.name}" обновлён`);
            } catch (error) {
              console.error('Error updating product:', error);
              toast.error('Ошибка при обновлении продукта');
              return; // Stop the process if product update fails
            }
          }
        }
      }

      // Convert string values to numbers before sending (backend expects numbers)
      const apiPayloadItems = updatedItems.map((item, idx) => ({
        ...item,
        // landed_cost is stored in somoni, so only when both rates are set
        landed_cost: pricesInSomoni ? Number(pricedItems[idx].landed_cost) : null,
        product_id: Number(item.product_id),
        boxes_qty: Number(item.boxes_qty),
        pieces_per_box: Number(item.pieces_per_box),
        loose_pieces: Number(item.loose_pieces),
        weight_kg: item.weight_kg ? Number(item.weight_kg) : 0,
        volume_cbm: item.volume_cbm ? Number(item.volume_cbm) : 0,
        purchase_cost: Number(item.purchase_cost),
        selling_price: Number(pricedItems[idx].selling_price),
        amount: Number(item.amount),
        markup_percent: Number(item.markup_percent),
      })) as any; // Type assertion since backend expects different types

      await createReceipt({
        warehouse_id: Number(preselectedWarehouseId), // Use preselected warehouse ID from props
        supplier_id: Number(supplierId),
        delivery_driver_id: deliveryDriverId ? Number(deliveryDriverId) : undefined,
        // Delivery data goes straight to the driver's operations (editable there later)
        delivery_cost: deliveryDriverId && num(deliveryCost) > 0 ? num(deliveryCost) : undefined,
        rate_to_usd: rateToUsdNum > 0 ? rateToUsdNum : undefined,
        usd_to_somoni: usdToSomoniNum > 0 ? usdToSomoniNum : undefined,
        items: apiPayloadItems,
      }).unwrap()

      toast.success('Приход успешно оформлен');
      setSupplierId('');
      setDeliveryDriverId('');
      setGlobalMarkup('');
      setRateToUsd('');
      setUsdToSomoni('');
      setDeliveryCost('');
      setItems([emptyItem]);
      setSelectedProductIndices(new Set());
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error('Ошибка при оформлении прихода');
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="bg-gray-50 border rounded-2xl p-6 space-y-6">

      <div>
        <label className="text-sm font-medium">Поставщик <span className="text-red-500">*</span></label>
        <select
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value)
            // A dollar supplier needs no conversion to USD
            const currency = suppliers.find((s) => s.id.toString() === e.target.value)?.currency
            if (currency === 'dollar') setRateToUsd('1')
          }}
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

      <div>
        <label className="text-sm font-medium">Доставщик (опционально)</label>
        <select
          value={deliveryDriverId}
          onChange={(e) => setDeliveryDriverId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2.5"
          disabled={!preselectedWarehouseId}
        >
          <option value="">Выберите доставщика</option>
          {deliveryDriversData?.drivers?.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
        {!preselectedWarehouseId && (
          <p className="text-xs text-gray-500 mt-1">Сначала выберите склад</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Общая наценка %</label>
        <input
          value={globalMarkup}
          onChange={(e) => {
            if (!onlyNumber(e.target.value)) return
            applyGlobalMarkup(e.target.value)
          }}
          className="w-full border rounded-lg px-3 py-2.5"
          placeholder="Например, 20"
        />
        <p className="text-xs text-gray-500 mt-1">
          Применяется ко всем товарам. Для отдельного товара наценку можно изменить в его строке.
        </p>
      </div>

      {/* Exchange rates and delivery (рохкиро) */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">
              Курс: 1 $ = ? {CURRENCY_SHORT[supplierCurrency] || 'валюты поставщика'}
            </label>
            <input
              value={rateToUsd}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                setRateToUsd(e.target.value)
              }}
              className="w-full border rounded-lg px-3 py-2.5"
              placeholder="Например, 6.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Курс: 1 $ = ? сомони</label>
            <input
              value={usdToSomoni}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                setUsdToSomoni(e.target.value)
              }}
              className="w-full border rounded-lg px-3 py-2.5"
              placeholder="Например, 9.3"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Рохкиро (доставка), $</label>
            <input
              value={deliveryCost}
              onChange={(e) => {
                if (!onlyNumber(e.target.value)) return
                setDeliveryCost(e.target.value)
              }}
              disabled={!deliveryDriverId}
              className="w-full border rounded-lg px-3 py-2.5 disabled:bg-gray-100"
              placeholder={deliveryDriverId ? 'Можно заполнить позже' : 'Сначала выберите доставщика'}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
          <span>
            Сумма прихода: <b>{totalAmount.toLocaleString()} {CURRENCY_SHORT[supplierCurrency] || ''}</b>
          </span>
          <span>
            В долларах: <b>{totalUsd > 0 ? `${totalUsd.toFixed(2)} $` : '—'}</b>
          </span>
          <span>
            Доставка: <b>{deliveryPct > 0 ? `${deliveryPct.toFixed(2)} %` : '—'}</b>
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Цена прод. = цена зак. ÷ курс к $ × курс сомони + % доставки + наценка, округляется до целых сомони.
          {!pricesInSomoni && ' Пока оба курса не указаны, цена считается как раньше: цена зак. + наценка.'}
          {num(deliveryCost) > 0 && !(rateToUsdNum > 0) && ' Укажите курс к $, чтобы посчитать % доставки.'}
        </p>
      </div>

      {/* Operations toolbar */}
      <div className="flex flex-wrap gap-3 items-center p-3 bg-white rounded-lg border">
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

        <button
          onClick={handlePrintReceipt}
          disabled={items.length === 0}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-800 text-sm"
        >
          <Printer size={14} /> Печать
        </button>

        <button
          onClick={handleShareReceipt}
          disabled={sharing || items.length === 0}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />} {sharing ? 'Отправка...' : 'Отправить'}
        </button>
      </div>

      {/* Hidden file input for Excel import */}
      <input id="excel-upload" type="file" accept=".xlsx, .xls" onChange={handleExcelImport} className="hidden" />

      {/* Items table header */}
      <div className="grid grid-cols-12 gap-2 bg-gray-100 border p-3 rounded-lg font-semibold text-sm hidden lg:grid">
        <div className="col-span-2">Товар</div>
        <div className="col-span-3 lg:col-span-1">Артикул</div>
        <div className="col-span-1">Коробки</div>
        <div className="col-span-1">Шт. в кор.</div>
        <div className="col-span-1">Отд. шт.</div>
        <div className="col-span-1">Цена зак.</div>
        <div className="col-span-1">С дост.{pricesInSomoni ? ', смн' : ''}</div>
        <div className="col-span-1">Наценка %</div>
        <div className="col-span-1">Цена прод.{pricesInSomoni ? ', смн' : ''}</div>
        <div className="col-span-1">Сумма</div>
        <div className="col-span-1">Действия</div>
      </div>

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 bg-white border p-2 rounded-xl">
          <div className="col-span-12 lg:col-span-2">
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
                  // Reset selected state when user starts typing
                  setSelectedProductIndices(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(i)
                    return newSet
                  })
                  // Check if this is a product name that needs to be converted to ID
                  const foundProduct = products.find((p) => p.name === query)
                  if (foundProduct) {
                    updateItem(i, { product_id: foundProduct.id.toString() })
                  } else {
                    // Update the input field with the query
                    updateItem(i, { product_id: query })
                  }
                }}
                onFocus={() => setFocusedRowIndex(i)}
                onBlur={() => setFocusedRowIndex(null)}
                onKeyDown={(e) => {
                  // Handle Enter key to select the first suggestion if available
                  if (e.key === 'Enter') {
                    const filteredProducts = products.filter(
                      (p) =>
                        p.name.toLowerCase().includes((item.product_id || '').toLowerCase()) &&
                        p.name.toLowerCase() !== (item.product_id || '').toLowerCase() // Don't re-select the same product
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
                !selectedProductIndices.has(i) &&
                focusedRowIndex === i &&
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
              className={`w-full border rounded px-2 py-1.5 text-sm ${
                isDuplicateCode(i, item.product_code, item.product_id)
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
              placeholder="Введите артикул товара..."
            />
            {isDuplicateCode(i, item.product_code, item.product_id) && (
              <p className="text-xs text-red-600 mt-1">Артикул уже существует</p>
            )}
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
            <label className="text-xs text-gray-500 lg:hidden">С дост.</label>
            <input
              value={pricedItems[i]?.landed_cost ?? ''}
              readOnly
              title={pricesInSomoni ? 'Себестоимость с доставкой, сомони' : 'Цена с доставкой, в валюте поставщика'}
              className="w-full border bg-gray-100 rounded px-2 py-1.5 text-sm"
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
              value={pricedItems[i]?.selling_price ?? ''}
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
              onClick={() => removeItem(i)}
              className="p-2 text-red-600 hover:bg-red-100 rounded text-sm"
              title="Удалить строку"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <div className="grid grid-cols-12 gap-2 bg-gray-100 border p-2 rounded-xl font-semibold text-sm mt-2">
  <div className="col-span-12 lg:col-span-10 text-right flex items-center justify-end">
    Итого:
  </div>

  <div className="col-span-6 lg:col-span-1">
    <input
      value={totalAmount.toLocaleString()}
      readOnly
      className="w-full border bg-gray-200 rounded px-2 py-1.5 text-sm font-semibold text-right"
    />
  </div>

  <div className="col-span-12 lg:col-span-1"></div>
</div>

      <div className="flex flex-wrap gap-3 pt-4 items-center">
        <button
          disabled={isInvalid || isLoading || isCreatingProduct || isSubmitting}
          onClick={() => {
            console.log('Button clicked', { isInvalid, isLoading, isCreatingProduct, isSubmitting })
            onSubmit()
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400 hover:bg-blue-700 transition-colors disabled:cursor-not-allowed"
        >
          {(isLoading || isCreatingProduct || isSubmitting) ? (
            <>
              <RotateCw size={16} className="animate-spin" />
              {isSubmitting ? 'Оформление прихода...' : isCreatingProduct ? 'Создание продукта...' : 'Оформление прихода...'}
            </>
          ) : (
            <>
              <PackagePlus size={16} />
              Оформить приход
            </>
          )}
        </button>

        {isInvalid && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
            Заполните все обязательные поля
          </div>
        )}

        <div className="ml-auto text-sm text-gray-600">Всего товаров: {items.length}</div>
      </div>
    </div>
  )
}

export default AdminReceiptForm
