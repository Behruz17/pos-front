import { StoresCards } from './StoresCards'
import { AllStoresFinancialSummary } from './AllStoresFinancialSummary'
import { useState } from 'react'

export const StoresPage = () => {
  const [activeTab, setActiveTab] = useState<'stores' | 'statistics'>('stores')
  
  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'stores'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Магазины
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'statistics'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Статистика
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'stores' ? (
        <StoresCards />
      ) : (
        <AllStoresFinancialSummary />
      )}
    </div>
  )
}
