import { useState, useEffect, useRef, useMemo } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Package, Users, LogOut, Menu, X, Settings, Search, Calculator } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { useQuery } from '@tanstack/react-query'
import { pedidosApi, clientesApi, empresaApi } from '../services/api'
import { Pedido, Cliente } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS } from '../utils/estados'

const initials = (n: string) =>
  n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

const AVATAR_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899']
const colorFor = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => empresaApi.get().then(r => r.data),
  })

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pedidos', icon: Package, label: 'Pedidos' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    ...(empresa?.slug !== 'printpack' ? [
      { to: '/configuracion/cotizador', icon: Calculator, label: 'Cotizador' },
    ] : []),
    ...(isAdmin ? [
      { to: '/configuracion', icon: Settings, label: 'Configuración' },
    ] : []),
  ]

  const { data: pedidos = [] } = useQuery<Pedido[]>({
    queryKey: ['pedidos-search'],
    queryFn: () => pedidosApi.getAll().then(r => r.data),
    enabled: searchOpen,
  })

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes-search'],
    queryFn: () => clientesApi.getAll().then(r => r.data),
    enabled: searchOpen,
  })

  const filteredPedidos = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return pedidos
      .filter(p =>
        String(p.numeroPedido).includes(q) ||
        p.cliente.nombre.toLowerCase().includes(q)
      )
      .slice(0, 5)
  }, [searchQuery, pedidos])

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return clientes
      .filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 5)
  }, [searchQuery, clientes])

  const hasResults = filteredPedidos.length > 0 || filteredClientes.length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
    {import.meta.env.VITE_ENV === 'testing' && (
      <div className="w-full bg-amber-400 text-amber-900 text-center text-[12px] font-bold py-1.5 z-50 fixed top-0 left-0">
        ⚠️ AMBIENTE DE TESTING — Los datos no son reales
      </div>
    )}
    <div className={`flex h-screen bg-slate-50 overflow-hidden ${import.meta.env.VITE_ENV === 'testing' ? 'mt-7' : ''}`}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={
        sidebarOpen
          ? 'fixed inset-y-0 left-0 z-30 w-[220px] flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out translate-x-0 md:sticky md:top-0 md:h-screen md:translate-x-0'
          : 'fixed inset-y-0 left-0 z-30 w-[220px] flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out -translate-x-full md:sticky md:top-0 md:h-screen md:translate-x-0'
      } style={{ background: '#0f172a' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sky-500/40">
          <div className="flex items-center gap-3">
            <img src="/Imagenes/isotipo.png" alt="Cotexa" className="w-8 h-8 object-contain" />
            <span className="text-white text-[15px] font-bold tracking-tight">Cotexa</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="md:hidden">
              <NotificationBell />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white p-1 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end onClick={() => setSidebarOpen(false)}
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

        {/* Logout */}
        <div className="px-3 py-3 border-t border-white/8">
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-colors">
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-slate-200 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-600 p-1">
            <Menu size={20} />
          </button>
          <img src="/Imagenes/isotipo.png" alt="Cotexa" className="w-7 h-7 object-contain" />
          <span className="text-slate-800 text-sm font-bold">Cotexa</span>
        </header>

        {/* Desktop topbar */}
        <header className="hidden md:flex items-center justify-between px-7 py-[13px] flex-shrink-0" style={{ background: '#0f172a' }}>
          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] w-[320px]"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Search size={14} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <input
                placeholder="Buscar pedidos, clientes..."
                className="flex-1 bg-transparent outline-none text-[13px] text-white placeholder-white/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
            </div>

            {searchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 mt-2 w-[480px] bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] z-50 overflow-hidden">
                {!hasResults ? (
                  <div className="px-5 py-6 text-[13px] text-slate-400 text-center">
                    Sin resultados para &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <>
                    {filteredPedidos.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pedidos</p>
                        {filteredPedidos.map(p => (
                          <button
                            key={p.id}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                            onMouseDown={() => {
                              setSearchOpen(false)
                              setSearchQuery('')
                              navigate(`/pedidos/${p.id}`)
                            }}
                          >
                            <span className="text-[12px] font-mono text-slate-400 tabular-nums w-12 flex-shrink-0">#{p.numeroPedido}</span>
                            <span className="text-[13px] font-medium text-slate-900 flex-1 truncate">{p.cliente.nombre}</span>
                            <span
                              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                              style={{ background: (ESTADO_COLORS[p.estado] || '#94a3b8') + '18', color: ESTADO_COLORS[p.estado] || '#94a3b8' }}
                            >
                              {ESTADO_LABELS[p.estado] || p.estado}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {filteredClientes.length > 0 && (
                      <div className={filteredPedidos.length > 0 ? 'border-t border-slate-100' : ''}>
                        <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Clientes</p>
                        {filteredClientes.map(c => (
                          <button
                            key={c.id}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                            onMouseDown={() => {
                              setSearchOpen(false)
                              setSearchQuery('')
                              navigate('/clientes')
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                              style={{ background: colorFor(c.nombre) }}
                            >
                              {initials(c.nombre)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-slate-900 truncate">{c.nombre}</p>
                              {c.email && <p className="text-[11px] text-slate-400 truncate">{c.email}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-[13px] font-medium text-white">{user?.nombre}</p>
              <p className="text-[11px] text-white/50">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  )
}
