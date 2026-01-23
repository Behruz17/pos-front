import { useState } from 'react';
import { useCreateSupplierPaymentMutation } from '@/features/suppliers/api/suppliers.api';
import { Modal } from './Modal';

interface SupplierPaymentModalProps {
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierPaymentModal = ({
  supplierId,
  supplierName,
  warehouseId,
  isOpen,
  onClose,
  onSuccess,
}: SupplierPaymentModalProps) => {
  const [createPayment, { isLoading, error }] = useCreateSupplierPaymentMutation();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPayment({
        id: supplierId,
        data: {
          amount: parseFloat(amount),
          warehouse_id: warehouseId,
          note,
        },
      }).unwrap();

      onSuccess();
      onClose();
      setAmount('');
      setNote('');
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  return (
    <Modal open={isOpen} title={`Оплата поставщику: ${supplierName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Сумма
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Примечание
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {(error as any)?.data?.message || 'Ошибка при выполнении оплаты'}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading || !amount}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Загрузка...' : 'Выполнить оплату'}
          </button>
        </div>
      </form>
    </Modal>
  );
};