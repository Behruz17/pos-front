import { useGetDeliveryOperationsQuery } from '@/features/delivery-operations/hooks/delivery-operations.hooks'
import type { DeliveryOperation } from '@/features/delivery-operations/model/delivery-operations.schemas'

interface DeliveryDriverStatsProps {
  driverId: number
}

export const DeliveryDriverStats = ({ driverId }: DeliveryDriverStatsProps) => {
  const { data: operations, isLoading } = useGetDeliveryOperationsQuery({ driverId })

  if (isLoading || !operations) return null

  const totalSum = operations
    .filter((op: DeliveryOperation) => op.type === 'RECEIPT' && op.sum)
    .reduce((sum: number, op: DeliveryOperation) => {
      const amount = parseFloat(op.sum ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const totalPayment = operations
    .filter((op: DeliveryOperation) => op.type === 'PAYMENT' && op.sum)
    .reduce((sum: number, op: DeliveryOperation) => {
      const amount = parseFloat(op.sum ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  if (totalSum === 0 && totalPayment === 0) return null

  return (
    <>
      {totalSum > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Общая сумма</span>
          <span className="text-sm font-semibold text-emerald-600">{totalSum.toFixed(2)}</span>
        </div>
      )}
      {totalPayment > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Сумма оплаты</span>
          <span className="text-sm font-semibold text-red-600">{totalPayment.toFixed(2)}</span>
        </div>
      )}
    </>
  )
}
