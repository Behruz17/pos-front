/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePutWarehouseStockMutation } from '@/features/remain/api/stock.api'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Field } from './ui/Field'
// import type { TPutWarehouseStock } from '@/features/remain/model/stock.types'

const EditStockModal = ({ stock, onClose }: { stock: any; onClose: () => void }) => {
  const [updateStock, { isLoading }] = usePutWarehouseStockMutation()

  if (!stock) return null

  const [form, setForm] = useState({
    total_pieces: Number(stock.total_pieces),
    weight_kg: Number(stock.weight_kg),
    volume_cbm: Number(stock.volume_cbm),
    reason: '',
  })

  const onSubmit = async () => {
    await updateStock({
      id: stock.id,
      body: {
        total_pieces: Number(form.total_pieces),
        weight_kg: Number(form.weight_kg),
        volume_cbm: Number(form.volume_cbm),
        reason: form.reason || undefined,
      },
    }).unwrap()

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Редактирование остатка</h2>
            <p className="text-sm text-slate-500">
              {stock.product_name} · {stock.warehouse_name}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Всего штук"
              value={form.total_pieces}
              onChange={(v) => setForm({ ...form, total_pieces: v })}
            />

            <Field label="Вес, кг" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />

            <Field label="Объём, м³" value={form.volume_cbm} onChange={(v) => setForm({ ...form, volume_cbm: v })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Причина изменения(необязательно)</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Инвентаризация, пересчёт, корректировка…"
              className="
                w-full rounded-lg border border-slate-300
                px-3 py-2 text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition"
          >
            Отмена
          </button>

          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
            "
          >
            {isLoading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditStockModal
