import { useState } from 'react'
import { Boxes, Package, Warehouse } from 'lucide-react'

import WarehouseStockPage from '../WarehouseStockPage'
import ProductsPage from '../ProductPage'
import StockPage from '../StockPage'

const InventoryPage = () => {
  const [tab, setTab] = useState<'warehouses' | 'products' | 'stock'>('stock')

  return (
    <div className="max-w-7xl mx-auto sm:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Остатки и товары</h1>
        <p className="text-xs sm:text-sm text-slate-500">Управление складами и номенклатурой</p>
      </div>

      <div className="flex gap-2 sm:gap-4 sm:border-b sm:border-slate-200">
        <Tab
          active={tab === 'warehouses'}
          onClick={() => setTab('warehouses')}
          icon={<Warehouse size={16} />}
          label="Склады"
        />

        <Tab active={tab === 'stock'} onClick={() => setTab('stock')} icon={<Boxes size={16} />} label="Остатки" />
        <Tab
          active={tab === 'products'}
          onClick={() => setTab('products')}
          icon={<Package size={16} />}
          label="Товары"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
        {tab === 'warehouses' && <WarehouseStockPage />}
        {tab === 'products' && <ProductsPage />}
        {tab === 'stock' && <StockPage />}
      </div>
    </div>
  )
}

export default InventoryPage
const Tab = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) => (
  <button
    onClick={onClick}
    className={`
        flex items-center justify-center gap-2
        px-4 py-2 rounded-xl sm:rounded-none
        text-sm font-medium transition
        w-full sm:w-auto
  
        ${
          active
            ? 'bg-blue-50 text-blue-600 sm:bg-transparent sm:border-b-2 sm:border-blue-600'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 sm:hover:bg-transparent sm:border-b-2 sm:border-transparent'
        }
      `}
  >
    <span className="hidden sm:inline-flex">{icon}</span>
    {label}
  </button>
)
