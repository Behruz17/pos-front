import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertTriangle, ArrowDown, ArrowUp, Search } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { useGetProductStatisticsQuery } from '@/features/products/api/products.api'
import type { TProductStatsItem } from '@/features/products/model/products.types'
import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { paths } from '@/app/routers/constants'
import ButtonBack from '@/shared/ui/ButtonBack'
import { Loading } from '@/shared/ui/Loading'

// Local date as YYYY-MM-DD (toISOString would shift the day by the timezone)
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const presets = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: '7 дней' },
  { key: 'month', label: 'Этот месяц' },
  { key: 'prevMonth', label: 'Прошлый месяц' },
  { key: 'year', label: 'Этот год' },
  { key: 'all', label: 'Всё время' },
] as const

const presetRange = (key: (typeof presets)[number]['key']): [string, string] => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (key) {
    case 'today':
      return [toDateStr(now), toDateStr(now)]
    case 'week':
      return [toDateStr(new Date(y, m, now.getDate() - 6)), toDateStr(now)]
    case 'month':
      return [toDateStr(new Date(y, m, 1)), toDateStr(now)]
    case 'prevMonth':
      return [toDateStr(new Date(y, m - 1, 1)), toDateStr(new Date(y, m, 0))]
    case 'year':
      return [toDateStr(new Date(y, 0, 1)), toDateStr(now)]
    case 'all':
      return ['', '']
  }
}

const fmt = (n: number | null | undefined, digits = 2) =>
  n == null ? '—' : n.toLocaleString('ru-RU', { maximumFractionDigits: digits })

type SortKey = 'name' | 'stock' | 'received' | 'sold_qty' | 'revenue' | 'profit' | 'profit_percent'

const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Товар', align: 'left' },
  { key: 'stock', label: 'Остаток', align: 'right' },
  { key: 'received', label: 'Пришло', align: 'right' },
  { key: 'sold_qty', label: 'Продано', align: 'right' },
  { key: 'revenue', label: 'Выручка, смн', align: 'right' },
  { key: 'profit', label: 'Прибыль, смн', align: 'right' },
  { key: 'profit_percent', label: 'Прибыль %', align: 'right' },
]

const ProductStatsPage = () => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [[from, to], setRange] = useState<[string, string]>(() => presetRange('month'))
  const [search, setSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'revenue', desc: true })

  const { data, isLoading, isFetching, isError } = useGetProductStatisticsQuery(
    { from, to },
    { skip: !isAdmin },
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = (data?.items ?? []).filter((it) => {
      if (onlyActive && !it.received && !it.sold_qty && !it.returned_qty) return false
      if (!q) return true
      return it.name.toLowerCase().includes(q) || (it.product_code ?? '').toLowerCase().includes(q)
    })
    const dir = sort.desc ? -1 : 1
    return [...list].sort((a, b) => {
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir
      const av = a[sort.key]
      const bv = b[sort.key]
      // Unknown values ("—") always go last
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return (av - bv) * dir
    })
  }, [data, search, onlyActive, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }))

  const handleExport = () => {
    try {
      const sheet = XLSX.utils.json_to_sheet(
        rows.map((it: TProductStatsItem, i) => ({
          '#': i + 1,
          Товар: it.name,
          Артикул: it.product_code ?? '',
          Остаток: it.stock,
          Пришло: it.received,
          Продано: it.sold_qty,
          Возвраты: it.returned_qty,
          'Выручка, смн': it.revenue,
          'Себестоимость ед., смн': it.unit_cost ?? '',
          'Прибыль, смн': it.profit ?? '',
          'Прибыль %': it.profit_percent ?? '',
        })),
      )
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, 'Статистика')
      XLSX.writeFile(book, `product_stats_${from || 'all'}_${to || toDateStr(new Date())}.xlsx`)
    } catch (e) {
      console.error(e)
      toast.error('Не удалось экспортировать')
    }
  }

  if (!isAdmin) {
    return <div className="text-center text-slate-500 py-10">Статистика доступна только администратору</div>
  }

  const totals = data?.totals
  const cards = [
    { label: 'Остаток сейчас', value: fmt(totals?.stock, 3), hint: 'шт., на всех складах' },
    { label: 'Пришло', value: fmt(totals?.received, 3), hint: 'шт., по приходам' },
    { label: 'Продано', value: fmt(totals?.sold_qty, 3), hint: 'шт., за вычетом возвратов' },
    { label: 'Выручка', value: fmt(totals?.revenue), hint: 'сомони' },
    {
      label: 'Прибыль',
      value: fmt(totals?.profit),
      hint: 'сомони',
      tone: (totals?.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    {
      label: 'Прибыль %',
      value: totals?.profit_percent == null ? '—' : `${fmt(totals.profit_percent, 1)}%`,
      hint: 'от себестоимости',
      tone: (totals?.profit_percent ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ]

  const activePreset = presets.find((p) => {
    const [f, t] = presetRange(p.key)
    return f === from && t === to
  })?.key

  return (
    <div className="space-y-6">
      <ButtonBack onBack={() => navigate(paths.products())} />

      <div className="flex flex-col gap-1">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Статистика товаров</h2>
        <p className="text-sm text-slate-500">
          Сколько пришло, продано и заработано за период. Остаток — текущий.
        </p>
      </div>

      {/* Period */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setRange(presetRange(p.key))}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                activePreset === p.key
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            С
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setRange([e.target.value, to])}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            По
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setRange([from, e.target.value])}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          {isFetching && <span className="text-sm text-slate-400 pb-2">Обновление…</span>}
        </div>
      </div>

      {isLoading ? (
        <Loading text="статистики" />
      ) : isError || !data ? (
        <div className="text-center text-red-500 py-10">Не удалось загрузить статистику</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">{c.label}</div>
                <div className={`mt-1 text-lg sm:text-xl font-semibold tabular-nums ${c.tone ?? 'text-slate-800'}`}>
                  {c.value}
                </div>
                <div className="text-xs text-slate-400">{c.hint}</div>
              </div>
            ))}
          </div>

          {data.totals.products_without_cost > 0 && (
            <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-slate-700">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                У {data.totals.products_without_cost} проданных товаров нет цены закупки в приходах — их прибыль
                не входит в итог.
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или артикулу…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Только с движением за период
            </label>
            <button
              onClick={handleExport}
              disabled={!rows.length}
              className="sm:ml-auto px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:bg-gray-300"
            >
              Экспорт
            </button>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        onClick={() => toggleSort(c.key)}
                        className={`px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${
                          c.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {c.label}
                          {sort.key === c.key && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((it) => (
                    <tr key={it.product_id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {it.name}
                          {it.deleted && <span className="ml-2 text-xs text-red-400">(удалён)</span>}
                        </div>
                        <div className="text-xs text-slate-400">
                          {it.product_code && <span className="font-mono mr-2">{it.product_code}</span>}
                          {it.unit_cost != null ? `себест. ${fmt(it.unit_cost)} смн` : 'себест. неизвестна'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(it.stock, 3)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(it.received, 3)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {fmt(it.sold_qty, 3)}
                        {it.returned_qty > 0 && (
                          <div className="text-xs text-slate-400">возвр. {fmt(it.returned_qty, 3)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(it.revenue)}</td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-medium ${
                          it.profit == null ? 'text-slate-400' : it.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {fmt(it.profit)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${
                          it.profit_percent == null
                            ? 'text-slate-400'
                            : it.profit_percent >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                        }`}
                      >
                        {it.profit_percent == null ? '—' : `${fmt(it.profit_percent, 1)}%`}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                        За выбранный период движений нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {rows.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-sm text-slate-600">
                Товаров в списке: <span className="font-medium">{rows.length}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ProductStatsPage
