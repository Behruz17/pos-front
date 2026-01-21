const LoaderPage = () => {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin" />
      </div>

      <div className="mt-4 text-sm text-gray-500">Загружаем данные…</div>
    </div>
  )
}

export default LoaderPage
