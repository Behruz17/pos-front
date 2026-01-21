import { Eye } from 'lucide-react'
import type { TReceiptGto } from '../model/receipt.types'
import { useNavigate } from 'react-router'
import { paths } from '@/app/routers/constants'
import { formatDateTime } from '@/shared/formatDateTime'

const ReceiptsTable = ({ data }: { data: TReceiptGto[] }) => {
  const navigate = useNavigate()

  if (!data.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        Приходов пока нет
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {data.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">Приход #{r.id}</div>

                <div className="mt-1 text-xs text-slate-500">{formatDateTime(r.created_at)}</div>
              </div>

              <button
                onClick={() => navigate(paths.receiptId(r.id.toString()))}
                className="text-slate-400 hover:text-blue-600 transition"
                title="Посмотреть"
              >
                <Eye size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Склад</span>
                <span className="font-medium text-slate-800">{r.warehouse_name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Создал</span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {r.created_by_name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Сумма</span>
                <span className="font-semibold text-slate-800">{Number(r.total_amount).toLocaleString()} с</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Склад</th>
                <th className="px-4 py-3 font-medium">Создал</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium text-right">Сумма</th>
                <th className="px-4 py-3 font-medium text-right">Действие</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-700">#{r.id}</td>

                  <td className="px-4 py-3 text-slate-700">{r.warehouse_name}</td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {r.created_by_name}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-600">{new Date(r.created_at).toLocaleString()}</td>

                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {Number(r.total_amount).toLocaleString()} с
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(paths.receiptId(r.id.toString()))}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition"
                      title="Посмотреть"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default ReceiptsTable
