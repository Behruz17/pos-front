/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from 'react-router'
import { skipToken } from '@reduxjs/toolkit/query'
import { Warehouse, User, Calendar, Package } from 'lucide-react'

import { useGetOneReceiptQuery } from '@/features/receipt/api/receipt.api'
import { formatDateTime } from '@/shared/formatDateTime'
import { Loading } from '@/shared/ui/Loading'
import { Td, Th } from '@/shared/ui/Table'
import { ProductImage } from '@/shared/ui/ProductImageю'

const ReceiptDetailPage = () => {
  const { id } = useParams<{ id?: string }>()
  const { data, isLoading } = useGetOneReceiptQuery(id ?? skipToken)

  if (isLoading) return <Loading text="документа" />
  if (!data) return <div className="text-slate-500">Документ не найден</div>

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Приход #{data.id}</h1>
          <p className="text-sm text-slate-500">Детали документа поступления</p>
        </div>

        <div className="sm:text-right">
          <div className="text-sm text-slate-500">Итого</div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-800">{data.total_amount.toLocaleString()} с</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetaCard icon={<Warehouse size={20} />} label="Склад" value={data.warehouse_name} />
        <MetaCard icon={<User size={20} />} label="Создал" value={data.created_by_name} />
        <MetaCard icon={<Calendar size={20} />} label="Дата" value={formatDateTime(data.created_at)} />
      </div>

      <div className="space-y-4 md:hidden">
        {data.items?.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {item.image ? (
                <ProductImage src={item.image} alt={item.product_name} />
              ) : (
                <Package size={20} className="text-slate-400" />
              )}

              <div>
                <div className="font-medium text-slate-800">{item.product_name}</div>
                <div className="text-xs text-slate-500">{item.manufacturer ?? '—'}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Info label="Коробки" value={item.boxes_qty} />
              <Info label="Шт/кор" value={item.pieces_per_box} />
              <Info label="Россыпь" value={item.loose_pieces} />
              <Info label="Всего шт" value={item.total_pieces} />
              <Info label="Вес" value={item.weight_kg ? `${item.weight_kg} кг` : '—'} />
              <Info label="Объём" value={item.volume_cbm ? `${item.volume_cbm} м³` : '—'} />
              <Info label="Закупка" value={item.purchase_cost} />
              <Info label="Продажа" value={item.selling_price} />
            </div>

            <div className="mt-4 flex justify-between border-t pt-3">
              <span className="text-slate-500 text-sm">Сумма</span>
              <span className="font-semibold text-slate-800">{item.amount}</span>
            </div>
          </div>
        ))}

        {!data.items?.length && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500">
            Позиции отсутствуют
          </div>
        )}
      </div>

      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Товар</Th>
                <Th>Производитель</Th>
                <Th right>Коробки</Th>
                <Th right>Шт/кор</Th>
                <Th right>Россыпь</Th>
                <Th right>Всего шт</Th>
                <Th right>Вес</Th>
                <Th right>Объём</Th>
                <Th right>Закупка</Th>
                <Th right>Продажа</Th>
                <Th right>Сумма</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <ProductImage src={item.image} alt={item.product_name} />
                      ) : (
                        <Package size={16} className="text-slate-400" />
                      )}
                      {item.product_name}
                    </div>
                  </Td>

                  <Td>{item.manufacturer ?? '—'}</Td>
                  <Td right>{item.boxes_qty}</Td>
                  <Td right>{item.pieces_per_box}</Td>
                  <Td right>{item.loose_pieces}</Td>
                  <Td right className="font-medium">
                    {item.total_pieces}
                  </Td>
                  <Td right>{item.weight_kg}</Td>
                  <Td right>{item.volume_cbm}</Td>
                  <Td right>{item.purchase_cost}</Td>
                  <Td right>{item.selling_price}</Td>
                  <Td right className="font-semibold">
                    {item.amount}
                  </Td>
                </tr>
              ))}

              {!data.items?.length && (
                <tr>
                  <Td colSpan={11} className="py-10 text-center text-slate-500">
                    Позиции отсутствуют
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReceiptDetailPage

const MetaCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
    <div className="text-slate-400">{icon}</div>
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  </div>
)

const Info = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value ?? '—'}</span>
  </div>
)
