export const paths = {
  home: () => `/`,
  auth: () => `/auth`,

  warehouse: () => `/warehouses`,

  products: () => `/products`,

  receipt: () => `/inventory/receipt`,
  transaction: () => `/inventory/transaction`,
  returns: () => `/inventory/returns`,
  receiptId: (id: string) => `/inventory/receipt/${id}`,

  stock: () => `/stock`,
  stockHistory: () => `/stock/history`,
  stockHistoryDetails: (id: string) => `/stock/history/${id}`,
  sales: (id: string = '') => `/inventory/transaction/sales/${id}`,
  workers: () => `/workers`,
  customers: (id: string = '') => `/customers/${id}`,
  warehousesStock: () => `/warehouses/stock`,
}
