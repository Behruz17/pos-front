import { useState } from 'react';
import { PackagePlus, Calendar, Edit3, Trash2 } from 'lucide-react';
import { CreateExpenseForm } from '@/features/expenses/ui/CreateExpenseForm';
import { useGetExpensesQuery, useDeleteExpenseMutation } from '@/features/expenses/api/expenses.api';
import { formatDateTime } from '@/shared/formatDateTime';
import DeleteModal from '@/widgets/modals/DeleteModal';

export const ExpensesPage = () => {
  const { data: expenses = [], isLoading, refetch } = useGetExpensesQuery({});
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId).unwrap();
      setDeleteId(null);
      refetch(); // Refresh the list after deletion
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Загрузка расходов…</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Расходы</h1>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PackagePlus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Создать расход</h2>
          </div>

          <CreateExpenseForm />
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Список расходов</h2>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Расходы отсутствуют</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Магазин
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Комментарий
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{expense.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(String(expense.amount)).toFixed(2))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.store_name || `Магазин #${expense.store_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.comment || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit3 size={16} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => setDeleteId(expense.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <DeleteModal
          onClose={() => setDeleteId(null)}
          onDelete={handleDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ExpensesPage;