import { useState } from 'react'
import { useRegisterMutation } from '../api/auth.api'
import type { TUserRole } from '../model'

export const UserForm = () => {
  const [register, { isLoading }] = useRegisterMutation()

  const [form, setForm] = useState({
    login: '',
    password: '',
    name: '',
    role: 'USER' as TUserRole,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.login || !form.password) {
      alert('Логин и пароль обязательны')
      return
    }

    const res = await register(form).unwrap()
    alert(`Пользователь ${res.login} успешно создан`)
    setForm({ login: '', password: '', name: '', role: 'USER' })
  }

  return (
    <div className="flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Регистрация пользователя</h1>

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
