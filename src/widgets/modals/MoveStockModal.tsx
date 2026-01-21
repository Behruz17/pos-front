/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePostMoveStockMutation } from '@/features/remain/api/stock.api'
import { useGetWarehousesQuery } from '@/features/warehouses/api/warehouses.api'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Field } from './ui/Field'

type Props = {
  stock: any | null
  onClose: () => void
}

const MoveStockModal = ({ stock, onClose }: Props) => {
  const [moveStock, { isLoading }] = usePostMoveStockMutation()
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useGetWarehousesQuery()

  if (!stock) return null

  const [form, setForm] = useState({
    to_warehouse_id: 0,
    total_pieces: stock.total_pieces,
    weight_kg: Number(stock.weight_kg),
    volume_cbm: Number(stock.volume_cbm),
    reason: '',
  })

  const onSubmit = async () => {
    if (!form.to_warehouse_id) return

    await moveStock({
      from_warehouse_id: stock.warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      product_id: stock.product_id,
      total_pieces: Number(form.total_pieces),
      weight_kg: Number(form.weight_kg),
      volume_cbm: Number(form.volume_cbm),
      reason: form.reason,
    }).unwrap()

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Перемещение товара</h2>
            <p className="text-sm text-slate-500">
              {stock.product_name} · {stock.warehouse_name}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Склад назначения</label>
            <select
              value={form.to_warehouse_id}
              onChange={(e) => setForm({ ...form, to_warehouse_id: Number(e.target.value) })}
              className="
                w-full rounded-lg border border-slate-300
                px-3 py-2 text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            >
              <option value={0}>Выберите склад</option>
              {isLoadingWarehouses && <option disabled>Загрузка…</option>}
              {!isLoadingWarehouses &&
                warehouses
                  .filter((w) => w.id !== stock.warehouse_id)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Количество, шт"
              value={form.total_pieces}
              onChange={(v) => setForm({ ...form, total_pieces: v })}
            />

            <Field label="Вес, кг" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />

            <Field label="Объём, м³" value={form.volume_cbm} onChange={(v) => setForm({ ...form, volume_cbm: v })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Причина перемещения(необязательно)</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Перемещение между складами, оптимизация, пересчёт…"
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
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Отмена
          </button>

          <button
            onClick={onSubmit}
            disabled={isLoading || !form.to_warehouse_id}
            className="
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
            "
          >
            {isLoading ? 'Перемещение…' : 'Переместить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MoveStockModal
