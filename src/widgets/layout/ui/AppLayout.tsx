import { Outlet } from 'react-router'
import Sidebar from './Siderbar'
import { Header } from './Header'
import { useState } from 'react'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toggleSidebar = () => setSidebarOpen((v) => !v)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-y-auto p-3">
          <Outlet />
        </div>
      </main>

      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="
      fixed inset-0 z-40
      bg-black/50
      md:hidden
      transition-opacity
    "
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default AppLayout
