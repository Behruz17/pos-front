import { X, Save, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  useCreateResellerMutation,
  useGetOneResellerQuery,
  useUpdateResellerMutation,
} from '@/features/resellers/api/resellers.api'

type Props = {
  resellerId: number | null
  storeId: number
  onClose: () => void
}

const ResellerFormModal = ({ resellerId, storeId, onClose }: Props) => {
  const isEdit = Boolean(resellerId)
  const { data, isLoading } = useGetOneResellerQuery(resellerId!, {
    skip: !isEdit,
  })

  const [createReseller, { isLoading: isCreating }] = useCreateResellerMutation()
  const [updateReseller, { isLoading: isUpdating }] = useUpdateResellerMutation()

  const [form, setForm] = useState(() => ({
    name: data?.name || '',
    phone: data?.phone || '',
    balance: data?.balance || 0,
    status: data?.status ?? 1,
  }))

  useEffect(() => {
    if (data && isEdit) {
      setForm({
        name: data.name,
        phone: data.phone,
        balance: data.balance,
        status: data.status,
      })
    }
  }, [data, isEdit])

  const isSaving = isCreating || isUpdating

  const onSubmit = async () => {
    if (!form.name.trim()) return

    try {
      if (isEdit) {
        await updateReseller({
          id: resellerId!,
          name: form.name.trim(),
          phone: form.phone.trim(),
          balance: Number(form.balance),
          status: Number(form.status),
          store_id: storeId
        }).unwrap()
      } else {
        await createReseller({
          name: form.name.trim(),
          phone: form.phone.trim(),
          balance: Number(form.balance),
          status: 1,
          store_id: storeId
        }).unwrap()
      }

      onClose()
    } catch (error) {
      console.error('Error saving reseller:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? 'Редактирование реселлера' : 'Новый реселлер'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit ? 'Обновление информации о реселлере' : 'Создание нового реселлера'}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {isEdit && isLoading ? (
            <div className="text-center py-10 text-slate-500">Загрузка данных реселлера…</div>
          ) : (
            <div className="space-y-4">
              <Field
                label="Имя реселлера"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />

              <Field
                label="Телефон"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+79991234567"
                required
              />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Баланс
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="
                      w-full rounded-lg border border-slate-300
                      px-3 py-2 text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                  />
                </div>
              </div>
            </div>
          )}
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
            onClick={onSubmit}
            disabled={isSaving || !form.name.trim() || !form.phone.trim()}
            className="
            cursor-pointer inline-flex items-center justify-center gap-2
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:opacity-50 
            "
          >
            {isEdit ? <Save size={16} /> : <Building2 size={16} />}
            {isSaving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResellerFormModal

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full rounded-lg border border-slate-300
        px-3 py-2 text-sm
        focus:ring-2 focus:ring-blue-500 focus:border-transparent
      "
    />
  </div>
)
