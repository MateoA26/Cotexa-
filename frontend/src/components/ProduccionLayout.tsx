import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

export default function ProduccionLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-2.5">
          <img src="/Imagenes/isotipo.png" alt="Cotexa" className="w-8 h-8 object-contain" />
          <span className="text-white text-[14px] font-bold">Cotexa</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-[13px] font-medium">{user?.nombre}</span>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}
