// Customer balance: negative = the customer owes us, positive = prepaid (overpayment)
export const customerDebtLine = (balance: number) => {
  const date = new Date().toLocaleDateString('ru-RU')
  if (balance < 0) return { label: `Долг клиента на ${date}`, value: Math.abs(balance) }
  if (balance > 0) return { label: `Переплата клиента на ${date}`, value: balance }
  return { label: `Долга нет на ${date}`, value: 0 }
}
