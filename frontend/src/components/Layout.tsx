import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Package, Users, LogOut, Boxes, Menu, X } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pedidos', icon: Package, label: 'Pedidos' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={
        sidebarOpen
          ? 'fixed inset-y-0 left-0 z-30 w-56 bg-gray-900 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out translate-x-0 md:relative md:translate-x-0'
          : 'fixed inset-y-0 left-0 z-30 w-56 bg-gray-900 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out -translate-x-full md:relative md:translate-x-0'
      }>
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-sky-500 rounded-lg p-1.5">
                <Boxes size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Cotexa</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-1.5 truncate">{user?.nombre}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-sky-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-gray-800 w-full transition-colors">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center gap-3 bg-gray-900 px-4 py-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 rounded-lg p-1">
              <Boxes size={14} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-tight">Cotexa</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
