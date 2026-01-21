/* eslint-disable @typescript-eslint/no-explicit-any */

import { usePutProductMutation } from '@/features/products/api/products.api'
import type { TGetWarehousesProductDetail } from '@/features/warehouses/model/warehouses.types'
import { X, Upload } from 'lucide-react'
import { useState } from 'react'

const EditProductModal = ({
  product,
  onClose,
}: {
  product: TGetWarehousesProductDetail['product']
  onClose: () => void
}) => {
  const [editProduct, { isLoading }] = usePutProductMutation()

  const [form, setForm] = useState({
    name: product.name,
    manufacturer: product.manufacturer ?? '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(product.image)

  const onSubmit = async () => {
    const fd = new FormData()

    fd.append('name', form.name)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Редактировать товар</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="aspect-square rounded-xl border bg-slate-50 overflow-hidden">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
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

        <div className="space-y-3">
          <Field label="Название" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />

          <Field
            label="Производитель"
            optional
            value={form.manufacturer}
            onChange={(v) => setForm((s) => ({ ...s, manufacturer: v }))}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
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
