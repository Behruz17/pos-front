import { useGetDeliveryOperationsQuery } from '@/features/delivery-operations/hooks/delivery-operations.hooks'
import type { DeliveryOperation } from '@/features/delivery-operations/model/delivery-operations.schemas'

interface DeliveryDriverStatsProps {
  driverId: number
}

export const DeliveryDriverStats = ({ driverId }: DeliveryDriverStatsProps) => {
  const { data: operations, isLoading } = useGetDeliveryOperationsQuery({ driverId })

  if (isLoading || !operations) return null

  const totalReceiptAmount = operations
    .filter((op: DeliveryOperation) => op.type === 'RECEIPT' && op.receipt_amount)
    .reduce((sum: number, op: DeliveryOperation) => {
      const amount = parseFloat(op.receipt_amount ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const totalPayment = operations
    .filter((op: DeliveryOperation) => op.type === 'PAYMENT' && op.sum)
    .reduce((sum: number, op: DeliveryOperation) => {
      const amount = parseFloat(op.sum ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  if (totalReceiptAmount === 0 && totalPayment === 0) return null

  return (
    <>
      {totalReceiptAmount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Сумма прихода</span>
          <span className="text-sm font-semibold text-emerald-600">{totalReceiptAmount.toFixed(2)}</span>
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
