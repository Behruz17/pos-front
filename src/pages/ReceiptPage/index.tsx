import { useAuth } from '@/features/auth/hooks/auth.hooks'
import { useGetReceiptsQuery } from '@/features/receipt/api/receipt.api'
import AdminReceiptForm from '@/features/receipt/ui/AdminReceiptForm'
import ReceiptsTable from '@/features/receipt/ui/ReceiptsTable'
import { Loading } from '@/shared/ui/Loading'

const ReceiptPage = () => {
  const { data = [], isLoading } = useGetReceiptsQuery()
  const { isAdmin } = useAuth()
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Приход товара</h1>
        <p className="text-sm text-slate-500">Оформление и история поступлений на склад</p>
      </div>

      {isAdmin && <AdminReceiptForm />}

      {isLoading ? <Loading text="приходов" /> : <ReceiptsTable data={data} />}
    </div>
  )
}

export default ReceiptPage
