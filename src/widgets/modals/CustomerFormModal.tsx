/* eslint-disable react-hooks/set-state-in-effect */
import { X, Save, UserPlus, Wallet, Plus, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  useCreateCustomerMutation,
  useGetOneCustomerQuery,
  useUpdateBalanceCustomerMutation,
  useUpdateCustomerMutation,
} from '@/features/customers/api/customers.api'

type Props = {
  customerId: number | null
  onClose: () => void
}

const CustomerFormModal = ({ customerId, onClose }: Props) => {
  const isEdit = Boolean(customerId)
  const { data, isLoading } = useGetOneCustomerQuery(customerId!, {
    skip: !isEdit,
  })

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation()
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation()
  const [updateBalance, { isLoading: isBalanceUpdating }] = useUpdateBalanceCustomerMutation()

  const [form, setForm] = useState(() => ({
    full_name: data?.full_name || '',
    phone: data?.phone ?? '',
    city: data?.city ?? '',
  }))

  const [balanceForm, setBalanceForm] = useState({
    amount: data?.balance ?? '',
    operation: 'add' as 'add' | 'subtract',
    reason: '',
  })

  useEffect(() => {
    if (data && isEdit) {
      setForm({
        full_name: data.full_name,
        phone: data.phone ?? '',
        city: data.city ?? '',
      })
    }
  }, [data, isEdit])

  const isSaving = isCreating || isUpdating || isBalanceUpdating

  const onSubmit = async () => {
    if (!form.full_name) return

    if (isEdit) {
      await updateCustomer({
        id: customerId!,
        ...form,
      }).unwrap()
    } else {
      await createCustomer(form).unwrap()
    }

    onClose()
  }

  const onUpdateBalance = async () => {
    if (!balanceForm.amount) return

    await updateBalance({
      id: customerId!,
      amount: Number(balanceForm.amount),
      operation: balanceForm.operation,
      reason: balanceForm.reason || undefined,
    }).unwrap()

    setBalanceForm({ amount: '', operation: 'add', reason: '' })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEdit ? 'Редактирование клиента' : 'Новый клиент'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit ? 'Обновление информации о клиенте' : 'Создание нового клиента'}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {isEdit && isLoading ? (
            <div className="text-center py-10 text-slate-500">Загрузка данных клиента…</div>
          ) : (
            <>
              <div className="space-y-4">
                <Field
                  label="Ф.И.О."
                  value={form.full_name}
                  onChange={(v) => setForm({ ...form, full_name: v })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Телефон</label>

                    <input
                      value={form.phone}
                      onChange={(e) => {
                        const v = e.target.value.trim()
                        if (!/^\d*(\.\d*)?$/.test(v)) return
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

                  <Field label="Город" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                </div>
              </div>

              {isEdit && (
                <div className="pt-6 border-t space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Wallet size={16} />
                    Баланс клиента
                  </div>

                  <div className="flex gap-2">
                    <BalanceButton
                      active={balanceForm.operation === 'add'}
                      onClick={() => setBalanceForm({ ...balanceForm, operation: 'add' })}
                      color="green"
                      icon={<Plus size={14} />}
                      label="Начислить"
                    />

                    <BalanceButton
                      active={balanceForm.operation === 'subtract'}
                      onClick={() => setBalanceForm({ ...balanceForm, operation: 'subtract' })}
                      color="red"
                      icon={<Minus size={14} />}
                      label="Списать"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Баланс</label>
                    <input
                      type="string"
                      value={balanceForm.amount}
                      placeholder={`${data?.balance ?? ''} сомони есть`}
                      onChange={(e) => {
                        const v = e.target.value.trim()
                        if (!/^\d*(\.\d*)?$/.test(v)) return
                        setBalanceForm({ ...balanceForm, amount: v })
                      }}
                      className="
        w-full rounded-lg border border-slate-300
        px-3 py-2 text-sm
        focus:ring-2 focus:ring-blue-500 focus:border-transparent
      "
                    />
                  </div>

                  <Field
                    label="Причина"
                    value={balanceForm.reason}
                    onChange={(v) => {
                      setBalanceForm({ ...balanceForm, reason: v })
                    }}
                    placeholder="Корректировка баланса"
                  />

                  <button
                    onClick={onUpdateBalance}
                    disabled={!balanceForm.amount || isBalanceUpdating || isUpdating}
                    className="
                    cursor-pointer
                      w-full mt-2
                      inline-flex items-center justify-center gap-2
                      rounded-lg px-4 py-2
                      bg-slate-800 text-white text-sm font-medium
                      hover:bg-slate-900
                      disabled:opacity-50
                    "
                  >
                    <Wallet size={16} />
                    {isBalanceUpdating ? 'Применение…' : 'Применить изменение баланса'}
                  </button>
                </div>
              )}
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
            disabled={isSaving || !form.full_name}
            className="
            cursor-pointer inline-flex items-center justify-center gap-2
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700
              disabled:opacity-50 
            "
          >
            {isEdit ? <Save size={16} /> : <UserPlus size={16} />}
            {isSaving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerFormModal
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

const BalanceButton = ({
  active,
  onClick,
  color,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  color: 'green' | 'red'
  icon: React.ReactNode
  label: string
}) => {
  const colors =
    color === 'green'
      ? active
        ? 'bg-green-50 border-green-300 text-green-700'
        : 'border-slate-300 text-slate-600'
      : active
      ? 'bg-red-50 border-red-300 text-red-700'
      : 'border-slate-300 text-slate-600'

  return (
    <button
      onClick={onClick}
      className={`
        cursor-pointer flex-1 flex items-center justify-center gap-1
        rounded-lg border px-3 py-2 text-sm
        transition ${colors}
      `}
    >
      {icon}
      {label}
    </button>
  )
}
