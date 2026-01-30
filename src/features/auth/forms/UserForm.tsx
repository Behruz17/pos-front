import { useState } from 'react'
import { useRegisterMutation } from '../api/auth.api'
import type { TUserRole } from '../model'
import { useGetStoresQuery } from '@/features/stores/api/stores.api'
import { User } from 'lucide-react'

export const UserForm = () => {
  const [register, { isLoading }] = useRegisterMutation()
  const { data: stores = [], isLoading: storesLoading } = useGetStoresQuery()

  const [form, setForm] = useState({
    login: '',
    password: '',
    name: '',
    role: 'USER' as TUserRole,
    store_id: undefined as number | undefined,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'store_id' ? (value ? Number(value) : undefined) : value }))
  }

  const handleStoreChange = (value: number | null) => {
    setForm(prev => ({
      ...prev,
      store_id: value || undefined
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.login || !form.password) {
      alert('Логин и пароль обязательны')
      return
    }
    console.log(form);
    
    // Only require store_id if role is not ADMIN
    if (form.role !== 'ADMIN' && !form.store_id) {
      alert('Пожалуйста, выберите магазин')
      return
    }

    // Prepare the payload, sending null for store_id if undefined
    const payload = {
      ...form,
      store_id: form.role === 'ADMIN' ? null : (form.store_id || null)
    }
    
    const res = await register(payload).unwrap()
    
    
    
    alert(`Пользователь ${res.login} успешно создан`)
    setForm({ login: '', password: '', name: '', role: 'USER', store_id: undefined })
  }


  return (
    <div className="flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Регистрация пользователя</h1>

        {storesLoading && <div className="text-center py-2 text-gray-500">Загрузка магазинов...</div>}

        {/* LOGIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Логин *</label>
          <input
            name="login"
            value={form.login}
            onChange={handleChange}
            placeholder="Введите логин"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Введите пароль"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Имя пользователя"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* ROLE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="USER">Пользователь</option>
            <option value="ADMIN">Администратор</option>
          </select>
        </div>

        {/* STORE - Only show if role is not ADMIN */}
        {form.role !== 'ADMIN' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Магазин *</label>
            {storesLoading ? (
              <div className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-100">Загрузка...</div>
            ) : (
              <select
                value={form.store_id || ''}
                onChange={(e) => handleStoreChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Выберите магазин</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.city || 'Без города'})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Создание...' : 'Зарегистрировать'}
        </button>
      </form>
    </div>
  )
}
