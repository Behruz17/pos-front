import { useState } from 'react'
import { CreateSaleForm } from '@/features/sales/ui/CreateSaleForm'
import { CreateReturnForm } from '@/features/returns/ui/CreateReturnForm'
import { PackagePlus, PackageMinus } from 'lucide-react'

type Tab = 'sales' | 'returns'

export const SalesPage = () => {
  const [tab, setTab] = useState<Tab>('sales')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {tab === 'sales' ? 'Продажи' : 'Возвраты'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {tab === 'sales' 
            ? 'Оформление новых продаж' 
            : 'Оформление возвратов товаров'}
        </p>
      </div>

      <div className="flex gap-3">
        <TabButton active={tab === 'sales'} onClick={() => setTab('sales')}>
          Продажи
        </TabButton>
        <TabButton active={tab === 'returns'} onClick={() => setTab('returns')}>
          Возвраты
        </TabButton>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        {tab === 'sales' ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PackagePlus className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Создать продажу</h2>
            </div>
            <CreateSaleForm />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <PackageMinus className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Создать возврат</h2>
            </div>
            <CreateReturnForm />
          </>
        )}
      </div>
    </div>
  )
}

const TabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-lg text-sm font-medium transition
      ${active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
    `}
  >
    {children}
  </button>
)

export default SalesPage
