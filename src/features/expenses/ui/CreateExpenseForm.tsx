import { useState, useEffect } from 'react';
import { PackagePlus, Calendar, Store } from 'lucide-react';
import { useCreateExpenseMutation } from '../api/expenses.api';
import { useGetStoresQuery } from '@/features/stores/api/stores.api';
import { toast } from 'sonner';

export const CreateExpenseForm = () => {
  const [amount, setAmount] = useState('');
  const [store_id, setStoreId] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [expense_date, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [createExpense, { isLoading }] = useCreateExpenseMutation();
  const { data: stores = [] } = useGetStoresQuery();

  useEffect(() => {
    if (stores.length > 0 && !store_id) {
      setStoreId(stores[0].id);
    }
  }, [stores, store_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !store_id) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      await createExpense({
        amount: parseFloat(amount),
        store_id: store_id,
        comment: comment || undefined,
        expense_date: expense_date || undefined,
      }).unwrap();

      toast.success('Расход успешно создан');
      // Reset form
      setAmount('');
      setComment('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Ошибка при создании расхода');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сумма *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10"
              placeholder="0.00"
              required
            />
            <PackagePlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Магазин *
          </label>
          <div className="relative">
            <select
              value={store_id || ''}
              onChange={(e) => setStoreId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 appearance-none"
              required
            >
              <option value="">Выберите магазин</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <Store className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата расхода
          </label>
          <div className="relative">
            <input
              type="date"
              value={expense_date}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Комментарий
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
            placeholder="Введите комментарий"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl disabled:bg-gray-400"
        >
          <PackagePlus size={16} /> Создать расход
        </button>
      </div>
    </form>
  );
};