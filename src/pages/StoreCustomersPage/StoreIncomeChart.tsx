import { useGetStoreIncomeChartQuery } from '@/features/stores/api/stores.api'
import { IncomeChart } from '@/shared/ui/IncomeChart'

type Props = { storeId: number; month?: number; year?: number }

/**
 * Money received by the store per day (month selected) or per month (only year):
 * cash sales + payments of debts for goods. Reseller operations are not included.
 */
export const StoreIncomeChart = ({ storeId, month, year }: Props) => {
  const { data, isFetching, isError } = useGetStoreIncomeChartQuery({ storeId, month, year })

  if (isError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-red-500">
        Не удалось загрузить диаграмму продаж
      </div>
    )
  }
  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Загрузка диаграммы…
      </div>
    )
  }

  const periodTitle =
    data.granularity === 'day'
      ? new Date(data.year, (data.month ?? 1) - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      : `${data.year} год`

  return (
    <IncomeChart
      granularity={data.granularity}
      items={data.items}
      periodTitle={periodTitle}
      description="Полученные деньги: наличные за товар и оплаты долгов. Перекупщики не входят."
      isFetching={isFetching}
    />
  )
}
