import { useMemo, useState } from 'react'
import { Plus, Search, Eye, RotateCcw, Receipt } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Loading } from '@/shared/ui/Loading'
import { formatDateTime } from '@/shared/formatDateTime'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { useGetSalesQuery } from '@/features/sales/api/sales.api'
import { useGetReturnsQuery } from '@/features/returns/api/returns.api'
import type { TSale } from '@/features/sales/model/sales.types'
import type { TReturn } from '@/features/returns/model/returns.types'
import { CreateSaleModal } from '@/widgets/modals/CreateSaleModal'
import ReturnsViewModal from '@/widgets/modals/ReturnsViewModal'
import { paths } from '@/app/routers/constants'

type Tab = 'sales' | 'returns'

const TransactionPage = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('sales')
  const [search, setSearch] = useState('')
  const [viewId, setViewId] = useState<number | null>(null)

  const { data: sales = [], isLoading: isSalesLoading } = useGetSalesQuery()
  const { data: returns = [], isLoading: isReturnsLoading } = useGetReturnsQuery()

  const isLoading = tab === 'sales' ? isSalesLoading : isReturnsLoading

  const filtered = useMemo(() => {
    const source = tab === 'sales' ? sales : returns

    return source.filter(
      (i) =>
        i.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.created_by_name?.toLowerCase().includes(search.toLowerCase())
    ) as (TSale | TReturn)[]
  }, [sales, returns, search, tab])

  const handleRowClick = (id: number) => {
    if (tab === 'sales') {
      navigate(paths.salesId(id.toString()))
    } else {
      setViewId(id)
    }
  }

  if (isLoading) {
    return <Loading text={tab === 'sales' ? 'продаж' : 'возвратов'} />
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Транзакции</h1>
          <p className="text-sm text-slate-500">{tab === 'sales' ? 'Все продажи' : 'Все возвраты'}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по клиенту или сотруднику"
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg
                border border-slate-300 text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <TabButton active={tab === 'sales'} onClick={() => setTab('sales')}>
          Продажи
        </TabButton>
        <TabButton active={tab === 'returns'} onClick={() => setTab('returns')}>
          Возвраты
        </TabButton>
        {isAdmin && tab === 'sales' && (
          <button
            onClick={() => setCreateOpen(true)}
            className="
                inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg
                bg-blue-600 text-white text-sm font-medium
                hover:bg-blue-700 transition
              "
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {!filtered.length && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          {tab === 'sales' ? 'Продаж пока нет' : 'Возвратов пока нет'}
        </div>
      )}

      {!!filtered.length && (
        <div className="space-y-3 sm:hidden">
          {filtered.map((i) => (
            <div
              key={i.id}
              onClick={() => handleRowClick(i.id)}
              className="
                bg-white border border-slate-200 rounded-xl
                p-4 space-y-3
                active:bg-slate-50 transition
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    #{i.id} — {i.customer_name || 'Демо-клиент'}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    {tab === 'sales' ? <Receipt size={14} /> : <RotateCcw size={14} />}
                    {formatDateTime(i.created_at)}
                  </div>
                </div>

                <Eye size={18} className="text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {tab === 'sales' && 'store_name' in i && (
                  <>
                    <div>
                      <span className="text-xs text-slate-500">Магазин</span>
                      <div className="font-medium">{i.store_name || `Магазин #${i.store_id}`}</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Склад</span>
                      <div className="font-medium">{i.warehouse_name || (i.warehouse_id ? `Склад #${i.warehouse_id}` : '—')}</div>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <span className="text-xs text-slate-500">Создал</span>
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {i.created_by_name}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-xs text-slate-500">Сумма</span>
                  <div className="font-semibold text-slate-800">{Number(i.total_amount).toLocaleString()} с</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!!filtered.length && (
        <div className="hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3">№</th>
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Магазин</th>
                  <th className="px-4 py-3">Склад</th>
                  <th className="px-4 py-3">Создал</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3 text-right">Действие</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">#{i.id}</td>

                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {tab === 'sales' ? (
                          <Receipt size={16} className="text-slate-400" />
                        ) : (
                          <RotateCcw size={16} className="text-slate-400" />
                        )}
                        {i.customer_name || 'Демо-клиент'}
                      </div>
                    </td>

                    {tab === 'sales' && 'store_name' in i && (
                      <>
                        <td className="px-4 py-3 text-slate-600">
                          {i.store_name || `Магазин #${i.store_id}`}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {i.warehouse_name || (i.warehouse_id ? `Склад #${i.warehouse_id}` : '—')}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {i.created_by_name}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{formatDateTime(i.created_at)}</td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {Number(i.total_amount).toLocaleString()} с
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleRowClick(i.id)} className="text-slate-500 hover:text-blue-600">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <CreateSaleModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => setCreateOpen(false)}
        />
      )}

      {viewId && <ReturnsViewModal id={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}

export default TransactionPage

const TabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-lg text-sm font-medium transition
      ${active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
    `}
  >
    {children}
  </button>
)
