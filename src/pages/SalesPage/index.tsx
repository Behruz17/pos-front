import { CreateSaleForm } from '@/features/sales/ui/CreateSaleForm'
import { CreateReturnForm } from '@/features/returns/ui/CreateReturnForm'
import { PackagePlus, PackageMinus } from 'lucide-react'

export const SalesPage = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Продажи и Возвраты</h1>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PackagePlus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Создать продажу</h2>
          </div>

          <CreateSaleForm />
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <PackageMinus className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Создать возврат</h2>
          </div>

          <CreateReturnForm />
        </div>
      </div>
    </div>
  )
}

export default SalesPage
