import { useEffect, useState } from 'react';
import { X, Package, Hash, Calendar, User, Coins } from 'lucide-react';
import { Loading } from '@/shared/ui/Loading';
import { ProductImage } from '@/shared/ui/ProductImageю';
import type { TSale, TSaleItem } from '@/features/sales/model/sales.types';
import { useGetSaleByIdQuery } from '@/features/sales/api/sales.api';

interface SalesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number;
}

export const SalesDetailModal = ({
  isOpen,
  onClose,
  saleId
}: SalesDetailModalProps) => {
  const {
    data: saleData,
    isLoading,
    error,
    refetch
  } = useGetSaleByIdQuery(saleId, {
    skip: !isOpen || !saleId,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isOpen && saleId) {
      refetch();
    }
  }, [isOpen, saleId, refetch]);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-800">
              Детали продажи #{saleId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loading text="загрузке данных продажи" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6 text-red-500">
            <div className="text-center">
              <p className="font-medium">Ошибка загрузки данных:</p>
              <p className="mt-1">{(error as any)?.data?.message || 'Произошла ошибка при загрузке данных'}</p>
            </div>
          </div>
        ) : saleData ? (
          <div className="flex-1 overflow-y-auto">
            {/* Sale Info */}
            <div className="p-6 bg-slate-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Hash size={16} />
                  <span className="text-sm">ID продажи</span>
                </div>
                <div className="font-medium text-slate-800">#{saleData.id}</div>

                <div className="flex items-center gap-2 text-slate-600">
                  <User size={16} />
                  <span className="text-sm">Клиент</span>
                </div>
                <div className="font-medium text-slate-800">{saleData.customer_name || '—'}</div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={16} />
                  <span className="text-sm">Дата создания</span>
                </div>
                <div className="font-medium text-slate-800">
                  {new Date(saleData.created_at).toLocaleDateString('ru-RU')}
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Coins size={16} />
                  <span className="text-sm">Статус оплаты</span>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    saleData.payment_status === 'DEBT' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {saleData.payment_status === 'DEBT' ? 'В долг' : 'Оплачено'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Товары в продаже</h3>
              
              <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Товар</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Артикул</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Кол-во</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Цена</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {saleData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-800 font-medium">{item.product_name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.product_code}</td>
                        <td className="px-4 py-3 text-right text-slate-800">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-800">{item.unit_price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {item.total_price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {saleData.items.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-slate-800">{item.product_name}</div>
                        <div className="text-sm text-slate-500">Артикул: {item.product_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">
                          {(item.quantity * item.unit_price).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">{item.quantity} × {item.unit_price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="p-6 bg-slate-50 border-t">
              <div className="flex justify-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">Общая сумма:</span>
                    <span className="text-xl font-bold text-slate-800">
                      {saleData.total_amount.toLocaleString()} с
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};