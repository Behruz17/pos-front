export const Loading = ({ text = '' }: { text?: string }) => {
  return <div className="flex items-center justify-center h-64 text-slate-500">Загрузка {text}…</div>
}
