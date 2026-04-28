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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={
        sidebarOpen
          ? 'fixed inset-y-0 left-0 z-30 w-[220px] flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out translate-x-0 md:relative md:translate-x-0'
          : 'fixed inset-y-0 left-0 z-30 w-[220px] flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out -translate-x-full md:relative md:translate-x-0'
      } style={{ background: '#0f172a' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <img src="/Imagenes/isotipo.png" alt="Cotexa" className="w-8 h-8 object-contain" />
            <span className="text-white text-[15px] font-bold tracking-tight">Cotexa</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white p-1 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-white/8">
          <div className="px-3 py-2 mb-1">
            <p className="text-[13px] font-medium text-slate-300 truncate">{user?.nombre}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-white/5 hover:text-red-400 w-full transition-colors">
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-slate-200 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-600 p-1">
            <Menu size={20} />
          </button>
          <img src="/Imagenes/isotipo.png" alt="Cotexa" className="w-7 h-7 object-contain" />
          <span className="text-slate-800 text-sm font-bold">Cotexa</span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
