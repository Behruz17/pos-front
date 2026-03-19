import { X, Save, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { useCreateResellerPaymentMutation } from '@/features/resellers/api/resellers.api'
import type { TResellerPaymentType } from '@/features/resellers/model/resellerPayment.types'

type Props = {
  resellerId: number
  resellerName: string
  storeId: number
  onClose: () => void
}

const ResellerPaymentModal = ({ resellerId, resellerName, storeId, onClose }: Props) => {
  const [paymentType, setPaymentType] = useState<TResellerPaymentType>('PAYMENT_TO_RESELLER')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const [createPayment, { isLoading }] = useCreateResellerPaymentMutation()

  const isFormValid = () => {
    const numAmount = parseFloat(amount)
    return !isNaN(numAmount) && numAmount > 0
  }

  const handleSubmit = async () => {
    if (!isFormValid()) return

    try {
      await createPayment({
        resellerId,
        data: {
          amount: parseFloat(amount),
          payment_type: paymentType,
          store_id: storeId,
          note: note.trim() || undefined,
        }
      }).unwrap()

      onClose()
    } catch (error) {
      // Error handling
    }
  }

  const getPaymentIcon = () => {
    switch (paymentType) {
      case 'PAYMENT_TO_RESELLER': return <ArrowUpRight size={20} />
      case 'PAYMENT_FROM_RESELLER': return <ArrowDownLeft size={20} />
      default: return <Wallet size={20} />
    }
  }

  const getPaymentTitle = () => {
    switch (paymentType) {
      case 'PAYMENT_TO_RESELLER': return 'Оплата реселлеру'
      case 'PAYMENT_FROM_RESELLER': return 'Оплата от реселлера'
      default: return 'Оплата'
    }
  }

  const getPaymentDescription = () => {
    switch (paymentType) {
      case 'PAYMENT_TO_RESELLER': return 'Вы платите деньги реселлеру'
      case 'PAYMENT_FROM_RESELLER': return 'Реселлер платит деньги вам'
      default: return 'Оплата'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              {getPaymentIcon()}
              {getPaymentTitle()}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {getPaymentDescription()} • Реселлер: {resellerName}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Тип оплаты</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'PAYMENT_TO_RESELLER' as const, label: 'Платим реселлеру', color: 'red' },
                { value: 'PAYMENT_FROM_RESELLER' as const, label: 'Реселлер платит', color: 'green' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setPaymentType(value)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    paymentType === value
                      ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Сумма</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*(.[0-9]+)?"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/^0+(?=\d)/, '')
                const numValue = Number(value)
                if (!isNaN(numValue) && numValue >= 0) {
                  setAmount(value)
                }
              }}
              placeholder="Введите сумму..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Примечание (опционально)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Введите примечание к оплате..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            disabled={isLoading || !isFormValid()}
            className="
              cursor-pointer inline-flex items-center justify-center gap-2
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:opacity-50 
            "
          >
            <Save size={16} />
            {isLoading ? 'Сохранение...' : 'Записать оплату'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResellerPaymentModal
