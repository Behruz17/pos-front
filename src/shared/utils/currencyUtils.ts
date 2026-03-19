export const getCurrencyDisplay = (currency?: string | null): string => {
  if (!currency) return '—';

  const currencyMap: Record<string, string> = {
    'yuan': 'юань ¥',
    'somoni': 'сомони SM',
    'dollar': 'доллар $',
    'CNY': 'юань ¥',
    'TJS': 'сомони SM',
    'USD': 'доллар $'
  };
  return currencyMap[currency.toLowerCase()] || currency;
};
