import { useParams } from 'react-router'
import { skipToken } from '@reduxjs/toolkit/query'
import { Package, Warehouse, User, Calendar } from 'lucide-react'

import { useGetHistoryStickDetailQuery } from '@/features/remain/api/stock.api'
import type { TStockChangeType } from '@/features/remain/model/stock.types'
import { formatDateTime } from '@/shared/formatDateTime'
import { Loading } from '@/shared/ui/Loading'
import { ProductImage } from '@/shared/ui/ProductImageю'

const CHANGE_TYPE_MAP: Record<
  TStockChangeType,
  {
    label: string
    badge: string
    fromColor: string
    toColor: string
  }
> = {
  IN: {
    label: 'Приход',
    badge: 'bg-green-100 text-green-700',
    fromColor: 'text-slate-500',
    toColor: 'text-green-700',
  },
  OUT: {
    label: 'Расход',
    badge: 'bg-red-100 text-red-700',
    fromColor: 'text-slate-500',
    toColor: 'text-red-700',
  },
  ADJUSTMENT: {
    label: 'Корректировка',
    badge: 'bg-yellow-100 text-yellow-800',
    fromColor: 'text-slate-500',
    toColor: 'text-blue-700',
  },
}

const HistoryStockDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useGetHistoryStickDetailQuery(id ?? skipToken)

  if (isLoading) return <Loading text="истории" />

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        Запись истории не найдена
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Изменение остатков</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Calendar size={14} />
              {formatDateTime(data.created_at)}
            </div>
          </div>

          <ChangeTypeBadge type={data.change_type} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Товар">
          <div className="flex items-center gap-4">
            {data.image ? (
              <ProductImage src={data.image} alt={data.product_name} />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package className="text-slate-400" />
              </div>
            )}

            <div>
              <div className="font-medium text-slate-800">{data.product_name}</div>
              <div className="text-sm text-slate-500">{data.manufacturer}</div>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Склад и пользователь">
          <InfoRow icon={<Warehouse size={14} />} label="Склад" value={data.warehouse_name} />
          <InfoRow icon={<User size={14} />} label="Пользователь" value={data.user_name} />
        </InfoCard>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Изменения остатков</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ChangeRow
            label="Всего штук"
            from={data.old_total_pieces}
            to={data.new_total_pieces}
            type={data.change_type}
          />

          <ChangeRow label="Вес (кг)" from={data.old_weight_kg} to={data.new_weight_kg} type={data.change_type} />

          <ChangeRow label="Объём (м³)" from={data.old_volume_cbm} to={data.new_volume_cbm} type={data.change_type} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Причина изменения</h2>
        <p className="text-sm text-slate-600 whitespace-pre-line">{data.reason || '— не указана —'}</p>
      </div>
    </div>
  )
}

const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
    {children}
  </div>
)

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-slate-500">
      {icon}
      {label}
    </div>
    <div className="font-medium text-slate-800 text-right">{value}</div>
  </div>
)

const ChangeRow = ({ label, from, to, type }: { label: string; from: number; to: number; type: TStockChangeType }) => {
  const cfg = CHANGE_TYPE_MAP[type]

  if (from === to) return null

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>

      <div className="font-mono text-sm">
        {type === 'IN' && (
          <>
            <span className={cfg.fromColor}>{from}</span>
            <span className="mx-2 text-slate-400">+</span>
            <span className={`${cfg.toColor} font-semibold`}>{to - from}</span>
          </>
        )}

        {type === 'OUT' && (
          <>
            <span className={cfg.fromColor}>{from}</span>
            <span className="mx-2 text-slate-400">−</span>
            <span className={`${cfg.toColor} font-semibold`}>{from - to}</span>
          </>
        )}

        {type === 'ADJUSTMENT' && (
          <>
            <span className={cfg.fromColor}>{from}</span>
            <span className="mx-2 text-slate-400">→</span>
            <span className={`${cfg.toColor} font-semibold`}>{to}</span>
          </>
        )}
      </div>
    </div>
  )
}

const ChangeTypeBadge = ({ type }: { type: TStockChangeType }) => {
  const cfg = CHANGE_TYPE_MAP[type]
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${cfg.badge}`}>{cfg.label}</span>
}

export default HistoryStockDetailPage
