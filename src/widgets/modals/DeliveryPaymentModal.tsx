import { useState } from 'react'
import { X, CreditCard, DollarSign } from 'lucide-react'
import { useCreateDeliveryPaymentMutation } from '@/shared/request/baseApi'

interface DeliveryPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  driverId: number
  driverName: string
  onSuccess?: () => void
}

export const DeliveryPaymentModal = ({ isOpen, onClose, driverId, driverName, onSuccess }: DeliveryPaymentModalProps) => {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [createPayment, { isLoading }] = useCreateDeliveryPaymentMutation()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      alert('Сумма должна быть больше 0')
      return
    }

    try {
      await createPayment({
        driverId,
        amount: numAmount,
        note: note || undefined,
      }).unwrap()

      setAmount('')
      setNote('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error?.data?.message || 'Ошибка при создании оплаты')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CreditCard size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Оплата доставщику</h2>
              <p className="text-sm text-slate-500">{driverName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сумма оплаты
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Введите сумму"
                min="0.01"
                step="0.01"
                required
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Примечание (необязательно)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: Оплата за март"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Выполнить оплату
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
