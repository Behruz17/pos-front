import { useAuth } from '@/features/auth/hooks/auth.hooks'
import AdminReceiptForm from '@/features/receipt/ui/AdminReceiptForm'

const ReceiptPage = () => {
  const { isAdmin } = useAuth()
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Приход товара</h1>
        <p className="text-sm text-slate-500">Оформление и история поступлений на склад</p>
      </div>

      {isAdmin && <AdminReceiptForm />}

      {/* Receipts list has been removed as requested */}
    </div>
  )
}

export default ReceiptPage
