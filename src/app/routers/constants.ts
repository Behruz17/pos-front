export const paths = {
  home: () => `/`,
  auth: () => `/auth`,

  warehouse: () => `/warehouses`,

  products: () => `/products`,

  receipt: () => `/inventory/receipt`,
  transaction: () => `/inventory/transaction`,
  returns: () => `/returns`,
  receiptId: (id: string) => `/inventory/receipt/${id}`,

  stock: () => `/stock`,
  stockHistory: () => `/stock/history`,
  stockHistoryDetails: (id: string) => `/stock/history/${id}`,
  sales: () => `/sales`,
  workers: () => `/workers`,
  customers: (id: string = '') => `/customers/${id}`,
  stores: () => `/stores`,
  warehousesStock: () => `/warehouses/stock`,
}
