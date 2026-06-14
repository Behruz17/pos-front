import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Trash2, ArrowRightLeft, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { usePostMoveStockMutation } from '@/features/remain/api/stock.api'
import { useGetWarehouseProductsQuery, useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import type { TGetWarehousesProducts } from '@/features/warehouses/model/warehouses.types'

type MoveRow = {
  id: string
  product_id: number
  product_name: string
  product_code: string
  total_pieces: string
}

type WarehouseProduct = TGetWarehousesProducts['products'][number]

const createRow = (): MoveRow => ({
  id: crypto.randomUUID(),
  product_id: 0,
  product_name: '',
  product_code: '',
  total_pieces: '',
})

const WarehouseStockMovePage = () => {
  const navigate = useNavigate()
  const { data: warehouses = [], isLoading: isWarehousesLoading } = useGetWarehousesQuery()
  const [moveStock, { isLoading: isMoving }] = usePostMoveStockMutation()
  const [fromWarehouseId, setFromWarehouseId] = useState(0)
  const [toWarehouseId, setToWarehouseId] = useState(0)
  const [reason, setReason] = useState('Перемещение между складами')
  const [rows, setRows] = useState<MoveRow[]>([createRow()])
  const productInputRefs = useRef<Array<HTMLInputElement | null>>([])

  const { data: productsData, isFetching: isProductsLoading } = useGetWarehouseProductsQuery(fromWarehouseId, {
    skip: !fromWarehouseId,
  })

  const products = productsData?.products ?? []
  const selectedProductIds = useMemo(
    () => rows.map((row) => row.product_id).filter(Boolean),
    [rows]
  )
  const getProductForRow = (row: MoveRow) => {
    if (row.product_id) {
      return products.find((product) => product.product_id === row.product_id)
    }

    const search = row.product_name.trim().toLowerCase()
    if (!search) return undefined

    return products.find(
      (product) =>
        product.product_name.toLowerCase() === search ||
        product.product_code?.toLowerCase() === search
    )
  }
  const isSubmitDisabled =
    isMoving ||
    !fromWarehouseId ||
    !toWarehouseId ||
    fromWarehouseId === toWarehouseId ||
    !reason.trim() ||
    rows.length === 0 ||
    rows.some((row) => !getProductForRow(row) || Number(row.total_pieces) <= 0)

  const updateRow = (id: string, data: Partial<MoveRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...data } : row)))
  }

  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)))
  }

  const addRowFromTab = (event: React.KeyboardEvent<HTMLInputElement>, row: MoveRow, index: number) => {
    if (event.key !== 'Tab' || event.shiftKey || index !== rows.length - 1) return

    event.preventDefault()

    if (!getProductForRow(row)) {
      toast.error('Выберите товар')
      return
    }

    setRows((current) => {
      const currentRow = current[index]
      if (!currentRow || !getProductForRow(currentRow)) return current
      return [...current, createRow()]
    })

    window.setTimeout(() => {
      productInputRefs.current[index + 1]?.focus()
    }, 50)
  }

  const onSubmit = async () => {
    const items = rows
      .map((row) => {
        const product = getProductForRow(row)
        if (!product) return null

        return {
          product_id: product.product_id,
          total_pieces: Number(row.total_pieces),
          weight_kg: 0,
          volume_cbm: 0,
        }
      })
      .filter((item): item is { product_id: number; total_pieces: number; weight_kg: number; volume_cbm: number } =>
        Boolean(item)
      )

    if (!fromWarehouseId || !toWarehouseId) {
      toast.error('Выберите оба склада')
      return
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error('Склады должны отличаться')
      return
    }

    if (!items.length || items.some((item) => item.total_pieces <= 0)) {
      toast.error('Выберите товары и укажите количество больше 0')
      return
    }

    try {
      const payload = {
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        items,
        reason,
      }
      const response = await moveStock(payload).unwrap()

      toast.success(`Перемещено товаров: ${response.moved_items ?? items.length}`)
      setRows([createRow()])
      setReason('Перемещение между складами')
    } catch (error) {
      console.error('Failed to move stock:', error)
      const message =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof (error as { data?: { error?: string } }).data?.error === 'string'
          ? (error as { data: { error: string } }).data.error
          : 'Не удалось переместить товары'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/warehouses/stock')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Назад к складам
        </button>

        <div className="text-sm text-slate-500">Массовое перемещение товаров между складами</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Перемещение товаров</h1>
            <p className="text-sm text-slate-500">Выберите склады и добавьте один или несколько товаров</p>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Со склада</span>
              <select
                value={fromWarehouseId}
                onChange={(event) => {
                  setFromWarehouseId(Number(event.target.value))
                  setRows([createRow()])
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Выберите склад</option>
                {isWarehousesLoading && <option disabled>Загрузка...</option>}
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">На склад</span>
              <select
                value={toWarehouseId}
                onChange={(event) => setToWarehouseId(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Выберите склад</option>
                {warehouses
                  .filter((warehouse) => warehouse.id !== fromWarehouseId)
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">Товары</h2>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => {
                const selectedProduct = products.find((product) => product.product_id === row.product_id)

                return (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_120px_44px]">
                      <div className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500">Товар {index + 1}</span>
                        <ProductSearch
                          inputRef={(element) => {
                            productInputRefs.current[index] = element
                          }}
                          row={row}
                          products={products}
                          selectedProductIds={selectedProductIds}
                          disabled={!fromWarehouseId || isProductsLoading}
                          placeholder={isProductsLoading ? 'Загрузка...' : 'Поиск товара...'}
                          onChange={(data) => updateRow(row.id, data)}
                        />
                        {selectedProduct && (
                          <div className="mt-1 text-xs text-slate-400">Доступно: {selectedProduct.total_pieces} шт</div>
                        )}
                      </div>

                      <NumberField
                        label="Штук"
                        value={row.total_pieces}
                        onChange={(value) => updateRow(row.id, { total_pieces: value })}
                        onKeyDown={(event) => addRowFromTab(event, row, index)}
                        onFocus={() => {
                          if (index === rows.length - 1 && getProductForRow(row)) {
                            setRows((current) => [...current, createRow()])
                          }
                        }}
                      />

                      <button
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Удалить товар"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Причина</span>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            onClick={() => navigate('/warehouses/stock')}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMoving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isMoving ? 'Перемещение...' : 'Переместить'}
          </button>
        </div>
      </div>
    </div>
  )
}

const NumberField = ({
  label,
  value,
  onChange,
  onKeyDown,
  onFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
}) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
    />
  </label>
)

const ProductSearch = ({
  inputRef,
  row,
  products,
  selectedProductIds,
  disabled,
  placeholder,
  onChange,
}: {
  inputRef?: (element: HTMLInputElement | null) => void
  row: MoveRow
  products: WarehouseProduct[]
  selectedProductIds: number[]
  disabled: boolean
  placeholder: string
  onChange: (data: Partial<MoveRow>) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const search = row.product_name.trim().toLowerCase()
  const filteredProducts = search
    ? products
        .filter(
          (product) =>
            product.product_name.toLowerCase().includes(search) ||
            (product.product_code?.toLowerCase().includes(search) ?? false)
        )
        .slice(0, 12)
    : products.slice(0, 12)

  const selectProduct = (product: WarehouseProduct) => {
    onChange({
      product_id: product.product_id,
      product_name: product.product_name,
      product_code: product.product_code ?? '',
      total_pieces: '',
    })
    setIsOpen(false)
  }

  const selectExactTypedProduct = () => {
    if (row.product_id || !search) return

    const exactProduct = products.find(
      (product) =>
        product.product_name.toLowerCase() === search ||
        (product.product_code?.toLowerCase() === search)
    )

    if (exactProduct) {
      selectProduct(exactProduct)
    }
  }

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={row.product_name}
        onFocus={() => {
          if (!row.product_id) setIsOpen(true)
        }}
        onBlur={() => {
          selectExactTypedProduct()
          window.setTimeout(() => setIsOpen(false), 150)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            selectExactTypedProduct()
          }
        }}
        onChange={(event) => {
          onChange({
            product_id: 0,
            product_name: event.target.value,
            product_code: '',
          })
          setIsOpen(true)
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-9 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
      />
      {row.product_name && (
        <button
          type="button"
          onClick={() => {
            onChange({ product_id: 0, product_name: '', product_code: '' })
            setIsOpen(true)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          title="Очистить"
        >
          <X size={15} />
        </button>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const isSelectedElsewhere =
                selectedProductIds.includes(product.product_id) && product.product_id !== row.product_id
              const isUnavailable = Number(product.total_pieces) <= 0

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isSelectedElsewhere || isUnavailable}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectProduct(product)}
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-55"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{product.product_name}</span>
                    <span className="block truncate text-xs text-slate-500">Артикул: {product.product_code || '-'}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {product.total_pieces} шт
                  </span>
                </button>
              )
            })
          ) : (
            <div className="px-3 py-4 text-center text-sm text-slate-500">Товары не найдены</div>
          )}
        </div>
      )}
    </div>
  )
}

export default WarehouseStockMovePage
