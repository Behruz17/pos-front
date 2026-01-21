import { useGetOneUserDetailQuery } from '@/features/customers/api/customers.api'
import { useParams } from 'react-router'
import { User, Phone, MapPin, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useGetOneUserDetailQuery(Number(id))

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка данных клиента…</div>
  }

  if (!data) {
    return <div className="flex justify-center py-20 text-slate-500">Клиент не найден</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Карточка клиента</h1>
        <p className="text-sm text-slate-500">Подробная информация и история операций</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <InfoRow icon={<User size={18} />} label="Ф.И.О." value={data.full_name} />

          <InfoRow icon={<Phone size={18} />} label="Телефон" value={data.phone || '—'} />

          <InfoRow icon={<MapPin size={18} />} label="Город" value={data.city || '—'} />

          <InfoRow
            icon={<Wallet size={18} />}
            label="Баланс"
            value={`${Number(data.balance).toLocaleString()} сомони`}
            valueClass="font-semibold text-slate-800"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <MetaRow label="Дата создания" value={new Date(data.created_at).toLocaleString()} />

          <MetaRow label="Последнее обновление" value={new Date(data.updated_at).toLocaleString()} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-sm font-semibold text-slate-700">История транзакций</h2>
        </div>

        {data.transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Транзакций пока нет</div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-slate-600">
                    <th className="px-6 py-3 font-medium">Тип</th>
                    <th className="px-6 py-3 font-medium">Сумма</th>
                    <th className="px-6 py-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-b-0 hover:bg-slate-50 transition">
                      <td className="px-6 py-3">
                        <TransactionType type={t.type} />
                      </td>

                      <td className="px-6 py-3 font-medium">{Number(t.amount).toLocaleString()} c</td>

                      <td className="px-6 py-3 text-slate-600">{new Date(t.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y">
              {data.transactions.map((t) => (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <TransactionType type={t.type} />
                    <div className="font-semibold">{Number(t.amount).toLocaleString()} c</div>
                  </div>

                  <div className="text-xs text-slate-500">{new Date(t.date).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CustomerDetailPage
const InfoRow = ({
  icon,
  label,
  value,
  valueClass = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) => (
  <div className="flex items-start gap-3">
    <div className="text-slate-400">{icon}</div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-sm ${valueClass}`}>{value}</div>
    </div>
  </div>
)

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-sm text-slate-700">{value}</div>
  </div>
)

const TransactionType = ({ type }: { type: 'sale' | 'return' }) => {
  const isSale = type === 'sale'

  return (
    <div
      className={`
          inline-flex items-center gap-2
          rounded-lg px-3 py-1 text-xs font-medium
          ${isSale ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
        `}
    >
      {isSale ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
      {isSale ? 'Продажа' : 'Возврат'}
    </div>
  )
}
