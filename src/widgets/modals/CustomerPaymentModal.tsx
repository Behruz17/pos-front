import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateCustomerPaymentMutation } from '@/features/customers/api/customers.api';
import { toast } from 'sonner';

interface CustomerPaymentModalProps {
  customerId: number;
  storeId: number;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const CustomerPaymentModal = ({
  customerId,
  storeId,
  customerName,
  isOpen,
  onClose,
  onPaymentSuccess
}: CustomerPaymentModalProps) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [createPayment, { isLoading }] = useCreateCustomerPaymentMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Пожалуйста, введите корректную сумму');
      return;
    }

    try {
      await createPayment({
        id: customerId,
        body: {
          amount: parseFloat(amount),
          note: note || undefined,
          store_id: storeId
        }
      }).unwrap();
      
      toast.success('Платеж успешно принят');
      setAmount('');
      setNote('');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (error) {
      toast.error('Ошибка при обработке платежа');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-slate-800">Оплата от клиента</h3>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Клиент
            </label>
            <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">
              {customerName}
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
              Сумма *
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
              Комментарий
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
              placeholder="Введите комментарий к платежу"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
            >
              {isLoading ? 'Обработка...' : 'Принять оплату'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};