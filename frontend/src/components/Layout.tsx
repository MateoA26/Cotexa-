import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Package, Users, LogOut, Menu, X, Settings } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pedidos', icon: Package, label: 'Pedidos' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    ...(isAdmin ? [{ to: '/configuracion', icon: Settings, label: 'Configuración' }] : []),
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={
        sidebarOpen
          ? 'fixed inset-y-0 left-0 z-30 w-56 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out translate-x-0 md:relative md:translate-x-0'
          : 'fixed inset-y-0 left-0 z-30 w-56 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out -translate-x-full md:relative md:translate-x-0'
      } style={{ background: '#1e3a5f' }}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <img src="/Imagenes/Copia de Logo fondo azul.png" alt="Cotexa" className="h-10 w-auto flex-1 min-w-0" />
            <div className="flex items-center gap-1 flex-shrink-0">
              <NotificationBell />
              <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white p-1 rounded transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-1.5 truncate">{user?.nombre}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-sky-500 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/10 w-full transition-colors">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#1e3a5f' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white p-1">
            <Menu size={20} />
          </button>
          <img src="/Imagenes/Copia de Logo fondo azul.png" alt="Cotexa" className="h-8 w-auto" />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
