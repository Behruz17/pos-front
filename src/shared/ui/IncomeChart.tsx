import { useState } from 'react'

/** One column: money received in a day (key YYYY-MM-DD), month (YYYY-MM) or year (YYYY) */
export type TIncomeChartItem = {
  key: string
  cash: number
  debt_payments: number
  total: number
  cash_count: number
  payments_count: number
}

export type TIncomeChartGranularity = 'day' | 'month' | 'year'

// Two series, validated categorical slots 1 and 2; text always stays in slate ink
const CASH_COLOR = '#2a78d6'
const PAYMENTS_COLOR = '#eb6834'

const PLOT_HEIGHT = 220

const fmt = (n: number, digits = 2) => n.toLocaleString('ru-RU', { maximumFractionDigits: digits })

// Compact axis labels: 12 500 → 12,5k
const fmtAxis = (n: number) => (n >= 1000 ? `${fmt(n / 1000, 1)}k` : fmt(n, 0))

// Smallest 1 / 2 / 2.5 / 5 × 10^n step that covers the maximum in at most `maxTicks` steps,
// so the gridlines land on even numbers and the plot is not half empty
const niceStep = (max: number, maxTicks: number) => {
  const pow = 10 ** Math.floor(Math.log10(max / maxTicks))
  const candidates = [1, 2, 2.5, 5, 10, 20].map((m) => m * pow)
  return candidates.find((s) => Math.ceil(max / s) <= maxTicks) ?? candidates[candidates.length - 1]
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const bucketLabel = (key: string, g: TIncomeChartGranularity) =>
  g === 'day' ? String(Number(key.slice(8, 10))) : g === 'month' ? MONTHS_SHORT[Number(key.slice(5, 7)) - 1] : key

const bucketTitle = (key: string, g: TIncomeChartGranularity) => {
  const [y, m, d] = key.split('-').map(Number)
  if (g === 'day')
    return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })
  if (g === 'month') return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  return `${y} год`
}

const GRANULARITY_WORDS: Record<TIncomeChartGranularity, { by: string; best: string }> = {
  day: { by: 'дням', best: 'день' },
  month: { by: 'месяцам', best: 'месяц' },
  year: { by: 'годам', best: 'год' },
}

type Props = {
  granularity: TIncomeChartGranularity
  items: TIncomeChartItem[]
  /** Shown after "Продажи по дням — " */
  periodTitle: string
  description: string
  isFetching?: boolean
}

/**
 * Stacked columns of money received: cash (paid at purchase) at the baseline, debt payments on top.
 * Hover previews a column, click pins its exact amounts (phones have no hover).
 */
export const IncomeChart = ({ granularity, items, periodTitle, description, isFetching }: Props) => {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const totals = items.reduce(
    (t, i) => ({ cash: t.cash + i.cash, debt_payments: t.debt_payments + i.debt_payments, total: t.total + i.total }),
    { cash: 0, debt_payments: 0, total: 0 }
  )

  const byDay = granularity === 'day'
  const words = GRANULARITY_WORDS[granularity]
  const maxTotal = Math.max(...items.map((i) => i.total), 0)
  const step = maxTotal > 0 ? niceStep(maxTotal, 5) : 1
  const axisMax = maxTotal > 0 ? Math.ceil(maxTotal / step) * step : 4
  const ticks = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step)
  const best = items.reduce<TIncomeChartItem | null>((b, i) => (i.total > (b?.total ?? 0) ? i : b), null)

  // On narrow screens show only every 5th day label (plus the 1st)
  const showDayLabel = (i: number) => !byDay || i === 0 || (i + 1) % 5 === 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-800">
            Продажи по {words.by} — {periodTitle}
          </h4>
          <p className="text-sm text-slate-500">
            {description} Нажмите на столбик, чтобы увидеть точную сумму.
            {isFetching && <span className="ml-2 text-slate-400">Обновление…</span>}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs text-slate-500">Всего за период</div>
          <div className="text-xl font-semibold text-slate-800 tabular-nums">{fmt(totals.total)} смн</div>
          {best && (
            <div className="text-xs text-slate-500">
              Лучший {words.best}: {bucketTitle(best.key, granularity)} — {fmt(best.total, 0)}
            </div>
          )}
        </div>
      </div>

      {/* Legend with totals (identity is never color alone) */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CASH_COLOR }} />
          Наличные <b className="tabular-nums">{fmt(totals.cash, 0)}</b>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: PAYMENTS_COLOR }} />
          Оплаты долгов <b className="tabular-nums">{fmt(totals.debt_payments, 0)}</b>
        </span>
      </div>

      {maxTotal === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">За этот период поступлений нет</div>
      ) : (
        <div className="mt-6 pt-2">
          <div className="flex">
            {/* Y axis labels */}
            <div className="relative w-12 shrink-0" style={{ height: PLOT_HEIGHT }}>
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-2 translate-y-1/2 text-[11px] text-slate-400 tabular-nums"
                  style={{ bottom: `${(t / axisMax) * 100}%` }}
                >
                  {fmtAxis(t)}
                </span>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {/* Plot */}
              <div className="relative" style={{ height: PLOT_HEIGHT }}>
                {ticks.map((t) => (
                  <div
                    key={t}
                    className={`absolute inset-x-0 border-t ${t === 0 ? 'border-slate-300' : 'border-slate-100'}`}
                    style={{ bottom: `${(t / axisMax) * 100}%` }}
                  />
                ))}

                <div className="absolute inset-0 flex">
                  {items.map((item, i) => {
                    const cashH = (item.cash / axisMax) * PLOT_HEIGHT
                    const payH = (item.debt_payments / axisMax) * PLOT_HEIGHT
                    const isSelected = selected === item.key
                    // Hover previews another column; otherwise the clicked one stays open
                    const isHovered = hovered === null ? isSelected : hovered === i
                    const toggle = () => setSelected((k) => (k === item.key ? null : item.key))
                    // Keep the tooltip inside the plot: by position, so it also works on narrow screens
                    const pos = (i + 0.5) / items.length
                    const align = pos < 0.4 ? 'left-0' : pos > 0.6 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    return (
                      <div
                        key={item.key}
                        tabIndex={0}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(i)}
                        onBlur={() => setHovered(null)}
                        onClick={toggle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggle()
                          }
                          if (e.key === 'Escape') setSelected(null)
                        }}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`${bucketTitle(item.key, granularity)}: всего ${fmt(item.total)} сомони, наличные ${fmt(item.cash)}, оплаты долгов ${fmt(item.debt_payments)}`}
                        className={`relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isSelected ? 'bg-slate-200/70' : isHovered ? 'bg-slate-100/70' : ''
                        }`}
                      >
                        {/* Stacked column: cash at the baseline, payments on top, 2px gap between them */}
                        <div className="flex w-[70%] max-w-6 flex-col items-stretch justify-end">
                          {payH > 0 && (
                            <div
                              className={`${cashH > 0 ? 'mb-[2px]' : ''} rounded-t`}
                              style={{ height: Math.max(payH, 1), backgroundColor: PAYMENTS_COLOR }}
                            />
                          )}
                          {cashH > 0 && (
                            <div
                              className={payH > 0 ? '' : 'rounded-t'}
                              style={{ height: Math.max(cashH, 1), backgroundColor: CASH_COLOR }}
                            />
                          )}
                        </div>

                        {isHovered && (
                          <div
                            role="tooltip"
                            className={`pointer-events-none absolute top-0 z-20 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg ${align}`}
                          >
                            <div className="mb-2 text-sm font-medium text-slate-800">
                              {bucketTitle(item.key, granularity)}
                            </div>
                            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                              <dt className="flex items-center gap-1.5 text-slate-500">
                                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CASH_COLOR }} />
                                Наличные ({item.cash_count})
                              </dt>
                              <dd className="text-right text-slate-800 tabular-nums">{fmt(item.cash)}</dd>
                              <dt className="flex items-center gap-1.5 text-slate-500">
                                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: PAYMENTS_COLOR }} />
                                Оплаты долгов ({item.payments_count})
                              </dt>
                              <dd className="text-right text-slate-800 tabular-nums">{fmt(item.debt_payments)}</dd>
                              <dt className="border-t border-slate-100 pt-1 font-medium text-slate-700">Всего</dt>
                              <dd className="border-t border-slate-100 pt-1 text-right font-semibold text-slate-800 tabular-nums">
                                {fmt(item.total)} смн
                              </dd>
                            </dl>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* X axis labels */}
              <div className="mt-1 flex">
                {items.map((item, i) => (
                  <div
                    key={item.key}
                    className="min-w-0 flex-1 text-center text-[10px] sm:text-[11px] text-slate-400 tabular-nums"
                  >
                    <span className={showDayLabel(i) ? '' : 'hidden sm:inline'}>
                      {bucketLabel(item.key, granularity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
