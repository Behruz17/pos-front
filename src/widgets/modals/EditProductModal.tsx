/* eslint-disable @typescript-eslint/no-explicit-any */

import { usePutProductMutation } from '@/features/products/api/products.api'

import { X, Upload } from 'lucide-react'
import { useState } from 'react'

interface ProductInfo {
  id: number
  name: string
  manufacturer?: string | null
  product_code?: string | null
  notification_threshold?: number
  image?: string
  created_at?: string | null
}

const EditProductModal = ({
  product,
  onClose,
}: {
  product: ProductInfo
  onClose: () => void
}) => {
  const [editProduct, { isLoading }] = usePutProductMutation()

  const [form, setForm] = useState({
    name: product.name,
    manufacturer: product.manufacturer || '',
    product_code: product.product_code || '',
    notification_threshold: product.notification_threshold ? product.notification_threshold.toString() : '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(product.image || null)

  const onSubmit = async () => {
    const fd = new FormData()

    fd.append('name', form.name)
    fd.append('product_code', form.product_code)
    if (form.notification_threshold) {
      fd.append('notification_threshold', form.notification_threshold)
    }
    if (form.manufacturer) {
      fd.append('manufacturer', form.manufacturer)
    }
    if (file) {
      fd.append('image', file)
    }

    await editProduct({
      id: product.id,
      body: fd,
    }).unwrap()

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Редактировать товар</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="px-6 pb-4 space-y-2 flex-shrink-0">
          <div className="w-32 h-32 mx-auto rounded-xl border bg-slate-50 overflow-hidden">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Нет изображения</div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:underline">
            <Upload size={16} />
            Загрузить новое изображение
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setFile(f)
                setPreview(URL.createObjectURL(f))
              }}
            />
          </label>
        </div>
        
        <div className="px-6 py-4 space-y-3 overflow-y-auto flex-grow">
          <Field label="Название" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />

          <Field
            label="Артикул"
            value={form.product_code}
            onChange={(v) => setForm((s) => ({ ...s, product_code: v }))}
          />

          <Field
            label="Порог уведомления"
            optional
            value={form.notification_threshold}
            onChange={(v) => setForm((s) => ({ ...s, notification_threshold: v }))}
          />

          <Field
            label="Производитель"
            optional
            value={form.manufacturer}
            onChange={(v) => setForm((s) => ({ ...s, manufacturer: v }))}
          />
        </div>

        <div className="px-6 py-4 flex-shrink-0 border-t border-gray-100">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">
              Отмена
            </button>

            <button
              disabled={!form.name || isLoading}
              onClick={onSubmit}
              className="
                px-4 py-2 rounded-xl
                bg-blue-600 text-white text-sm font-medium
                hover:bg-blue-700
                disabled:opacity-50
              "
            >
              {isLoading ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProductModal

const Field = ({
  label,
  value,
  onChange,
  optional,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  optional?: boolean
}) => (
  <div className="space-y-1">
    <label className="text-xs text-slate-500">
      {label} {optional && <span className="text-slate-400">(необязательно)</span>}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full rounded-xl border border-slate-300
        px-3 py-2 text-sm
        focus:ring-2 focus:ring-blue-500
      "
    />
  </div>
)
