import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

export const Modal = ({ open, title, onClose, children, size = 'md' }: ModalProps) => {
  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }

  return (
    <div
      style={{
        overflow: 'auto',
      }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}
