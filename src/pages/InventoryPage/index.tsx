import WarehouseStockPage from '../WarehouseStockPage'


const InventoryPage = () => {
  return (
    <div className="max-w-7xl mx-auto sm:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Остатки и товары</h1>
        <p className="text-xs sm:text-sm text-slate-500">Управление складами и номенклатурой</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        <WarehouseStockPage />
      </div>
    </div>
  )
}

export default InventoryPage
