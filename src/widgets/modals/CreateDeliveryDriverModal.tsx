import { useState, useEffect } from 'react'
import { X, Save, User, Phone, DollarSign } from 'lucide-react'

interface CreateDeliveryDriverModalProps {
  isOpen: boolean
  onClose: () => void
  warehouseId: number
  driverId?: number | null
  driverData?: DriverData | null
  onSuccess?: () => void
  createDriver: any
  updateDriver: any
}

interface DriverData {
  name: string
  phone: string
  balance: number
}

export const CreateDeliveryDriverModal = ({ 
  isOpen, 
  onClose, 
  warehouseId, 
  driverId, 
  driverData,
  onSuccess,
  createDriver,
  updateDriver
}: CreateDeliveryDriverModalProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<DriverData>({
    name: '',
    phone: '',
    balance: 0
  })

  const isLoading = isCreating || isUpdating

  useEffect(() => {
    if (isOpen) {
      if (driverData && driverId) {
        setFormData({
          name: driverData.name || '',
          phone: driverData.phone || '',
          balance: driverData.balance || 0
        })
      } else {
        setFormData({
          name: '',
          phone: '',
          balance: 0
        })
      }
      setError(null)
    }
  }, [isOpen, driverData, driverId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Пожалуйста, введите имя доставщика')
      return
    }

    try {
      const requestData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || '',
        balance: formData.balance,
      };
      
      
      if (driverId) {
        setIsUpdating(true)
        const updateData = { id: driverId, data: requestData };
        await updateDriver(updateData).unwrap()
        setIsUpdating(false)
      } else {
        setIsCreating(true)
        const createData = { warehouseId, data: requestData };
        await createDriver(createData).unwrap()
        setIsCreating(false)
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      setIsCreating(false)
      setIsUpdating(false)
      
      let errorMessage = 'Ошибка при сохранении доставщика'
      
      if (error && typeof error === 'object') {
        if ('data' in error && error.data) {
          const errorData = error.data as any
          if (Array.isArray(errorData)) {
            errorMessage = errorData.map((err: any) => err.message || err).join(', ')
          } else {
            errorMessage = typeof errorData === 'string' ? errorData : 'Ошибка валидации данных'
          }
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('status' in error && 'error' in error && typeof error.error === 'string') {
          errorMessage = `Ошибка ${error.status}: ${error.error}`
        } else if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      setError(errorMessage)
    }
  }

  const handleInputChange = (field: keyof DriverData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'balance' ? Number(value) || 0 : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {driverId ? 'Редактировать доставщика' : 'Добавить доставщика'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Имя доставщика <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Введите имя доставщика"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Телефон
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Введите номер телефона"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Баланс
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
