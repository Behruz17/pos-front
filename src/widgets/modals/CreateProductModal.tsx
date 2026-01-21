import { usePostProductMutation } from '@/features/products/api/products.api'
import { Plus, X, Upload } from 'lucide-react'
import { Upload as AntUpload, Button } from 'antd'
import { useState } from 'react'

export const CreateProductModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const [createProduct, { isLoading }] = usePostProductMutation()

  const onCreate = async () => {
    if (!name.trim() || !image) return

    const formData = new FormData()
    formData.append('name', name)
    if (manufacturer.trim()) {
      formData.append('manufacturer', manufacturer)
    }
    formData.append('image', image)
    console.log('formData', formData)

    await createProduct(formData).unwrap()

    onClose()
  }

  return (
    <div
      style={{
        overflow: 'auto',
      }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Добавить продукт</h2>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название товара"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
          />

          <input
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Производитель (опционально)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
          />

          <AntUpload
            maxCount={1}
            accept="image/*"
            beforeUpload={(file) => {
              setImage(file)
              return false
            }}
            onRemove={() => setImage(null)}
          >
            <Button icon={<Upload size={16} />}>Загрузить изображение</Button>
          </AntUpload>

          {image && <div className="text-xs text-slate-500">Файл: {image.name}</div>}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100">
            Отмена
          </button>

          <button
            onClick={onCreate}
            disabled={isLoading || !image}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            <Plus size={16} />
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}
