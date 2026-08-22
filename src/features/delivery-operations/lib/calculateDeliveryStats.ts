import type { DeliveryOperation } from '@/features/delivery-operations/model/delivery-operations.schemas'

export interface DeliveryStats {
  averagePercentage: string | null
  weightedAveragePercentage: string | null
  totalReceiptAmount: string | null
  totalSum: string | null
  totalPayment: string | null
  totalConvertedSum: string | null
}

const calculatePercentage = (deliveryCost: string, convertedSum: number | null) => {
  if (!convertedSum || !deliveryCost) return null
  const delivery = parseFloat(deliveryCost)
  const converted = parseFloat(String(convertedSum))
  if (!converted || isNaN(delivery)) return null
  return (delivery / converted) * 100
}

export const calculateDeliveryStats = (operations: DeliveryOperation[] | undefined | null): DeliveryStats => {
  if (!operations || operations.length === 0) {
    return {
      averagePercentage: null,
      weightedAveragePercentage: null,
      totalReceiptAmount: null,
      totalSum: null,
      totalPayment: null,
      totalConvertedSum: null
    }
  }

  const receiptOperations = operations.filter((op) => op.type === 'RECEIPT' && op.converted_sum && op.sum)

  const percentages = receiptOperations
    .map((op) => calculatePercentage(op.sum, op.converted_sum))
    .filter((p): p is number => p !== null)
  const averagePercentage = percentages.length > 0
    ? (percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(2)
    : null

  const totalDeliveryCostForWeighted = receiptOperations.reduce((sum, op) => {
    const cost = parseFloat(op.sum)
    return sum + (isNaN(cost) ? 0 : cost)
  }, 0)
  const totalConvertedSumForWeighted = receiptOperations.reduce((sum, op) => {
    const cs = parseFloat(String(op.converted_sum ?? 0))
    return sum + (isNaN(cs) ? 0 : cs)
  }, 0)
  const weightedAveragePercentage = totalConvertedSumForWeighted > 0
    ? ((totalDeliveryCostForWeighted / totalConvertedSumForWeighted) * 100).toFixed(2)
    : null

  const totalReceiptAmountValue = operations
    .filter((op) => op.type === 'RECEIPT' && op.receipt_amount)
    .reduce((sum, op) => {
      const amount = parseFloat(op.receipt_amount ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const totalPaymentValue = operations
    .filter((op) => op.type !== 'RECEIPT' && op.sum)
    .reduce((sum, op) => {
      const amount = parseFloat(op.sum ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const totalSumValue = operations
    .filter((op) => op.type === 'RECEIPT' && op.sum)
    .reduce((sum, op) => {
      const amount = parseFloat(op.sum ?? '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const totalConvertedSumValue = operations
    .filter((op) => op.type === 'RECEIPT' && op.converted_sum)
    .reduce((sum, op) => {
      const amount = parseFloat(String(op.converted_sum ?? 0))
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  return {
    averagePercentage,
    weightedAveragePercentage,
    totalReceiptAmount: totalReceiptAmountValue > 0 ? totalReceiptAmountValue.toFixed(2) : null,
    totalSum: totalSumValue > 0 ? totalSumValue.toFixed(2) : null,
    totalPayment: totalPaymentValue > 0 ? totalPaymentValue.toFixed(2) : null,
    totalConvertedSum: totalConvertedSumValue > 0 ? totalConvertedSumValue.toFixed(2) : null
  }
}
