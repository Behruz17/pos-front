import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TProductStatsItem } from '@/features/products/model/products.types'

const fmt = (n: number, digits = 2) => n.toLocaleString('ru-RU', { maximumFractionDigits: digits })

const LIMITS = [10, 20, 30] as const

// Single series, so one hue (validated categorical slot 1); text always stays in slate ink
const BAR_COLOR = '#2a78d6'
const BAR_HOVER_COLOR = '#1f5fae'

type Props = { items: TProductStatsItem[] }

// Ranked horizontal bars: which products brought the most profit in the selected period
export const TopProfitChart = ({ items }: Props) => {
  // Collapsed by default; opens on click on the header
  const [open, setOpen] = useState(false)
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(10)
  const [hovered, setHovered] = useState<number | null>(null)

  const ranked = useMemo(
    () =>
      items
        .filter((it) => it.profit != null && it.profit > 0)
        .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0))
        .slice(0, limit),
    [items, limit]
  )

  const max = ranked[0]?.profit ?? 0
  const totalProfit = items.reduce((sum, it) => sum + (it.profit && it.profit > 0 ? it.profit : 0), 0)
  const shownProfit = ranked.reduce((sum, it) => sum + (it.profit ?? 0), 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-start gap-2 text-left cursor-pointer group"
        >
          <ChevronDown
            size={20}
            className={`mt-0.5 shrink-0 text-slate-400 group-hover:text-slate-600 transition-transform ${open ? '' : '-rotate-90'}`}
          />
          <div>
            <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-700">
              Самые прибыльные товары
            </h3>
            <p className="text-sm text-slate-500">
              Прибыль за выбранный период, сомони
              {ranked.length > 0 && totalProfit > 0 && (
                <>
                  {' '}
                  · топ-{ranked.length} дали{' '}
                  <b className="text-slate-700">{fmt((shownProfit / totalProfit) * 100, 1)}%</b> всей прибыли
                </>
              )}
            </p>
          </div>
        </button>
        {open && (
          <div
            className="flex gap-1 rounded-lg bg-slate-100 p-1 self-start"
            role="group"
            aria-label="Сколько товаров показать"
          >
            {LIMITS.map((n) => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                aria-pressed={limit === n}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  limit === n ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Топ {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {!open ? null : ranked.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">За выбранный период нет товаров с прибылью</div>
      ) : (
        <ol className="mt-4 flex flex-col">
          {ranked.map((it, i) => {
            const profit = it.profit ?? 0
            const width = max > 0 ? Math.max((profit / max) * 100, 0.5) : 0
            const isHovered = hovered === it.product_id
            return (
              <li
                key={it.product_id}
                tabIndex={0}
                onMouseEnter={() => setHovered(it.product_id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(it.product_id)}
                onBlur={() => setHovered(null)}
                aria-label={`${i + 1}. ${it.name}: прибыль ${fmt(profit)} сомони`}
                className={`relative grid grid-cols-[minmax(0,9rem)_1fr] sm:grid-cols-[minmax(0,16rem)_1fr] items-center gap-3 py-1.5 px-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isHovered ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex min-w-0 items-baseline gap-2 text-sm">
                  <span className="w-5 shrink-0 text-right text-xs text-slate-400 tabular-nums">{i + 1}</span>
                  <span className="truncate text-slate-700" title={it.name}>
                    {it.name}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  {/* Bar: square at the baseline, 4px rounded data-end, capped thickness */}
                  <div className="h-5 flex-1 min-w-0">
                    <div
                      className="h-full rounded-r transition-[width,background-color] duration-300"
                      style={{ width: `${width}%`, backgroundColor: isHovered ? BAR_HOVER_COLOR : BAR_COLOR }}
                    />
                  </div>
                  <span className="w-20 sm:w-24 shrink-0 text-right text-sm font-medium text-slate-800 tabular-nums">
                    {fmt(profit, 0)}
                  </span>
                </div>

                {isHovered && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
                  >
                    <div className="mb-2 font-medium text-slate-800 text-sm">{it.name}</div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt className="text-slate-500">Прибыль</dt>
                      <dd className="text-right font-medium text-slate-800 tabular-nums">{fmt(profit)} смн</dd>
                      <dt className="text-slate-500">Прибыль %</dt>
                      <dd className="text-right text-slate-800 tabular-nums">
                        {it.profit_percent == null ? '—' : `${fmt(it.profit_percent, 1)}%`}
                      </dd>
                      <dt className="text-slate-500">Выручка</dt>
                      <dd className="text-right text-slate-800 tabular-nums">{fmt(it.revenue)} смн</dd>
                      <dt className="text-slate-500">Продано</dt>
                      <dd className="text-right text-slate-800 tabular-nums">{fmt(it.sold_qty, 3)} шт.</dd>
                      <dt className="text-slate-500">Себест. ед.</dt>
                      <dd className="text-right text-slate-800 tabular-nums">
                        {it.unit_cost == null ? '—' : `${fmt(it.unit_cost)} смн`}
                      </dd>
                    </dl>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
