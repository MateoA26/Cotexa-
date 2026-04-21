import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Users, LogOut, Menu, X, ShieldCheck } from 'lucide-react'

export default function SuperAdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/superadmin/empresas', icon: Building2, label: 'Empresas' },
    { to: '/superadmin/usuarios', icon: Users, label: 'Usuarios' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={
          sidebarOpen
            ? 'fixed inset-y-0 left-0 z-30 w-56 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out translate-x-0 md:relative md:translate-x-0'
            : 'fixed inset-y-0 left-0 z-30 w-56 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out -translate-x-full md:relative md:translate-x-0'
        }
        style={{ background: '#0f172a' }}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)' }}>
                <ShieldCheck size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-tight truncate">Cotexa</p>
                <p className="text-white/40 text-xs">SuperAdmin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white/40 hover:text-white p-1 rounded transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 px-0.5">
            <p className="text-white/30 text-xs truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-sky-500 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/10 w-full transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#0f172a' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white p-1">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-sky-400" />
            <span className="text-white text-sm font-semibold">SuperAdmin</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
