import { X, User, Calendar, RotateCcw, Package, Hash } from 'lucide-react'
import { formatDateTime } from '@/shared/formatDateTime'
import { Loading } from '@/shared/ui/Loading'
import { useGetOneDetailReturnQuery } from '@/features/returns/api/returns.api'
import { skipToken } from '@reduxjs/toolkit/query'
import { Td, Th } from '@/shared/ui/Table'

type Props = {
  id: number
  onClose: () => void
}

const ReturnsViewModal = ({ id, onClose }: Props) => {
  const { data, isLoading } = useGetOneDetailReturnQuery(id ?? skipToken)

  if (isLoading) {
    return (
      <ModalLayout onClose={onClose}>
        <Loading text="документа" />
      </ModalLayout>
    )
  }

  if (!data) return null

  return (
    <ModalLayout onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <RotateCcw size={20} className="text-orange-500" />
            Возврат #{data.id}
          </h2>
          <p className="text-sm text-slate-500">Детали возврата товара</p>
        </div>

        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetaItem icon={<User size={16} />} label="Клиент" value={data.customer_name || '—'} />
        <MetaItem icon={<User size={16} />} label="Создал" value={data.created_by_name} />
        <MetaItem icon={<Calendar size={16} />} label="Дата" value={formatDateTime(data.created_at)} />
        <MetaItem icon={<Hash size={16} />} label="Продажа" value={data.sale_id ? `#${data.sale_id}` : '—'} />
      </div>

      <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <Th>Товар</Th>
              <Th right>Кол-во</Th>
              <Th right>Цена</Th>
              <Th right>Сумма</Th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <Td>
                  <div className="flex items-start gap-2">
                    <Package size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-800">{item.product_name}</div>
                      <div className="text-xs text-slate-500">{item.manufacturer || '—'}</div>
                    </div>
                  </div>
                </Td>

                <Td right>{item.quantity}</Td>
                <Td right>{item.unit_price} c</Td>
                <Td right className="font-semibold">
                  {item.total_price} c
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {data.items.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              <div className="font-medium text-slate-800">{item.product_name}</div>
            </div>

            <div className="text-xs text-slate-500">{item.manufacturer || '—'}</div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <ValueRow label="Кол-во" value={item.quantity} />
              <ValueRow label="Цена" value={`${item.unit_price} c`} />
              <ValueRow label="Сумма" value={`${item.total_price} c`} bold />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t pt-4">
        <div className="text-lg font-semibold text-slate-800">Итого: {data.total_amount} c</div>
      </div>
    </ModalLayout>
  )
}

export default ReturnsViewModal

const ModalLayout = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div onClick={onClose} className="absolute inset-0 bg-black/40" />
    <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
      {children}
    </div>
  </div>
)

const MetaItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
    <div className="text-slate-400">{icon}</div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800 break-words">{value}</div>
    </div>
  </div>
)

const ValueRow = ({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className={bold ? 'font-semibold text-slate-800' : 'text-slate-800'}>{value}</span>
  </div>
)
