import { ArrowLeft } from 'lucide-react'

const ButtonBack = ({ onBack }: { onBack: () => void }) => {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
    >
      <ArrowLeft size={16} />
      Назад к списку
    </button>
  )
}

export default ButtonBack
