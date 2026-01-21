import { useNavigate } from 'react-router'
import { Eye } from 'lucide-react'

import { paths } from '@/app/routers/constants'
import { useGetHistoryStockQuery } from '@/features/remain/api/stock.api'
import { Loading } from '@/shared/ui/Loading'
import { Td, Th } from '@/shared/ui/Table'
import type { TStockChangeType } from '@/features/remain/model/stock.types'

const CHANGE_TYPE_LABEL: Record<TStockChangeType, string> = {
  IN: 'Приход',
  OUT: 'Расход',
  ADJUSTMENT: 'Корректировка',
}
const CHANGE_TYPE_STYLE: Record<TStockChangeType, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
}
const HistoryStockPage = () => {
  const { data, isLoading } = useGetHistoryStockQuery()
  const navigate = useNavigate()

  if (isLoading) {
    return <Loading text="истории изменений" />
  }

  if (!data?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        История изменений пуста
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Дата</Th>
                <Th>Товар</Th>
                <Th>Склад</Th>
                <Th>Изменения</Th>
                <Th>Пользователь</Th>
                <Th>Тип</Th>
                <Th>Причина</Th>
                <Th right>Действие</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition">
                  <Td className="text-slate-600">{new Date(h.created_at).toLocaleString('ru-RU')}</Td>

                  <Td>
                    <div className="font-medium text-slate-800">{h.product_name}</div>
                    <div className="text-xs text-slate-500">{h.manufacturer}</div>
                  </Td>

                  <Td>{h.warehouse_name}</Td>

                  <Td className="space-y-0.5">
                    <Change label="Всего шт" from={h.old_total_pieces} to={h.new_total_pieces} />
                    <Change label="Вес (кг)" from={h.old_weight_kg} to={h.new_weight_kg} />
                    <Change label="Объём (м³)" from={h.old_volume_cbm} to={h.new_volume_cbm} />
                  </Td>

                  <Td>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {h.user_name}
                    </span>
                  </Td>

                  <Td>
                    <ChangeTypeBadge type={h.change_type} />
                  </Td>

                  <Td>
                    <ReasonBadge reason={h.reason} />
                  </Td>

                  <Td right>
                    <button
                      onClick={() => navigate(paths.stockHistoryDetails(h.id.toString()))}
                      className="text-slate-400 hover:text-blue-600 transition"
                    >
                      <Eye size={16} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {data.map((h) => (
          <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                <div className="font-medium text-slate-800">{h.product_name}</div>
                <div className="text-xs text-slate-500">{h.manufacturer}</div>
              </div>

              <button
                onClick={() => navigate(paths.stockHistoryDetails(h.id.toString()))}
                className="text-slate-400 hover:text-blue-600"
              >
                <Eye size={18} />
              </button>
            </div>

            <div className="text-sm">
              <span className="text-slate-500">Склад:</span> {h.warehouse_name}
            </div>

            <div className="space-y-1">
              <Change label="Всего шт" from={h.old_total_pieces} to={h.new_total_pieces} />
              <Change label="Вес (кг)" from={h.old_weight_kg} to={h.new_weight_kg} />
              <Change label="Объём (м³)" from={h.old_volume_cbm} to={h.new_volume_cbm} />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {h.user_name}
              </span>

              <ChangeTypeBadge type={h.change_type} />
            </div>

            <ReasonBadge reason={h.reason} />
          </div>
        ))}
      </div>
    </>
  )
}

export default HistoryStockPage

const Change = ({ label, from, to }: { label: string; from: number; to: number }) => {
  if (from === to) return null

  return (
    <div className="text-xs">
      <span className="text-slate-500">{label}:</span> <span className="text-red-600">{from}</span>
      <span className="mx-1 text-slate-400">→</span>
      <span className="text-green-600 font-medium">{to}</span>
    </div>
  )
}

const ChangeTypeBadge = ({ type }: { type: TStockChangeType }) => {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${CHANGE_TYPE_STYLE[type]}`}>
      {CHANGE_TYPE_LABEL[type]}
    </span>
  )
}
const ReasonBadge = ({ reason }: { reason: string }) => (
  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{reason}</span>
)
