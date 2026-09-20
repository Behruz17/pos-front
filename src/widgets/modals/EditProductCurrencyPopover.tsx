import { useState } from 'react'
import { Pencil, X, Check, Loader2 } from 'lucide-react'
import { usePatchProductCurrencyMutation } from '@/features/products/api/products.api'
import { getCurrencyDisplay } from '@/shared/utils/currencyUtils'
import { toast } from 'sonner'

const CURRENCY_OPTIONS = [
  { value: 'somoni', label: 'Сомони' },
  { value: 'yuan', label: 'Юань' },
  { value: 'dollar', label: 'Доллар' },
]

type Props = {
  productId: number
  currency?: string | null
  hasSupplier?: boolean
}

export const EditProductCurrencyPopover = ({ productId, currency, hasSupplier }: Props) => {
  const [open, setOpen] = useState(false)
  const [pendingValue, setPendingValue] = useState<string | null>(null)
  const [patchCurrency, { isLoading }] = usePatchProductCurrencyMutation()

  if (hasSupplier) {
    return (
      <span
        title="Валюта определяется поставщиком и не может быть изменена вручную"
        className="p-0.5 text-slate-300 cursor-not-allowed"
      >
        <Pencil size={12} />
      </span>
    )
  }

  const onSelect = async (value: string) => {
    if (isLoading) return
    if (value === currency) {
      setOpen(false)
      return
    }
    try {
      setPendingValue(value)
      await patchCurrency({ id: productId, currency: value }).unwrap()
      toast.success('Валюта товара обновлена')
    } catch {
      toast.error('Не удалось обновить валюту')
    } finally {
      setPendingValue(null)
      setOpen(false)
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        disabled={isLoading}
        title={isLoading ? 'Обновление валюты…' : 'Изменить валюту'}
        aria-label="Изменить валюту товара"
        className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">Валюта</span>
              <button
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={12} />
              </button>
            </div>
            {CURRENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                disabled={isLoading}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-left hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {opt.label} <span className="text-slate-400">({getCurrencyDisplay(opt.value)})</span>
                </span>
                {isLoading && pendingValue === opt.value ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  opt.value === currency && <Check size={14} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  )
}
