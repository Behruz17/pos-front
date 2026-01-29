/* eslint-disable react-hooks/set-state-in-effect */
import { X, Save, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  useCreateSupplierMutation,
  useGetOneSupplierQuery,
  useUpdateSupplierMutation,
} from '@/features/suppliers/api/suppliers.api'

type Props = {
  supplierId: number | null
  onClose: () => void
  warehouseId?: number
}

const CreateSupplierModal = ({ supplierId, onClose, warehouseId }: Props) => {
  const isEdit = Boolean(supplierId)
  const { data, isLoading } = useGetOneSupplierQuery(supplierId!, {
    skip: !isEdit,
  })

  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation()
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation()

  const [form, setForm] = useState(() => ({
    name: data?.name || '',
    phone: data?.phone ?? '',
    balance: data?.balance || 0,
  }))

  useEffect(() => {
    if (data && isEdit) {
      setForm({
        name: data.name,
        phone: data.phone ?? '',
        balance: data.balance || 0,
      })
    }
  }, [data, isEdit])

  const isSaving = isCreating || isUpdating

  const onSubmit = async () => {
    if (!form.name) return

    // Prepare the payload
    const payload: any = {
      ...form,
      status: 1, // Default status is 1
    };
    
    // Include warehouseId if provided
    if (warehouseId) {
      payload.warehouse_id = warehouseId;
    }

    if (isEdit) {
      // For update, we need to include the id in the payload
      await updateSupplier({
        id: supplierId!,
        ...payload,
      }).unwrap()
    } else {
      await createSupplier(payload).unwrap()
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? 'Редактирование поставщика' : 'Новый поставщик'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit ? 'Обновление информации о поставщике' : 'Создание нового поставщика'}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {isEdit && isLoading ? (
            <div className="text-center py-10 text-slate-500">Загрузка данных поставщика…</div>
          ) : (
            <>
              <div className="space-y-4">
                <Field
                  label="Название"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Телефон</label>

                    <input
                      value={form.phone}
                      onChange={(e) => {
                        const v = e.target.value.trim()
                        setForm({ ...form, phone: v })
                      }}
                      placeholder="+992918564456"
                      className="
                      w-full rounded-lg border border-slate-300
                      px-3 py-2 text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Баланс</label>
                    
                    <input
                      type="number"
                      value={form.balance}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0
                        setForm({ ...form, balance: v })
                      }}
                      placeholder="0"
                      className="
                      w-full rounded-lg border border-slate-300
                      px-3 py-2 text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                    />
                  </div>
                </div>
              </div>
            </>
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
            disabled={isSaving || !form.name}
            className="
            cursor-pointer inline-flex items-center justify-center gap-2
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:opacity-50 
            "
          >
            {isEdit ? <Save size={16} /> : <Truck size={16} />}
            {isSaving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateSupplierModal

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
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